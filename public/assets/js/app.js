      function render() {
        if (!roomCode) {
          $("#app").innerHTML = `
      <div class="top"><div class="logo-box">${logoHTML(36)}<div class="logo">Chips-<b>in</b></div></div><div class="row">${settingsButtonHTML()}</div></div>
      <div class="card">
        <h3>Selamat Datang di Chips-in</h3>
        <p class="mut">Aplikasi chip kasino digital untuk Poker & Blackjack IRL bersama teman.</p>
        <div class="row" style="margin-top:12px">
          <button class="y f" onclick="beginHostCreation()">Host Room (Buat Meja Baru)</button>
        </div>
        <div style="margin:16px 0;text-align:center" class="mut">— ATAU —</div>
        <div class="row">
          <input id="rc" placeholder="Kode Room (6 Karakter)" style="text-transform:uppercase" maxlength="6" onkeydown="if(event.key==='Enter')joinRoom()">
          <button class="ok" onclick="joinRoom()">Join Room</button>
        </div>
      </div>`;
          localizeTree($("#app"));
          return;
        }

        if (!st) {
          $("#app").innerHTML =
            `<div class="card"><div class="mut">Menghubungkan ke Room ${roomCode}…</div><button class="g s" style="margin-top:10px" onclick="roomCode='';localStorage.cb_room='';render()">Batal / Ganti Room</button></div>`;
          localizeTree($("#app"));
          return;
        }

        const me = st.players ? st.players.find((p) => p.id === st.you) : null;

        let h = `<div class="top">
    <div class="logo-box">
      ${logoHTML(36)}<div class="logo">Room: <b>${st.code || roomCode}</b></div>
    </div>
    <div class="row">
      ${settingsButtonHTML()}
      ${st.isHost ? `<button class="y s" onclick="openDealerControls()">👑 Kontrol Dealer</button>` : ""}
    </div>
  </div>`;

        if (!st.isHost && st.host) {
          h += `<div class="row" style="margin:0 0 10px;gap:8px">${avatar(st.host.avatar, 26)}<div class="mut">👑 Bandar: <b data-player-name style="color:var(--tx)">${esc(st.host.name)}</b></div></div>`;
        }

        if (st.isHost) {
          const hp = st.host || {};
          h += `<div class="card"><div class="row sp" style="flex-wrap:nowrap">
      <div class="row" style="flex-wrap:nowrap;gap:12px">${avatar(hp.avatar, 54)}<div><div data-player-name style="font-weight:800">${esc(hp.name)}</div><div class="mut">👑 Bandar</div></div></div>
      <button class="g s" onclick="leaveHostRoom()">Keluar</button></div>
      <div class="row" style="margin-top:8px"><button class="g s" onclick="openProfile('name')">✎ Ganti Nama</button><button class="g s" onclick="openProfile('avatar')">🖼 Ganti Foto</button></div></div>`;
        } else if (me) {
          h += `<div class="card"><div class="row sp" style="flex-wrap:nowrap">
      <div class="row" style="flex-wrap:nowrap;gap:12px">${avatar(me.avatar, 54)}<div><div data-player-name style="font-weight:800">${esc(me.name)}</div><div class="big">${fmt(me.chips)}</div></div></div>
      <button class="g s" onclick="if(confirm(translateText('Keluar dari room?')))leaveSeat()">Keluar</button></div>
      <div class="row" style="margin-top:8px"><button class="g s" onclick="openProfile('name')">✎ Ganti Nama</button><button class="g s" onclick="openProfile('avatar')">🖼 Ganti Foto</button></div></div>`;
        }

        const ph = st.pendingHost;
        if (ph && st.isHost) {
          h += `<div class="card" style="border-color:var(--gold)"><div class="row sp"><div class="mut">Menunggu <b>${esc(ph.targetName)}</b> menerima peran Bandar…</div>
      <button class="g s" onclick="api('cancelHostOffer')">Batalkan</button></div></div>`;
        }

        h += roundStartControl();
        if (st.mode === "poker") h += pokerView(me);
        else h += bjView(me);

        h += `<div class="card"><h3>Riwayat Permainan</h3><div class="log">${(st.log || []).map((l) => `<div>${esc(l)}</div>`).join("") || "—"}</div></div>`;

        if (notice && !st.isHost) {
          h += `<div class="winner-modal">
      <button class="g notice-close" aria-label="Tutup" onclick="closeNotice()">×</button>
      ${
        notice.type === "winner"
          ? `<div class="confetti-box">🎉 🪙 👑 🪙 🎉</div>
      <h1 style="color:var(--gold);font-size:36px;margin:10px 0">${esc(notice.name)} MENANG KASINO!</h1>
      <p style="color:#fff">Menjadi satu-satunya pemenang yang menguasai semua chip!</p>`
          : `<div class="confetti-box">🪙</div>
      <h1 style="color:var(--red);font-size:32px;margin:10px 0">CHIPS KAMU HABIS</h1>
      <p style="color:#fff">Minta Bandar mengisi chip kamu untuk bermain kembali.</p>`
      }
    </div>`;
        }

        if (ph && me && ph.targetId === me.id) {
          h += `<div class="winner-modal" style="z-index:10000">
      <div style="font-size:48px">👑</div>
      <h1 style="color:var(--gold);font-size:28px;margin:10px 0">Jadi Bandar?</h1>
      <p style="color:#fff;max-width:320px">Bandar menawarkan peran <b>Bandar</b> kepadamu. Jika kamu terima, kamu <b>keluar dari meja</b> dan tidak ikut bermain lagi (chipmu disimpan), sedangkan Bandar lama otomatis duduk sebagai pemain.</p>
      <div class="row" style="margin-top:14px;justify-content:center">
        <button class="ok" onclick="api('respondHost',{accept:true})">Terima</button>
        <button class="r" onclick="api('respondHost',{accept:false})">Tolak</button>
      </div>
    </div>`;
        }

        if (st.resumeOffer) {
          h += `<div class="winner-modal" style="z-index:10000">
      <div style="font-size:48px">${st.resumeOffer.role === "host" ? "👑" : "🪙"}</div>
      <h1 style="color:var(--gold);font-size:28px;margin:10px 0">Lanjutkan ke room sebelumnya?</h1>
      <p style="color:#fff;max-width:320px">Kembali sebagai ${st.resumeOffer.role === "host" ? "Bandar" : `pemain ${esc(st.resumeOffer.name)}`}${st.resumeOffer.chips == null ? "" : ` dengan ${fmt(st.resumeOffer.chips)} chip`}.</p>
      <div class="row" style="margin-top:14px;justify-content:center">
        <button class="ok" onclick="api('resumeSession')">Lanjutkan</button>
        <button class="g" onclick="declineResume()">Tidak</button>
      </div>
    </div>`;
        }

        if (toastMsg) h += `<div class="toast">${esc(toastMsg)}</div>`;
        $("#app").innerHTML = h;
        localizeTree($("#app"));

        const prof = myProfile(); // berlaku juga untuk Bandar: wajib pilih nama & foto sebelum memegang kontrol room
        if (prof && !prof.ready && !pfOpen) openProfile("full");
        else if (pfOpen && pf.mode === "full" && (!prof || prof.ready))
          closeProfile();
        if (chipAdjustment) renderChipAdjustment();
        else if (dealerControlsOpen && st.isHost) renderDealerControls();
      }

      // PENTING: tampilkan UI dulu, baru sambungkan (kalau tidak, layar kosong saat belum ada room)
      render();
      connect();
