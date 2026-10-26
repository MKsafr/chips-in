let pendingAllInConfirmation = null;
let roomScanner = null;
let roomScanHandled = false;
let roomScannerLibraryPromise = null;
const BORDER_STORE_ITEMS = [
  { id: "red", name: "Ember Red", price: 5000 },
  { id: "blue", name: "Sapphire Blue", price: 5000 },
  { id: "green", name: "Emerald Green", price: 5000 },
  { id: "purple", name: "Nebula Purple", price: 5000 },
  { id: "orange", name: "Solar Orange", price: 5000 },
  { id: "pink", name: "Sakura Pink", price: 5000 },
  { id: "cyan", name: "Aurora Cyan", price: 5000 },
  { id: "white", name: "Pearl White", price: 5000 },
  {
    id: "neon-green-white",
    name: "Neon Aurora",
    price: 10000,
    colors: ["#39ff14", "#f5f7fa"],
  },
  {
    id: "neon-green-black",
    name: "Toxic Night",
    price: 10000,
    colors: ["#39ff14", "#17191d"],
  },
  {
    id: "neon-orange-magenta",
    name: "Magma Pop",
    price: 10000,
    colors: ["#ff6d00", "#ff00a8"],
  },
  {
    id: "neon-orange-electric-blue",
    name: "Voltage Sunset",
    price: 10000,
    colors: ["#ff6d00", "#168cff"],
  },
  {
    id: "neon-green-denim",
    name: "Denim Grove",
    price: 10000,
    colors: ["#39ff14", "#6f8fae"],
  },
];
let borderStorePending = false;

function rememberModalPointerDown(event) {
  event.currentTarget.dataset.pointerStartedInside =
    String(event.target !== event.currentTarget);
}

function closeOnModalBackdrop(event, close) {
  const modal = event.currentTarget;
  const pointerStartedInside =
    modal.dataset.pointerStartedInside === "true";
  delete modal.dataset.pointerStartedInside;
  if (event.target === modal && !pointerStartedInside) close();
}

function setModalContent(content) {
  const modal = $("#modal");
  const scrollPositions = [...modal.querySelectorAll(".mbox")].map(
    (box) => box.scrollTop,
  );
  modal.innerHTML = content;
  localizeTree(modal);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modal.querySelectorAll(".mbox").forEach((box, index) => {
        if (scrollPositions[index] !== undefined)
          box.scrollTop = scrollPositions[index];
      });
    });
  });
}

