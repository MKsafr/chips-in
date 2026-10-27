const http = require("http"),
  fs = require("fs"),
  path = require("path"),
  crypto = require("crypto"),
  net = require("net");
const QRCode = require("qrcode");
const { PUBLIC_PATH, VIEW_PATH } = require("../Config/paths");
const PORT = process.env.PORT || 3000;
const VERSION = "3.21"; // klien yang versinya beda akan otomatis refresh
const MVP_MUSIC_TRACKS = require(path.join(
  PUBLIC_PATH,
  "assets",
  "sounds",
  "mvp",
  "tracks.json",
));
const MVP_MUSIC_PRICE = 1000;

// Avatar preset yang tersedia. Samakan dengan daftar di public/assets/js/state.js.
const AVATARS = [
  "default",
  "spade",
  "heart",
  "club",
  "diamond",
  "chip-red",
  "chip-blue",
  "chip-green",
  "chip-black",
  "chip-purple",
  "chip-allin",
  "crown",
  "joker",
  "dice",
  "shark",
  "wolf",
  "fox",
  "cowboy",
  "cool",
  "slot",
  "clover",
  "fire",
  "dragon",
  "lion",
  "hat",
  "rocket",
  "money",
];

function isValidAvatar(avatar) {
  if (AVATARS.includes(avatar)) return true;
  if (typeof avatar !== "string" || avatar.length > 48 * 1024) return false;
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(avatar);
  if (!match) return false;
  const image = Buffer.from(match[1], "base64");
  return (
    image.length > 4 &&
    image.length <= 36 * 1024 &&
    image.toString("base64") === match[1] &&
    image[0] === 0xff &&
    image[1] === 0xd8 &&
    image[image.length - 2] === 0xff &&
    image[image.length - 1] === 0xd9
  );
}

// In-Memory Multi-Room Storage
const rooms = {};
const clients = new Set();
const disconnectTimers = new Map();
const DISCONNECT_GRACE_MS = 2 * 60 * 1000;
const API_MAX_BODY_BYTES = 64 * 1024;
const API_RATE_LIMIT_CAPACITY = 120;
const API_RATE_LIMIT_REFILL_PER_SECOND = 5;
const API_RATE_LIMIT_IDLE_MS = 5 * 60 * 1000;
const API_RATE_LIMIT_MAX_CLIENTS = 10000;
const apiRateLimits = new Map();
const PLAYER_BORDER_PRODUCTS = new Map([
  ["red", 5000],
  ["blue", 5000],
  ["green", 5000],
  ["purple", 5000],
  ["orange", 5000],
  ["pink", 5000],
  ["cyan", 5000],
  ["white", 5000],
  ["neon-green-white", 10000],
  ["neon-green-black", 10000],
  ["neon-orange-magenta", 10000],
  ["neon-orange-electric-blue", 10000],
  ["neon-green-denim", 10000],
]);

function disconnectKey(token, roomCode) {
  return JSON.stringify([token, roomCode]);
}

function getClientAddress(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedAddress =
    forwardedFor && String(forwardedFor).split(",")[0].trim();
  if (forwardedAddress && net.isIP(forwardedAddress)) return forwardedAddress;
  return req.socket.remoteAddress || "unknown";
}

