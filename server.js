// ChipBank - chip digital lokal untuk poker & blackjack (tanpa dependency)
// Jalankan: node server.js   (opsional: PORT=3000 PIN=1234 node server.js)
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const PIN = process.env.PIN || String(1000 + crypto.randomInt(9000));
const FILE = path.join(__dirname, 'chipbank-state.json');

let S = {
  mode: 'poker', startChips: 1000, sb: 5, bb: 10, nextId: 1, players: [], log: [],
  poker: { active: false, stage: 'idle', dealer: null, turn: null, currentBet: 0, minRaise: 0, order: [], sbId: null, bbId: null },
  bj: { phase: 'betting' }
};
try { S = Object.assign(S, JSON.parse(fs.readFileSync(FILE, 'utf8'))); } catch {}
const hosts = new Set();
const clients = new Set();

const P = id => S.players.find(p => p.id === id);
const pot = () => S.players.reduce((a, p) => a + (p.contrib || 0), 0);
const log = m => { S.log.unshift(m); S.log.length = Math.min(S.log.length, 40); };
const int = v => Math.max(0, Math.floor(+v || 0));

/* ---------- POKER ---------- */
function put(p, a) { p.chips -= a; p.bet += a; p.contrib += a; if (p.chips === 0) p.allin = true; }
function post(p, a) { put(p, Math.min(a, p.chips)); }

function nextActor(startIdx) {
  const o = S.poker.order;
  for (let i = 0; i < o.length; i++) {
    const p = P(o[(startIdx + i) % o.length]);
    if (p && !p.folded && !p.allin && (!p.acted || p.bet < S.poker.currentBet)) return p.id;
  }
  return null;
}

function startHand() {
  const k = S.poker;
  if (S.mode !== 'poker') throw 'Mode sekarang bukan poker';
  if (k.active) throw 'Hand masih berjalan';
  const order = S.players.filter(p => p.chips > 0).map(p => p.id);
  if (order.length < 2) throw 'Minimal 2 pemain yang punya chip';
  S.players.forEach(p => { p.bet = p.contrib = 0; p.folded = p.allin = p.acted = false; p.inHand = order.includes(p.id); });
  const n = order.length, di = (order.indexOf(k.dealer) + 1) % n;
  const sbI = n === 2 ? di : (di + 1) % n, bbI = (sbI + 1) % n;
  Object.assign(k, { active: true, stage: 'preflop', dealer: order[di], order, currentBet: 0, minRaise: S.bb, sbId: order[sbI], bbId: order[bbI] });
  post(P(order[sbI]), S.sb); post(P(order[bbI]), S.bb);
  k.currentBet = Math.max(...order.map(id => P(id).bet));
  k.turn = nextActor((bbI + 1) % n);
  log(`Hand baru • dealer ${P(k.dealer).name} • blind ${S.sb}/${S.bb}`);
  if (!k.turn) nextStage();
}

function nextStage() {
  const k = S.poker, stages = ['preflop', 'flop', 'turn', 'river', 'showdown'];
  S.players.forEach(p => { p.bet = 0; p.acted = false; });
  k.currentBet = 0; k.minRaise = S.bb;
  k.stage = stages[stages.indexOf(k.stage) + 1];
  const can = k.order.map(P).filter(p => !p.folded && !p.allin);
  if (k.stage === 'showdown' || can.length < 2) { k.stage = 'showdown'; k.turn = null; log('Showdown'); return; }
  k.turn = nextActor(k.order.indexOf(k.dealer) + 1);
  log('— ' + k.stage.toUpperCase() + ' —');
}

function endHand() {
  const k = S.poker;
  Object.assign(k, { active: false, stage: 'idle', turn: null, currentBet: 0 });
  S.players.forEach(p => { p.bet = p.contrib = 0; p.folded = p.allin = p.acted = p.inHand = false; });
}

function afterAction() {
  const k = S.poker;
  const live = k.order.map(P).filter(p => !p.folded);
  if (live.length === 1) { const w = live[0], t = pot(); w.chips += t; log(`${w.name} menang ${t} (semua fold)`); endHand(); return; }
  const nxt = nextActor(k.order.indexOf(k.turn) + 1);
  if (nxt) k.turn = nxt; else nextStage();
}

