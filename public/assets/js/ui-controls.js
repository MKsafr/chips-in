let pendingAllInConfirmation = null;
let roomScanner = null;
let roomScanHandled = false;

function openRoomScanner() {
  roomScanHandled = false;
  $("#modal").innerHTML =
    `<div class="modal" onclick="if(event.target===this)closeRoomScanner()"><div class="mbox room-scanner-modal" role="dialog" aria-modal="true" aria-label="${translateText("Scan QR Room dengan Kamera")}">
    <div class="row sp"><h2>${translateText("Scan QR Room")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeRoomScanner()">×</button></div>
    <p class="mut">${translateText("Arahkan kamera ke QR room.")}</p>
    <div id="roomQrReader"></div>
    <p id="roomScannerStatus" class="mut room-scanner-status" role="status">${translateText("Meminta akses kamera…")}</p>
    <button class="g" style="width:100%" onclick="closeRoomScanner()">${translateText("Batal")}</button>
  </div></div>`;
  localizeTree($("#modal"));
  startRoomScanner();
}

async function startRoomScanner() {
  if (!window.Html5Qrcode) {
    setRoomScannerStatus("Pemindai QR tidak dapat dimuat.");
    return;
  }
  const scanner = new Html5Qrcode("roomQrReader");
  roomScanner = scanner;
  try {
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        aspectRatio: 1,
        qrbox: (width, height) => {
          const size = Math.floor(Math.min(width, height, 280) * 0.82);
          return { width: size, height: size };
        },
      },
      async (decodedText) => {
        if (roomScanHandled) return;
        const code = roomCodeFromScan(decodedText);
        if (!code) {
          setRoomScannerStatus("QR bukan kode atau link room yang valid.");
          return;
        }
        roomScanHandled = true;
        await closeRoomScanner();
        const input = $("#rc");
        if (input) {
          input.value = code;
          joinRoom();
        }
      },
      () => {},
    );
    if (roomScanner !== scanner) {
      await scanner.stop();
      scanner.clear();
    }
  } catch {
    if (roomScanner === scanner) {
      roomScanner = null;
      try {
        scanner.clear();
      } catch {}
      setRoomScannerStatus(
        "Kamera tidak dapat dibuka. Izinkan akses kamera dan gunakan HTTPS.",
      );
    }
  }
}

function roomCodeFromScan(value) {
  const text = String(value || "").trim();
  if (/^[A-Z0-9]{6}$/i.test(text)) return text.toUpperCase();
  try {
    const url = new URL(text);
    if (url.origin !== window.location.origin) return "";
    const code = (url.searchParams.get("room") || "").trim().toUpperCase();
    return /^[A-Z0-9]{6}$/.test(code) ? code : "";
  } catch {
    return "";
  }
}

function setRoomScannerStatus(message) {
  const status = $("#roomScannerStatus");
  if (status) status.textContent = translateText(message);
}

async function closeRoomScanner() {
  const scanner = roomScanner;
  roomScanner = null;
  if (scanner) {
    try {
      await scanner.stop();
    } catch {}
    try {
      scanner.clear();
    } catch {}
  }
  $("#modal").innerHTML = "";
}

function askAllInConfirmation(mode, amount) {
  pendingAllInConfirmation = { mode, amount };
  $("#modal").innerHTML =
    `<div class="modal" onclick="if(event.target===this)cancelAllInConfirmation()"><div class="mbox" role="dialog" aria-modal="true" aria-labelledby="allInConfirmationTitle" style="text-align:center">
    <h2 id="allInConfirmationTitle">${translateText("Konfirmasi All-in")}</h2>
    <p class="mut">${translateText("Apakah kamu yakin ingin All-in?")}</p>
    <p style="font-size:20px;font-weight:800;color:var(--gold)">${translateText("Jumlah All-in")}: ${fmt(amount)}</p>
    <div class="row"><button class="g f" onclick="cancelAllInConfirmation()">${translateText("Batal")}</button><button class="r f" onclick="confirmAllIn()">${translateText("Ya, All-in")}</button></div>
  </div></div>`;
  localizeTree($("#modal"));
}

function cancelAllInConfirmation() {
  pendingAllInConfirmation = null;
  $("#modal").innerHTML = "";
}

function confirmAllIn() {
  const confirmation = pendingAllInConfirmation;
  pendingAllInConfirmation = null;
  $("#modal").innerHTML = "";
  if (!confirmation) return;
  if (confirmation.mode === "poker") api("act", { a: "allin" });
  else api("bet", { amount: confirmation.amount });
}