function getApiRateLimitRetryAfter(req, now = Date.now()) {
  const clientAddress = getClientAddress(req);
  let bucket = apiRateLimits.get(clientAddress);
  if (!bucket) {
    if (apiRateLimits.size >= API_RATE_LIMIT_MAX_CLIENTS) {
      for (const [address, entry] of apiRateLimits) {
        if (now - entry.updatedAt >= API_RATE_LIMIT_IDLE_MS)
          apiRateLimits.delete(address);
      }
    }
    if (apiRateLimits.size >= API_RATE_LIMIT_MAX_CLIENTS) return 60;
    bucket = { tokens: API_RATE_LIMIT_CAPACITY, updatedAt: now };
    apiRateLimits.set(clientAddress, bucket);
  } else {
    bucket.tokens = Math.min(
      API_RATE_LIMIT_CAPACITY,
      bucket.tokens +
        ((now - bucket.updatedAt) / 1000) * API_RATE_LIMIT_REFILL_PER_SECOND,
    );
    bucket.updatedAt = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return 0;
  }
  return Math.ceil((1 - bucket.tokens) / API_RATE_LIMIT_REFILL_PER_SECOND);
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

function logRoom(room, msg) {
  room.log.unshift(
    `[${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}] ${msg}`,
  );
  room.log.length = Math.min(room.log.length, 30);
  room.lastEvent = msg;
  room.lastEventId = (room.lastEventId || 0) + 1;
}

function setAutomaticMvpMusic(room, winnerIds) {
  room.mvpMusicEligiblePlayerIds = [...new Set(winnerIds)];
  room.mvpMusicChosenForRound = false;
  room.mvpMusicEventId += 1;
  room.mvpMusicTrackId = null;
  room.mvpMusicChosenBy = null;
  const winner = room.mvpMusicEligiblePlayerIds
    .map((id) => P(room, id))
    .find((player) =>
      MVP_MUSIC_TRACKS.some((track) =>
        player?.ownedMvpMusicTrackIds?.includes(track.id),
      ),
    );
  const track = winner
    ? MVP_MUSIC_TRACKS.find((item) =>
        winner.ownedMvpMusicTrackIds.includes(item.id),
      )
    : null;
  if (!winner || !track) return;
  room.mvpMusicTrackId = track.id;
  room.mvpMusicChosenBy = winner.id;
  room.mvpMusicChosenForRound = true;
}

function initRoom(code) {
  return {
    code,
    hostToken: null,
    mode: "poker",
    startChips: 1000,
    sb: 5,
    bb: 10,
    nextId: 1,
    players: [],
    log: [],
    lastEvent: "Room berhasil dibuat.",
    lastEventId: 0,
    dealerConfirmedStage: true,
    pendingHost: null,
    hostProfile: { name: "Bandar", avatar: "crown", ready: false },
    mvpMusicTrackId: null,
    mvpMusicEventId: 0,
    mvpMusicChosenBy: null,
    mvpMusicEligiblePlayerIds: [],
    mvpMusicChosenForRound: false,
    mvpRoundWinnerIds: [],
    stash: {}, // chip & nama pemain yang sedang tidak duduk (supaya tidak bisa dapat chip baru dengan keluar-masuk)
    suspended: {},
    touched: Date.now(),
    poker: {
      active: false,
      stage: "idle",
      dealer: null,
      turn: null,
      currentBet: 0,
      minRaise: 0,
      order: [],
      sbId: null,
      bbId: null,
    },
    bj: { phase: "betting", resolved: false, dealerTurn: null },
  };
}

const P = (room, id) => room.players.find((p) => p.id === id);
const pot = (room) => room.players.reduce((a, p) => a + (p.contrib || 0), 0);

function uniqueChipLeaderId(room) {
  if (room.players.length <= 1) return null;
  const isPoker = room.mode === "poker";
  let leaderId = null;
  let maxChips = 0;
  let hasTie = false;
  for (const player of room.players) {
    const total =
      (player.chips || 0) +
      (isPoker
        ? player.contrib || 0
        : (player.bjBet || 0) + (player.bjSplitBet || 0));
    if (total > maxChips) {
      leaderId = player.id;
      maxChips = total;
      hasTie = false;
    } else if (total === maxChips && total > 0) {
      hasTie = true;
    }
  }
  return hasTie ? null : leaderId;
}

function bjTurnHands(room) {
  return room.players.flatMap((player) => [
    { id: player.id, betSlot: "main" },
    { id: player.id, betSlot: "split" },
  ]);
}

function bjTurnHasBet(room, turn) {
  const player = turn && P(room, turn.id);
  return Boolean(
    player &&
      (turn.betSlot === "main" ? player.bjBet : player.bjSplitBet) > 0,
  );
}

function nextBJTurn(room, after = null) {
  const hands = bjTurnHands(room);
  const start = after
    ? hands.findIndex(
        (turn) => turn.id === after.id && turn.betSlot === after.betSlot,
      ) + 1
    : 0;
  for (let index = Math.max(0, start); index < hands.length; index++) {
    if (bjTurnHasBet(room, hands[index])) return hands[index];
  }
  return null;
}

function put(p, a) {
  p.chips -= a;
  p.bet += a;
  p.contrib += a;
  if (p.chips === 0) p.allin = true;
}
function post(p, a) {
  put(p, Math.min(a, p.chips));
}

function nextActor(room, startIdx) {
  const o = room.poker.order;
  for (let i = 0; i < o.length; i++) {
    const p = P(room, o[(startIdx + i) % o.length]);
    if (
      p &&
      !p.folded &&
      !p.allin &&
      (!p.acted || p.bet < room.poker.currentBet)
    )
      return p.id;
  }
  return null;
}

function startHand(room) {
  const k = room.poker;
  if (room.mode !== "poker") throw "Mode saat ini bukan Poker";
  if (k.active) throw "Hand masih berjalan";
  room.mvpMusicEligiblePlayerIds = [];
  room.mvpMusicChosenForRound = false;
  room.mvpRoundWinnerIds = [];
  const order = room.players.filter((p) => p.chips > 0).map((p) => p.id);
  if (order.length < 2) throw "Minimal 2 pemain yang memiliki chip";

  room.players.forEach((p) => {
    p.bet = p.contrib = 0;
    p.folded = p.allin = p.acted = false;
    p.inHand = order.includes(p.id);
  });

  const n = order.length;
  let di = order.indexOf(k.dealer);
  di = di === -1 ? 0 : (di + 1) % n;

  const sbI = n === 2 ? di : (di + 1) % n,
    bbI = (sbI + 1) % n;
  Object.assign(k, {
    active: true,
    stage: "preflop",
    dealer: order[di],
    order,
    currentBet: 0,
    minRaise: room.bb,
    sbId: order[sbI],
    bbId: order[bbI],
  });
  post(P(room, order[sbI]), room.sb);
  post(P(room, order[bbI]), room.bb);
  k.currentBet = Math.max(...order.map((id) => P(room, id).bet));
  k.turn = nextActor(room, (bbI + 1) % n);
  room.dealerConfirmedStage = false;
  logRoom(
    room,
    `Hand baru dimulai • Dealer: ${P(room, k.dealer).name} • Blind ${room.sb}/${room.bb}`,
  );
  if (!k.turn) nextStage(room);
}

function nextStage(room) {
  const k = room.poker,
    stages = ["preflop", "flop", "turn", "river", "showdown"];
  room.players.forEach((p) => {
    p.bet = 0;
    p.acted = false;
  });
  k.currentBet = 0;
  k.minRaise = room.bb;
  k.stage = stages[stages.indexOf(k.stage) + 1];

  const can = k.order
    .map((id) => P(room, id))
    .filter((p) => p && !p.folded && !p.allin);
  if (k.stage === "showdown" || can.length < 2) {
    k.stage = "showdown";
    k.turn = null;
    room.dealerConfirmedStage = true;
    logRoom(room, "Showdown! Tentukan pemenang.");
    return;
  }

  const firstToAct =
    k.order.length === 2
      ? k.order.indexOf(k.dealer)
      : k.order.indexOf(k.dealer) + 1;
  k.turn = nextActor(room, firstToAct);
  room.dealerConfirmedStage = false;
  logRoom(
    room,
    `Menunggu Bandar menampilkan kartu ${k.stage.toUpperCase()} di meja fisik.`,
  );
}

function endHand(room) {
  const k = room.poker;
  Object.assign(k, { active: false, stage: "idle", turn: null, currentBet: 0 });
  room.players.forEach((p) => {
    p.bet = p.contrib = 0;
    p.folded = p.allin = p.acted = p.inHand = false;
  });
}

function afterAction(room) {
  const k = room.poker;
  const live = k.order.map((id) => P(room, id)).filter((p) => p && !p.folded);
  if (live.length === 1) {
    const w = live[0],
      t = pot(room);
    w.chips += t;
    setAutomaticMvpMusic(room, [w.id]);
    logRoom(room, `${w.name} menang ${t} chip (semua pemain fold)`);
    endHand(room);
    return;
  }
  const nxt = nextActor(room, k.order.indexOf(k.turn) + 1);
  if (nxt) k.turn = nxt;
  else nextStage(room);
}

function act(room, p, a, amount) {
  const k = room.poker;
  if (!k.active || k.stage === "showdown" || k.turn !== p.id)
    throw "Bukan giliranmu";
  if (!room.dealerConfirmedStage)
    throw "Menunggu Bandar konfirmasi pembukaan kartu fisik terlebih dahulu!";

  const toCall = k.currentBet - p.bet;
  if (a === "fold") {
    p.folded = true;
    logRoom(room, `${p.name} Fold`);
  } else if (a === "call") {
    const c = Math.min(toCall, p.chips);
    put(p, c);
    logRoom(
      room,
      c
        ? `${p.name} Call ${c}${p.allin ? " (ALL-IN)" : ""}`
        : `${p.name} Check`,
    );
  } else if (a === "raise" || a === "allin") {
    let to = a === "allin" ? p.bet + p.chips : Math.floor(+amount || 0);
    if (to - p.bet > p.chips) to = p.bet + p.chips;
    const allinNow = to - p.bet === p.chips;
    if (to <= 0) throw "Jumlah taruhan tidak valid";
    if (to <= k.currentBet && !allinNow)
      throw "Raise harus lebih besar dari taruhan saat ini";
    if (to < k.currentBet + k.minRaise && !allinNow)
      throw "Minimal raise ke " + (k.currentBet + k.minRaise);

    put(p, to - p.bet);
    if (to > k.currentBet) {
      k.minRaise = Math.max(k.minRaise, to - k.currentBet);
      k.currentBet = to;
      room.players.forEach((q) => {
        if (q !== p && q.inHand && !q.folded && !q.allin) q.acted = false;
      });
    }
    logRoom(room, `${p.name} ${p.allin ? "ALL-IN ke" : "Raise ke"} ${to}`);
  } else throw "Aksi tidak dikenal";

  p.acted = true;
  afterAction(room);
}

function layers(room) {
  const ps = room.players.filter((p) => p.contrib > 0);
  const lv = [...new Set(ps.map((p) => p.contrib))].sort((a, b) => a - b);
  let prev = 0,
    carry = 0,
    out = [];
  for (const L of lv) {
    let amount = ps.reduce(
      (a, p) => a + Math.min(p.contrib, L) - Math.min(p.contrib, prev),
      0,
    );
    const elig = ps.filter((p) => !p.folded && p.contrib >= L).map((p) => p.id);
    prev = L;
    if (!elig.length) {
      carry += amount;
      continue;
    }
    amount += carry;
    carry = 0;
    const last = out[out.length - 1];
    if (last && last.elig.join() === elig.join()) last.amount += amount;
    else out.push({ amount, elig });
  }
  if (carry && out.length) out[out.length - 1].amount += carry;
  return out;
}

function award(room, winners) {
  const k = room.poker;
  if (!k.active || k.stage !== "showdown") throw "Belum tahap Showdown";
  if (!Array.isArray(winners)) throw "Pilih pemenang untuk setiap pot";
  const ls = layers(room);

  if (winners[0] && winners[0].length === 1) {
    const mainWinnerId = winners[0][0];
    for (let i = 1; i < ls.length; i++) {
      if (!winners[i] || winners[i].length === 0) {
        if (ls[i].elig.includes(mainWinnerId)) {
          winners[i] = [mainWinnerId];
        }
      }
    }
  }

  const selectedWinners = ls.map((l, i) =>
    Array.isArray(winners[i])
      ? winners[i].filter((id) => l.elig.includes(id))
      : [],
  );
  if (selectedWinners.some((selected) => !selected.length))
    throw "Pilih pemenang untuk setiap pot";

  ls.forEach((l, i) => {
    const w = selectedWinners[i];
    const share = Math.floor(l.amount / w.length);
    const remainder = l.amount - share * w.length;
    const dealerIndex = k.order.indexOf(k.dealer);
    const clockwiseOrder = [
      ...k.order.slice(dealerIndex + 1),
      ...k.order.slice(0, dealerIndex + 1),
    ];
    const orderedWinners = clockwiseOrder.filter((id) => w.includes(id));
    orderedWinners.forEach((id, index) => {
      const add = share + (index < remainder ? 1 : 0);
      P(room, id).chips += add;
    });
    logRoom(
      room,
      `${i === 0 ? "Pot Utama" : "Side Pot " + i} (${l.amount}) dikirim ke: ${w.map((id) => P(room, id).name).join(", ")}`,
    );
  });
  setAutomaticMvpMusic(room, selectedWinners.flat());
  endHand(room);
}

function setBet(room, p, amt) {
  p.chips += p.bjBet;
  amt = Math.min(amt, p.chips);
  p.chips -= amt;
  p.bjBet = amt;
}

function bjResolve(room, p, res, betSlot) {
  const mult = { win: 2, bj: 2.5, push: 1, lose: 0 };
  if (!(res in mult)) throw "Hasil tidak valid";
  if (res === "bj" && (p.bjHasSplit || p.bjDoubled))
    throw "Blackjack 3:2 tidak berlaku setelah Split atau Double";
  if (betSlot !== undefined && betSlot !== "main" && betSlot !== "split")
    throw "Taruhan tidak valid";
  if (!p.bjBet && !p.bjSplitBet) return;
  const resolvedTurn = betSlot
    ? { id: p.id, betSlot }
    : room.bj.dealerTurn?.id === p.id
      ? room.bj.dealerTurn
      : null;

  let totalPay = 0;
  if ((!betSlot || betSlot === "main") && p.bjBet > 0) {
    totalPay += Math.round(p.bjBet * mult[res]);
    p.bjBet = 0;
  }
  if ((!betSlot || betSlot === "split") && p.bjSplitBet > 0) {
    totalPay += Math.round(p.bjSplitBet * mult[res]);
    p.bjSplitBet = 0;
  }

  if ((res === "win" || res === "bj") && !room.mvpRoundWinnerIds.includes(p.id))
    room.mvpRoundWinnerIds.push(p.id);

  if (!p.bjBet && !p.bjSplitBet) p.bjHasSplit = false;
  p.chips += totalPay;
  room.bj.resolved = true;
  if (
    resolvedTurn &&
    room.bj.dealerTurn?.id === resolvedTurn.id &&
    room.bj.dealerTurn?.betSlot === resolvedTurn.betSlot &&
    !bjTurnHasBet(room, resolvedTurn)
  ) {
    room.bj.dealerTurn = nextBJTurn(room, resolvedTurn);
  }
  const betLabel =
    betSlot === "main" && p.bjSplitBet > 0
      ? " (Bet 1)"
      : betSlot === "split"
        ? " (Bet 2)"
        : "";
  logRoom(
    room,
    `${p.name}${betLabel}: ${res.toUpperCase()} (Menerima ${totalPay} chip)`,
  );
  if (!room.players.some((q) => q.bjBet > 0 || q.bjSplitBet > 0)) {
    room.bj.phase = "betting";
    room.bj.dealerTurn = null;
    setAutomaticMvpMusic(room, room.mvpRoundWinnerIds);
  }
}

// ---------- Meja: pemain hanya duduk setelah mengonfirmasi profil ----------
// except: objek pemain yang dikecualikan, atau 'host' kalau yang dicek adalah nama Bandar sendiri
const nameTaken = (room, name, except) => {
  const n = name.toLowerCase();
  if (room.players.some((p) => p !== except && p.name.toLowerCase() === n))
    return true;
  return (
    except !== "host" &&
    !!room.hostProfile &&
    room.hostProfile.name.toLowerCase() === n
  );
};

function defaultName(room) {
  for (let i = 1; ; i++)
    if (!nameTaken(room, "Player " + i)) return "Player " + i;
}

function seatPlayer(room, token, profile) {
  if (
    !token ||
    room.hostToken === token ||
    room.players.some((p) => p.token === token)
  )
    return null;
  const old = room.stash[token];
  let name = profile
    ? profile.name
    : old && old.name && !nameTaken(room, old.name)
      ? old.name
      : defaultName(room);
  const id = room.nextId++;
  const p = {
    id,
    token,
    name,
    avatar: profile
      ? profile.avatar
      : old && old.avatar
        ? old.avatar
        : AVATARS[(id - 1) % AVATARS.length],
    ready: profile ? true : !!(old && old.ready),
    chips: old ? old.chips : room.startChips,
    ownedBorderColors: Array.isArray(old && old.ownedBorderColors)
      ? old.ownedBorderColors.filter((color) =>
          PLAYER_BORDER_PRODUCTS.has(color),
        )
      : [],
    ownedProfileBorderColors: Array.isArray(
      old && old.ownedProfileBorderColors,
    )
      ? old.ownedProfileBorderColors.filter((color) =>
          PLAYER_BORDER_PRODUCTS.has(color),
        )
      : [],
    ownedMvpMusicTrackIds: Array.isArray(old && old.ownedMvpMusicTrackIds)
      ? old.ownedMvpMusicTrackIds.filter((trackId) =>
          MVP_MUSIC_TRACKS.some((track) => track.id === trackId),
        )
      : [],
    profileBorderColor:
      old &&
      PLAYER_BORDER_PRODUCTS.has(old.profileBorderColor) &&
      old.ownedProfileBorderColors?.includes(old.profileBorderColor)
        ? old.profileBorderColor
        : null,
    leaderBordersUnlocked: old?.leaderBordersUnlocked === true,
    leaderBorderColor: null,
    borderColor:
      old &&
      PLAYER_BORDER_PRODUCTS.has(old.borderColor) &&
      old.ownedBorderColors?.includes(old.borderColor)
        ? old.borderColor
        : null,
    bet: 0,
    contrib: 0,
    folded: false,
    allin: false,
    acted: false,
    inHand: false,
    bjBet: 0,
    bjSplitBet: 0,
    bjHasSplit: false,
    bjDoubled: false,
    last: 0,
  };
  room.players.push(p);
  delete room.stash[token];
  return p;
}

// Pemain meninggalkan meja. Chip disimpan, jadi kalau kembali chipnya sama (bukan chip baru).
function unseatPlayer(room, p) {
  p.chips += (p.bjBet || 0) + (p.bjSplitBet || 0); // taruhan blackjack yang belum dikunci dikembalikan
  p.bjBet = p.bjSplitBet = 0;
  p.bjHasSplit = false;
  p.bjDoubled = false;
  room.stash[p.token] = {
    name: p.name,
    chips: p.chips,
    avatar: p.avatar,
    ready: p.ready,
    ownedBorderColors: p.ownedBorderColors || [],
    borderColor: p.borderColor || null,
    ownedProfileBorderColors: p.ownedProfileBorderColors || [],
    profileBorderColor: p.profileBorderColor || null,
    ownedMvpMusicTrackIds: p.ownedMvpMusicTrackIds || [],
    leaderBordersUnlocked: p.leaderBordersUnlocked === true,
  };
  room.players = room.players.filter((q) => q !== p);
  if (room.pendingHost && room.pendingHost.targetId === p.id) clearOffer(room);
}

function cancelRound(room, why) {
  if (room.poker.active) {
    room.players.forEach((p) => {
      p.chips += p.contrib;
    });
    endHand(room);
  }
  if (
    room.bj.phase === "playing" ||
    room.players.some((p) => p.bjBet || p.bjSplitBet)
  ) {
    room.players.forEach((p) => {
      p.chips += p.bjBet + p.bjSplitBet;
      p.bjBet = p.bjSplitBet = 0;
      p.bjHasSplit = false;
    });
    room.bj.phase = "betting";
    room.bj.resolved = false;
  }
  logRoom(room, why);
}

// Bandar baru turun dari meja (keluar sebagai pemain). Bandar lama otomatis duduk di meja kalau masih online.
function promote(room, newToken, returnFormerHostToSeat = true) {
  const np = room.players.find((p) => p.token === newToken);
  if (!np) return;
  const oldToken = room.hostToken;
  if (
    room.poker.active ||
    room.bj.phase === "playing" ||
    room.players.some((p) => p.bjBet || p.bjSplitBet)
  ) {
    cancelRound(
      room,
      "Ronde dibatalkan karena pergantian Bandar. Semua chip dikembalikan",
    );
  }

  clearOffer(room);
  const newName = np.name;
  const oldProf = room.hostProfile;
  const newProf = { name: np.name, avatar: np.avatar, ready: true };
  unseatPlayer(room, np);
  room.hostToken = newToken;
  // Profil Bandar lama disimpan supaya dia duduk dengan nama & foto yang sama; profil pemain baru jadi profil Bandar
  const prev = room.stash[oldToken];
  if (returnFormerHostToSeat) {
    room.stash[oldToken] = {
      name: oldProf.name,
      avatar: oldProf.avatar,
      ready: !!oldProf.ready,
      chips: prev ? prev.chips : room.startChips,
    };
  } else {
    delete room.stash[oldToken];
  }
  room.hostProfile = newProf;
  const online =
    returnFormerHostToSeat &&
    [...clients].some((c) => c.token === oldToken && c.roomCode === room.code);
  const seated = online ? seatPlayer(room, oldToken) : null;
  logRoom(
    room,
    `${newName} sekarang menjadi Bandar${seated ? ` • Bandar sebelumnya duduk sebagai ${seated.name}` : ""}`,
  );
}

function resumeSession(room, token) {
  const session = room.suspended[token];
  if (!session) throw "Sesi sebelumnya tidak ditemukan";

  if (session.role === "host") {
    const currentHostToken = room.hostToken;
    room.hostToken = token;
    room.hostProfile = session.profile;
    delete room.stash[token];
    if (currentHostToken && currentHostToken !== token)
      seatPlayer(room, currentHostToken);
  } else {
    const player =
      room.players.find((p) => p.token === token) || seatPlayer(room, token);
    if (!player) throw "Tidak dapat melanjutkan sesi pemain";
  }

  delete room.suspended[token];
  logRoom(
    room,
    session.role === "host"
      ? `${room.hostProfile.name} kembali menjadi Bandar`
      : `${session.name} kembali ke meja`,
  );
}

// Dipakai untuk tawaran Bandar (perlu persetujuan pemain)
const offerTimers = {};
function clearOffer(room) {
  clearTimeout(offerTimers[room.code]);
  delete offerTimers[room.code];
  room.pendingHost = null;
}

// Menyimpan sesi saat koneksi terakhir pemain di room benar-benar terputus.
function handleDisconnect(token, code) {
  const room = rooms[code];
  if (
    !room ||
    [...clients].some((c) => c.token === token && c.roomCode === code)
  )
    return;

  if (room.hostToken === token) {
    room.suspended[token] = {
      role: "host",
      profile: { ...room.hostProfile },
    };
    clearOffer(room);
    if (room.poker.active || room.bj.phase === "playing")
      cancelRound(room, "Ronde dibatalkan karena Bandar terputus");

    const next = room.players.find((p) =>
      [...clients].some((c) => c.token === p.token && c.roomCode === code),
    );
    if (next) {
      logRoom(room, "Bandar terputus. Mencari Bandar baru secara otomatis…");
      promote(room, next.token);
    } else {
      room.hostToken = null;
      logRoom(room, "Bandar terputus. Menunggu Bandar kembali…");
    }
  } else {
    const player = room.players.find((p) => p.token === token);
    if (!player) return;
    room.suspended[token] = {
      role: "player",
      name: player.name,
    };
    if (room.poker.active || room.bj.phase === "playing")
      cancelRound(room, `${player.name} terputus. Ronde dibatalkan`);
    unseatPlayer(room, player);
    logRoom(room, `${player.name} terputus dan meninggalkan meja`);
  }
  broadcast(code);
}

function handle(b) {
  const { token, type, roomCode } = b;

  if (type === "hostRoom") {
    const name = String(b.name || "")
      .trim()
      .slice(0, 16);
    if (!name) throw "Nama tidak boleh kosong";
    if (!isValidAvatar(b.avatar)) throw "Foto tidak dapat digunakan";
    const code = generateRoomCode();
    rooms[code] = initRoom(code);
    rooms[code].hostToken = token;
    rooms[code].hostProfile = { name, avatar: b.avatar, ready: true };
    logRoom(rooms[code], `${name} membuat room sebagai Bandar`);
    return { ok: 1, roomCode: code };
  }

  const room = rooms[roomCode];
  if (!room) throw "Room tidak ditemukan atau telah ditutup!";

  room.touched = Date.now();
  const me = room.players.find((p) => p.token === token);
  const isHost = room.hostToken === token;

  const needHost = () => {
    if (!isHost) throw "Hanya Bandar yang memiliki akses ini!";
    if (!room.hostProfile.ready) throw "Pilih nama dan foto profil Bandar dulu";
  };
  const needMe = () => {
    if (!me) throw "Kamu belum bergabung di room ini!";
    return me;
  };

  switch (type) {
    case "checkRoom":
      break; // hanya untuk memastikan room ada (error ditangani di atas)
    case "resumeSession":
      resumeSession(room, token);
      break;
    case "declineResume": {
      const session = room.suspended[token];
      delete room.suspended[token];
      if (session && session.role === "player") {
        if (me) unseatPlayer(room, me);
      } else {
        delete room.stash[token];
      }
      if (session && session.role === "host" && !room.hostToken) {
        const next = room.players[0];
        if (next) promote(room, next.token);
        else delete rooms[room.code];
      }
      break;
    }
    case "joinRoom": {
      if (isHost) throw "Bandar tidak dapat bergabung sebagai pemain";
      if (room.suspended[token] && !me)
        throw "Pilih Lanjutkan atau Tidak untuk sesi sebelumnya terlebih dahulu";
      const name = String(b.name || "")
        .trim()
        .slice(0, 16);
      if (!name) throw "Nama tidak boleh kosong";
      if (!isValidAvatar(b.avatar)) throw "Foto tidak dapat digunakan";
      if (nameTaken(room, name, me || null)) throw "Nama sudah dipakai";
      const player =
        me ||
        seatPlayer(room, token, {
          name,
          avatar: b.avatar,
        });
      if (!player) throw "Tidak dapat bergabung ke meja";
      if (me) {
        delete room.suspended[token];
        player.name = name;
        player.avatar = b.avatar;
        player.ready = true;
      } else {
        logRoom(room, `${player.name} join meja`);
      }
      break;
    }
    case "profile": {
      const m = isHost ? room.hostProfile : needMe(); // Bandar mengatur profilnya sendiri
      if (b.name !== undefined) {
        const name = String(b.name || "")
          .trim()
          .slice(0, 16);
        if (!name) throw "Nama tidak boleh kosong";
        if (nameTaken(room, name, isHost ? "host" : m))
          throw "Nama sudah dipakai";
        m.name = name;
      }
      if (b.avatar !== undefined) {
        if (!isValidAvatar(b.avatar)) throw "Foto tidak dapat digunakan";
        m.avatar = b.avatar;
      }
      m.ready = true;
      break;
    }
    case "leave": {
      if (!me) break;
      if (me.inHand || me.bjBet > 0 || me.bjSplitBet > 0)
        throw "Tunggu hingga ronde selesai sebelum keluar";
      unseatPlayer(room, me);
      logRoom(room, `${me.name} telah meninggalkan meja`);
      break;
    }
    case "leaveHost": {
      needHost();
      clearOffer(room);
      const nextHost =
        room.players.find((p) =>
          [...clients].some(
            (client) =>
              client.token === p.token && client.roomCode === room.code,
          ),
        ) || room.players[0];
      if (nextHost) {
        promote(room, nextHost.token, false);
      } else {
        delete rooms[room.code];
      }
      break;
    }
    case "act":
      act(room, needMe(), b.a, b.amount);
      break;
    case "confirmDealerStage": {
      needHost();
      room.dealerConfirmedStage = true;
      logRoom(
        room,
        `Bandar telah mengonfirmasi pembukaan kartu ${room.poker.stage.toUpperCase()}`,
      );
      break;
    }
    case "bet":
      needMe();
      if (room.mode !== "blackjack" || room.bj.phase !== "betting")
        throw "Belum saatnya bertaruh";
      const oldBet = me.bjBet;
      setBet(room, me, Math.floor(+b.amount || 0));
      me.bjHasSplit = false;
      me.bjDoubled = false;
      if (me.bjBet !== oldBet)
        logRoom(
          room,
          me.bjBet > oldBet
            ? `${me.name} memasang taruhan ${me.bjBet.toLocaleString("id-ID")}`
            : `${me.name} mengubah taruhan menjadi ${me.bjBet.toLocaleString("id-ID")}`,
        );
      break;
    case "add": {
      needMe();
      if (
        room.bj.phase !== "playing" ||
        !me.bjBet ||
        me.bjDoubled ||
        me.bjHasSplit
      )
        throw "Tidak dapat menambah taruhan";
      const a = Math.min(Math.floor(+b.amount || 0), me.chips);
      if (!a) throw "Chip tidak mencukupi";
      me.chips -= a;
      me.bjBet += a;
      me.bjDoubled = true;
      logRoom(room, `${me.name} Double taruhan +${a}`);
      break;
    }
    case "splitBJ": {
      needMe();
      if (
        room.bj.phase !== "playing" ||
        !me.bjBet ||
        me.bjDoubled ||
        me.bjSplitBet
      )
        throw "Tidak dapat melakukan split";
      if (me.chips < me.bjBet) throw "Chip tidak cukup untuk Melakukan Split";
      me.chips -= me.bjBet;
      me.bjSplitBet = me.bjBet;
      me.bjHasSplit = true;
      logRoom(room, `${me.name} Melakukan SPLIT (+${me.bjBet} chip)`);
      break;
    }
    case "setup":
      needHost();
      if (room.poker.active || room.bj.phase === "playing")
        throw "Selesaikan ronde yang berjalan terlebih dahulu!";
      const cancelBlackjackBets =
        b.mode === "poker" &&
        room.mode === "blackjack" &&
        room.players.some((p) => p.bjBet || p.bjSplitBet);
      if (cancelBlackjackBets && b.cancelBlackjackBets !== true)
        throw "Ada taruhan Blackjack yang belum dikunci. Konfirmasi pembatalan taruhan untuk pindah ke Poker.";
      if (cancelBlackjackBets) {
        room.players.forEach((p) => {
          p.chips += (p.bjBet || 0) + (p.bjSplitBet || 0);
          p.bjBet = p.bjSplitBet = 0;
          p.bjHasSplit = false;
          p.bjDoubled = false;
        });
        room.bj.phase = "betting";
        room.bj.resolved = false;
      }
      if (b.mode && b.mode !== room.mode) {
        room.mode = b.mode;
        room.log = [];
        logRoom(room, `Mode game diubah ke ${b.mode.toUpperCase()}`);
        if (cancelBlackjackBets)
          logRoom(room, "Taruhan Blackjack dibatalkan. Chip dikembalikan");
      }
      const oldStartChips = room.startChips;
      const oldSb = room.sb;
      const oldBb = room.bb;
      if (b.startChips !== undefined)
        room.startChips = Math.max(1, Math.floor(+b.startChips || 0));
      if (b.sb !== undefined) room.sb = Math.max(1, Math.floor(+b.sb || 0));
      if (b.bb !== undefined) room.bb = Math.max(1, Math.floor(+b.bb || 0));
      room.bb = Math.max(room.sb, room.bb);
      const changes = [];
      if (oldSb !== room.sb) changes.push(`Small Blind menjadi ${room.sb}`);
      if (oldBb !== room.bb) changes.push(`Big Blind menjadi ${room.bb}`);
      if (oldStartChips !== room.startChips)
        changes.push(`Chip Awal menjadi ${room.startChips}`);
      if (changes.length) logRoom(room, changes.join(" • "));
      break;
    case "reorderPlayers": {
      needHost();
      if (room.poker.active || room.bj.phase === "playing")
        throw "Tidak bisa mengubah urutan saat ronde berjalan";
      if (Array.isArray(b.newOrder)) {
        const order = b.newOrder.map(Number);
        if (
          order.length !== room.players.length ||
          new Set(order).size !== room.players.length ||
          room.players.some((p) => !order.includes(p.id))
        )
          throw "Urutan pemain tidak valid";
        room.players.sort((x, y) => order.indexOf(x.id) - order.indexOf(y.id));
        logRoom(room, "Bandar merubah urutan tempat duduk pemain");
      }
      break;
    }
    case "transferHost": {
      needHost();
      const target = P(room, b.targetId);
      if (!target) throw "Pemain tidak ditemukan";
      if (room.poker.active || room.bj.phase === "playing")
        throw "Selesaikan ronde yang berjalan sebelum mengganti Bandar";
      clearOffer(room);
      room.pendingHost = { targetId: target.id, targetName: target.name };
      offerTimers[room.code] = setTimeout(() => {
        if (rooms[room.code] && room.pendingHost) {
          logRoom(
            room,
            `Tawaran Bandar ke ${room.pendingHost.targetName} kedaluwarsa`,
          );
          room.pendingHost = null;
          broadcast(room.code);
        }
      }, 60000);
      logRoom(
        room,
        `Bandar menawarkan peran Bandar ke ${target.name}. Menunggu persetujuan…`,
      );
      break;
    }
    case "cancelHostOffer":
      needHost();
      if (room.pendingHost) {
        clearOffer(room);
        logRoom(room, "Tawaran Bandar dibatalkan");
      }
      break;
    case "respondHost": {
      const o = room.pendingHost;
      if (!o) throw "Tawaran Bandar sudah tidak berlaku";
      const m = needMe();
      if (m.id !== o.targetId) throw "Tawaran ini bukan untukmu";
      if (b.accept) {
        if (room.poker.active || room.bj.phase === "playing") {
          clearOffer(room);
          throw "Ronde sedang berjalan, tawaran dibatalkan";
        }
        promote(room, m.token);
      } else {
        clearOffer(room);
        logRoom(room, `${m.name} menolak peran Bandar`);
      }
      break;
    }
    case "start":
      needHost();
      clearOffer(room);
      room.log = [];
      startHand(room);
      break;
    case "award":
      needHost();
      award(room, b.winners);
      break;
    case "musicStore": {
      const player = needMe();
      const trackId = String(b.trackId || "");
      const track = MVP_MUSIC_TRACKS.find((item) => item.id === trackId);
      if (!track) throw "Musik MVP tidak tersedia";
      if (!Array.isArray(player.ownedMvpMusicTrackIds))
        player.ownedMvpMusicTrackIds = [];
      if (player.ownedMvpMusicTrackIds.includes(trackId))
        throw "Musik MVP sudah dimiliki";
      if (
        room.poker.active ||
        room.bj.phase === "playing" ||
        room.players.some((p) => p.bjBet || p.bjSplitBet)
      )
        throw "Musik hanya dapat dibeli saat ronde tidak aktif";
      if (player.chips < MVP_MUSIC_PRICE)
        throw "Chip tidak mencukupi untuk membeli musik MVP";
      player.chips -= MVP_MUSIC_PRICE;
      player.ownedMvpMusicTrackIds.push(trackId);
      break;
    }
    case "cancel":
      needHost();
      if (room.poker.active) {
        room.players.forEach((p) => {
          p.chips += p.contrib;
        });
        endHand(room);
        logRoom(room, "Hand dibatalkan. Chip dikembalikan");
      }
      break;
    case "adjust": {
      needHost();
      const p = P(room, b.id);
      if (!p) break;
      const d = Number(b.delta);
      if (!Number.isSafeInteger(d) || d === 0)
        throw "Jumlah chip harus berupa angka bulat lebih dari nol";
      p.chips = Math.max(0, p.chips + d);
      logRoom(
        room,
        `Bandar ${d >= 0 ? "menambah" : "mengurangi"} ${Math.abs(d)} chip untuk ${p.name}`,
      );
      break;
    }
    case "transferChips": {
      const sender = needMe();
      if (
        room.poker.active ||
        (room.mode === "blackjack" &&
          (room.bj.phase === "playing" ||
            room.players.some((p) => p.bjBet || p.bjSplitBet)))
      )
        throw "Transfer chip hanya tersedia saat ronde tidak aktif";
      const targetId = Number(b.targetId);
      const recipient = P(room, targetId);
      if (!recipient) throw "Pemain tidak ditemukan";
      if (recipient === sender)
        throw "Tidak bisa mengirim chip ke diri sendiri";
      const amount = Number(b.amount);
      if (!Number.isSafeInteger(amount) || amount < 1)
        throw "Jumlah chip harus berupa angka bulat lebih dari nol";
      if (amount > sender.chips) throw "Chip tidak mencukupi";
      if (!Number.isSafeInteger(recipient.chips + amount))
        throw "Jumlah chip penerima terlalu besar";
      sender.chips -= amount;
      recipient.chips += amount;
      logRoom(
        room,
        `${sender.name} mengirim ${amount.toLocaleString("id-ID")} chip kepada ${recipient.name}`,
      );
      break;
    }
    case "borderStore": {
      const player = needMe();
      const action = b.action;
      const color = b.color;
      if (!Array.isArray(player.ownedBorderColors))
        player.ownedBorderColors = [];
      if (!Array.isArray(player.ownedProfileBorderColors))
        player.ownedProfileBorderColors = [];
      const ensureBorderPurchasable = () => {
        if (
          room.poker.active ||
          room.bj.phase === "playing" ||
          room.players.some((p) => p.bjBet || p.bjSplitBet)
        )
          throw "Border hanya dapat dibeli saat ronde tidak aktif";
      };
      if (action === "buy") {
        const price = PLAYER_BORDER_PRODUCTS.get(color);
        if (price === undefined) throw "Warna border tidak tersedia";
        if (player.ownedBorderColors.includes(color))
          throw "Warna border sudah dimiliki";
        ensureBorderPurchasable();
        if (player.chips < price)
          throw "Chip tidak mencukupi untuk membeli border";
        player.chips -= price;
        player.ownedBorderColors.push(color);
        player.borderColor = color;
        break;
      }
      if (action === "buyProfile") {
        const price = PLAYER_BORDER_PRODUCTS.get(color);
        if (price === undefined) throw "Warna border tidak tersedia";
        if (player.ownedProfileBorderColors.includes(color))
          throw "Warna border profil sudah dimiliki";
        ensureBorderPurchasable();
        if (player.chips < price)
          throw "Chip tidak mencukupi untuk membeli border profil";
        player.chips -= price;
        player.ownedProfileBorderColors.push(color);
        player.profileBorderColor = color;
        break;
      }
      if (action === "buyBundle") {
        const price = PLAYER_BORDER_PRODUCTS.get(color);
        if (price === undefined) throw "Warna border tidak tersedia";
        const needsSpotlight = !player.ownedBorderColors.includes(color);
        const needsProfile = !player.ownedProfileBorderColors.includes(color);
        if (!needsSpotlight && !needsProfile)
          throw "Bundle border sudah dimiliki";
        ensureBorderPurchasable();
        const bundlePrice = Math.ceil(
          price * (Number(needsSpotlight) + Number(needsProfile)) * 0.75,
        );
        if (player.chips < bundlePrice)
          throw "Chip tidak mencukupi untuk membeli bundle border";
        player.chips -= bundlePrice;
        if (needsSpotlight) player.ownedBorderColors.push(color);
        if (needsProfile) player.ownedProfileBorderColors.push(color);
        player.borderColor = color;
        player.profileBorderColor = color;
        break;
      }
      if (action === "equip") {
        if (!PLAYER_BORDER_PRODUCTS.has(color))
          throw "Warna border tidak tersedia";
        if (!player.ownedBorderColors.includes(color))
          throw "Warna border belum dimiliki";
        player.borderColor = color;
        break;
      }
      if (action === "equipProfile") {
        if (!PLAYER_BORDER_PRODUCTS.has(color))
          throw "Warna border tidak tersedia";
        if (!player.ownedProfileBorderColors.includes(color))
          throw "Warna border profil belum dimiliki";
        player.profileBorderColor = color;
        break;
      }
      if (action === "clear") {
        player.borderColor = null;
        break;
      }
      if (action === "clearProfile") {
        player.profileBorderColor = null;
        break;
      }
      if (action === "unlockLeaderBorders") {
        if (uniqueChipLeaderId(room) !== player.id)
          throw "Hanya pemimpin chip yang dapat membuka trial border";
        if (player.leaderBordersUnlocked) throw "Trial border sudah terbuka";
        ensureBorderPurchasable();
        if (player.chips < 5000)
          throw "Chip tidak mencukupi untuk membuka trial border";
        player.chips -= 5000;
        player.leaderBordersUnlocked = true;
        break;
      }
      if (action === "leaderStyle") {
        if (uniqueChipLeaderId(room) !== player.id)
          throw "Hanya pemimpin chip yang dapat memilih gaya border";
        if (color === "default") {
          player.leaderBorderColor = null;
          break;
        }
        if (
          color !== "rgb" &&
          (typeof color !== "string" || !PLAYER_BORDER_PRODUCTS.has(color))
        )
          throw "Warna border tidak tersedia";
        if (
          color !== "rgb" &&
          !player.leaderBordersUnlocked &&
          !player.ownedBorderColors.includes(color)
        )
          throw "Buka trial border pemimpin terlebih dahulu";
        player.leaderBorderColor = color;
        break;
      }
      throw "Aksi store tidak valid";
    }
    case "kick": {
      needHost();
      const p = P(room, b.id);
      if (!p) break;
      if (p.inHand || p.bjBet || p.bjSplitBet)
        throw "Tunggu hingga ronde selesai";
      unseatPlayer(room, p);
      logRoom(room, `${p.name} dikeluarkan oleh Bandar`);
      break;
    }
    case "resetAll":
      needHost();
      if (room.poker.active || room.bj.phase === "playing")
        throw "Hand masih berjalan";
      room.players.forEach((p) => {
        p.chips = room.startChips;
        p.bjBet = p.bjSplitBet = 0;
        p.bjHasSplit = false;
        p.bjDoubled = false;
      });
      Object.values(room.stash).forEach((s) => {
        s.chips = room.startChips;
      });
      room.bj.phase = "betting";
      room.bj.resolved = false;
      room.bj.dealerTurn = null;
      room.log = [];
      logRoom(room, "Semua chip pemain berhasil direset");
      break;
    case "bjDeal":
      needHost();
      if (room.mode !== "blackjack") throw "Mode bukan Blackjack";
      if (!room.players.some((p) => p.bjBet > 0))
        throw "Belum ada pemain yang memasang taruhan";
      clearOffer(room);
      room.players.forEach((p) => {
        p.last = p.bjBet || p.last;
        p.bjDoubled = false;
      });
      room.bj.resolved = false;
      room.bj.phase = "playing";
      room.bj.dealerTurn = nextBJTurn(room);
      room.mvpMusicEligiblePlayerIds = [];
      room.mvpMusicChosenForRound = false;
      room.mvpRoundWinnerIds = [];
      logRoom(room, "Kartu dikocok & taruhan dikunci");
      break;
    case "bjResolve":
      needHost();
      {
        const p = P(room, b.id);
        if (p) bjResolve(room, p, b.result, b.betSlot);
      }
      break;
    case "bjNext":
      needHost();
      if (room.mode !== "blackjack" || room.bj.phase !== "playing")
        throw "Ronde Blackjack tidak sedang berlangsung";
      room.bj.dealerTurn = nextBJTurn(room, room.bj.dealerTurn);
      break;
    case "bjAll":
      needHost();
      room.players
        .filter((p) => p.bjBet > 0 || p.bjSplitBet > 0)
        .forEach((p) => bjResolve(room, p, b.result));
      break;
    case "bjCancel":
      needHost();
      if (room.bj.phase !== "playing" || room.bj.resolved)
        throw "Ronde tidak dapat dibatalkan";
      room.players.forEach((p) => {
        p.chips += p.bjBet + p.bjSplitBet;
        p.bjBet = p.bjSplitBet = 0;
        p.bjHasSplit = false;
        p.bjDoubled = false;
      });
      room.bj.phase = "betting";
      room.bj.resolved = false;
      room.bj.dealerTurn = null;
      room.mvpRoundWinnerIds = [];
      logRoom(room, "Ronde Blackjack dibatalkan");
      break;
    default:
      throw "Perintah tidak dikenal";
  }
  return {
    ok: 1,
    ...(type === "joinRoom" ? { roomCode: room.code } : {}),
    ...(type === "checkRoom"
      ? {
          suggestedName: defaultName(room),
          ...(!me && room.suspended[token]
            ? {
                resumeOffer: {
                  role: room.suspended[token].role,
                  name:
                    room.suspended[token].role === "host"
                      ? room.suspended[token].profile.name
                      : room.suspended[token].name,
                  chips: room.stash[token] ? room.stash[token].chips : null,
                },
              }
            : {}),
        }
      : {}),
  };
}

function view(token, roomCode) {
  const room = rooms[roomCode];
  if (!room) return { error: "ROOM_NOT_FOUND", ver: VERSION };

  const me = room.players.find((p) => p.token === token);
  const k = room.poker;
  const isHost = room.hostToken === token;

  const activeChipHolders = room.players.filter((p) => p.chips > 0);
  const roundInProgress = room.poker.active || room.bj.phase === "playing";
  const winnerName =
    !roundInProgress &&
    room.players.length > 1 &&
    activeChipHolders.length === 1
      ? activeChipHolders[0].name
      : null;

  return {
    ver: VERSION,
    code: room.code,
    mode: room.mode,
    startChips: room.startChips,
    sb: room.sb,
    bb: room.bb,
    log: room.log,
    lastEvent: room.lastEvent,
    lastEventId: room.lastEventId,
    dealerConfirmedStage: room.dealerConfirmedStage,
    winnerName,
    mvpMusicTrackId: room.mvpMusicTrackId,
    mvpMusicEventId: room.mvpMusicEventId,
    mvpMusicChosenBy: room.mvpMusicChosenBy,
    mvpMusicEligiblePlayerIds: room.mvpMusicEligiblePlayerIds,
    mvpMusicChosenForRound: room.mvpMusicChosenForRound,
    players: room.players.map(({ token, ...r }) => r),
    poker: {
      ...k,
      pot: pot(room),
      layers: k.stage === "showdown" ? layers(room) : [],
    },
    bj: room.bj,
    pendingHost: room.pendingHost,
    host: room.hostProfile,
    resumeOffer: !me && room.suspended[token]
      ? {
          role: room.suspended[token].role,
          name:
            room.suspended[token].role === "host"
              ? room.suspended[token].profile.name
              : room.suspended[token].name,
          chips: room.stash[token] ? room.stash[token].chips : null,
        }
      : null,
    you: me ? me.id : null,
    isHost,
  };
}

const send = (c) => {
  if (c.roomCode) {
    c.res.write("data: " + JSON.stringify(view(c.token, c.roomCode)) + "\n\n");
  }
};

const broadcast = (code) =>
  clients.forEach((c) => {
    if (c.roomCode === code) send(c);
  });

function sendStaticFile(req, res, filePath, contentType) {
  const stats = fs.statSync(filePath);
  const etag = `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
  const lastModified = stats.mtime.toUTCString();
  const ifNoneMatch = req.headers["if-none-match"];
  let notModified = false;

  if (ifNoneMatch) {
    notModified = ifNoneMatch.split(",").some((tag) => {
      const candidate = tag.trim();
      return (
        candidate === "*" ||
        candidate.replace(/^W\//, "") === etag.replace(/^W\//, "")
      );
    });
  } else if (req.headers["if-modified-since"]) {
    const ifModifiedSince = Date.parse(req.headers["if-modified-since"]);
    notModified =
      Number.isFinite(ifModifiedSince) &&
      Math.floor(stats.mtimeMs / 1000) <= Math.floor(ifModifiedSince / 1000);
  }

  const headers = {
    "Cache-Control": "no-cache",
    ETag: etag,
    "Last-Modified": lastModified,
  };
  if (notModified) {
    res.writeHead(304, headers);
    return res.end();
  }

  res.writeHead(200, {
    ...headers,
    "Content-Type": contentType,
    "Content-Length": stats.size,
  });
  return fs.createReadStream(filePath).pipe(res);
}

http
  .createServer((req, res) => {
    const u = new URL(req.url, "http://x");

    if (req.method === "GET" && u.pathname === "/room-qr") {
      const roomCode = (u.searchParams.get("room") || "").toUpperCase();
      if (!/^[A-Z0-9]{6}$/.test(roomCode) || !rooms[roomCode]) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Room tidak ditemukan");
      }
      const forwardedProtocol = String(req.headers["x-forwarded-proto"] || "")
        .split(",")[0]
        .trim();
      const forwardedHost = String(req.headers["x-forwarded-host"] || "")
        .split(",")[0]
        .trim();
      const protocol =
        forwardedProtocol || (req.socket.encrypted ? "https" : "http");
      const host = forwardedHost || req.headers.host;
      let origin;
      try {
        origin = new URL(process.env.PUBLIC_ORIGIN || `${protocol}://${host}`)
          .origin;
      } catch {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Origin tidak valid");
      }
      const inviteUrl = new URL("/", origin);
      inviteUrl.searchParams.set("room", roomCode);
      return QRCode.toBuffer(inviteUrl.toString(), {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      })
        .then((image) => {
          res.writeHead(200, {
            "Content-Type": "image/png",
            "Cache-Control": "no-store",
          });
          res.end(image);
        })
        .catch(() => {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("QR gagal dibuat");
        });
    }

    if (u.pathname === "/manifest.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(fs.readFileSync(path.join(PUBLIC_PATH, "manifest.json")));
    }
    if (req.method === "GET" && u.pathname === "/robots.txt") {
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      });
      return res.end(fs.readFileSync(path.join(PUBLIC_PATH, "robots.txt")));
    }
    if (req.method === "GET" && u.pathname === "/sitemap.xml") {
      res.writeHead(200, {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      });
      return res.end(fs.readFileSync(path.join(PUBLIC_PATH, "sitemap.xml")));
    }
    if (u.pathname === "/sw.js") {
      res.writeHead(200, {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      });
      return res.end(fs.readFileSync(path.join(PUBLIC_PATH, "sw.js")));
    }
    const legalPages = {
      "/about": "about.html",
      "/terms": "terms.html",
      "/privacy": "privacy.html",
    };
    if (req.method === "GET" && legalPages[u.pathname]) {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      return res.end(
        fs.readFileSync(path.join(PUBLIC_PATH, "pages", legalPages[u.pathname])),
      );
    }
    if (u.pathname.startsWith("/assets/sounds/mvp/")) {
      let file;
      try {
        file = decodeURIComponent(
          u.pathname.slice("/assets/sounds/mvp/".length),
        );
      } catch {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Invalid asset path");
      }
      const extension = path.extname(file).toLowerCase();
      if (
        !file ||
        file !== path.basename(file) ||
        (file !== "tracks.json" && extension !== ".mp3")
      ) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Asset tidak ditemukan");
      }
      const assetPath = path.resolve(
        PUBLIC_PATH,
        "assets",
        "sounds",
        "mvp",
        file,
      );
      if (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Asset tidak ditemukan");
      }
      return sendStaticFile(
        req,
        res,
        assetPath,
        file === "tracks.json"
          ? "application/json; charset=utf-8"
          : "audio/mpeg",
      );
    }
    const assetMatch = u.pathname.match(/^\/assets\/(css|js|images)\/(.+)$/);
    if (assetMatch) {
      let assetPath;
      try {
        assetPath = path.resolve(
          PUBLIC_PATH,
          "assets",
          assetMatch[1],
          decodeURIComponent(assetMatch[2]),
        );
      } catch {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("Invalid asset path");
      }
      const assetRoot = path.resolve(PUBLIC_PATH, "assets", assetMatch[1]);
      const relativePath = path.relative(assetRoot, assetPath);
      const extension = path.extname(assetPath).toLowerCase();
      const allowedExtensions =
        assetMatch[1] === "images" ? [".svg"] : [`.${assetMatch[1]}`];
      const contentTypes = {
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".svg": "image/svg+xml",
      };
      if (
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath) ||
        !allowedExtensions.includes(extension)
      ) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Asset tidak ditemukan");
      }
      let assetStats;
      try {
        assetStats = fs.statSync(assetPath);
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
      }
      if (!assetStats || !assetStats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Asset tidak ditemukan");
      }
      return sendStaticFile(req, res, assetPath, contentTypes[extension]);
    }
    if (
      u.pathname.startsWith("/assets/sound/") ||
      u.pathname.startsWith("/assets/sounds/") ||
      u.pathname.startsWith("/sounds/")
    ) {
      const file = path.basename(decodeURIComponent(u.pathname));
      const soundLocations = [
        path.join(PUBLIC_PATH, "assets", "sounds", file),
        path.join(PUBLIC_PATH, "assets", "sound", file),
        path.join(PUBLIC_PATH, "sounds", file),
      ];
      const soundPath = soundLocations.find(
        (candidate) =>
          fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
      );
      if (soundPath) {
        res.writeHead(200, {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        });
        return fs.createReadStream(soundPath).pipe(res);
      }
    }

    if (
      u.pathname === "/logo.png" ||
      u.pathname === "/assets/logo/logo-main.png" ||
      u.pathname === "/assets/logo/logo-small.png"
    ) {
      const requestedLogo =
        u.pathname === "/assets/logo/logo-small.png"
          ? "logo-small.png"
          : "logo-main.png";
      const p = path.join(PUBLIC_PATH, "assets", "logo", requestedLogo);
      const fallback =
        requestedLogo === "logo-small.png"
          ? path.join(PUBLIC_PATH, "assets", "logo", "logo-main.png")
          : path.join(PUBLIC_PATH, "logo.png");
      const logoPath = fs.existsSync(p) ? p : fallback;
      if (fs.existsSync(logoPath)) {
        return sendStaticFile(req, res, logoPath, "image/png");
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Logo belum ada");
    }

    if (u.pathname === "/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      const c = {
        res,
        token: u.searchParams.get("token") || "",
        roomCode: u.searchParams.get("room") || "",
      };
      const key = disconnectKey(c.token, c.roomCode);
      clearTimeout(disconnectTimers.get(key));
      disconnectTimers.delete(key);
      clients.add(c);
      res.write("retry: 1500\n\n");
      const rm = rooms[c.roomCode];
      if (rm) rm.touched = Date.now();
      send(c);
      res.on("close", () => {
        clients.delete(c);
        clearTimeout(disconnectTimers.get(key));
        disconnectTimers.set(
          key,
          setTimeout(() => {
            disconnectTimers.delete(key);
            handleDisconnect(c.token, c.roomCode);
          }, DISCONNECT_GRACE_MS),
        );
      });
      return;
    }

    if (req.method === "POST" && u.pathname === "/api") {
      const retryAfter = getApiRateLimitRetryAfter(req);
      if (retryAfter) {
        res.writeHead(429, {
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": String(retryAfter),
        });
        return res.end(
          JSON.stringify({
            err: "Terlalu banyak permintaan. Coba lagi sebentar.",
          }),
        );
      }

      const contentLength = Number(req.headers["content-length"]);
      if (contentLength > API_MAX_BODY_BYTES) {
        res.writeHead(413, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(JSON.stringify({ err: "Ukuran permintaan terlalu besar." }));
        req.resume();
        return;
      }

      let bodyBytes = 0;
      let tooLarge = false;
      const chunks = [];
      req.on("data", (chunk) => {
        if (tooLarge) return;
        bodyBytes += chunk.length;
        if (bodyBytes > API_MAX_BODY_BYTES) {
          tooLarge = true;
          chunks.length = 0;
          res.writeHead(413, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(JSON.stringify({ err: "Ukuran permintaan terlalu besar." }));
          return;
        }
        chunks.push(chunk);
      });
      req.on("end", () => {
        if (tooLarge) return;
        let out;
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
            throw new Error("Format permintaan tidak valid");
          const resData = handle(parsed);
          out = { ok: 1, ...resData };
          if (parsed.roomCode || out.roomCode) {
            broadcast(parsed.roomCode || out.roomCode);
          }
        } catch (e) {
          out = { err: typeof e === "string" ? e : e.message };
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(out));
      });
      return;
    }

    if (req.method === "GET" && u.pathname !== "/") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Halaman tidak ditemukan");
    }

    fs.readFile(VIEW_PATH, (err, html) => {
      res.writeHead(err ? 500 : 200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      });
      res.end(err ? "app/Views/index.html tidak ditemukan" : html);
    });
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`\n♠ Chips-in Multi-Room berjalan di port ${PORT}\n`);
  });

setInterval(() => clients.forEach((c) => c.res.write(": ping\n\n")), 20000);

// Hapus room yang tidak ada koneksi sama sekali selama 3 jam (hemat RAM 512MB)
setInterval(
  () => {
    for (const code in rooms) {
      const idle = Date.now() - (rooms[code].touched || 0) > 3 * 3600 * 1000;
      if (idle && ![...clients].some((c) => c.roomCode === code))
        delete rooms[code];
    }
  },
  10 * 60 * 1000,
);
