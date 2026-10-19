const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const VERSION = '3.2.0';   // klien yang versinya beda akan otomatis refresh

// Foto profil yang tersedia (tanpa upload). Harus sama dengan daftar di index.html
const AVATARS = ['spade','heart','club','diamond','chip-red','chip-blue','chip-green','chip-black','chip-purple','chip-allin',
  'crown','joker','dice','shark','wolf','fox','cowboy','cool','slot','clover','fire','dragon','lion','hat','rocket','money'];

// In-Memory Multi-Room Storage
const rooms = {}; 
const clients = new Set();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

function logRoom(room, msg) {
  room.log.unshift(`[${new Date().toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}] ${msg}`);
  room.log.length = Math.min(room.log.length, 30);
  room.lastEvent = msg;
}

function initRoom(code) {
  return {
    code,
    hostToken: null,
    mode: 'poker',
    startChips: 1000,
    sb: 5,
    bb: 10,
    nextId: 1,
    players: [],
    log: [],
    lastEvent: 'Room berhasil dibuat.',
    dealerConfirmedStage: true,
    pendingHost: null,
    hostProfile: { name: 'Bandar', avatar: 'crown', ready: false },   // Bandar juga punya nama & foto (tidak ikut bermain)
    stash: {},   // chip & nama pemain yang sedang tidak duduk (supaya tidak bisa dapat chip baru dengan keluar-masuk)
    touched: Date.now(),
    poker: { active: false, stage: 'idle', dealer: null, turn: null, currentBet: 0, minRaise: 0, order: [], sbId: null, bbId: null },
    bj: { phase: 'betting' }
  };
}

const P = (room, id) => room.players.find(p => p.id === id);
const pot = (room) => room.players.reduce((a, p) => a + (p.contrib || 0), 0);

function put(p, a) { p.chips -= a; p.bet += a; p.contrib += a; if (p.chips === 0) p.allin = true; }
function post(p, a) { put(p, Math.min(a, p.chips)); }

function nextActor(room, startIdx) {
  const o = room.poker.order;
  for (let i = 0; i < o.length; i++) {
    const p = P(room, o[(startIdx + i) % o.length]);
    if (p && !p.folded && !p.allin && (!p.acted || p.bet < room.poker.currentBet)) return p.id;
  }
  return null;
}

function startHand(room) {
  const k = room.poker;
  if (room.mode !== 'poker') throw 'Mode saat ini bukan Poker';
  if (k.active) throw 'Hand masih berjalan';
  const order = room.players.filter(p => p.chips > 0).map(p => p.id);
  if (order.length < 2) throw 'Minimal 2 pemain yang memiliki chip';
  
  room.players.forEach(p => { 
    p.bet = p.contrib = 0; 
    p.folded = p.allin = p.acted = false; 
    p.inHand = order.includes(p.id); 
  });

  const n = order.length;
  let di = order.indexOf(k.dealer);
  di = di === -1 ? 0 : (di + 1) % n;
  
  const sbI = n === 2 ? di : (di + 1) % n, bbI = (sbI + 1) % n;
  Object.assign(k, { active: true, stage: 'preflop', dealer: order[di], order, currentBet: 0, minRaise: room.bb, sbId: order[sbI], bbId: order[bbI] });
  post(P(room, order[sbI]), room.sb); 
  post(P(room, order[bbI]), room.bb);
  k.currentBet = Math.max(...order.map(id => P(room, id).bet));
  k.turn = nextActor(room, (bbI + 1) % n);
  room.dealerConfirmedStage = true;
  logRoom(room, `Hand baru dimulai • Dealer: ${P(room, k.dealer).name} • Blind ${room.sb}/${room.bb}`);
  if (!k.turn) nextStage(room);
}

