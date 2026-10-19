const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;

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
    dealerConfirmedStage: true, // Lock aksi sebelum dealer konfirm flop/river
    poker: { active: false, stage: 'idle', dealer: null, turn: null, currentBet: 0, minRaise: 0, order: [], sbId: null, bbId: null },
    bj: { phase: 'betting' }
  };
}

const P = (room, id) => room.players.find(p => p.id === id);
const pot = (room) => room.players.reduce((a, p) => a + (p.contrib || 0), 0);

/* ---------- LOGIKA POKER ---------- */
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
  room.dealerConfirmedStage = false; // Kunci aksi pemain sampai dealer menekan konfirmasi kartu
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
  
  // Fitur Otomatisasi Side Pot: Jika pemenang Pot Utama ada di Side Pot, pilih otomatis
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

/* ---------- LOGIKA BLACKJACK ---------- */
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

/* ---------- DISCONNECT & HOST AUTO-TRANSFER ---------- */
function handleDisconnect(token) {
  for (const code in rooms) {
    const room = rooms[code];
    if (room.hostToken === token) {
      const activePlayers = room.players.filter(p => p.token !== token);
      if (activePlayers.length > 0) {
        room.hostToken = activePlayers[0].token;
        logRoom(room, `Bandar keluar. Peran bandar otomatis dialihkan ke ${activePlayers[0].name}`);
      } else {
        delete rooms[code]; // Hapus room jika kosong
      }
    }
  }
}

/* ---------- REQUEST HANDLER ---------- */
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

  const me = room.players.find(p => p.token === token);
  const isHost = room.hostToken === token;

  const needHost = () => { if (!isHost) throw 'Hanya Bandar yang memiliki akses ini!'; };
  const needMe = () => { if (!me) throw 'Kamu belum bergabung di room ini!'; return me; };

  switch (type) {
    case 'join': {
      if (me) break;
      let name = String(b.name || '').trim().slice(0, 16);
      if (!name) throw 'Nama tidak boleh kosong';
      if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        name += ' ' + room.nextId;
      }
      room.players.push({ 
        id: room.nextId++, 
        token, 
        name, 
        chips: room.startChips, 
        bet: 0, 
        contrib: 0, 
        folded: false, 
        allin: false, 
        acted: false, 
        inHand: false, 
        bjBet: 0, 
        bjSplitBet: 0, 
        last: 0 
      });
      logRoom(room, `${name} bergabung dengan ${room.startChips} chip`);
      break;
    }
    case 'leave': {
      if (!me) break;
      if (me.inHand || me.bjBet > 0) throw 'Tunggu hingga ronde selesai sebelum keluar';
      room.players = room.players.filter(p => p !== me);
      logRoom(room, `${me.name} telah meninggalkan meja`);
      if (isHost) handleDisconnect(token);
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
        room.log = []; // Reset riwayat saat ubah mode
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
        room.players.sort((a, b) => b.newOrder.indexOf(a.id) - b.newOrder.indexOf(b.id));
        logRoom(room, 'Bandar merubah urutan tempat duduk pemain');
      }
      break;
    }
    case 'transferHost': {
      needHost();
      const target = P(room, b.targetId);
      if (!target) throw 'Pemain tidak ditemukan';
      room.hostToken = target.token;
      logRoom(room, `Peran Bandar telah diserahkan kepada ${target.name}`);
      break;
    }
    case 'start': 
      needHost(); 
      room.log = []; // Reset riwayat tiap sesi hand poker baru
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
      room.players = room.players.filter(q => q !== p); 
      logRoom(room, `${p.name} dikeluarkan oleh Bandar`); 
      break;
    }
    case 'resetAll':
      needHost(); 
      if (room.poker.active) throw 'Hand masih berjalan';
      room.players.forEach(p => { p.chips = room.startChips; p.bjBet = p.bjSplitBet = 0; }); 
      room.bj.phase = 'betting'; 
      room.log = [];
      logRoom(room, 'Semua chip pemain berhasil direset'); 
      break;
    case 'bjDeal':
      needHost(); 
      if (room.mode !== 'blackjack') throw 'Mode bukan Blackjack';
      if (!room.players.some(p => p.bjBet > 0)) throw 'Belum ada pemain yang memasang taruhan';
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

/* ---------- SERVER INITIALIZATION ---------- */
function view(token, roomCode) {
  const room = rooms[roomCode];
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  
  const me = room.players.find(p => p.token === token);
  const k = room.poker;
  const isHost = room.hostToken === token;

  // Cek Pemenang Utama (Jika hanya tersisa 1 orang yang punya chip)
  const activeChipHolders = room.players.filter(p => p.chips > 0);
  const winnerName = (room.players.length > 1 && activeChipHolders.length === 1) ? activeChipHolders[0].name : null;

  return {
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
    you: me ? me.id : null,
    isHost
  };
}

const send = c => {
  if (c.roomCode && rooms[c.roomCode]) {
    c.res.write('data: ' + JSON.stringify(view(c.token, c.roomCode)) + '\n\n');
  }
};

const broadcast = (code) => clients.forEach(c => { if (c.roomCode === code) send(c); });

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');

  // Serve static asset (manifest, logo, sw.js)
  if (u.pathname === '/manifest.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(fs.readFileSync(path.join(__dirname, 'manifest.json')));
  }
  if (u.pathname === '/sw.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    return res.end(fs.readFileSync(path.join(__dirname, 'sw.js')));
  }
  if (u.pathname === '/logo.png') {
    const p = path.join(__dirname, 'logo.png');
    if (fs.existsSync(p)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return fs.createReadStream(p).pipe(res);
    }
  }

  if (u.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const c = { res, token: u.searchParams.get('token') || '', roomCode: u.searchParams.get('room') || '' };
    clients.add(c); 
    res.write('retry: 1500\n\n'); 
    send(c);
    req.on('close', () => { clients.delete(c); handleDisconnect(c.token); }); 
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
    res.writeHead(err ? 500 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(err ? 'index.html tidak ditemukan' : html);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`\n♠ ChipBank V2 Multi-Room berjalan di port ${PORT}\n`);
});

setInterval(() => clients.forEach(c => c.res.write(': ping\n\n')), 20000);