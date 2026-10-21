function beginHostCreation() {
  pf = { mode: "createHost", name: "Dealer", avatar: "default" };
  pfOpen = true;
  pfAvatarPickerOpen = false;
  renderProfile();
}

async function joinRoom() {
  const v = (($("#rc") || {}).value || "").trim().toUpperCase();
  if (v.length !== 6) {
    showAlert(
      "Kode room tidak valid",
      "Kode room terdiri dari 6 karakter. Cek lagi kode dari Bandar.",
    );
    return;
  }
  const j = await api("checkRoom", { roomCode: v });
  if (j && j.ok) {
    pendingRoomCode = v;
    pf = {
      mode: "join",
      name: j.suggestedName || "Player 1",
      avatar: "default",
    };
    pfOpen = true;
    pfAvatarPickerOpen = false;
    renderProfile();
  }
}

// ----- Profil pemain (nama + foto) -----
// Profil milik kita: pemain di meja, atau profil Bandar kalau kita Bandar
function myProfile() {
  if (!st) return null;
  return st.isHost
    ? st.host
    : (st.players || []).find((p) => p.id === st.you) || null;
}
function openProfile(mode) {
  const me = myProfile();
  if (!me) return;
  pf = { mode: mode || "edit", name: me.name, avatar: me.avatar || "default" };
  pfOpen = true;
  pfAvatarPickerOpen = false;
  renderProfile();
}
let pfAvatarPickerOpen = false;
function captureProfileName() {
  const el = $("#pfName");
  if (el) pf.name = el.value;
}
function closeProfile() {
  pfOpen = false;
  pfAvatarPickerOpen = false;
  if (pf.mode === "join") pendingRoomCode = "";
  const m = $("#modal");
  if (m) m.innerHTML = "";
}
function openAvatarPicker() {
  captureProfileName();
  pfAvatarPickerOpen = true;
  renderProfile();
}
function closeAvatarPicker() {
  pfAvatarPickerOpen = false;
  renderProfile();
}
function pickAvatar(id) {
  captureProfileName();
  pf.avatar = id;
  pfAvatarPickerOpen = false;
  renderProfile();
}
function uploadAvatar(input) {
  const file = input.files && input.files[0];
  input.value = "";
  if (!file) return;
  captureProfileName();
  if (!file.type.startsWith("image/")) {
    showAlert("Foto tidak valid", "Pilih file gambar untuk dijadikan avatar.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showAlert("Foto terlalu besar", "Ukuran file foto maksimal 10 MB.");
    return;
  }

  const reader = new FileReader();
  reader.onerror = () =>
    showAlert("Foto gagal dibuka", "Coba pilih file gambar yang lain.");
  reader.onload = () => {
    const image = new Image();
    image.onerror = () =>
      showAlert("Foto gagal dibuka", "Coba pilih file gambar yang lain.");
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context || !image.naturalWidth || !image.naturalHeight) {
        showAlert("Foto gagal diproses", "Coba pilih file gambar yang lain.");
        return;
      }
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const sx = (image.naturalWidth - side) / 2;
      const sy = (image.naturalHeight - side) / 2;
      let output = "";
      for (const size of [128, 96, 72]) {
        canvas.width = size;
        canvas.height = size;
        context.clearRect(0, 0, size, size);
        context.drawImage(image, sx, sy, side, side, 0, 0, size, size);
        for (const quality of [0.82, 0.68, 0.52, 0.38]) {
          output = canvas.toDataURL("image/jpeg", quality);
          if (output.length <= 48 * 1024) break;
        }
        if (output.length <= 48 * 1024) break;
      }
      if (!output || output.length > 48 * 1024) {
        showAlert(
          "Foto terlalu besar",
          "Foto ini tidak dapat dikompres ke ukuran avatar.",
        );
        return;
      }
      pf.avatar = output;
      pfAvatarPickerOpen = false;
      renderProfile();
    };
    image.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}