function nextStage(room) {
  const k = room.poker, stages = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  room.players.forEach(p => { p.bet = 0; p.acted = false; });
  k.currentBet = 0; k.minRaise = room.bb;
  k.stage = stages[stages.indexOf(k.stage) + 1];
  
  const can = k.order.map(id => P(room, id)).filter(p => p && !p.folded && !p.allin);
  if (k.stage === 'showdown' || can.length < 2) { 
    k.stage = 'showdown'; 
    k.turn = null; 
    room.dealerConfirmedStage = true;
    logRoom(room, 'Showdown! Tentukan pemenang.'); 
    return; 
  }
  
  k.turn = nextActor(room, k.order.indexOf(k.dealer) + 1);
  room.dealerConfirmedStage = false;
  logRoom(room, `Menunggu Bandar menampilkan kartu ${k.stage.toUpperCase()} di meja fisik.`);
}

function endHand(room) {
  const k = room.poker;
  Object.assign(k, { active: false, stage: 'idle', turn: null, currentBet: 0 });
  room.players.forEach(p => { p.bet = p.contrib = 0; p.folded = p.allin = p.acted = p.inHand = false; });
}

function afterAction(room) {
  const k = room.poker;
  const live = k.order.map(id => P(room, id)).filter(p => p && !p.folded);
  if (live.length === 1) { 
    const w = live[0], t = pot(room); 
    w.chips += t; 
    logRoom(room, `${w.name} menang ${t} chip (semua pemain fold)`); 
    endHand(room); 
    return; 
  }
  const nxt = nextActor(room, k.order.indexOf(k.turn) + 1);
  if (nxt) k.turn = nxt; else nextStage(room);
}

function act(room, p, a, amount) {
  const k = room.poker;
  if (!k.active || k.stage === 'showdown' || k.turn !== p.id) throw 'Bukan giliranmu';
  if (!room.dealerConfirmedStage) throw 'Menunggu Bandar konfirmasi pembukaan kartu fisik terlebih dahulu!';
  
  const toCall = k.currentBet - p.bet;
  if (a === 'fold') { 
    p.folded = true; 
    logRoom(room, `${p.name} Fold`); 
  } else if (a === 'call') {
    const c = Math.min(toCall, p.chips); 
    put(p, c);
    logRoom(room, c ? `${p.name} Call ${c}${p.allin ? ' (ALL-IN)' : ''}` : `${p.name} Check`);
  } else if (a === 'raise' || a === 'allin') {
    let to = a === 'allin' ? p.bet + p.chips : Math.floor(+amount || 0);
    if (to - p.bet > p.chips) to = p.bet + p.chips;
    const allinNow = (to - p.bet === p.chips);
    if (to <= 0) throw 'Jumlah taruhan tidak valid';
    if (to <= k.currentBet && !allinNow) throw 'Raise harus lebih besar dari taruhan saat ini';
    if (to < k.currentBet + k.minRaise && !allinNow) throw 'Minimal raise ke ' + (k.currentBet + k.minRaise);
    
    put(p, to - p.bet);
    if (to > k.currentBet) {
      k.minRaise = Math.max(k.minRaise, to - k.currentBet); 
      k.currentBet = to;
      room.players.forEach(q => { if (q !== p && q.inHand && !q.folded && !q.allin) q.acted = false; });
    }
    logRoom(room, `${p.name} ${p.allin ? 'ALL-IN ke' : 'Raise ke'} ${to}`);
  } else throw 'Aksi tidak dikenal';
  
  p.acted = true; 
  afterAction(room);
}

function layers(room) {
  const ps = room.players.filter(p => p.contrib > 0);
  const lv = [...new Set(ps.map(p => p.contrib))].sort((a, b) => a - b);
  let prev = 0, carry = 0, out = [];
  for (const L of lv) {
    let amount = ps.reduce((a, p) => a + Math.min(p.contrib, L) - Math.min(p.contrib, prev), 0);
    const elig = ps.filter(p => !p.folded && p.contrib >= L).map(p => p.id);
    prev = L;
    if (!elig.length) { carry += amount; continue; }
    amount += carry; carry = 0;
    const last = out[out.length - 1];
    if (last && last.elig.join() === elig.join()) last.amount += amount; else out.push({ amount, elig });
  }
  if (carry && out.length) out[out.length - 1].amount += carry;
  return out;
}

