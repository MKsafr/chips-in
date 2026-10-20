      const $ = (s) => document.querySelector(s);
      const esc = (s) =>
        String(s || "").replace(
          /[&<>"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[c],
        );
      const fmt = (n) =>
        Number(n || 0).toLocaleString(
          currentLanguage === "en" ? "en-US" : "id-ID",
        );

      let token =
        localStorage.cb_token ||
        (localStorage.cb_token =
          Math.random().toString(36).slice(2) + Date.now().toString(36));
      let roomCode = localStorage.cb_room || "";
      const THEMES = {
        default: "Default",
        dark: "Dark Mode",
        blue: "Ocean Blue",
        crimson: "Crimson Red",
        purple: "Purple Night",
        teal: "Deep Teal",
        sunset: "Sunset",
      };
      const LANGUAGES = { id: "Bahasa Indonesia", en: "English" };
      const EN_TEXT = {
        "Selamat Datang di Chips-in": "Welcome to Chips-in",
        "Aplikasi chip kasino digital untuk Poker & Blackjack IRL bersama teman.":
          "A digital casino chip app for playing poker and blackjack with friends.",
        "Host Room (Buat Meja Baru)": "Create Room",
        "— ATAU —": "— OR —",
        "Kode Room (6 Karakter)": "Room Code (6 characters)",
        "Join Room": "Join Room",
        "Unduh App": "Install App",
        "Lanjutkan ke room sebelumnya?": "Continue to your previous room?",
        "Kamu telah dikeluarkan": "You have been removed",
        "Bandar telah mengeluarkan kamu dari room.": "The dealer removed you from the room.",
        "Chip kamu habis, tunggu ronde berikutnya atau minta Bandar menambahkan chip.": "You are out of chips. Wait for the next round or ask the dealer for more chips.",
        "Masukkan jumlah chip": "Enter the chip amount",
        "Jumlah chip harus berupa angka bulat lebih dari nol": "Enter a whole number greater than zero",
        "Pengaturan": "Settings",
        "Kontrol Dealer": "Dealer Controls",
        "Tutup": "Close",
        "Tampilan (hanya di perangkat ini)": "Appearance (this device only)",
        "Tema": "Theme",
        "Bahasa": "Language",
        "Volume Efek Suara": "Sound Effects Volume",
        "Matikan Suara": "Mute",
        "Nyalakan Suara": "Unmute",
        "Batal": "Cancel",
        "Simpan": "Save",
        "Menghubungkan ke Room": "Connecting to room",
        "Batal / Ganti Room": "Cancel / Change Room",
        "Room:": "Room:",
        "Keluar Room": "Leave Room",
        "Tutup Kontrol": "Close Controls",
        "👑 Bandar": "👑 Dealer",
        "👑 Bandar:": "👑 Dealer:",
        "👑 Bandar": "👑 Dealer",
        "Bandar": "Dealer",
        "Ganti Nama": "Change Name",
        "✎ Ganti Nama": "✎ Change Name",
        "Ganti Foto": "Change Avatar",
        "🖼 Ganti Foto": "🖼 Change Avatar",
        "✎ Edit Profil": "✎ Edit Profile",
        "Edit Profil": "Edit Profile",
        "Pilih avatar": "Choose avatar",
        "Pilih Avatar": "Choose Avatar",
        "Perbarui nama dan avatar profilmu.": "Update your name and profile avatar.",
        "Lengkapi profilmu sebelum mulai bermain.": "Complete your profile before playing.",
        "Avatar siap digunakan": "Avatar ready",
        "Avatar default": "Default avatar",
        "Pilih emoji atau gunakan foto sendiri.": "Choose an emoji or use your own photo.",
        "Upload Foto": "Upload Photo",
        "Foto tidak valid": "Invalid photo",
        "Foto terlalu besar": "Photo too large",
        "Foto gagal dibuka": "Could not open photo",
        "Foto gagal diproses": "Could not process photo",
        "Pilih file gambar untuk dijadikan avatar.": "Choose an image file for your avatar.",
        "Ukuran file foto maksimal 10 MB.": "Photo file size must be 10 MB or less.",
        "Coba pilih file gambar yang lain.": "Try choosing another image file.",
        "Foto ini tidak dapat dikompres ke ukuran avatar.":
          "This photo cannot be compressed to avatar size.",
        "Selamat datang di meja! 🎉": "Welcome to the table! 🎉",
        "Kamu jadi Bandar! 👑": "You are the Dealer! 👑",
        "Buat Meja Baru 👑": "Create a New Table 👑",
        "Siapkan Profil Pemain": "Set Up Player Profile",
        "Pilih nama dan foto profil Bandar. Room baru dibuat setelah menekan Lanjutkan.":
          "Choose the dealer's name and avatar. The room will be created when you select Continue.",
        "Pemain lain baru melihatmu setelah kamu menekan Lanjutkan.":
          "Other players will see you after you select Continue.",
        "Pilih nama dan foto profil Bandar dulu sebelum mengatur room. Pemain lain akan melihatnya.":
          "Choose the dealer's name and avatar before setting up the room. Other players will see this profile.",
        "Pilih foto profil dan isi namamu. Bisa diubah lagi kapan saja saat bermain.":
          "Choose an avatar and enter your name. You can change these anytime while playing.",
        "Nama (maks 16 karakter)": "Name (up to 16 characters)",
        "Lanjutkan": "Continue",
        "Lanjut": "Continue",
        "Mulai Main": "Start Playing",
        "Mode game diubah ke": "Game mode changed to",
        "IDLE": "IDLE",
        "Total Pot": "Total Pot",
        "Taruhan saat ini": "Current bet",
        "Feed Terbaru": "Latest Update",
        "Aksi Bandar (Dealer)": "Dealer Action",
        "Aksi Bandar": "Dealer Action",
        "Belum ada pemain yang join, sebarkan kode room agar mereka bisa bergabung.":
          "No players have joined yet. Share the room code so they can join.",
        "Buka kartu": "Reveal the",
        "di meja fisik, lalu tekan tombol di bawah ini agar pemain bisa bertaruh.":
          "cards at the physical table, then press the button below to let players bet.",
        "Tampilkan Kartu": "Confirm",
        "Daftar Pemain": "Players",
        "Belum ada pemain": "No players yet",
        "Pemain belum memberikan taruhan": "Players have not placed bets yet",
        "Giliranmu": "Your Turn",
        "Tunggu Bandar mengonfirmasi pembukaan kartu": "Wait for the dealer to confirm the",
        "di meja fisik...": "cards at the physical table...",
        "Raise ke": "Raise to",
        "Min": "Min",
        "Pot Utama": "Main Pot",
        "Total Pot": "Total Pot",
        "Showdown — Tentukan Pemenang": "Showdown — Select the Winner",
        "Side Pot": "Side Pot",
        "Kirim Pot": "Award Pot",
        "Menunggu Bandar memilih pemenang…": "Waiting for the dealer to select the winner…",
        "Blackjack": "Blackjack",
        "Total Taruhan": "Total Bets",
        "Daftar Taruhan Pemain": "Player Bets",
        "Menang": "Win",
        "BJ 3:2": "Blackjack 3:2",
        "Seri": "Push",
        "Kalah": "Lose",
        "Taruhanmu:": "Your Bet:",
        "Reset": "Reset",
        "Ulang": "Repeat",
        "Opsi Tambahan": "Extra Options",
        "Double (+": "Double (+",
        "Split (+": "Split (+",
        "Kontrol Bandar": "Dealer Controls",
        "Semua Menang": "All Win",
        "Semua Seri": "All Push",
        "Semua Kalah": "All Lose",
        "Batalkan ronde?": "Cancel this round?",
        "Kunci Taruhan & Bagi Kartu": "Lock Bets & Deal",
        "Pengaturan Meja": "Table Settings",
        "♠ Poker": "♠ Poker",
        "♣ Blackjack": "♣ Blackjack",
        "Chip Awal": "Starting Chips",
        "Small Blind": "Small Blind",
        "Big Blind": "Big Blind",
        "Simpan Pengaturan": "Save Settings",
        "Kelola Pemain": "Manage Players",
        "Tawarkan Bandar": "Offer Dealer Role",
        "Reset Semua Chip": "Reset All Chips",
        "Selamat Datang di Chips-in": "Welcome to Chips-in",
        "Kode room tidak valid": "Invalid room code",
        "Kode room terdiri dari 6 karakter. Cek lagi kode dari Bandar.":
          "Room codes have 6 characters. Check the code from the dealer.",
        "Room tidak ditemukan": "Room Not Found",
        "Kode room salah atau room sudah ditutup. Periksa lagi kode dari Bandar.":
          "The room code is incorrect or the room has closed. Check the code with the dealer.",
        "Room sudah ditutup atau server baru saja restart. Buat atau gabung room lagi.":
          "The room has closed or the server restarted. Create or join another room.",
        "Koneksi ke server terputus": "Connection to server lost",
        "Kamu sudah tidak duduk di meja ini": "You are no longer seated at this table",
        "Riwayat Permainan": "Game History",
        "Kode Room (6 Karakter)": "Room Code (6 characters)",
        "Aplikasi chip kasino digital untuk Poker & Blackjack IRL bersama teman.":
          "A digital casino chip app for playing poker and blackjack with friends.",
        "Room tidak ditemukan": "Room Not Found",
        "Pemain dikeluarkan oleh Bandar": "Player removed by dealer",
        "Room tidak ditemukan atau telah ditutup!":
          "Room not found or already closed!",
        "Game History": "Game History",
        "Taruhanmu": "Your Bet",
        "• Taruhan saat ini": "• Current bet",
        "Tidak dapat melakukan split": "Cannot split",
        "Mode bukan Blackjack": "This is not a Blackjack game",
        "Nama maksimal 16 karakter": "Name can be up to 16 characters",
        "Install Chips-in": "Install Chips-in",
        "Di Android, buka menu browser lalu pilih 'Install app' atau 'Tambahkan ke layar utama'. Di iPhone, buka menu Bagikan lalu pilih 'Add to Home Screen'.":
          "On Android, open your browser menu and select 'Install app' or 'Add to Home screen'. On iPhone, open the Share menu and select 'Add to Home Screen'.",
        "Keluar dari room? Bandar akan langsung dialihkan ke pemain lain. Jika tidak ada pemain, room akan dihapus.":
          "Leave the room? The dealer role will immediately transfer to another player. If there are no players, the room will be deleted.",
        "Keluar dari room?": "Leave the room?",
        "Tawarkan peran Bandar ke": "Offer the dealer role to",
        "? Dia harus menyetujui dulu.": "? They must accept first.",
        "Keluarkan": "Remove",
        "Reset semua chip?": "Reset all chips?",
        "Tampilan": "Appearance",
        "Buat Room": "Create Room",
        "Poker": "Poker",
        "Blackjack": "Blackjack",
        "Fold": "Fold",
        "Raise": "Raise",
        "Check": "Check",
        "Call": "Call",
        "Pot": "Pot",
        "Main Pot": "Main Pot",
        "Semua pemain fold": "Everyone folded",
        "Chip awal": "Starting chips",
        "Tampilkan Kartu": "Confirm Cards",
        "Small Blind": "Small Blind",
        "Big Blind": "Big Blind",
        "Nyalakan Suara": "Unmute",
        "Matikan Suara": "Mute",
        "hand baru dimulai": "new hand started",
        "Pilih nama dan foto profil": "Choose a name and avatar",
        "Nama (maks 16 karakter)": "Name (up to 16 characters)",
        "Batas minimum raise": "Minimum raise",
        "Mengganti nama menjadi": "changed their name to",
        "Pemain": "Player",
        "Dealer": "Dealer",
        "Bandar": "Dealer",
        "Taruhan": "Bet",
        "menang": "won",
        "Menerima": "Received",
        "telah meninggalkan meja": "left the table",
        "GILIRAN": "YOUR TURN",
        "Tawaran Bandar dibatalkan": "Dealer offer cancelled",
        "Ganti Foto Profil": "Change Avatar",
        "Small Blind menjadi": "Small Blind set to",
        "Big Blind menjadi": "Big Blind set to",
        "Chip Awal menjadi": "Starting Chips set to",
        "Semua chip pemain berhasil direset": "All player chips were reset",
        "Ronde Blackjack dibatalkan": "Blackjack round cancelled",
        "Tunggu hingga ronde selesai sebelum keluar":
          "Wait until the round ends before leaving",
        "Koneksi ke server terputus": "Connection to server lost",
        "Kamu sudah tidak duduk di meja ini": "You are no longer seated at this table",
        "Kode room salah atau room sudah ditutup. Periksa lagi kode dari Bandar.":
          "The room code is incorrect or the room has closed. Check the code with the dealer.",
        "Room sudah ditutup atau server baru saja restart. Buat atau gabung room lagi.":
          "The room has closed or the server restarted. Create or join another room.",
        "Room tidak ditemukan atau telah ditutup!":
          "Room not found or already closed!",
        "Minimal 2 pemain yang memiliki chip": "At least 2 players with chips are required",
        "Hand masih berjalan": "A hand is still in progress",
        "Selesaikan ronde yang berjalan terlebih dahulu!": "Finish the current round first!",
        "Mode saat ini bukan Poker": "The current game mode is not Poker",
        "Menunggu Bandar konfirmasi pembukaan kartu fisik terlebih dahulu!":
          "Wait for the dealer to confirm the physical cards first!",
        "Jumlah taruhan tidak valid": "Invalid bet amount",
        "Raise harus lebih besar dari taruhan saat ini": "Raise must exceed the current bet",
        "Belum tahap Showdown": "It is not showdown yet",
        "Pilih pemenang untuk setiap pot": "Select a winner for every pot",
        "Perintah tidak dikenal": "Unknown command",
        "Room berhasil dibuat.": "Room created.",
        "Pemain dikeluarkan": "Player was removed",
        "Kamu jadi Bandar! 👑": "You are the Dealer! 👑",
        "Room:": "Room:",
        "⏱": "⏱",
        "Bandar •": "Dealer •",
        "• tidak ikut bermain": "• not playing",
        "duduk di meja": "joined the table",
        "Taruhan saat ini": "Current bet",
        "Aksi Bandar (Dealer)": "Dealer Action",
        "Aksi Bandar": "Dealer Action",
        "Belum ada pemain yang join, sebarkan kode room agar mereka bisa bergabung.":
          "No players have joined yet. Share the room code so they can join.",
        "Buka kartu": "Reveal the",
        "di meja fisik, lalu tekan tombol di bawah ini agar pemain bisa bertaruh.":
          "cards at the physical table, then press the button below to let players bet.",
        "agar pemain bisa bertaruh.": "so players can bet.",
        "Bandar telah mengonfirmasi pembukaan kartu":
          "Dealer confirmed the cards",
        "Tunggu Bandar mengonfirmasi pembukaan kartu":
          "Wait for the dealer to confirm the",
        "di meja fisik...": "cards at the physical table...",
        "Tampilkan Kartu": "Confirm Cards",
        "Daftar Pemain": "Players",
        "Belum ada pemain": "No players yet",
        "Pemain belum memberikan taruhan": "Players have not placed bets yet",
        "Giliranmu": "Your Turn",
        "Showdown — Tentukan Pemenang": "Showdown — Select the Winner",
        "Menunggu Bandar memilih pemenang…": "Waiting for the dealer to select the winner…",
        "Daftar Taruhan Pemain": "Player Bets",
        "Taruhanmu:": "Your Bet:",
        "Kunci Taruhan & Bagi Kartu": "Lock Bets & Deal",
        "Pengaturan Meja": "Table Settings",
        "♠ Poker": "♠ Poker",
        "♣ Blackjack": "♣ Blackjack",
        "Simpan Pengaturan": "Save Settings",
        "Kelola Pemain": "Manage Players",
        "Tawarkan Bandar": "Offer Dealer Role",
        "Reset Semua Chip": "Reset All Chips",
        "Selamat Datang di Chips-in": "Welcome to Chips-in",
        "Aplikasi chip kasino digital untuk Poker & Blackjack IRL bersama teman.":
          "A digital casino chip app for playing poker and blackjack with friends.",
        "Host Room (Buat Meja Baru)": "Create Room",
        "— ATAU —": "— OR —",
        "Join Room": "Join Room",
        "Maks 16 karakter": "Up to 16 characters",
        "Nama (maks 16 karakter)": "Name (up to 16 characters)",
        "MENANG KASINO!": "WINS THE GAME!",
        "Bandar menawarkan peran": "The dealer is offering you the role of",
        "kepadamu. Jika kamu terima, kamu": "If you accept, you will",
        "keluar dari meja": "leave the table",
        "dan tidak ikut bermain lagi (chipmu disimpan), sedangkan Bandar lama otomatis duduk sebagai pemain.":
          "and stop playing (your chips will be saved), while the previous dealer takes your seat.",
        "menjadi satu-satunya pemenang yang menguasai semua chip!":
          "is now the only player with all the chips!",
        "Bandar terputus. Mencari Bandar baru secara otomatis…":
          "Dealer disconnected. Automatically finding a new dealer…",
        "Mode game diubah ke": "Game mode changed to",
        "Chip Awal": "Starting Chips",
        "Daftar Pemain": "Players",
        "Aplikasi chip kasino digital untuk Poker & Blackjack IRL bersama teman.":
          "A digital casino chip app for playing poker and blackjack with friends.",
        "Menunggu": "Waiting for",
        "menerima peran Bandar…": "to accept the dealer role…",
        "Batalkan": "Cancel",
        "▶ Mulai Hand Baru": "▶ Start New Hand",
        "MENANG KASINO!": "WINS THE GAME!",
        "Menjadi satu-satunya pemenang yang menguasai semua chip!":
          "Is now the only player with all the chips!",
        "CHIPS KAMU HABIS": "YOU'RE OUT OF CHIPS",
        "Minta Bandar mengisi chip kamu untuk bermain kembali.":
          "Ask the dealer to add chips so you can play again.",
        "Jadi Bandar?": "Become the Dealer?",
        "Bandar menawarkan peran": "The dealer is offering you the role of",
        "kepadamu. Jika kamu terima, kamu": "If you accept, you will",
        "keluar dari meja": "leave the table",
        "dan tidak ikut bermain lagi (chipmu disimpan), sedangkan Bandar lama otomatis duduk sebagai pemain.":
          "and stop playing (your chips will be saved), while the previous dealer takes your seat.",
        "Terima": "Accept",
        "Tolak": "Decline",
        "OK": "OK",
        "Dealer": "Dealer",
        "D": "D",
        "FOLD": "FOLD",
        "GILIRAN": "YOUR TURN",
        "Pemain": "Player",
        "Chip": "Chips",
        "Nama tidak boleh kosong": "Name cannot be empty",
        "Nama sudah dipakai": "That name is already taken",
        "Room tidak ditemukan atau telah ditutup!":
          "Room not found or already closed!",
        "Hanya Bandar yang memiliki akses ini!":
          "Only the dealer can do this!",
        "Kamu belum bergabung di room ini!": "You have not joined this room!",
        "Bandar tidak dapat bergabung sebagai pemain":
          "The dealer cannot join as a player",
        "Foto profil tidak valid": "Invalid avatar",
        "Tidak dapat bergabung ke meja": "Could not join the table",
        "Tunggu hingga ronde selesai sebelum keluar":
          "Wait until the round ends before leaving",
        "Belum saatnya bertaruh": "It is not time to bet yet",
        "Tidak dapat menambah taruhan": "Cannot add to the bet",
        "Chip tidak mencukupi": "Not enough chips",
        "Chip tidak cukup untuk Melakukan Split":
          "Not enough chips to split",
        "Selesaikan ronde yang berjalan terlebih dahulu!":
          "Finish the current round first!",
        "Tidak bisa mengubah urutan saat hand berjalan":
          "Cannot change the seating order during a hand",
        "Pemain tidak ditemukan": "Player not found",
        "Selesaikan ronde yang berjalan sebelum mengganti Bandar":
          "Finish the current round before changing the dealer",
        "Tawaran Bandar sudah tidak berlaku": "The dealer offer has expired",
        "Tawaran ini bukan untukmu": "This offer is not for you",
        "Ronde sedang berjalan, tawaran dibatalkan":
          "A round is in progress; the offer was cancelled",
        "Tunggu hingga ronde selesai": "Wait until the round ends",
        "Hand masih berjalan": "A hand is still in progress",
        "Belum ada pemain yang memasang taruhan":
          "No players have placed bets yet",
        "Ronde Blackjack dibatalkan": "Blackjack round cancelled",
        "Tawaran Bandar dibatalkan": "Dealer offer cancelled",
        "Hand dibatalkan. Chip dikembalikan":
          "Hand cancelled. Chips have been returned",
        "Semua chip pemain berhasil direset": "All player chips were reset",
        "Kartu dikocok & taruhan dikunci": "Cards shuffled & bets locked",
        "Showdown! Tentukan pemenang.": "Showdown! Select the winner.",
        "Mode game diubah ke POKER": "Game mode changed to POKER",
        "Mode game diubah ke BLACKJACK": "Game mode changed to BLACKJACK",
        "Small Blind menjadi": "Small Blind set to",
        "Big Blind menjadi": "Big Blind set to",
        "Chip Awal menjadi": "Starting Chips set to",
        "• Taruhan saat ini": "• Current bet",
        "Blackjack": "Blackjack",
      };
      let currentLanguage = LANGUAGES[localStorage.cb_language]
        ? localStorage.cb_language
        : "id";
      let currentVolume = Number(localStorage.cb_volume);
      if (!Number.isFinite(currentVolume))
        currentVolume = 1;
      currentVolume = Math.max(0, Math.min(currentVolume, 1));
      let soundMuted = localStorage.cb_muted === "true";
      let settingsOpen = false;
      // Theme, language, and volume settings are stored locally per device.
      document.documentElement.lang = currentLanguage;
      let currentTheme = THEMES[localStorage.cb_theme]
        ? localStorage.cb_theme
        : "default";
      document.documentElement.setAttribute("data-theme", currentTheme);

      const APP_VER = "3.6.0";
      let st = null,
        draft = { w: {} },
        toastMsg = "",
        dealerControlsOpen = false,
        deferredPrompt = null;
      let pfOpen = false,
        pf = {},
        leaving = false,
        pendingRoomCode = "",
        pendingEntrySound = false,
        notice = null,
        noticeTimer = null,
        noChipsNoticeKey = null,
        casinoWinnerNoticeKey = null,
        chipAdjustment = null;

      // Avatar preset harus sama dengan daftar AVATARS di RoomController.js.
      const AV = {
        default: { default: 1 },
        spade: { t: "♠", bg: "#222" },
        heart: { t: "♥", bg: "#c0392b" },
        club: { t: "♣", bg: "#1e9a5a" },
        diamond: { t: "♦", bg: "#2471c9" },
        "chip-red": { chip: "#c0392b", t: "5" },
        "chip-blue": { chip: "#2471c9", t: "10" },
        "chip-green": { chip: "#1e9a5a", t: "25" },
        "chip-black": { chip: "#222", t: "100" },
        "chip-purple": { chip: "#7d3cc4", t: "500" },
        "chip-allin": { allin: 1 },
        crown: { e: "👑" },
        joker: { e: "🃏" },
        dice: { e: "🎲" },
        shark: { e: "🦈" },
        wolf: { e: "🐺" },
        fox: { e: "🦊" },
        cowboy: { e: "🤠" },
        cool: { e: "😎" },
        slot: { e: "🎰" },
        clover: { e: "🍀" },
        fire: { e: "🔥" },
        dragon: { e: "🐉" },
        lion: { e: "🦁" },
        hat: { e: "🎩" },
        rocket: { e: "🚀" },
        money: { e: "💰" },
      };
      const AV_IDS = Object.keys(AV);
      function avatar(id, size) {
        size = size || 36;
        if (typeof id === "string" && id.startsWith("data:image/jpeg;base64,"))
          return `<img class="av av-photo" src="${id}" alt="" style="width:${size}px;height:${size}px">`;
        const a = AV[id] || AV.default,
          wh = `width:${size}px;height:${size}px;`,
          bw = Math.max(2, Math.round(size / 11));
        if (a.default)
          return `<span class="av av-default" style="${wh}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8H4z"></path></svg></span>`;
        if (a.e)
          return `<span class="av" style="${wh}font-size:${Math.round(size * 0.55)}px;background:var(--btn2)">${a.e}</span>`;
        if (a.allin)
          return `<span class="av" style="${wh}font-size:${Math.round(size * 0.22)}px;color:#000;background:linear-gradient(135deg,#e8c35a,#e5484d);border:${bw}px solid rgba(255,255,255,.75)">ALL<br>IN</span>`;
        if (a.chip)
          return `<span class="av" style="${wh}font-size:${Math.round(size * 0.3)}px;background:${a.chip};border:${bw}px dashed rgba(255,255,255,.6)">${a.t}</span>`;
        return `<span class="av" style="${wh}font-size:${Math.round(size * 0.55)}px;background:${a.bg}">${a.t}</span>`;
      }
      let audioCtx = null;

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js", { updateViaCache: "none" })
          .catch(() => {});
      }
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        render();
      });