function renderProfile() {
  const full = ["full", "join", "createHost"].includes(pf.mode),
    showName = pf.mode !== "avatar";
  const title = full
    ? pf.mode === "createHost"
      ? "Buat Meja Baru 👑"
      : pf.mode === "join"
        ? "Siapkan Profil Pemain"
        : st && st.isHost
          ? "Kamu jadi Bandar! 👑"
          : "Selamat datang di meja! 🎉"
    : "Edit Profil";
  const helper =
    pf.mode === "createHost"
      ? "Pilih nama dan avatar Bandar."
      : pf.mode === "join"
        ? "Pemain lain baru melihat profilmu setelah kamu menekan Lanjutkan."
        : full
          ? "Lengkapi profilmu sebelum mulai bermain."
          : "Perbarui nama dan avatar profilmu.";
  $("#modal").innerHTML = `<div class="modal"><div class="mbox profile-box">
    <div class="profile-title">${title}</div>
    <div class="mut profile-helper">${helper}</div>
    <div class="profile-editor">
      <div class="profile-avatar-wrap">
        <button class="profile-avatar-trigger" aria-label="Pilih avatar" onclick="openAvatarPicker()">
          ${avatar(pf.avatar, 104)}<span class="profile-avatar-plus" aria-hidden="true"></span>
        </button>
        <span class="mut">Pilih avatar</span>
      </div>
      <div class="profile-fields">
        ${showName ? `<label class="profile-label" for="pfName">Nama</label><input id="pfName" maxlength="16" value="${esc(pf.name)}" autocomplete="nickname" placeholder="Masukkan nama" onkeydown="if(event.key==='Enter')saveProfile()">` : ""}
        <div class="mut profile-avatar-hint">${pf.avatar && pf.avatar !== "default" ? "Avatar siap digunakan" : "Avatar default"}</div>
      </div>
    </div>
    <div class="row profile-actions">
      <button class="g f" onclick="closeProfile()">Batal</button>
      <button class="ok f" onclick="saveProfile()">${pf.mode === "createHost" || pf.mode === "join" ? "Lanjutkan" : "Simpan"}</button>
    </div>
    </div></div>
    ${
      pfAvatarPickerOpen
        ? `<div class="modal avatar-picker-modal" onclick="if(event.target===this)closeAvatarPicker()"><div class="mbox avatar-picker-box" role="dialog" aria-modal="true" aria-label="Pilih avatar">
      <div class="row sp avatar-picker-heading"><div><div class="profile-title">Pilih Avatar</div><div class="mut">Pilih emoji atau gunakan foto sendiri.</div></div><button class="g s" aria-label="Tutup" onclick="closeAvatarPicker()">✕</button></div>
      <div class="avgrid">${AV_IDS.map((id) => `<button class="avbtn ${pf.avatar === id ? "sel" : ""}" aria-label="${id === "default" ? "Avatar default" : id}" onclick="pickAvatar('${id}')">${avatar(id, 42)}</button>`).join("")}</div>
      <div class="avatar-picker-actions">
        <label class="g avatar-upload-button">📷 Upload Foto<input type="file" accept="image/*" onchange="uploadAvatar(this)"></label>
      </div>
    </div></div>`
        : ""
    }`;
  localizeTree($("#modal"));
}
async function saveProfile() {
  const payload = {};
  captureProfileName();
  if (pf.mode !== "avatar") payload.name = ($("#pfName") || {}).value;
  if (pf.mode !== "name") payload.avatar = pf.avatar || "default";
  if (pf.mode === "createHost") {
    pendingEntrySound = true;
    const j = await api("hostRoom", payload);
    if (j && j.ok) closeProfile();
    else pendingEntrySound = false;
    return;
  }
  if (pf.mode === "join") {
    pendingEntrySound = true;
    const j = await api("joinRoom", {
      ...payload,
      roomCode: pendingRoomCode,
    });
    if (j && j.ok) {
      closeProfile();
      if (invitedRoomCode) {
        const inviteUrl = new URL(window.location.href);
        inviteUrl.searchParams.delete("room");
        window.history.replaceState(
          null,
          "",
          inviteUrl.pathname + inviteUrl.search + inviteUrl.hash,
        );
      }
    } else pendingEntrySound = false;
    return;
  }
  const j = await api("profile", payload);
  if (j && j.ok) closeProfile();
}