function award(room, winners) {
  const k = room.poker;
  if (!k.active || k.stage !== 'showdown') throw 'Belum tahap Showdown';
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

  ls.forEach((l, i) => {
    const w = (winners[i] || []).filter(id => l.elig.includes(id));
    if (!w.length) return;
    const share = Math.floor(l.amount / w.length);
    let rem = l.amount - share * w.length;
    w.forEach(id => { 
      const add = share + (rem-- > 0 ? 1 : 0); 
      P(room, id).chips += add; 
    });
    logRoom(room, `${i === 0 ? 'Pot Utama' : 'Side Pot ' + i} (${l.amount}) dikirim ke: ${w.map(id => P(room, id).name).join(', ')}`);
  });
  endHand(room);
}

function setBet(room, p, amt) {
  p.chips += p.bjBet; 
  amt = Math.min(amt, p.chips);
  p.chips -= amt; 
  p.bjBet = amt;
}

function bjResolve(room, p, res) {
  const mult = { win: 2, bj: 2.5, push: 1, lose: 0 };
  if (!(res in mult)) throw 'Hasil tidak valid';
  if (!p.bjBet && !p.bjSplitBet) return;
  
  let totalPay = 0;
  if (p.bjBet > 0) {
    totalPay += Math.floor(p.bjBet * mult[res]);
    p.bjBet = 0;
  }
  if (p.bjSplitBet > 0) {
    totalPay += Math.floor(p.bjSplitBet * mult[res]);
    p.bjSplitBet = 0;
  }
  
  p.chips += totalPay;
  logRoom(room, `${p.name}: ${res.toUpperCase()} (Menerima ${totalPay} chip)`);
  if (!room.players.some(q => q.bjBet > 0 || q.bjSplitBet > 0)) room.bj.phase = 'betting';
}

// ---------- Meja: semua orang di room (selain Bandar) otomatis jadi pemain ----------
// except: objek pemain yang dikecualikan, atau 'host' kalau yang dicek adalah nama Bandar sendiri
const nameTaken = (room, name, except) => {
  const n = name.toLowerCase();
  if (room.players.some(p => p !== except && p.name.toLowerCase() === n)) return true;
  return except !== 'host' && !!room.hostProfile && room.hostProfile.name.toLowerCase() === n;
};

function defaultName(room) {
  for (let i = 1; ; i++) if (!nameTaken(room, 'Pemain ' + i)) return 'Pemain ' + i;
}

function seatPlayer(room, token) {
  if (!token || room.hostToken === token || room.players.some(p => p.token === token)) return null;
  const old = room.stash[token];
  let name = old && old.name && !nameTaken(room, old.name) ? old.name : defaultName(room);
  const id = room.nextId++;
  const p = {
    id, token, name,
    avatar: old && old.avatar ? old.avatar : AVATARS[(id - 1) % AVATARS.length],
    ready: !!(old && old.ready),          // false = belum mengisi nama/foto -> klien menampilkan pop up profil
    chips: old ? old.chips : room.startChips,
    bet: 0, contrib: 0, folded: false, allin: false, acted: false, inHand: false,
    bjBet: 0, bjSplitBet: 0, last: 0
  };
  room.players.push(p);
  delete room.stash[token];
  logRoom(room, `${p.name} duduk di meja (${p.chips} chip)`);
  return p;
}

// Pemain meninggalkan meja. Chip disimpan, jadi kalau kembali chipnya sama (bukan chip baru).
function unseatPlayer(room, p) {
  p.chips += (p.bjBet || 0) + (p.bjSplitBet || 0);   // taruhan blackjack yang belum dikunci dikembalikan
  p.bjBet = p.bjSplitBet = 0;
  room.stash[p.token] = { name: p.name, chips: p.chips, avatar: p.avatar, ready: p.ready };
  room.players = room.players.filter(q => q !== p);
  if (room.pendingHost && room.pendingHost.targetId === p.id) clearOffer(room);
}

