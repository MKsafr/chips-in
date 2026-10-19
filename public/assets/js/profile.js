      function beginHostCreation() {
        pf = { mode: "createHost", name: "Dealer", avatar: "crown" };
        pfOpen = true;
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
            avatar: "spade",
          };
          pfOpen = true;
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
        pf = { mode, name: me.name, avatar: me.avatar };
        pfOpen = true;
        renderProfile();
      }
      function closeProfile() {
        pfOpen = false;
        if (pf.mode === "join") pendingRoomCode = "";
        const m = $("#modal");
        if (m) m.innerHTML = "";
      }
      function pickAvatar(id) {
        const el = $("#pfName");
        if (el) pf.name = el.value;
        pf.avatar = id;
        renderProfile();
      }
      function renderProfile() {
        const full = ["full", "join", "createHost"].includes(pf.mode),
          showName = pf.mode !== "avatar",
          showAv = pf.mode !== "name";
        const title = full
          ? pf.mode === "createHost"
            ? "Buat Meja Baru 👑"
            : pf.mode === "join"
              ? "Siapkan Profil Pemain"
              : st && st.isHost
                ? "Kamu jadi Bandar! 👑"
                : "Selamat datang di meja! 🎉"
          : pf.mode === "name"
            ? "Ganti Nama"
            : "Ganti Foto Profil";
        $("#modal").innerHTML = `<div class="modal"><div class="mbox">
    <div style="font-size:18px;font-weight:800">${title}</div>
    ${full ? `<div class="mut" style="margin-top:4px">${pf.mode === "createHost" ? "Pilih nama dan foto profil Bandar. Room baru dibuat setelah menekan Lanjutkan." : pf.mode === "join" ? "Pemain lain baru melihatmu setelah kamu menekan Lanjutkan." : st && st.isHost ? "Pilih nama dan foto profil Bandar dulu sebelum mengatur room. Pemain lain akan melihatnya." : "Pilih foto profil dan isi namamu. Bisa diubah lagi kapan saja saat bermain."}</div>` : ""}
    ${showAv ? `<div class="avgrid">${AV_IDS.map((id) => `<button class="avbtn ${pf.avatar === id ? "sel" : ""}" onclick="pickAvatar('${id}')">${avatar(id, 44)}</button>`).join("")}</div>` : ""}
    ${
      showName
        ? `<div class="mut" style="margin:10px 0 4px">Nama (maks 16 karakter)</div>
      <input id="pfName" maxlength="16" value="${esc(pf.name)}" onkeydown="if(event.key==='Enter')saveProfile()">`
        : ""
    }
    <div class="row" style="margin-top:14px">
      <button class="g f" onclick="closeProfile()">Batal</button>
      <button class="ok f" onclick="saveProfile()">${pf.mode === "createHost" || pf.mode === "join" ? "Lanjutkan" : full ? (st && st.isHost ? "Lanjut" : "Mulai Main") : "Simpan"}</button>
    </div></div></div>`;
        localizeTree($("#modal"));
      }
      async function saveProfile() {
        const payload = {};
        if (pf.mode !== "avatar") payload.name = ($("#pfName") || {}).value;
        if (pf.mode !== "name") payload.avatar = pf.avatar;
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
          if (j && j.ok) closeProfile();
          else pendingEntrySound = false;
          return;
        }
        const j = await api("profile", payload);
        if (j && j.ok) closeProfile();
      }
