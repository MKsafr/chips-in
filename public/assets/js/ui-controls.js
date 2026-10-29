let pendingAllInConfirmation = null;
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
let storeOpen = false;
let storeTab = "themes";
let mvpMusicPurchasePending = false;
const MVP_MUSIC_PRICE = 1000;

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

function openStore(tab = "borders") {
  if (tab !== "music") stopMvpMusicPreview();
  storeOpen = true;
  storeTab = tab;
  renderStore();
}

function closeStore() {
  stopMvpMusicPreview();
  storeOpen = false;
  $("#modal").innerHTML = "";
}

function renderStore() {
  if (!storeOpen) return;
  if (storeTab === "borders") {
    openBorderStore();
    return;
  }
  const me = (st?.players || []).find((player) => player.id === st.you);
  const ownedMvpMusicTrackIds = Array.isArray(me?.ownedMvpMusicTrackIds)
    ? me.ownedMvpMusicTrackIds
    : [];
  const hasPendingBlackjackBet = (st.players || []).some(
    (player) => player.bjBet || player.bjSplitBet,
  );
  const canBuyMvpMusic =
    Boolean(me) &&
    !st.poker.active &&
    st.bj.phase !== "playing" &&
    !hasPendingBlackjackBet;
  const musicPurchaseDisabledReason = !me
    ? ""
    : me.chips < MVP_MUSIC_PRICE
      ? translateText("Saldo chip tidak cukup untuk membeli musik.")
      : st.poker.active || st.bj.phase === "playing"
        ? translateText("Musik hanya dapat dibeli saat ronde tidak aktif.")
        : hasPendingBlackjackBet
          ? translateText("Selesaikan atau batalkan taruhan Blackjack sebelum membeli musik.")
          : mvpMusicPurchasePending
            ? translateText("Pembelian musik sedang diproses.")
            : "";
  const musicContent = !mvpMusicTracksLoaded
    ? `<p class="mut store-empty">${translateText("Memuat musik MVP…")}</p>`
    : mvpMusicTracks.length === 0
      ? `<p class="mut store-empty">${translateText("Belum ada musik MVP. Lagu akan muncul di sini setelah ditambahkan.")}</p>`
      : `<p class="mut store-note">${translateText("Semua pemain dapat membeli musik seharga 1.000 chip. Jika menang ronde, pemilik musik dapat memilihnya untuk diputar di room.")}</p>
        <div class="store-music-list">${mvpMusicTracks
          .map((track) => {
            const isOwned = ownedMvpMusicTrackIds.includes(track.id);
            const isPreviewing = mvpMusicPreviewTrackId === track.id;
            const button = isOwned
              ? `<button class="g s" disabled>${translateText("Dimiliki")}</button>`
              : `<button class="y s" ${!canBuyMvpMusic || me.chips < MVP_MUSIC_PRICE || mvpMusicPurchasePending ? "disabled" : ""} data-testid="music-buy-${esc(track.id)}" onclick="buyMvpMusic('${esc(track.id)}')">${translateText("Beli")} · ${fmt(MVP_MUSIC_PRICE)}</button>`;
            return `<article class="store-music-item" data-testid="music-item-${esc(track.id)}">
                <div><b>${esc(track.title)}</b><span class="mut">${translateText("Musik MVP")}</span></div>
                <div class="store-music-actions">
                  <button class="g s store-music-preview-button" data-testid="music-preview-${esc(track.id)}" aria-label="${translateText(isPreviewing ? "Hentikan pratinjau" : "Pratinjau")} ${esc(track.title)}" title="${translateText(isPreviewing ? "Hentikan pratinjau" : "Pratinjau")}" onclick="toggleMvpMusicPreview('${esc(track.id)}')"><svg viewBox="0 0 24 24" aria-hidden="true">${isPreviewing ? '<path d="M7 7h10v10H7z"/>' : '<path transform="translate(-1.5 0)" d="M8 5v14l11-7z"/>'}</svg></button>
                  ${button}
                </div>
              </article>`;
          })
          .join("")}</div>
        <p class="mut store-note">${translateText("Pratinjau berlangsung maksimal 15 detik dan hanya terdengar di perangkat Anda.")}</p>
        ${
          musicPurchaseDisabledReason &&
          mvpMusicTracks.some(
            (track) => !ownedMvpMusicTrackIds.includes(track.id),
          )
            ? `<p class="mut store-note">${musicPurchaseDisabledReason}</p>`
            : ""
        }`;
  setModalContent(
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeStore)">
      <div class="mbox store-modal" role="dialog" aria-modal="true" aria-labelledby="storeTitle">
        <div class="row sp"><h2 id="storeTitle">${translateText("Toko")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeStore()">×</button></div>
        <div class="store-tabs" role="tablist" aria-label="${translateText("Kategori toko")}">
          <button class="${storeTab === "borders" ? "selected" : ""}" role="tab" aria-selected="${storeTab === "borders"}" data-testid="store-tab-border" onclick="openStore('borders')">${translateText("Toko Border")}</button>
          <button class="${storeTab === "music" ? "selected" : ""}" role="tab" aria-selected="${storeTab === "music"}" data-testid="store-tab-music" onclick="openStore('music')">${translateText("Toko Musik")}</button>
        </div>
        ${musicContent}
      </div>
    </div>`,
  );
}

function toggleMvpMusicPreview(trackId) {
  if (mvpMusicPreviewTrackId === trackId) stopMvpMusicPreview();
  else playMvpMusicPreview(trackId);
  renderStore();
}

async function buyMvpMusic(trackId) {
  if (mvpMusicPurchasePending) return;
  const me = (st?.players || []).find((player) => player.id === st.you);
  if (!me) return;
  if (
    me.chips === MVP_MUSIC_PRICE &&
    !confirm(
      translateText(
        "Saldo Anda tepat 1.000 chip. Beli musik ini dan habiskan semua chip?",
      ),
    )
  )
    return;
  mvpMusicPurchasePending = true;
  try {
    const result = await api("musicStore", { trackId });
    if (result && result.ok) flash("Musik MVP berhasil dibeli");
  } finally {
    mvpMusicPurchasePending = false;
    if ($("#modal .store-modal")) renderStore();
  }
}

function openBorderStore() {
  storeOpen = true;
  storeTab = "borders";
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
        ? `<button class="ok s" ${borderStorePending ? "disabled" : ""} data-testid="border-equip-${id}" onclick="equipPlayerBorder('${id}')">${translateText("Gunakan")}</button>`
        : `<button class="y s" ${me.chips < price || borderStorePending ? "disabled" : ""} data-testid="border-buy-${id}" onclick="buyPlayerBorder('${id}')">${translateText("Beli")} · ${fmt(price)}</button>`;
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
      <button class="${isLocked || selected ? "g" : "ok"} s" ${isLocked || selected || borderStorePending ? "disabled" : ""} ${isLocked ? "" : `data-testid="leader-style-${id}" onclick="chooseLeaderBorder('${id}')"`}>${translateText(isLocked ? "Terkunci" : selected ? "Sedang dipakai" : "Gunakan")}</button>
    </article>`;
  };
  const renderProfileBorderItem = ({ id, name, price }) => {
    const isOwned = ownedProfile.includes(id);
    const isActive = me.profileBorderColor === id;
    const button = isActive
      ? `<button class="g s" disabled>${translateText("Sedang dipakai")}</button>`
      : isOwned
        ? `<button class="ok s" ${borderStorePending ? "disabled" : ""} data-testid="profile-border-equip-${id}" onclick="equipProfileBorder('${id}')">${translateText("Gunakan")}</button>`
        : `<button class="y s" ${me.chips < price || borderStorePending ? "disabled" : ""} data-testid="profile-border-buy-${id}" onclick="buyProfileBorder('${id}')">${translateText("Beli")} · ${fmt(price)}</button>`;
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
      <button class="${ownsBoth ? "g" : "y"} s" ${ownsBoth || me.chips < cost || borderStorePending ? "disabled" : ""} data-testid="border-bundle-${id}" onclick="buyBorderBundle('${id}')">${translateText(ownsBoth ? "Sudah dimiliki" : "Beli Bundle")} · ${fmt(cost)}</button>
    </article>`;
  };
  setModalContent(
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeBorderStore)"><div class="mbox border-store-modal" role="dialog" aria-modal="true" aria-labelledby="borderStoreTitle">
      <div class="row sp"><h2 id="borderStoreTitle">${translateText("Toko Border")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeBorderStore()">×</button></div>
      <div class="store-tabs" role="tablist" aria-label="${translateText("Kategori toko")}">
        <button class="selected" role="tab" aria-selected="true" data-testid="store-tab-border" onclick="openStore('borders')">${translateText("Toko Border")}</button>
        <button role="tab" aria-selected="false" data-testid="store-tab-music" onclick="openStore('music')">${translateText("Toko Musik")}</button>
      </div>
      <div class="border-store-balance"><span class="mut">${translateText("Saldo tersedia")}</span><b>${fmtChips(me.chips)}</b></div>
      ${
        isChipLeader
          ? `<section class="leader-border-section" aria-labelledby="leaderBorderTitle">
        <h3 id="leaderBorderTitle">${translateText("Gaya Pemimpin Chip")}</h3>
        <p class="mut">${translateText("RGB gratis. Buka semua trial border lain seharga 5.000 chip. Border yang sudah dimiliki juga bisa dipilih. Gaya pilihan hanya aktif saat kamu memimpin.")}</p>
        ${
          me.leaderBordersUnlocked
            ? `<div class="leader-border-unlocked">${translateText("Semua trial border terbuka")}</div>`
            : `<button class="y f leader-border-unlock" ${me.chips < 5000 || borderStorePending || st.poker.active || st.bj.phase === "playing" || (st.players || []).some((player) => player.bjBet || player.bjSplitBet) ? "disabled" : ""} data-testid="leader-unlock" onclick="unlockLeaderBorders()">${translateText("Buka semua trial border")} · ${fmt(5000)}</button>`
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
  closeStore();
}

window.addEventListener("chipsin-language-change", () => {
  if (storeOpen) renderStore();
  else if ($("#modal .border-store-modal")) openBorderStore();
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


// Phase 2: lazy entry points. Heavy modal code lives in components/ and loads on first use.
function openHelp() {
  return loadScriptOnce("/assets/js/components/help.js").then(() => openHelpModal());
}

function openRoomScanner() {
  return loadScriptOnce("/assets/js/components/room-scanner.js").then(() => openRoomScannerModal());
}


function askAllInConfirmation(mode, amount) {
  pendingAllInConfirmation = { mode, amount };
  $("#modal").innerHTML =
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,cancelAllInConfirmation)"><div class="mbox" role="dialog" aria-modal="true" aria-labelledby="allInConfirmationTitle" style="text-align:center">
    <h2 id="allInConfirmationTitle">${translateText("Konfirmasi All-in")}</h2>
    <p class="mut">${translateText("Apakah kamu yakin ingin All-in?")}</p>
    <p style="font-size:20px;font-weight:800;color:var(--gold)">${translateText("Jumlah All-in")}: ${fmt(amount)}</p>
    <div class="row"><button class="g f" data-testid="allin-cancel" onclick="cancelAllInConfirmation()">${translateText("Batal")}</button><button class="r f" data-testid="allin-confirm" onclick="confirmAllIn()">${translateText("Ya, All-in")}</button></div>
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
  return `<button class="g s" data-testid="settings-open" aria-label="${translateText("Pengaturan")}" onclick="openSettings()">⚙ ${translateText("Pengaturan")}</button>`;
}
function openRoomQr() {
  const code = String((st && st.code) || roomCode || "").toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) return;
  const inviteUrl = new URL("/", window.location.origin);
  inviteUrl.searchParams.set("room", code);
  const link = inviteUrl.toString();
  $("#modal").innerHTML =
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeRoomQr)"><div class="mbox room-qr-modal" role="dialog" aria-modal="true" aria-label="${translateText("QR Room")}">
    <div class="row sp"><h2>${translateText("QR Room")}</h2><button class="g s" data-testid="qr-close" aria-label="${translateText("Tutup")}" onclick="closeRoomQr()">×</button></div>
    <p class="mut">${translateText("Scan QR ini untuk membuka room.")}</p>
    <img class="room-qr-image" data-testid="qr-image" src="/room-qr?room=${encodeURIComponent(code)}" alt="${translateText("QR Room")}">
    <div class="room-qr-code" data-testid="qr-code"><span class="mut">${translateText("Kode Room")}</span><b>${esc(code)}</b></div>
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
    (st.mode === "blackjack" && st.bj.phase === "playing");
  if (!me.chips) {
    flash("Chip tidak mencukupi");
    return;
  }
  if (!recipients.length) {
    flash("Minimal harus ada dua pemain di meja untuk mengirim chip.");
    return;
  }
  if (transferLocked) {
    flash("Transfer chip hanya tersedia saat ronde tidak aktif");
    return;
  }
  $("#modal").innerHTML =
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeChipTransfer)"><div class="mbox chip-transfer-modal" role="dialog" aria-modal="true" aria-labelledby="chipTransferTitle">
    <div class="row sp"><h2 id="chipTransferTitle">${translateText("Kirim Chip")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeChipTransfer()">×</button></div>
    <div class="chip-transfer-balance"><span class="mut">${translateText("Saldo tersedia")}</span><b>${fmtChips(me.chips)}</b></div>
    <label class="chip-transfer-field"><span>${translateText("Penerima")}</span><select id="chipTransferTarget" data-testid="transfer-target"><option value="">${translateText("Pilih pemain")}</option>${recipients.map((player) => `<option value="${player.id}">${esc(player.name)}</option>`).join("")}</select></label>
    <label class="chip-transfer-field"><span>${translateText("Jumlah Chip")}</span><input id="chipTransferAmount" data-testid="transfer-amount" type="number" min="1" max="${me.chips}" step="1" inputmode="numeric" placeholder="${translateText("Jumlah Chip")}"></label>
    <div class="row chip-transfer-actions"><button class="g f" onclick="closeChipTransfer()">${translateText("Batal")}</button><button class="ok f" data-testid="transfer-submit" onclick="submitChipTransfer()">${translateText("Kirim Chip")}</button></div>
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
        <select data-testid="theme-select" onchange="changeTheme(this.value);renderSettings()">${Object.keys(
          THEMES,
        )
          .map(
            (key) =>
              `<option value="${key}" ${key === currentTheme ? "selected" : ""}>${THEMES[key]}</option>`,
          )
          .join("")}</select>
      </label>
      <label class="settings-option"><span class="mut">${translateText("Bahasa")}</span>
        <select data-testid="language-select" onchange="updateLanguage(this.value)">${Object.keys(LANGUAGES)
          .map(
            (key) =>
              `<option value="${key}" ${key === currentLanguage ? "selected" : ""}>${LANGUAGES[key]}</option>`,
          )
          .join("")}</select>
      </label>
      <div class="settings-option"><span class="mut">${translateText("Volume Efek Suara")}</span>
        <div class="volume-control">
          <input id="volumeSlider" data-testid="volume-slider" type="range" min="0" max="100" step="1" value="${Math.round(currentVolume * 100)}" style="--volume-level:${currentVolume * 100}%" aria-label="${translateText("Volume Efek Suara")}" oninput="setVolume(this.value)">
          <button class="g mute-toggle" data-testid="mute-toggle" aria-label="${translateText(soundMuted ? "Nyalakan Suara" : "Matikan Suara")}" title="${translateText(soundMuted ? "Nyalakan Suara" : "Matikan Suara")}" aria-pressed="${soundMuted}" onclick="toggleMute()">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4V5z"></path>${soundMuted ? "" : '<path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 5.5a9 9 0 0 1 0 13"></path>'}${soundMuted ? '<path class="mute-slash" d="m4 4 16 16"></path>' : ""}</svg>
          </button>
          <span id="volumeValue">${Math.round(currentVolume * 100)}%</span>
        </div>
      </div>
      <div class="settings-option"><span class="mut">${translateText("Volume Musik Latar")}</span>
        <div class="volume-control">
          <input id="bgMusicVolumeSlider" data-testid="bgm-volume-slider" type="range" min="0" max="100" step="1" value="${Math.round(backgroundMusicVolume * 100)}" style="--volume-level:${backgroundMusicVolume * 100}%" aria-label="${translateText("Volume Musik Latar")}" oninput="setBackgroundMusicVolume(this.value)">
          <button class="g mute-toggle" data-testid="bgm-mute-toggle" aria-label="${translateText(backgroundMusicMuted ? "Nyalakan Musik" : "Matikan Musik")}" title="${translateText(backgroundMusicMuted ? "Nyalakan Musik" : "Matikan Musik")}" aria-pressed="${backgroundMusicMuted}" onclick="toggleBackgroundMusicMute()">
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
    <input id="chipAmount" data-testid="chip-adjust-amount" type="number" min="1" step="1" inputmode="numeric" placeholder="${translateText("Jumlah Chip")}" onkeydown="if(event.key==='Enter')submitChipAdjustment()">
    <div class="row" style="margin-top:12px"><button class="g f" onclick="closeChipAdjustment()">Batal</button><button class="${adding ? "ok" : "r"} f" data-testid="chip-adjust-save" onclick="submitChipAdjustment()">Simpan</button></div>
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