function cancelRound(room, why) {
  if (room.poker.active) {
    room.players.forEach(p => { p.chips += p.contrib; });
    endHand(room);
  }
  if (room.bj.phase === 'playing' || room.players.some(p => p.bjBet || p.bjSplitBet)) {
    room.players.forEach(p => { p.chips += (p.bjBet + p.bjSplitBet); p.bjBet = p.bjSplitBet = 0; });
    room.bj.phase = 'betting';
  }
  logRoom(room, why);
}

// Bandar baru turun dari meja (keluar sebagai pemain). Bandar lama otomatis duduk di meja kalau masih online.
function promote(room, newToken) {
  const np = room.players.find(p => p.token === newToken);
  if (!np) return;
  const oldToken = room.hostToken;
  if (room.poker.active || room.bj.phase === 'playing') {
    cancelRound(room, 'Ronde dibatalkan karena pergantian Bandar. Semua chip dikembalikan');
  }
  clearOffer(room);
  const newName = np.name;
  const oldProf = room.hostProfile;
  const newProf = { name: np.name, avatar: np.avatar, ready: true };
  unseatPlayer(room, np);
  room.hostToken = newToken;
  // Profil Bandar lama disimpan supaya dia duduk dengan nama & foto yang sama; profil pemain baru jadi profil Bandar
  const prev = room.stash[oldToken];
  room.stash[oldToken] = { name: oldProf.name, avatar: oldProf.avatar, ready: !!oldProf.ready, chips: prev ? prev.chips : room.startChips };
  room.hostProfile = newProf;
  const online = [...clients].some(c => c.token === oldToken && c.roomCode === room.code);
  const seated = online ? seatPlayer(room, oldToken) : null;
  logRoom(room, `${newName} sekarang menjadi Bandar${seated ? ` • Bandar sebelumnya duduk sebagai ${seated.name}` : ''}`);
}

// Dipakai untuk tawaran Bandar (perlu persetujuan pemain)
const offerTimers = {};
function clearOffer(room) {
  clearTimeout(offerTimers[room.code]);
  delete offerTimers[room.code];
  room.pendingHost = null;
}

// Dipanggil HANYA kalau Bandar benar-benar terputus (sudah lewat masa tunggu).
// Di sini pengalihan Bandar otomatis, tanpa persetujuan.
function handleDisconnect(token) {
  for (const code in rooms) {
    const room = rooms[code];
    if (room.hostToken !== token) continue;
    const others = room.players.filter(p => p.token !== token);
    const online = others.filter(p => [...clients].some(c => c.token === p.token && c.roomCode === code));
    const next = online[0] || others[0];
    if (next) {
      logRoom(room, 'Bandar terputus. Mencari Bandar baru secara otomatis…');
      promote(room, next.token);
      broadcast(code);
    } else if (![...clients].some(x => x.roomCode === code)) {
      clearOffer(room);
      delete rooms[code];
    }
  }
}