function openBorderStore() {
  const me = (st.players || []).find((player) => player.id === st.you);
  if (!me) return;
  const isChipLeader =
    me.id === getUniqueChipLeader(st.players || [], st.mode === "poker");
  const owned = Array.isArray(me.ownedBorderColors)
    ? me.ownedBorderColors
    : [];
  const ownedProfile = Array.isArray(me.ownedProfileBorderColors)
    ? me.ownedProfileBorderColors
    : [];
  const renderBorderItem = ({ id, name, price }) => {
    const isOwned = owned.includes(id);
    const isActive = me.borderColor === id;
    const button = isActive
      ? `<button class="g s" disabled>${translateText("Sedang dipakai")}</button>`
      : isOwned
        ? `<button class="ok s" ${borderStorePending ? "disabled" : ""} onclick="equipPlayerBorder('${id}')">${translateText("Gunakan")}</button>`
        : `<button class="y s" ${me.chips < price || borderStorePending ? "disabled" : ""} onclick="buyPlayerBorder('${id}')">${translateText("Beli")} · ${fmt(price)}</button>`;
    return `<article class="border-store-item">
      <div class="border-store-preview pl-border-${id}" aria-hidden="true"></div>
      <div class="border-store-item-info"><b>${translateText(name)}</b></div>
      ${button}
    </article>`;
  };
  const leaderBorderOptions = [
    { id: "rgb", name: "Highest Chip RGB" },
    ...BORDER_STORE_ITEMS,
  ];
  const renderBorderCategory = (items, renderItem, price) =>
    `<section class="border-store-subcategory">
      <h4>${translateText(price === 5000 ? "Border 1 Warna" : "Border 2 Warna")}</h4>
      <div class="border-store-grid">${items.map(renderItem).join("")}</div>
    </section>`;
  const renderLeaderBorderOption = ({ id, name }) => {
    const isLocked =
      id !== "rgb" &&
      me.leaderBordersUnlocked !== true &&
      !owned.includes(id);
    const selected = (me.leaderBorderColor || "rgb") === id;
    const preview =
      id === "rgb"
        ? `<div class="leader-border-rgb-preview" aria-hidden="true"></div>`
        : `<div class="border-store-preview pl-border-${id} ${isLocked ? "leader-border-preview-locked" : ""}" aria-hidden="true"></div>`;
    return `<article class="border-store-item leader-border-item">
      ${preview}
      <div class="border-store-item-info"><b>${translateText(name)}</b></div>
      <button class="${isLocked || selected ? "g" : "ok"} s" ${isLocked || selected || borderStorePending ? "disabled" : ""} ${isLocked ? "" : `onclick="chooseLeaderBorder('${id}')"`}>${translateText(isLocked ? "Terkunci" : selected ? "Sedang dipakai" : "Gunakan")}</button>
    </article>`;
  };
  const renderProfileBorderItem = ({ id, name, price }) => {
    const isOwned = ownedProfile.includes(id);
    const isActive = me.profileBorderColor === id;
    const button = isActive
      ? `<button class="g s" disabled>${translateText("Sedang dipakai")}</button>`
      : isOwned
        ? `<button class="ok s" ${borderStorePending ? "disabled" : ""} onclick="equipProfileBorder('${id}')">${translateText("Gunakan")}</button>`
        : `<button class="y s" ${me.chips < price || borderStorePending ? "disabled" : ""} onclick="buyProfileBorder('${id}')">${translateText("Beli")} · ${fmt(price)}</button>`;
    return `<article class="border-store-item">
      <div class="border-store-preview profile-border-preview pl-border-${id}" aria-hidden="true"></div>
      <div class="border-store-item-info"><b>${translateText(name)}</b></div>
      ${button}
    </article>`;
  };
  const bundlePrice = (id, price) =>
    Math.ceil(
      price *
        (Number(!owned.includes(id)) + Number(!ownedProfile.includes(id))) *
        0.75,
    );
  const renderBorderBundle = ({ id, name, price }) => {
    const ownsBoth = owned.includes(id) && ownedProfile.includes(id);
    const cost = bundlePrice(id, price);
    return `<article class="border-store-item">
      <div class="border-store-preview pl-border-${id}" aria-hidden="true"></div>
      <div class="border-store-item-info"><b>${translateText(name)}</b><span class="mut">${translateText("Sorotan + Profil")}</span></div>
      <button class="${ownsBoth ? "g" : "y"} s" ${ownsBoth || me.chips < cost || borderStorePending ? "disabled" : ""} onclick="buyBorderBundle('${id}')">${translateText(ownsBoth ? "Sudah dimiliki" : "Beli Bundle")} · ${fmt(cost)}</button>
    </article>`;
  };
  setModalContent(
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeBorderStore)"><div class="mbox border-store-modal" role="dialog" aria-modal="true" aria-labelledby="borderStoreTitle">
      <div class="row sp"><h2 id="borderStoreTitle">${translateText("Toko Border")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeBorderStore()">×</button></div>
      <div class="border-store-balance"><span class="mut">${translateText("Saldo tersedia")}</span><b>${fmtChips(me.chips)}</b></div>
      ${
        isChipLeader
          ? `<section class="leader-border-section" aria-labelledby="leaderBorderTitle">
        <h3 id="leaderBorderTitle">${translateText("Gaya Pemimpin Chip")}</h3>
        <p class="mut">${translateText("RGB gratis. Buka semua trial border lain seharga 5.000 chip. Border yang sudah dimiliki juga bisa dipilih. Gaya pilihan hanya aktif saat kamu memimpin.")}</p>
        ${
          me.leaderBordersUnlocked
            ? `<div class="leader-border-unlocked">${translateText("Semua trial border terbuka")}</div>`
            : `<button class="y f leader-border-unlock" ${me.chips < 5000 || borderStorePending || st.poker.active || st.bj.phase === "playing" || (st.players || []).some((player) => player.bjBet || player.bjSplitBet) ? "disabled" : ""} onclick="unlockLeaderBorders()">${translateText("Buka semua trial border")} · ${fmt(5000)}</button>`
        }
        <div class="border-store-grid">${renderLeaderBorderOption(
          leaderBorderOptions[0],
        )}</div>
        <div class="border-store-category-pair">
          ${renderBorderCategory(
            leaderBorderOptions.filter(
              ({ id }) =>
                BORDER_STORE_ITEMS.find((item) => item.id === id)?.price ===
                5000,
            ),
            renderLeaderBorderOption,
            5000,
          )}
          ${renderBorderCategory(
            leaderBorderOptions.filter(
              ({ id }) =>
                BORDER_STORE_ITEMS.find((item) => item.id === id)?.price ===
                10000,
            ),
            renderLeaderBorderOption,
            10000,
          )}
        </div>
      </section>`
          : ""
      }
      <div class="border-store-categories">
        <section class="border-store-category" aria-labelledby="singleBorderTitle">
          <h3 id="singleBorderTitle">${translateText("Border 1 Warna")}</h3>
          <div class="border-store-grid">${BORDER_STORE_ITEMS.filter(({ price }) => price === 5000).map(renderBorderItem).join("")}</div>
        </section>
        <section class="border-store-category" aria-labelledby="doubleBorderTitle">
          <h3 id="doubleBorderTitle">${translateText("Border 2 Warna")}</h3>
          <div class="border-store-grid">${BORDER_STORE_ITEMS.filter(({ price }) => price === 10000).map(renderBorderItem).join("")}</div>
        </section>
      </div>
      <section class="profile-border-store-section" aria-labelledby="profileBorderTitle">
      <h3 id="profileBorderTitle">${translateText("Border Profil")}</h3>
        <div class="border-store-category-pair">
          ${renderBorderCategory(
            BORDER_STORE_ITEMS.filter(({ price }) => price === 5000),
            renderProfileBorderItem,
            5000,
          )}
          ${renderBorderCategory(
            BORDER_STORE_ITEMS.filter(({ price }) => price === 10000),
            renderProfileBorderItem,
            10000,
          )}
        </div>
      <button class="g f profile-border-clear" ${!me.profileBorderColor || borderStorePending ? "disabled" : ""} onclick="clearProfilePlayerBorder()">${translateText("Lepas border profil")}</button>
      </section>
      <section class="profile-border-store-section" aria-labelledby="borderBundleTitle">
      <h3 id="borderBundleTitle">${translateText("Bundle Border Serasi")}</h3>
      <p class="mut border-store-note">${translateText("Beli border sorotan dan profil yang serasi sekaligus dengan diskon 25%. Jika salah satunya sudah dimiliki, diskon hanya berlaku untuk border yang belum dimiliki.")}</p>
        <div class="border-store-category-pair">
          ${renderBorderCategory(
            BORDER_STORE_ITEMS.filter(({ price }) => price === 5000),
            renderBorderBundle,
            5000,
          )}
          ${renderBorderCategory(
            BORDER_STORE_ITEMS.filter(({ price }) => price === 10000),
            renderBorderBundle,
            10000,
          )}
        </div>
      </section>
      <div class="row border-store-actions"><button class="g f" ${!me.borderColor || borderStorePending ? "disabled" : ""} onclick="clearPlayerBorder()">${translateText("Lepas border")}</button><button class="g f" onclick="closeBorderStore()">${translateText("Tutup")}</button></div>
      <p class="mut border-store-note">${translateText("Pembelian hanya tersedia saat ronde tidak aktif. Border tersimpan di room ini.")}</p>
    </div></div>`,
  );
}

function closeBorderStore() {
  $("#modal").innerHTML = "";
}

window.addEventListener("chipsin-language-change", () => {
  if ($("#modal .border-store-modal")) openBorderStore();
});

async function updatePlayerBorder(action, color) {
  if (borderStorePending) return;
  borderStorePending = true;
  try {
    const result = await api("borderStore", { action, color });
    if (result && result.ok) {
      closeBorderStore();
      flash(
        action === "buy"
          ? "Border berhasil dibeli dan dipakai"
          : action === "buyProfile"
            ? "Border profil berhasil dibeli dan dipakai"
            : action === "buyBundle"
              ? "Bundle border berhasil dibeli dan dipakai"
          : action === "equip"
            ? "Border berhasil dipakai"
            : action === "equipProfile"
              ? "Border profil berhasil dipakai"
              : action === "clearProfile"
                ? "Border profil dilepas"
            : action === "leaderStyle"
              ? "Gaya pemimpin chip berhasil diubah"
                : action === "unlockLeaderBorders"
                  ? "Trial border pemimpin berhasil dibuka"
                : "Border dilepas",
      );
    }
  } finally {
    borderStorePending = false;
    if ($("#modal .border-store-modal")) openBorderStore();
  }
}

function buyPlayerBorder(color) {
  return updatePlayerBorder("buy", color);
}

function equipPlayerBorder(color) {
  return updatePlayerBorder("equip", color);
}

function buyProfileBorder(color) {
  return updatePlayerBorder("buyProfile", color);
}

function equipProfileBorder(color) {
  return updatePlayerBorder("equipProfile", color);
}

function clearProfilePlayerBorder() {
  return updatePlayerBorder("clearProfile");
}

function buyBorderBundle(color) {
  return updatePlayerBorder("buyBundle", color);
}

function clearPlayerBorder() {
  return updatePlayerBorder("clear");
}

function chooseLeaderBorder(color) {
  return updatePlayerBorder("leaderStyle", color);
}

function unlockLeaderBorders() {
  return updatePlayerBorder("unlockLeaderBorders");
}

function openHelp() {
  setModalContent(
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeHelp)"><div class="mbox help-modal" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
    <div class="row sp"><h2 id="helpTitle">${translateText("Bantuan dan FAQ")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeHelp()">×</button></div>
    <section class="help-section">
      <h3>${translateText("Pertanyaan Umum")}</h3>
      <details><summary>${translateText("Bagaimana cara membuat atau bergabung ke room?")}</summary><p>${translateText("Pilih Buat Ruangan untuk menjadi Bandar, atau masukkan kode room dari Bandar lalu pilih Gabung Room. Kamu juga bisa memindai QR room.")}</p></details>
      <details><summary>${translateText("Apakah kartu dimainkan di aplikasi?")}</summary><p>${translateText("Tidak. Kartu dimainkan secara fisik. Aplikasi membantu mencatat pemain, chip, taruhan, pot, dan hasil permainan.")}</p></details>
      <details><summary>${translateText("Bagaimana cara kerja chip?")}</summary><p>${translateText("Chip hanya untuk mencatat permainan sosial. Chip tidak memiliki nilai uang, tidak dapat dibeli, dan tidak dapat dicairkan.")}</p></details>
      <details><summary>${translateText("Pengaturan suara saya tidak tersimpan di perangkat lain, kenapa?")}</summary><p>${translateText("Pengaturan suara disimpan di browser dan perangkat yang kamu gunakan, jadi tidak otomatis dibagikan ke perangkat lain.")}</p></details>
      <details><summary>${translateText("Apa yang harus dilakukan jika koneksi terputus?")}</summary><p>${translateText("Kembali ke tab Chips-in dan tunggu browser menyambungkan ulang. Sesi room dapat dipulihkan selama room masih tersedia.")}</p></details>
    </section>
    <section class="help-section">
      <h3>${translateText("Laporkan Bug")}</h3>
      <p class="mut">${translateText("Isi judul dan langkah untuk mengulangi masalah. Kamu akan diarahkan ke GitHub untuk meninjau dan mengirim laporan.")}</p>
      <form class="bug-report-form" action="https://github.com/MKsafr/chips-in/issues/new" method="get" target="_blank" onsubmit="prepareBugReport(event)">
        <label>${translateText("Judul masalah")}<input name="title" maxlength="120" required placeholder="${translateText("Contoh: Suara tidak bisa diatur di Safari")}"></label>
        <label>${translateText("Langkah atau keterangan")}<textarea name="body" maxlength="4000" required placeholder="${translateText("Apa yang kamu lakukan, apa yang terjadi, dan apa yang seharusnya terjadi?")}"></textarea></label>
        <p class="mut">${translateText("GitHub akan menampilkan laporan secara publik. Login dan tekan Submit new issue untuk mengirim. Jangan sertakan kata sandi atau informasi pribadi.")}</p>
        <button class="ok" type="submit">${translateText("Lanjutkan ke GitHub")}</button>
      </form>
    </section>
  </div></div>`,
  );
}

