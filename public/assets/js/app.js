function render() {
  const preserveRoomViewport = Boolean(roomCode && st);
  const savedScrollX = window.scrollX;
  const savedScrollY = window.scrollY;
  const savedModalScrollTop = $("#modal .mbox")?.scrollTop ?? null;
  const currentInput = document.activeElement?.matches(
    "input, textarea, select",
  )
    ? document.activeElement
    : null;
  const savedInput =
    preserveRoomViewport && currentInput?.id
      ? {
          id: currentInput.id,
          value: currentInput.value,
          selectionStart: currentInput.selectionStart,
          selectionEnd: currentInput.selectionEnd,
        }
      : null;

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
          <input id="rc" value="${esc(invitedRoomCode)}" placeholder="Kode Room (6 Karakter)" style="text-transform:uppercase" maxlength="6" onkeydown="if(event.key==='Enter')joinRoom()">
          <button class="ok" onclick="joinRoom()">Join Room</button>
          <button class="g room-camera-button" aria-label="${translateText("Scan QR Room dengan Kamera")}" title="${translateText("Scan QR Room dengan Kamera")}" onclick="openRoomScanner()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h-4L8.5 7H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5L14 5Z"/><circle cx="12" cy="13" r="3.5"/></svg></button>
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
  const transferLocked =
    st.poker.active ||
    st.bj.phase === "playing" ||
    (st.players || []).some((player) => player.bjBet || player.bjSplitBet);
  const canTransferChips =
    me && me.chips > 0 && (st.players || []).length > 1 && !transferLocked;

  let h = `<div class="top">
    <div class="logo-box">
      ${logoHTML(36)}<div><div class="room-code-line"><div class="logo">Room: <b>${st.code || roomCode}</b></div><button class="g room-qr-button" aria-label="${translateText("Tampilkan QR Room")}" title="${translateText("Tampilkan QR Room")}" onclick="openRoomQr()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM19 14h2v2h-2zM19 19h2v2h-2zM14 19h3v2h-3zM17 17h2v2h-2z"/></svg></button></div><div class="logo">${st.mode === "poker" ? "♠ Poker" : "♣ Blackjack"}</div></div>
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
      <div class="row" style="margin-top:8px"><button class="g s" onclick="openProfile('edit')">✎ Edit Profil</button></div></div>`;
  } else if (me) {
    h += `<div class="card"><div class="row sp" style="flex-wrap:nowrap">
      <div class="row" style="flex-wrap:nowrap;gap:12px">${avatar(me.avatar, 54)}<div><div data-player-name style="font-weight:800">${esc(me.name)}</div><div class="chip-balance-row"><div class="big">${fmt(me.chips)}</div></div></div></div>
      <button class="g s" onclick="if(confirm(translateText('Keluar dari room?')))leaveSeat()">Keluar</button></div>
      <div class="row" style="margin-top:8px"><button class="g s" onclick="openProfile('edit')">✎ Edit Profil</button><button class="g s chip-transfer-action" aria-label="Transfer Chips" title="${translateText(canTransferChips ? "Kirim Chip" : "Transfer chip hanya tersedia saat ronde tidak aktif")}" ${canTransferChips ? "" : "disabled"} onclick="openChipTransfer()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 15 22l-4-9-9-4 20-7ZM22 2 11 13"/></svg>Transfer Chips</button></div></div>`;
  }

  const ph = st.pendingHost;
  if (ph && st.isHost) {
    h += `<div class="card" style="border-color:var(--gold)"><div class="row sp"><div class="mut">Menunggu <b>${esc(ph.targetName)}</b> menerima peran Bandar…</div>
      <button class="g s" onclick="api('cancelHostOffer')">Batalkan</button></div></div>`;
  }

  if (st.mode === "poker") h += pokerView(me);
  else h += bjView(me);

  h += `<div class="card"><h3>Riwayat Permainan</h3><div class="log">${(st.log || []).map((l) => `<div>${esc(l)}</div>`).join("") || "—"}</div></div>`;

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

  if (preserveRoomViewport) {
    requestAnimationFrame(() => {
      const input = savedInput && document.getElementById(savedInput.id);
      if (input && !currentInput?.isConnected) {
        input.value = savedInput.value;
        try {
          input.focus({ preventScroll: true });
        } catch {
          input.focus();
        }
        if (savedInput.selectionStart !== null) {
          try {
            input.setSelectionRange(
              savedInput.selectionStart,
              savedInput.selectionEnd,
            );
          } catch {}
        }
      }
      window.scrollTo(savedScrollX, savedScrollY);
      requestAnimationFrame(() => {
        const modalBox = $("#modal .mbox");
        if (modalBox && savedModalScrollTop !== null)
          modalBox.scrollTop = savedModalScrollTop;
      });
    });
  }
}

// PENTING: tampilkan UI dulu, baru sambungkan (kalau tidak, layar kosong saat belum ada room)
render();
connect();