function handle(b) {
  const { token, type, roomCode } = b;
  
  if (type === 'hostRoom') {
    const code = generateRoomCode();
    rooms[code] = initRoom(code);
    rooms[code].hostToken = token;
    return { ok: 1, roomCode: code };
  }

  const room = rooms[roomCode];
  if (!room) throw 'Room tidak ditemukan atau telah ditutup!';

  room.touched = Date.now();
  const me = room.players.find(p => p.token === token);
  const isHost = room.hostToken === token;

  const needHost = () => {
    if (!isHost) throw 'Hanya Bandar yang memiliki akses ini!';
    if (!room.hostProfile.ready) throw 'Pilih nama dan foto profil Bandar dulu';
  };
  const needMe = () => { if (!me) throw 'Kamu belum bergabung di room ini!'; return me; };

  switch (type) {
    case 'checkRoom': break;   // hanya untuk memastikan room ada (error ditangani di atas)
    case 'profile': {
      const m = isHost ? room.hostProfile : needMe();   // Bandar mengatur profilnya sendiri
      if (b.name !== undefined) {
        const name = String(b.name || '').trim().slice(0, 16);
        if (!name) throw 'Nama tidak boleh kosong';
        if (nameTaken(room, name, isHost ? 'host' : m)) throw 'Nama sudah dipakai';
        if (name !== m.name) { const o = m.name; m.name = name; logRoom(room, `${o} mengganti nama menjadi ${name}`); }
      }
      if (b.avatar !== undefined) {
        if (!AVATARS.includes(b.avatar)) throw 'Foto profil tidak valid';
        m.avatar = b.avatar;
      }
      m.ready = true;
      break;
    }
    case 'leave': {
      if (!me) break;
      if (me.inHand || me.bjBet > 0) throw 'Tunggu hingga ronde selesai sebelum keluar';
      unseatPlayer(room, me);
      logRoom(room, `${me.name} telah meninggalkan meja`);
      break;
    }
    case 'act': act(room, needMe(), b.a, b.amount); break;
    case 'confirmDealerStage': {
      needHost();
      room.dealerConfirmedStage = true;
      logRoom(room, `Bandar telah mengonfirmasi pembukaan kartu ${room.poker.stage.toUpperCase()}`);
      break;
    }
    case 'bet':
      needMe(); 
      if (room.mode !== 'blackjack' || room.bj.phase !== 'betting') throw 'Belum saatnya bertaruh';
      setBet(room, me, Math.floor(+b.amount || 0)); 
      break;
    case 'add': {
      needMe(); 
      if (room.bj.phase !== 'playing' || !me.bjBet) throw 'Tidak dapat menambah taruhan';
      const a = Math.min(Math.floor(+b.amount || 0), me.chips); 
      if (!a) throw 'Chip tidak mencukupi';
      me.chips -= a; 
      me.bjBet += a; 
      logRoom(room, `${me.name} Double taruhan +${a}`); 
      break;
    }
    case 'splitBJ': {
      needMe();
      if (room.bj.phase !== 'playing' || !me.bjBet) throw 'Tidak dapat melakukan split';
      if (me.chips < me.bjBet) throw 'Chip tidak cukup untuk Melakukan Split';
      me.chips -= me.bjBet;
      me.bjSplitBet = me.bjBet;
      logRoom(room, `${me.name} Melakukan SPLIT (+${me.bjBet} chip)`);
      break;
    }
    case 'setup':
      needHost();
      if (room.poker.active || room.bj.phase === 'playing') throw 'Selesaikan ronde yang berjalan terlebih dahulu!';
      if (b.mode && b.mode !== room.mode) {
        room.mode = b.mode;
        room.log = [];
        logRoom(room, `Mode game diubah ke ${b.mode.toUpperCase()}`);
      }
      if (b.startChips) room.startChips = Math.max(1, Math.floor(+b.startChips || 0));
      if (b.sb) room.sb = Math.max(1, Math.floor(+b.sb || 0));
      if (b.bb) room.bb = Math.max(room.sb, Math.floor(+b.bb || 0)); 
      break;
    case 'reorderPlayers': {
      needHost();
      if (room.poker.active) throw 'Tidak bisa mengubah urutan saat hand berjalan';
      if (Array.isArray(b.newOrder)) {
        const order = b.newOrder;
        room.players.sort((x, y) => order.indexOf(x.id) - order.indexOf(y.id));
        logRoom(room, 'Bandar merubah urutan tempat duduk pemain');
      }
      break;
    }
    case 'transferHost': {
      needHost();
      const target = P(room, b.targetId);
      if (!target) throw 'Pemain tidak ditemukan';
      if (room.poker.active || room.bj.phase === 'playing') throw 'Selesaikan ronde yang berjalan sebelum mengganti Bandar';
      clearOffer(room);
      room.pendingHost = { targetId: target.id, targetName: target.name };
      offerTimers[room.code] = setTimeout(() => {
        if (rooms[room.code] && room.pendingHost) {
          logRoom(room, `Tawaran Bandar ke ${room.pendingHost.targetName} kedaluwarsa`);
          room.pendingHost = null;
          broadcast(room.code);
        }
      }, 60000);
      logRoom(room, `Bandar menawarkan peran Bandar ke ${target.name}. Menunggu persetujuan…`);
      break;
    }
    case 'cancelHostOffer':
      needHost();
      if (room.pendingHost) { clearOffer(room); logRoom(room, 'Tawaran Bandar dibatalkan'); }
      break;
    case 'respondHost': {
      const o = room.pendingHost;
      if (!o) throw 'Tawaran Bandar sudah tidak berlaku';
      const m = needMe();
      if (m.id !== o.targetId) throw 'Tawaran ini bukan untukmu';
      if (b.accept) {
        if (room.poker.active || room.bj.phase === 'playing') { clearOffer(room); throw 'Ronde sedang berjalan, tawaran dibatalkan'; }
        promote(room, m.token);
      } else {
        clearOffer(room);
        logRoom(room, `${m.name} menolak peran Bandar`);
      }
      break;
    }
    case 'start': 
      needHost(); 
      clearOffer(room);
      room.log = [];
      startHand(room); 
      break;
    case 'award': needHost(); award(room, b.winners); break;
    case 'cancel':
      needHost();
      if (room.poker.active) { 
        room.players.forEach(p => { p.chips += p.contrib; }); 
        endHand(room); 
        logRoom(room, 'Hand dibatalkan. Chip dikembalikan'); 
      }
      break;
    case 'adjust': {
      needHost(); 
      const p = P(room, b.id); 
      if (!p) break;
      const d = Math.trunc(+b.delta || 0); 
      p.chips = Math.max(0, p.chips + d);
      logRoom(room, `Bandar ${d >= 0 ? 'menambah' : 'mengurangi'} ${Math.abs(d)} chip untuk ${p.name}`); 
      break;
    }
    case 'kick': {
      needHost(); 
      const p = P(room, b.id); 
      if (!p) break;
      if (p.inHand || p.bjBet) throw 'Tunggu hingga ronde selesai';
      unseatPlayer(room, p);
      logRoom(room, `${p.name} dikeluarkan oleh Bandar`); 
      break;
    }
    case 'resetAll':
      needHost(); 
      if (room.poker.active) throw 'Hand masih berjalan';
      room.players.forEach(p => { p.chips = room.startChips; p.bjBet = p.bjSplitBet = 0; }); 
      Object.values(room.stash).forEach(s => { s.chips = room.startChips; });
      room.bj.phase = 'betting'; 
      room.log = [];
      logRoom(room, 'Semua chip pemain berhasil direset'); 
      break;
    case 'bjDeal':
      needHost(); 
      if (room.mode !== 'blackjack') throw 'Mode bukan Blackjack';
      if (!room.players.some(p => p.bjBet > 0)) throw 'Belum ada pemain yang memasang taruhan';
      clearOffer(room);
      room.players.forEach(p => { p.last = p.bjBet || p.last; }); 
      room.bj.phase = 'playing'; 
      logRoom(room, 'Kartu dikocok & taruhan dikunci'); 
      break;
    case 'bjResolve': needHost(); { const p = P(room, b.id); if (p) bjResolve(room, p, b.result); } break;
    case 'bjAll': needHost(); room.players.filter(p => p.bjBet > 0 || p.bjSplitBet > 0).forEach(p => bjResolve(room, p, b.result)); break;
    case 'bjCancel':
      needHost(); 
      room.players.forEach(p => { p.chips += (p.bjBet + p.bjSplitBet); p.bjBet = p.bjSplitBet = 0; }); 
      room.bj.phase = 'betting'; 
      logRoom(room, 'Ronde Blackjack dibatalkan'); 
      break;
    default: throw 'Perintah tidak dikenal';
  }
  return { ok: 1 };
}

