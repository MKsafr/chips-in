      function settingsButtonHTML() {
        return `<button class="g s" aria-label="${translateText("Pengaturan")}" onclick="openSettings()">⚙ ${translateText("Pengaturan")}</button>`;
      }
      function themeSelect() {
        return (
          `<select onchange="changeTheme(this.value)" title="Tampilan (hanya di perangkat ini)" style="width:auto;padding:4px 8px;font-size:12px">` +
          Object.keys(THEMES)
            .map(
              (k) =>
                `<option value="${k}" ${currentTheme === k ? "selected" : ""}>${THEMES[k]}</option>`,
            )
            .join("") +
          `</select>`
        );
      }
      function openSettings() {
        settingsOpen = true;
        renderSettings();
      }
      function closeSettings() {
        settingsOpen = false;
        $("#modal").innerHTML = "";
      }
      function setVolume(value) {
        currentVolume = Math.max(0, Math.min(Number(value) / 100, 1));
        localStorage.cb_volume = String(currentVolume);
        const label = $("#volumeValue");
        if (label) label.textContent = `${Math.round(currentVolume * 100)}%`;
      }
      function toggleMute() {
        soundMuted = !soundMuted;
        localStorage.cb_muted = String(soundMuted);
        renderSettings();
      }
      function renderSettings() {
        $("#modal").innerHTML = `<div class="modal" onclick="if(event.target===this)closeSettings()"><div class="mbox">
    <div class="row sp"><div style="font-size:18px;font-weight:800">⚙ ${translateText("Pengaturan")}</div><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeSettings()">×</button></div>
    <div class="settings-grid">
      <label class="settings-option"><span class="mut">${translateText("Tema")}</span>
        <select onchange="changeTheme(this.value);renderSettings()">${Object.keys(THEMES).map((key) => `<option value="${key}" ${key === currentTheme ? "selected" : ""}>${THEMES[key]}</option>`).join("")}</select>
      </label>
      <label class="settings-option"><span class="mut">${translateText("Bahasa")}</span>
        <select onchange="updateLanguage(this.value)">${Object.keys(LANGUAGES).map((key) => `<option value="${key}" ${key === currentLanguage ? "selected" : ""}>${LANGUAGES[key]}</option>`).join("")}</select>
      </label>
      <div class="settings-option"><span class="mut">${translateText("Volume Efek Suara")}</span>
        <div class="volume-control"><input type="range" min="0" max="100" value="${Math.round(currentVolume * 100)}" aria-label="${translateText("Volume Efek Suara")}" oninput="setVolume(this.value)"><span id="volumeValue">${Math.round(currentVolume * 100)}%</span></div>
        <button class="g" onclick="toggleMute()">${translateText(soundMuted ? "Nyalakan Suara" : "Matikan Suara")}</button>
      </div>
    </div>
    <button class="b" style="width:100%;margin-bottom:8px" onclick="installApp()">${translateText("Install App")}</button>
    <button class="ok" style="width:100%" onclick="closeSettings()">${translateText("Simpan")}</button>
  </div></div>`;
        localizeTree($("#modal"));
      }

      function exitRoom() {
        if (es) {
          es.close();
          es = null;
        }
        roomCode = "";
        localStorage.cb_room = "";
        st = null;
        dealerControlsOpen = false;
        chipAdjustment = null;
        closeProfile();
        render();
      }
      async function leaveSeat() {
        leaving = true;
        const j = await api("leave");
        if (j && j.ok) exitRoom();
        leaving = false;
      }
      async function leaveHostRoom() {
        if (
          !confirm(
            translateText(
              "Keluar dari room? Bandar akan langsung dialihkan ke pemain lain. Jika tidak ada pemain, room akan dihapus.",
            ),
          )
        )
          return;
        leaving = true;
        try {
          const j = await api("leaveHost");
          if (j && j.ok) exitRoom();
        } finally {
          leaving = false;
        }
      }
      function openDealerControls() {
        dealerControlsOpen = true;
        renderDealerControls();
      }
      function closeDealerControls() {
        dealerControlsOpen = false;
        $("#modal").innerHTML = "";
      }
      function renderDealerControls() {
        if (!dealerControlsOpen || !st || !st.isHost) return;
        $("#modal").innerHTML = `<div class="modal" onclick="if(event.target===this)closeDealerControls()"><div class="mbox">
    <div class="dealer-controls-heading"><div style="font-size:18px;font-weight:800">👑 Kontrol Bandar</div><button class="g s" aria-label="Tutup" onclick="closeDealerControls()">×</button></div>
    ${hostPanel()}
  </div></div>`;
        localizeTree($("#modal"));
      }
      function openChipAdjustment(id, direction) {
        chipAdjustment = { id, direction };
        renderChipAdjustment();
      }
      function closeChipAdjustment() {
        chipAdjustment = null;
        if (dealerControlsOpen) renderDealerControls();
        else $("#modal").innerHTML = "";
      }
      function renderChipAdjustment() {
        if (!chipAdjustment) return;
        const player = (st.players || []).find(
          (p) => p.id === chipAdjustment.id,
        );
        if (!player) return closeChipAdjustment();
        const adding = chipAdjustment.direction > 0;
        $("#modal").innerHTML = `<div class="modal" onclick="if(event.target===this)closeChipAdjustment()"><div class="mbox">
    <div class="row sp"><div style="font-size:18px;font-weight:800">${adding ? "+ Chip" : "- Chip"} • ${esc(player.name)}</div><button class="g s" onclick="closeChipAdjustment()">×</button></div>
    <div class="mut" style="margin:10px 0 4px">Masukkan jumlah chip</div>
    <input id="chipAmount" type="number" min="1" step="1" inputmode="numeric" placeholder="Jumlah chip" onkeydown="if(event.key==='Enter')submitChipAdjustment()">
    <div class="row" style="margin-top:12px"><button class="g f" onclick="closeChipAdjustment()">Batal</button><button class="${adding ? "ok" : "r"} f" onclick="submitChipAdjustment()">Simpan</button></div>
  </div></div>`;
        localizeTree($("#modal"));
      }
      async function submitChipAdjustment() {
        const amount = Number(($("#chipAmount") || {}).value);
        if (!Number.isSafeInteger(amount) || amount < 1) {
          flash("Masukkan jumlah chip bulat lebih dari nol");
          return;
        }
        const { id, direction } = chipAdjustment;
        const j = await api("adjust", { id, delta: direction * amount });
        if (j && j.ok) closeChipAdjustment();
      }
      async function declineResume() {
        leaving = true;
        const j = await api("declineResume");
        if (j && j.ok) exitRoom();
        leaving = false;
      }
      function showAlert(title, msg) {
        $("#alert").innerHTML =
          `<div class="modal" style="z-index:10001"><div class="mbox" style="text-align:center">
    <div style="font-size:40px">🚫</div>
    <div style="font-size:18px;font-weight:800;margin:6px 0">${esc(translateText(title))}</div>
    <div class="mut" style="margin-bottom:14px">${esc(translateText(msg))}</div>
    <button class="y" style="width:100%" onclick="closeAlert()">${translateText("OK")}</button></div></div>`;
        localizeTree($("#alert"));
      }
      function closeAlert() {
        $("#alert").innerHTML = "";
      }

      async function installApp() {
        if (!deferredPrompt) {
          showAlert(
            "Install Chips-in",
            "Di Android, buka menu browser lalu pilih 'Install app' atau 'Tambahkan ke layar utama'. Di iPhone, buka menu Bagikan lalu pilih 'Add to Home Screen'.",
          );
          return;
        }
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      }