function act(p, a, amount) {
  const k = S.poker;
  if (!k.active || k.stage === 'showdown' || k.turn !== p.id) throw 'Bukan giliranmu';
  const toCall = k.currentBet - p.bet;
  if (a === 'fold') { p.folded = true; log(`${p.name} fold`); }
  else if (a === 'call') {
    const c = Math.min(toCall, p.chips); put(p, c);
    log(c ? `${p.name} call ${c}${p.allin ? ' (all-in)' : ''}` : `${p.name} check`);
  } else if (a === 'raise' || a === 'allin') {
    let to = a === 'allin' ? p.bet + p.chips : int(amount);
    if (to - p.bet > p.chips) to = p.bet + p.chips;
    const allinNow = to - p.bet === p.chips;
    if (!(to > 0)) throw 'Jumlah tidak valid';
    if (to <= k.currentBet && !allinNow) throw 'Raise harus lebih besar dari taruhan saat ini';
    if (to < k.currentBet + k.minRaise && !allinNow) throw 'Minimal raise ke ' + (k.currentBet + k.minRaise);
    put(p, to - p.bet);
    if (to > k.currentBet) {
      k.minRaise = Math.max(k.minRaise, to - k.currentBet); k.currentBet = to;
      S.players.forEach(q => { if (q !== p && q.inHand && !q.folded && !q.allin) q.acted = false; });
    }
    log(`${p.name} ${to > k.currentBet - 0 && p.allin ? 'all-in ke' : 'raise ke'} ${to}`);
  } else throw 'Aksi tidak dikenal';
  p.acted = true; afterAction();
}