function view(token, roomCode) {
  const room = rooms[roomCode];
  if (!room) return { error: 'ROOM_NOT_FOUND', ver: VERSION };
  
  const me = room.players.find(p => p.token === token);
  const k = room.poker;
  const isHost = room.hostToken === token;

  const activeChipHolders = room.players.filter(p => p.chips > 0);
  const winnerName = (room.players.length > 1 && activeChipHolders.length === 1) ? activeChipHolders[0].name : null;

  return {
    ver: VERSION,
    code: room.code,
    mode: room.mode,
    startChips: room.startChips,
    sb: room.sb,
    bb: room.bb,
    log: room.log,
    lastEvent: room.lastEvent,
    dealerConfirmedStage: room.dealerConfirmedStage,
    winnerName,
    players: room.players.map(({ token, ...r }) => r),
    poker: { ...k, pot: pot(room), layers: k.stage === 'showdown' ? layers(room) : [] },
    bj: room.bj,
    pendingHost: room.pendingHost,
    host: room.hostProfile,
    you: me ? me.id : null,
    isHost
  };
}

const send = c => {
  if (c.roomCode) {
    c.res.write('data: ' + JSON.stringify(view(c.token, c.roomCode)) + '\n\n');
  }
};

const broadcast = (code) => clients.forEach(c => { if (c.roomCode === code) send(c); });

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');

  if (u.pathname === '/manifest.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(fs.readFileSync(path.join(__dirname, 'manifest.json')));
  }
  if (u.pathname === '/sw.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-cache' });
    return res.end(fs.readFileSync(path.join(__dirname, 'sw.js')));
  }
  if (u.pathname === '/logo.png') {
    const p = path.join(__dirname, 'logo.png');
    if (fs.existsSync(p)) {
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' });
      return fs.createReadStream(p).pipe(res);
    }
    // Belum ada logo.png -> 404 (jangan kirim index.html), klien akan memakai placeholder
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('logo.png belum ada');
  }

  if (u.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const c = { res, token: u.searchParams.get('token') || '', roomCode: u.searchParams.get('room') || '' };
    clients.add(c); 
    res.write('retry: 1500\n\n'); 
    // Siapa pun yang masuk room (selain Bandar) otomatis duduk di meja sebagai pemain
    const rm = rooms[c.roomCode];
    const seated = rm ? seatPlayer(rm, c.token) : null;
    if (rm) rm.touched = Date.now();
    if (seated) broadcast(c.roomCode); else send(c);
    req.on('close', () => {
      clients.delete(c);
      // Beri waktu 60 detik: refresh / layar HP mati / sinyal putus jangan langsung menghapus room atau memindah bandar
      setTimeout(() => {
        if (![...clients].some(x => x.token === c.token)) handleDisconnect(c.token);
      }, 60000);
    }); 
    return;
  }

  if (req.method === 'POST' && u.pathname === '/api') {
    let d = ''; 
    req.on('data', x => d += x);
    req.on('end', () => {
      let out;
      try { 
        const parsed = JSON.parse(d);
        const resData = handle(parsed); 
        out = { ok: 1, ...resData }; 
        if (parsed.roomCode || out.roomCode) {
          broadcast(parsed.roomCode || out.roomCode);
        }
      } catch (e) { 
        out = { err: typeof e === 'string' ? e : e.message }; 
      }
      res.writeHead(200, { 'Content-Type': 'application/json' }); 
      res.end(JSON.stringify(out));
    });
    return;
  }

  fs.readFile(path.join(__dirname, 'index.html'), (err, html) => {
    res.writeHead(err ? 500 : 200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
    res.end(err ? 'index.html tidak ditemukan' : html);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`\n♠ Chips-in Multi-Room berjalan di port ${PORT}\n`);
});

setInterval(() => clients.forEach(c => c.res.write(': ping\n\n')), 20000);

// Hapus room yang tidak ada koneksi sama sekali selama 3 jam (hemat RAM 512MB)
setInterval(() => {
  for (const code in rooms) {
    const idle = Date.now() - (rooms[code].touched || 0) > 3 * 3600 * 1000;
    if (idle && ![...clients].some(c => c.roomCode === code)) delete rooms[code];
  }
}, 10 * 60 * 1000);