function closeHelp() {
  $("#modal").innerHTML = "";
}

function prepareBugReport(event) {
  const form = event.currentTarget;
  if (form.dataset.metadataAdded) return;
  const details = form.elements.body.value.trim();
  form.elements.body.value =
    `${details}\n\n---\nApp version: ${APP_VER}\nLanguage: ${currentLanguage}`;
  form.dataset.metadataAdded = "true";
}

function openRoomScanner() {
  roomScanHandled = false;
  $("#modal").innerHTML =
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeRoomScanner)"><div class="mbox room-scanner-modal" role="dialog" aria-modal="true" aria-label="${translateText("Scan QR Room dengan Kamera")}">
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
    try {
      await loadRoomScannerLibrary();
    } catch {
      setRoomScannerStatus("Pemindai QR tidak dapat dimuat.");
      return;
    }
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

function loadRoomScannerLibrary() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (!roomScannerLibraryPromise) {
    roomScannerLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/assets/js/html5-qrcode.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        roomScannerLibraryPromise = null;
        reject(new Error("QR scanner script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return roomScannerLibraryPromise;
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
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,cancelAllInConfirmation)"><div class="mbox" role="dialog" aria-modal="true" aria-labelledby="allInConfirmationTitle" style="text-align:center">
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
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeRoomQr)"><div class="mbox room-qr-modal" role="dialog" aria-modal="true" aria-label="${translateText("QR Room")}">
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
let chipTransferPending = false;

function openChipTransfer() {
  const me = (st.players || []).find((player) => player.id === st.you);
  if (!me) return;
  const recipients = (st.players || []).filter((player) => player.id !== me.id);
  const transferLocked =
    st.poker.active ||
    st.bj.phase === "playing" ||
    (st.players || []).some((player) => player.bjBet || player.bjSplitBet);
  if (!me.chips || !recipients.length || transferLocked) return;
  $("#modal").innerHTML =
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeChipTransfer)"><div class="mbox chip-transfer-modal" role="dialog" aria-modal="true" aria-labelledby="chipTransferTitle">
    <div class="row sp"><h2 id="chipTransferTitle">${translateText("Kirim Chip")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeChipTransfer()">×</button></div>
    <div class="chip-transfer-balance"><span class="mut">${translateText("Saldo tersedia")}</span><b>${fmtChips(me.chips)}</b></div>
    <label class="chip-transfer-field"><span>${translateText("Penerima")}</span><select id="chipTransferTarget"><option value="">${translateText("Pilih pemain")}</option>${recipients.map((player) => `<option value="${player.id}">${esc(player.name)}</option>`).join("")}</select></label>
    <label class="chip-transfer-field"><span>${translateText("Jumlah Chip")}</span><input id="chipTransferAmount" type="number" min="1" max="${me.chips}" step="1" inputmode="numeric" placeholder="${translateText("Jumlah Chip")}"></label>
    <div class="row chip-transfer-actions"><button class="g f" onclick="closeChipTransfer()">${translateText("Batal")}</button><button class="ok f" onclick="submitChipTransfer()">${translateText("Kirim Chip")}</button></div>
  </div></div>`;
  localizeTree($("#modal"));
}

function closeChipTransfer() {
  $("#modal").innerHTML = "";
}

async function submitChipTransfer() {
  if (chipTransferPending) return;
  const targetId = Number(($("#chipTransferTarget") || {}).value);
  const amount = Number(($("#chipTransferAmount") || {}).value);
  const me = (st.players || []).find((player) => player.id === st.you);
  const recipient = (st.players || []).find((player) => player.id === targetId);
  if (!recipient || recipient.id === st.you) {
    flash("Pilih pemain yang valid");
    return;
  }
  if (!Number.isSafeInteger(amount) || amount < 1) {
    flash("Jumlah chip harus berupa angka bulat lebih dari nol");
    return;
  }
  if (!me || amount > me.chips) {
    flash("Chip tidak mencukupi");
    return;
  }
  if (
    !confirm(
      `${translateText("Kirim")} ${fmtChips(amount)} ${translateText("ke")} ${recipient.name}?`,
    )
  )
    return;

  chipTransferPending = true;
  try {
    const result = await api("transferChips", { targetId, amount });
    if (result && result.ok) {
      closeChipTransfer();
      flash("Transfer chip berhasil");
    }
  } finally {
    chipTransferPending = false;
  }
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
  syncSoundEffects();
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
  if (!backgroundMusicMuted && backgroundMusicVolume > 0)
    startBackgroundMusic();
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
  syncSoundEffects();
  renderSettings();
}
function toggleBackgroundMusicMute() {
  backgroundMusicMuted = !backgroundMusicMuted;
  localStorage.cb_bgm_muted = String(backgroundMusicMuted);
  syncBackgroundMusic();
  if (!backgroundMusicMuted && backgroundMusicVolume > 0)
    startBackgroundMusic();
  renderSettings();
}
function renderSettings() {
  setModalContent(
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeSettings)"><div class="mbox">
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
  </div></div>`,
  );
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
  setModalContent(
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeDealerControls)"><div class="mbox">
    <div class="dealer-controls-heading"><div style="font-size:18px;font-weight:800">👑 Kontrol Bandar</div><button class="g s" aria-label="Tutup" onclick="closeDealerControls()">×</button></div>
    ${hostPanel()}
  </div></div>`,
  );
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
  setModalContent(
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeChipAdjustment)"><div class="mbox">
    <div class="row sp"><div style="font-size:18px;font-weight:800">${translateText(adding ? "+ Chip" : "- Chip")} • ${esc(player.name)}</div><button class="g s" onclick="closeChipAdjustment()">×</button></div>
    <div class="mut" style="margin:10px 0 4px">Masukkan jumlah chip</div>
    <input id="chipAmount" type="number" min="1" step="1" inputmode="numeric" placeholder="${translateText("Jumlah Chip")}" onkeydown="if(event.key==='Enter')submitChipAdjustment()">
    <div class="row" style="margin-top:12px"><button class="g f" onclick="closeChipAdjustment()">Batal</button><button class="${adding ? "ok" : "r"} f" onclick="submitChipAdjustment()">Simpan</button></div>
  </div></div>`,
  );
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