function settingsButtonHTML() {
  return `<button class="g s" aria-label="${translateText("Pengaturan")}" onclick="openSettings()">⚙ ${translateText("Pengaturan")}</button>`;
}
function openRoomQr() {
  const code = String((st && st.code) || roomCode || "").toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return;
  const inviteUrl = new URL("/", window.location.origin);
  inviteUrl.searchParams.set("room", code);
  const link = inviteUrl.toString();
  $("#modal").innerHTML =
    `<div class="modal" onclick="if(event.target===this)closeRoomQr()"><div class="mbox room-qr-modal" role="dialog" aria-modal="true" aria-label="${translateText("QR Room")}">
    <div class="row sp"><h2>${translateText("QR Room")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeRoomQr()">×</button></div>
    <p class="mut">${translateText("Scan QR ini untuk membuka room.")}</p>
    <img class="room-qr-image" src="/room-qr?room=${encodeURIComponent(code)}" alt="${translateText("QR Room")}">
    <div class="room-qr-code"><span class="mut">${translateText("Kode Room")}</span><b>${esc(code)}</b></div>
    <div class="room-qr-link"><input id="roomInviteUrl" type="url" value="${esc(link)}" readonly aria-label="${translateText("Link Undangan Room")}"><button class="ok" onclick="copyRoomInviteLink()">${translateText("Salin Link")}</button></div>
  </div></div>`;
  localizeTree($("#modal"));
}
function closeRoomQr() {
  $("#modal").innerHTML = "";
}
async function copyRoomInviteLink() {
  const input = $("#roomInviteUrl");
  if (!input) return;
  try {
    await navigator.clipboard.writeText(input.value);
  } catch {
    input.select();
    if (!document.execCommand("copy")) return;
  }
  flash("Link room disalin");
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
  const slider = $("#volumeSlider");
  if (slider)
    slider.style.setProperty("--volume-level", `${currentVolume * 100}%`);
  const label = $("#volumeValue");
  if (label) label.textContent = `${Math.round(currentVolume * 100)}%`;
}
function setBackgroundMusicVolume(value) {
  backgroundMusicVolume = Math.max(0, Math.min(Number(value) / 100, 1));
  localStorage.cb_bgm_volume = String(backgroundMusicVolume);
  syncBackgroundMusic();
  const slider = $("#bgMusicVolumeSlider");
  if (slider)
    slider.style.setProperty(
      "--volume-level",
      `${backgroundMusicVolume * 100}%`,
    );
  const label = $("#bgMusicVolumeValue");
  if (label) label.textContent = `${Math.round(backgroundMusicVolume * 100)}%`;
}
function toggleMute() {
  soundMuted = !soundMuted;
  localStorage.cb_muted = String(soundMuted);
  renderSettings();
}
function toggleBackgroundMusicMute() {
  backgroundMusicMuted = !backgroundMusicMuted;
  localStorage.cb_bgm_muted = String(backgroundMusicMuted);
  syncBackgroundMusic();
  renderSettings();
}
function renderSettings() {
  $("#modal").innerHTML =
    `<div class="modal" onclick="if(event.target===this)closeSettings()"><div class="mbox">
    <div class="row sp"><div style="font-size:18px;font-weight:800">⚙ ${translateText("Pengaturan")}</div><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeSettings()">×</button></div>
    <div class="settings-grid">
      <label class="settings-option"><span class="mut">${translateText("Tema")}</span>
        <select onchange="changeTheme(this.value);renderSettings()">${Object.keys(
          THEMES,
        )
          .map(
            (key) =>
              `<option value="${key}" ${key === currentTheme ? "selected" : ""}>${THEMES[key]}</option>`,
          )
          .join("")}</select>
      </label>
      <label class="settings-option"><span class="mut">${translateText("Bahasa")}</span>
        <select onchange="updateLanguage(this.value)">${Object.keys(LANGUAGES)
          .map(
            (key) =>
              `<option value="${key}" ${key === currentLanguage ? "selected" : ""}>${LANGUAGES[key]}</option>`,
          )
          .join("")}</select>
      </label>
      <div class="settings-option"><span class="mut">${translateText("Volume Efek Suara")}</span>
        <div class="volume-control">
          <input id="volumeSlider" type="range" min="0" max="100" step="1" value="${Math.round(currentVolume * 100)}" style="--volume-level:${currentVolume * 100}%" aria-label="${translateText("Volume Efek Suara")}" oninput="setVolume(this.value)">
          <button class="g mute-toggle" aria-label="${translateText(soundMuted ? "Nyalakan Suara" : "Matikan Suara")}" title="${translateText(soundMuted ? "Nyalakan Suara" : "Matikan Suara")}" aria-pressed="${soundMuted}" onclick="toggleMute()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"></path>${soundMuted ? "" : '<path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 5.5a9 9 0 0 1 0 13"></path>'}${soundMuted ? '<path class="mute-slash" d="m4 4 16 16"></path>' : ""}</svg>
          </button>
          <span id="volumeValue">${Math.round(currentVolume * 100)}%</span>
        </div>
      </div>
      <div class="settings-option"><span class="mut">${translateText("Volume Musik Latar")}</span>
        <div class="volume-control">
          <input id="bgMusicVolumeSlider" type="range" min="0" max="100" step="1" value="${Math.round(backgroundMusicVolume * 100)}" style="--volume-level:${backgroundMusicVolume * 100}%" aria-label="${translateText("Volume Musik Latar")}" oninput="setBackgroundMusicVolume(this.value)">
          <button class="g mute-toggle" aria-label="${translateText(backgroundMusicMuted ? "Nyalakan Musik" : "Matikan Musik")}" title="${translateText(backgroundMusicMuted ? "Nyalakan Musik" : "Matikan Musik")}" aria-pressed="${backgroundMusicMuted}" onclick="toggleBackgroundMusicMute()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"></path>${backgroundMusicMuted ? "" : '<path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 5.5a9 9 0 0 1 0 13"></path>'}${backgroundMusicMuted ? '<path class="mute-slash" d="m4 4 16 16"></path>' : ""}</svg>
          </button>
          <span id="bgMusicVolumeValue">${Math.round(backgroundMusicVolume * 100)}%</span>
        </div>
      </div>
    </div>
    <button class="g s install-app-button" onclick="installApp()">${translateText("Unduh App")}</button>
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
  $("#modal").innerHTML =
    `<div class="modal" onclick="if(event.target===this)closeDealerControls()"><div class="mbox">
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
  const player = (st.players || []).find((p) => p.id === chipAdjustment.id);
  if (!player) return closeChipAdjustment();
  const adding = chipAdjustment.direction > 0;
  $("#modal").innerHTML =
    `<div class="modal" onclick="if(event.target===this)closeChipAdjustment()"><div class="mbox">
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