function layers() {
  const ps = S.players.filter(p => p.contrib > 0);
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

function award(winners) {
  const k = S.poker;
  if (!k.active || k.stage !== 'showdown') throw 'Belum showdown';
  const ls = layers();
  if (!Array.isArray(winners) || winners.length !== ls.length) throw 'Data pemenang tidak lengkap';
  ls.forEach((l, i) => { if (!(winners[i] || []).some(id => l.elig.includes(id))) throw `Pilih pemenang untuk pot ${i === 0 ? 'utama' : 'samping ' + i}`; });
  ls.forEach((l, i) => {
    const w = winners[i].filter(id => l.elig.includes(id)), share = Math.floor(l.amount / w.length);
    let rem = l.amount - share * w.length;
    w.forEach(id => { const add = share + (rem-- > 0 ? 1 : 0); P(id).chips += add; });
    log(`${i === 0 ? 'Pot utama' : 'Side pot ' + i} ${l.amount} → ${w.map(id => P(id).name).join(', ')}`);
  });
  endHand();
}

/* ---------- BLACKJACK ---------- */
function setBet(p, amt) {
  p.chips += p.bjBet; amt = Math.min(amt, p.chips);
  p.chips -= amt; p.bjBet = amt;
}
function bjResolve(p, res) {
  const mult = { win: 2, bj: 2.5, push: 1, lose: 0 };
  if (!(res in mult)) throw 'Hasil tidak valid';
  if (!p.bjBet) return;
  const pay = Math.floor(p.bjBet * mult[res]);
  p.chips += pay;
  log(`${p.name}: ${{ win: 'menang', bj: 'BLACKJACK', push: 'seri', lose: 'kalah' }[res]} (taruhan ${p.bjBet}, terima ${pay})`);
  p.bjBet = 0;
  if (!S.players.some(q => q.bjBet > 0)) S.bj.phase = 'betting';
}

/* ---------- HANDLER ---------- */
function handle(b) {
  const { token, type } = b;
  const me = S.players.find(p => p.token === token), host = hosts.has(token);
  const needHost = () => { if (!host) throw 'Hanya bandar (host) yang bisa'; };
  const needMe = () => { if (!me) throw 'Kamu belum bergabung'; return me; };
  switch (type) {
    case 'unlock': if (String(b.pin) !== PIN) throw 'PIN salah'; hosts.add(token); break;
    case 'join': {
      if (me) break;
      let name = String(b.name || '').trim().slice(0, 16);
      if (!name) throw 'Isi nama dulu';
      if (S.players.some(p => p.name.toLowerCase() === name.toLowerCase())) name += ' ' + S.nextId;
      S.players.push({ id: S.nextId++, token, name, chips: S.startChips, bet: 0, contrib: 0, folded: false, allin: false, acted: false, inHand: false, bjBet: 0, last: 0 });
      log(`${name} bergabung dengan ${S.startChips} chip`); break;
    }
    case 'act': act(needMe(), b.a, b.amount); break;
    case 'bet':
      needMe(); if (S.mode !== 'blackjack' || S.bj.phase !== 'betting') throw 'Belum waktunya bertaruh';
      setBet(me, int(b.amount)); break;
    case 'add': {
      needMe(); if (S.bj.phase !== 'playing' || !me.bjBet) throw 'Tidak bisa menambah taruhan';
      const a = Math.min(int(b.amount), me.chips); if (!a) throw 'Chip tidak cukup';
      me.chips -= a; me.bjBet += a; log(`${me.name} tambah taruhan ${a} (double/split)`); break;
    }
    case 'setup':
      needHost();
      if (S.poker.active || S.bj.phase === 'playing') throw 'Selesaikan ronde yang berjalan dulu';
      if (b.mode === 'poker' || b.mode === 'blackjack') S.mode = b.mode;
      if (b.startChips) S.startChips = Math.max(1, int(b.startChips));
      if (b.sb) S.sb = Math.max(1, int(b.sb));
      if (b.bb) S.bb = Math.max(S.sb, int(b.bb)); break;
    case 'start': needHost(); startHand(); break;
    case 'award': needHost(); award(b.winners); break;
    case 'cancel':
      needHost();
      if (S.poker.active) { S.players.forEach(p => { p.chips += p.contrib; }); endHand(); log('Hand dibatalkan, chip dikembalikan'); }
      break;
    case 'adjust': {
      needHost(); const p = P(b.id); if (!p) throw 'Pemain tidak ada';
      const d = Math.trunc(+b.delta || 0); p.chips = Math.max(0, p.chips + d);
      log(`Bandar ${d >= 0 ? 'menambah' : 'mengurangi'} ${Math.abs(d)} chip ${p.name}`); break;
    }
    case 'kick': {
      needHost(); const p = P(b.id); if (!p) break;
      if (p.inHand || p.bjBet) throw 'Tunggu ronde selesai';
      S.players = S.players.filter(q => q !== p); log(`${p.name} dikeluarkan`); break;
    }
    case 'resetAll':
      needHost(); if (S.poker.active) throw 'Hand masih berjalan';
      S.players.forEach(p => { p.chips = S.startChips; p.bjBet = 0; }); S.bj.phase = 'betting'; log('Semua chip direset'); break;
    case 'bjDeal':
      needHost(); if (S.mode !== 'blackjack') throw 'Mode bukan blackjack';
      if (!S.players.some(p => p.bjBet > 0)) throw 'Belum ada yang bertaruh';
      S.players.forEach(p => { p.last = p.bjBet || p.last; }); S.bj.phase = 'playing'; log('Kartu dibagi, taruhan dikunci'); break;
    case 'bjResolve': needHost(); { const p = P(b.id); if (p) bjResolve(p, b.result); } break;
    case 'bjAll': needHost(); S.players.filter(p => p.bjBet > 0).forEach(p => bjResolve(p, b.result)); break;
    case 'bjCancel':
      needHost(); S.players.forEach(p => { p.chips += p.bjBet; p.bjBet = 0; }); S.bj.phase = 'betting'; log('Ronde blackjack dibatalkan'); break;
    default: throw 'Perintah tidak dikenal';
  }
}

/* ---------- SERVER ---------- */
function view(token) {
  const me = S.players.find(p => p.token === token), k = S.poker;
  return {
    mode: S.mode, startChips: S.startChips, sb: S.sb, bb: S.bb, log: S.log,
    players: S.players.map(({ token, ...r }) => r),
    poker: { ...k, pot: pot(), layers: k.stage === 'showdown' ? layers() : [] },
    bj: S.bj, you: me ? me.id : null, host: hosts.has(token)
  };
}
const send = c => c.res.write('data: ' + JSON.stringify(view(c.token)) + '\n\n');
const broadcast = () => clients.forEach(send);
let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => fs.writeFile(FILE, JSON.stringify(S), () => {}), 300); };

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const c = { res, token: u.searchParams.get('token') || '' };
    clients.add(c); res.write('retry: 1500\n\n'); send(c);
    req.on('close', () => clients.delete(c)); return;
  }
  if (req.method === 'POST' && u.pathname === '/api') {
    let d = ''; req.on('data', x => d += x);
    req.on('end', () => {
      let out;
      try { handle(JSON.parse(d)); out = { ok: 1 }; }
      catch (e) { out = { err: typeof e === 'string' ? e : 'Error: ' + e.message }; }
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
      save(); broadcast();
    });
    return;
  }
  fs.readFile(path.join(__dirname, 'index.html'), (err, html) => {
    res.writeHead(err ? 500 : 200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(err ? 'index.html tidak ditemukan' : html);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n♠ ChipBank berjalan!\n');
  Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal)
    .forEach(i => console.log(`  Buka di HP semua pemain:  http://${i.address}:${PORT}`));
  console.log(`\n  PIN bandar (host): ${PIN}\n`);
});
setInterval(() => clients.forEach(c => c.res.write(': ping\n\n')), 20000);
