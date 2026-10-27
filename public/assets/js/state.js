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
  Number(n || 0).toLocaleString(currentLanguage === "en" ? "en-US" : "id-ID");
const chipUnit = (amount) =>
  currentLanguage === "en" &&
  Number(String(amount).replace(/[,.]/g, "")) !== 1
    ? "chips"
    : "chip";
const fmtChips = (amount) => `${fmt(amount)} ${chipUnit(amount)}`;

let token =
  localStorage.cb_token ||
  (localStorage.cb_token =
    Math.random().toString(36).slice(2) + Date.now().toString(36));
const inviteCodeParam = new URLSearchParams(window.location.search).get("room");
const invitedRoomCode = /^[A-Z0-9]{6}$/.test(
  (inviteCodeParam || "").trim().toUpperCase(),
)
  ? inviteCodeParam.trim().toUpperCase()
  : "";
let roomCode = invitedRoomCode ? "" : localStorage.cb_room || "";
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
  "Pemain yang sedang disorot": "Featured player",
  "Giliran pemain": "Player's turn",
  "Pemain di meja": "At the table",
  "Sorotan Blackjack": "Blackjack spotlight",
  "Sedang mendapat giliran": "Taking a turn",
  "Sorotan di meja": "Table spotlight",
  "Chip Tersisa": "Chips remaining",
  "Bet 1": "Bet 1",
  "Bet 2": "Bet 2",
  "Bantuan dan FAQ": "Help & FAQ",
  "Pertanyaan Umum": "Frequently Asked Questions",
  "Bagaimana cara membuat atau bergabung ke room?":
    "How do I create or join a room?",
  "Pilih Buat Ruangan untuk menjadi Bandar, atau masukkan kode room dari Bandar lalu pilih Gabung Room. Kamu juga bisa memindai QR room.":
    "Choose Create Room to become the dealer, or enter the room code from the dealer and choose Join Room. You can also scan the room QR code.",
  "Apakah kartu dimainkan di aplikasi?":
    "Are cards played in the app?",
  "Tidak. Kartu dimainkan secara fisik. Aplikasi membantu mencatat pemain, chip, taruhan, pot, dan hasil permainan.":
    "No. Cards are played physically. The app helps track players, chips, bets, pots, and game results.",
  "Bagaimana cara kerja chip?": "How do chips work?",
  "Chip hanya untuk mencatat permainan sosial. Chip tidak memiliki nilai uang, tidak dapat dibeli, dan tidak dapat dicairkan.":
    "Chips are only for tracking social games. They have no monetary value, cannot be purchased, and cannot be cashed out.",
  "Pengaturan suara saya tidak tersimpan di perangkat lain, kenapa?":
    "Why aren't my sound settings available on my other devices?",
  "Pengaturan suara disimpan di browser dan perangkat yang kamu gunakan, jadi tidak otomatis dibagikan ke perangkat lain.":
    "Sound settings are saved in the browser and device you use, so they are not automatically shared with other devices.",
  "Apa yang harus dilakukan jika koneksi terputus?":
    "What should I do if my connection drops?",
  "Kembali ke tab Chips-in dan tunggu browser menyambungkan ulang. Sesi room dapat dipulihkan selama room masih tersedia.":
    "Return to the Chips-in tab and wait for the browser to reconnect. The room session can be restored while the room is still available.",
  "Laporkan Bug": "Report a Bug",
  "Isi judul dan langkah untuk mengulangi masalah. Kamu akan diarahkan ke GitHub untuk meninjau dan mengirim laporan.":
    "Enter a title and steps to reproduce the problem. You will be redirected to GitHub to review and submit the report.",
  "Judul masalah": "Issue title",
  "Contoh: Suara tidak bisa diatur di Safari":
    "Example: Cannot adjust sound in Safari",
  "Langkah atau keterangan": "Steps or details",
  "Apa yang kamu lakukan, apa yang terjadi, dan apa yang seharusnya terjadi?":
    "What did you do, what happened, and what did you expect to happen?",
  "GitHub akan menampilkan laporan secara publik. Login dan tekan Submit new issue untuk mengirim. Jangan sertakan kata sandi atau informasi pribadi.":
    "GitHub will display the report publicly. Sign in and click Submit new issue to send it. Do not include passwords or personal information.",
  "Lanjutkan ke GitHub": "Continue to GitHub",
  "Selamat Datang di Chips-in": "Welcome to Chips-in",
  "Aplikasi chip virtual untuk mencatat permainan Poker & Blackjack bersama teman.":
    "A virtual chip app for tracking Poker & Blackjack games with friends.",
  "Buat Ruangan": "Create Room",
  "— ATAU —": "— OR —",
  "Kode Room (6 Karakter)": "Room Code (6 characters)",
  "Tampilkan QR Room": "Show Room QR",
  "QR Room": "Room QR",
  "Scan QR ini untuk membuka room.": "Scan this QR code to open the room.",
  "Kode Room": "Room Code",
  "Link Undangan Room": "Room Invite Link",
  "Salin Link": "Copy Link",
  "Link room disalin": "Room link copied",
  "Kirim Chip": "Send Chips",
  "Transfer chip hanya tersedia saat ronde tidak aktif":
    "Chip transfers are only available between rounds",
  "Saldo tersedia": "Available balance",
  Penerima: "Recipient",
  "Pilih pemain": "Select a player",
  "Jumlah Chip": "Chip Amount",
  Kirim: "Send",
  ke: "to",
  "Pilih pemain yang valid": "Select a valid player",
  "Chip tidak mencukupi": "Not enough chips",
  "Transfer chip berhasil": "Chip transfer successful",
  "Tidak bisa mengirim chip ke diri sendiri":
    "You cannot send chips to yourself",
  "Jumlah chip penerima terlalu besar": "Recipient balance is too large",
  "Pindah ke Poker? Taruhan Blackjack yang belum dikunci akan dibatalkan dan chip dikembalikan.":
    "Switch to Poker? Unlocked Blackjack bets will be canceled and the chips refunded.",
  "Ada taruhan Blackjack yang belum dikunci. Konfirmasi pembatalan taruhan untuk pindah ke Poker.":
    "There are unlocked Blackjack bets. Confirm bet cancellation to switch to Poker.",
  "Gabung Room": "Join Room",
  "Scan QR Room dengan Kamera": "Scan Room QR with Camera",
  "Scan QR Room": "Scan Room QR",
  "Arahkan kamera ke QR room.": "Point the camera at the room QR code.",
  "Meminta akses kamera…": "Requesting camera access…",
  "Pemindai QR tidak dapat dimuat.": "QR scanner could not be loaded.",
  "QR bukan kode atau link room yang valid.":
    "This QR code does not contain a valid room code or link.",
  "Kamera tidak dapat dibuka. Izinkan akses kamera dan gunakan HTTPS.":
    "Camera could not be opened. Allow camera access and use HTTPS.",
  "Unduh App": "Install App",
  "Lanjutkan ke room sebelumnya?": "Continue to your previous room?",
  "Kamu telah dikeluarkan": "You have been removed",
  "Bandar telah mengeluarkan kamu dari room.":
    "The dealer removed you from the room.",
  "Chip kamu habis, tunggu ronde berikutnya atau minta Bandar menambahkan chip.":
    "You are out of chips. Wait for the next round or ask the dealer for more chips.",
  "Masukkan jumlah chip": "Enter the chip amount",
  "Jumlah taruhan": "Bet amount",
  Masukkan: "Place bet",
  "Masukkan jumlah chip bulat lebih dari nol":
    "Enter a whole number of chips greater than zero",
  "Jumlah chip harus berupa angka bulat lebih dari nol":
    "Enter a whole number greater than zero",
  Pengaturan: "Settings",
  "Kontrol Dealer": "Dealer Controls",
  "👑 Kontrol Dealer": "👑 Dealer Controls",
  Keluar: "Leave",
  "+ Chip": "+ Chips",
  "- Chip": "- Chips",
  "Tambah Chip": "Add Chips",
  "Kurangi Chip": "Reduce Chips",
  "Seret untuk memindahkan": "Drag to reorder",
  Keluarkan: "Remove",
  "Keluarkan pemain": "Remove Player",
  Tutup: "Close",
  "Tampilan (hanya di perangkat ini)": "Appearance (this device only)",
  Toko: "Store",
  "Toko Border": "Border Store",
  "Toko Musik": "Music Store",
  "Kategori toko": "Store categories",
  "Belum ada musik MVP. Lagu akan muncul di sini setelah ditambahkan.":
    "There is no MVP music yet. Songs will appear here after they are added.",
  "Memuat musik MVP…": "Loading MVP music…",
  "Musik MVP": "MVP Music",
  "Musik MVP hanya dapat dipilih oleh pemenang ronde. Musik yang dipilih akan diputar untuk semua pemain di room.":
    "MVP music can only be selected by a round winner. The selected music will play for everyone in the room.",
  "Khusus pemenang": "Winners only",
  Pilih: "Choose",
  "Pilih Musik MVP": "Choose MVP Music",
  "Kamu menang! Pilih musik yang akan diputar untuk semua pemain di room.":
    "You won! Choose music to play for everyone in the room.",
  "Musik MVP diputar untuk semua pemain":
    "MVP music is playing for everyone",
  "Kamu belum memenangkan ronde ini": "You did not win this round",
  "Pemenang ronde ini sudah memilih musik MVP":
    "A winner of this round has already chosen MVP music",
  "Musik MVP tidak tersedia": "MVP music is unavailable",
  "Border 1 Warna": "Single-Color Borders",
  "Border 2 Warna": "Two-Color Borders",
  "Gaya Pemimpin Chip": "Chip Leader Style",
  "Border satu warna seharga 5.000 chip dan border dua warna seharga 10.000 chip.":
    "Single-color borders cost 5,000 chips and two-color borders cost 10,000 chips.",
  "Pembelian hanya tersedia saat ronde tidak aktif. Border tersimpan di room ini.":
    "Purchases are only available between rounds. Borders are saved in this room.",
  Merah: "Red",
  Biru: "Blue",
  Hijau: "Green",
  Ungu: "Purple",
  Oranye: "Orange",
  "Merah Muda": "Pink",
  Cyan: "Cyan",
  Putih: "White",
  "Sudah dimiliki": "Owned",
  "Sedang dipakai": "Equipped",
  Gunakan: "Equip",
  Beli: "Buy",
  "Lepas border": "Remove border",
  "Border berhasil dibeli dan dipakai": "Border purchased and equipped",
  "Border profil berhasil dibeli dan dipakai":
    "Profile border purchased and equipped",
  "Bundle border berhasil dibeli dan dipakai":
    "Border bundle purchased and equipped",
  "Border berhasil dipakai": "Border equipped",
  "Border profil berhasil dipakai": "Profile border equipped",
  "Border dilepas": "Border removed",
  "Border profil dilepas": "Profile border removed",
  "Warna border tidak tersedia": "Border color is unavailable",
  "Warna border sudah dimiliki": "You already own this border color",
  "Warna border profil sudah dimiliki":
    "You already own this profile border color",
  "Border hanya dapat dibeli saat ronde tidak aktif":
    "Borders can only be purchased between rounds",
  "Chip tidak mencukupi untuk membeli border":
    "Not enough chips to purchase this border",
  "Chip tidak mencukupi untuk membeli border profil":
    "Not enough chips to purchase this profile border",
  "Bundle border sudah dimiliki": "You already own this border bundle",
  "Chip tidak mencukupi untuk membeli bundle border":
    "Not enough chips to purchase this border bundle",
  "Warna border belum dimiliki": "You do not own this border color",
  "Warna border profil belum dimiliki":
    "You do not own this profile border color",
  "RGB gratis. Buka semua trial border lain seharga 5.000 chip. Gaya pilihan hanya aktif saat kamu memimpin.":
    "RGB is free. Unlock all other trial borders for 5,000 chips. Selected styles only apply while you lead.",
  "RGB gratis. Buka semua trial border lain seharga 5.000 chip. Border yang sudah dimiliki juga bisa dipilih. Gaya pilihan hanya aktif saat kamu memimpin.":
    "RGB is free. Unlock all other trial borders for 5,000 chips. You can also choose borders you already own. Selected styles only apply while you lead.",
  "Border Profil": "Profile Borders",
  "Lepas border profil": "Remove profile border",
  "Bundle Border Serasi": "Matching Border Bundles",
  "Sorotan + Profil": "Highlight + Profile",
  "Beli border sorotan dan profil yang serasi sekaligus dengan diskon 25%. Jika salah satunya sudah dimiliki, diskon hanya berlaku untuk border yang belum dimiliki.":
    "Buy matching highlight and profile borders together with 25% off. If you already own one, the discount applies to the remaining border.",
  "Gaya pemimpin chip berhasil diubah": "Chip leader style updated",
  "Semua trial border terbuka": "All trial borders unlocked",
  "Buka semua trial border": "Unlock all trial borders",
  Terkunci: "Locked",
  "Hanya pemimpin chip yang dapat membuka trial border":
    "Only the chip leader can unlock trial borders",
  "Hanya pemimpin chip yang dapat memilih gaya border":
    "Only the chip leader can choose a border style",
  "Trial border sudah terbuka": "Trial borders are already unlocked",
  "Chip tidak mencukupi untuk membuka trial border":
    "Not enough chips to unlock trial borders",
  "Buka trial border pemimpin terlebih dahulu":
    "Unlock the chip leader trial borders first",
  "Trial border pemimpin berhasil dibuka":
    "Chip leader trial borders unlocked",
  "Aksi store tidak valid": "Invalid store action",
  Tema: "Theme",
  Bahasa: "Language",
  "Volume Efek Suara": "Sound Effects Volume",
  "Volume Musik Latar": "Background Music Volume",
  "Konfirmasi All-in": "Confirm All-in",
  "Apakah kamu yakin ingin All-in?": "Are you sure you want to go all-in?",
  "Jumlah All-in": "All-in Amount",
  "Ya, All-in": "Yes, go all-in",
  "Matikan Suara": "Mute",
  "Nyalakan Suara": "Unmute",
  "Matikan Musik": "Mute Music",
  "Nyalakan Musik": "Unmute Music",
  Batal: "Cancel",
  Simpan: "Save",
  "Menghubungkan ke Room": "Connecting to room",
  "Batal / Ganti Room": "Cancel / Change Room",
  "Room:": "Room:",
  "Keluar Room": "Leave Room",
  "Tutup Kontrol": "Close Controls",
  "👑 Bandar": "👑 Dealer",
  "👑 Bandar:": "👑 Dealer:",
  "👑 Bandar": "👑 Dealer",
  Bandar: "Dealer",
  "Ganti Nama": "Change Name",
  "✎ Ganti Nama": "✎ Change Name",
  "Ganti Foto": "Change Avatar",
  "🖼 Ganti Foto": "🖼 Change Avatar",
  "✎ Edit Profil": "✎ Edit Profile",
  "Edit Profil": "Edit Profile",
  "Pilih avatar": "Choose avatar",
  "Pilih Avatar": "Choose Avatar",
  "Perbarui nama dan avatar profilmu.": "Update your name and profile avatar.",
  "Lengkapi profilmu sebelum mulai bermain.":
    "Complete your profile before playing.",
  "Avatar siap digunakan": "Avatar ready",
  "Avatar default": "Default avatar",
  "Pilih emoji atau gunakan foto sendiri.":
    "Choose an emoji or use your own photo.",
  "Upload Foto": "Upload Photo",
  "Ukuran foto terlalu besar": "Photo file too large",
  "Format foto tidak didukung": "Unsupported photo format",
  "Foto gagal dibaca": "Could not read photo",
  "Foto gagal diproses": "Could not process photo",
  "Foto tidak bisa dikompres": "Could not compress photo",
  "Foto tidak dapat digunakan": "Photo could not be used",
  "Pilih file gambar untuk dijadikan avatar.":
    "Choose an image file for your avatar.",
  "Pilih foto dalam format JPG, PNG, atau WebP.":
    "Choose a photo in JPG, PNG, or WebP format.",
  "Ukuran foto maksimal 10 MB. Pilih foto yang lebih kecil.":
    "Photo size must be 10 MB or less. Choose a smaller photo.",
  "File tidak dapat dibaca. Coba pilih foto yang lain.":
    "The file could not be read. Try choosing another photo.",
  "Browser tidak dapat membuka foto ini. Coba pilih JPG, PNG, atau WebP.":
    "Your browser could not open this photo. Try JPG, PNG, or WebP.",
  "Browser tidak dapat memproses foto ini. Coba pilih foto lain.":
    "Your browser could not process this photo. Try another one.",
  "Coba pilih foto lain dengan ukuran atau resolusi yang lebih kecil.":
    "Try another photo with a smaller file size or resolution.",
  "Selamat datang di meja! 🎉": "Welcome to the table! 🎉",
  "Kamu jadi Bandar! 👑": "You are the Dealer! 👑",
  "Buat Meja Baru 👑": "Create New Table 👑",
  "Siapkan Profil Pemain": "Set Up Player Profile",
  "Pilih nama dan foto profil Bandar. Room baru dibuat setelah menekan Lanjutkan.":
    "Choose the dealer's name and avatar. The room will be created when you select Continue.",
  "Pemain lain baru melihatmu setelah kamu menekan Lanjutkan.":
    "Other players will see you after you select Continue.",
  "Pemain lain baru melihat profilmu setelah kamu menekan Lanjutkan.":
    "Other players will see your profile after you select Continue.",
  "Pilih nama dan foto profil Bandar dulu sebelum mengatur room. Pemain lain akan melihatnya.":
    "Choose the dealer's name and avatar before setting up the room. Other players will see this profile.",
  "Pilih nama dan avatar Bandar.": "Choose the dealer's name and avatar.",
  "Pilih foto profil dan isi namamu. Bisa diubah lagi kapan saja saat bermain.":
    "Choose an avatar and enter your name. You can change these anytime while playing.",
  "Nama (maks 16 karakter)": "Name (up to 16 characters)",
  Nama: "Name",
  "Masukkan nama": "Enter your name",
  Lanjutkan: "Continue",
  Lanjut: "Continue",
  Tidak: "No",
  "Mulai Main": "Start Playing",
  "Mode game diubah ke": "Game mode changed to",
  "Belum Dimulai": "Not Started",
  "Jumlah Pot": "Total Pot",
  "Panduan Hand Poker": "Poker Hand Guide",
  "Panduan Blackjack": "Blackjack Guide",
  "Urutan Hand Poker": "Poker Hand Rankings",
  "Contoh kartu": "Example cards",
  "Menangkan pot dengan membuat semua pemain lain fold atau bertahan hingga showdown dengan kombinasi lima kartu terkuat. Berikut urutan hand dari yang terendah hingga tertinggi.":
    "Win the pot by making every other player fold, or stay in until showdown with the strongest five-card hand. Here are the hands ranked from lowest to highest.",
  "Royal Flush": "Royal Flush",
  "Straight Flush": "Straight Flush",
  "Four of a Kind": "Four of a Kind",
  "Full House": "Full House",
  Flush: "Flush",
  Straight: "Straight",
  "Three of a Kind": "Three of a Kind",
  "Two Pair": "Two Pair",
  "One Pair": "One Pair",
  "High Card": "High Card",
  "Lima kartu berurutan dari 10 sampai As dengan simbol yang sama.":
    "Five consecutive cards from 10 to Ace, all in the same suit.",
  "Lima kartu berurutan dengan simbol yang sama.":
    "Five consecutive cards, all in the same suit.",
  "Empat kartu dengan angka yang sama, ditambah satu kartu lain.":
    "Four cards of the same rank, plus one other card.",
  "Tiga kartu dengan angka yang sama dan sepasang kartu dengan angka yang sama.":
    "Three cards of the same rank and a pair of another rank.",
  "Lima kartu dengan simbol yang sama, tidak harus berurutan.":
    "Five cards of the same suit, not necessarily in sequence.",
  "Lima kartu berurutan dengan simbol yang berbeda-beda.":
    "Five consecutive cards in different suits.",
  "Tiga kartu dengan angka yang sama, ditambah dua kartu lain.":
    "Three cards of the same rank, plus two other cards.",
  "Dua pasang kartu dengan angka yang sama, ditambah satu kartu lain.":
    "Two pairs of cards with matching ranks, plus one other card.",
  "Sepasang kartu dengan angka yang sama, ditambah tiga kartu lain.":
    "A pair of cards with the same rank, plus three other cards.",
  "Tidak ada kombinasi di atas; nilai kartu tertinggi yang menentukan.":
    "None of the combinations above; the highest card determines the hand.",
  "Tujuan permainan": "Goal",
  "Dapatkan nilai kartu lebih tinggi dari bandar tanpa melewati 21. Kamu juga menang jika bandar melewati 21 sementara nilaimu tidak.":
    "Get a higher card total than the dealer without going over 21. You also win if the dealer busts and you do not.",
  "Nilai kartu dan hand": "Card values and hands",
  "Kartu 2–10 bernilai sesuai angkanya; J, Q, dan K bernilai 10. As bernilai 1 atau 11, pilih nilai yang tidak membuat total melewati 21 jika memungkinkan. Hand adalah total nilai kartu yang kamu pegang.":
    "Cards 2–10 are worth their face value; J, Q, and K are worth 10. An Ace is worth 1 or 11; use the value that keeps your total at or below 21 when possible. Your hand is the total value of your cards.",
  "Contoh: As + King = Blackjack natural (21 dari dua kartu).":
    "Example: Ace + King = a natural Blackjack (21 in two cards).",
  "Menang, kalah, seri, dan bust": "Win, lose, push, and bust",
  "Jika totalmu melewati 21, kamu bust dan kalah. Jika tidak bust, bandingkan total dengan bandar: lebih tinggi menang, lebih rendah kalah, dan sama berarti seri (push, taruhan kembali).":
    "If your total goes over 21, you bust and lose. Otherwise, compare totals with the dealer: higher wins, lower loses, and a tie is a push (your bet is returned).",
  "Blackjack natural": "Natural Blackjack",
  "Blackjack adalah 21 dari dua kartu pertama: satu As dan satu kartu bernilai 10. Dalam aturan umum, payout-nya 3:2. Tiga kartu atau lebih yang totalnya 21 bukan Blackjack natural.":
    "A Blackjack is 21 with your first two cards: one Ace and one 10-value card. Under common rules, it pays 3:2. A total of 21 made with three or more cards is not a natural Blackjack.",
  "Contoh natural: As + Queen. Aplikasi mencatat hasil yang dipilih bandar; kartu tidak diperiksa otomatis.":
    "Natural example: Ace + Queen. The app records the dealer's selected result; it does not verify cards automatically.",
  "Hit dan stand": "Hit and stand",
  "Hit berarti mengambil kartu tambahan; stand berarti berhenti mengambil kartu. Tentukan aksi pada kartu fisik bersama bandar—aplikasi ini hanya mencatat taruhan dan hasil.":
    "Hit means taking another card; stand means taking no more cards. Play these actions with physical cards and the dealer—the app only tracks bets and results.",
  Double: "Double",
  "Double berarti menambah taruhan sebesar taruhan awal, lalu mengambil satu kartu terakhir. Umumnya dilakukan pada dua kartu awal. Di aplikasi, opsi Double menambahkan taruhan yang sama; Split tidak dapat dilakukan setelah Double.":
    "Double means adding an amount equal to your original bet, then taking one final card. It is commonly allowed on the first two cards. In this app, Double adds the same amount; you cannot Split after Doubling.",
  Split: "Split",
  "Jika dua kartu awal memiliki nilai yang sama, aturan umum mengizinkan kartu itu dipisah menjadi dua hand dengan taruhan tambahan yang sama. Mainkan dan tentukan hasil tiap hand secara terpisah. Aplikasi mendukung satu Split per ronde; Split memerlukan chip yang cukup dan tidak dapat dilakukan setelah Double. Blackjack pada hand hasil Split tidak mendapat payout natural 3:2.":
    "If your first two cards have the same value, common rules allow splitting them into two hands with an additional matching bet. Play and settle each hand separately. This app allows one Split per round; you need enough chips, and cannot Split after Doubling. Blackjack on a split hand does not receive the natural 3:2 payout.",
  "Taruhan dan payout di aplikasi": "Bets and payouts in this app",
  "Taruhan dipasang sebelum kartu dibagikan. Hasil Menang mengembalikan total 2× taruhan (termasuk taruhan awal), push mengembalikan 1×, dan kalah mengembalikan 0. Hasil BJ membayar total 2,5× taruhan, dibulatkan ke chip terdekat. Bandar mencatat hasil secara manual.":
    "Place bets before cards are dealt. Win returns 2× the bet total (including the original stake), push returns 1×, and lose returns 0. BJ returns 2.5× the bet, rounded to the nearest chip. The dealer records results manually.",
  "Ringkasan aturan umum Blackjack. Aturan meja dapat berbeda; kartu dimainkan secara fisik dan hasil di aplikasi dicatat manual oleh bandar.":
    "A summary of common Blackjack rules. Table rules can vary; cards are played physically and the dealer records results in the app.",
  "As": "Ace",
  sekop: "spades",
  hati: "hearts",
  wajik: "diamonds",
  keriting: "clubs",
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
  Giliranmu: "Your Turn",
  "Tunggu Bandar mengonfirmasi pembukaan kartu":
    "Wait for the dealer to confirm the",
  "di meja fisik...": "cards at the physical table...",
  "Raise ke": "Raise to",
  Min: "Min",
  "Pot Utama": "Main Pot",
  "Total Pot": "Total Pot",
  "Showdown — Tentukan Pemenang": "Showdown — Select the Winner",
  "Side Pot": "Side Pot",
  "Kirim Pot": "Award Pot",
  "Menunggu Bandar memilih pemenang…":
    "Waiting for the dealer to select the winner…",
  Blackjack: "Blackjack",
  "Total Taruhan": "Total Bets",
  "Daftar Taruhan Pemain": "Player Bets",
  Menang: "Win",
  "BJ 3:2": "Blackjack 3:2",
  Bust: "Bust",
  Next: "Next",
  "Giliran Bandar": "Dealer's Turn",
  "Semua taruhan sudah mendapat giliran.":
    "All bets have had a turn.",
  "Blackjack natural tidak berlaku untuk Split atau Double.":
    "Natural Blackjack does not apply after a Split or Double.",
  Seri: "Push",
  Kalah: "Lose",
  "Taruhanmu:": "Your Bet:",
  Reset: "Reset",
  Ulang: "Repeat",
  "Opsi Tambahan": "Extra Options",
  "Double (+": "Double (+",
  "Split (+": "Split (+",
  "Kontrol Bandar": "Dealer Controls",
  "👑 Kontrol Bandar": "👑 Dealer Controls",
  "Kontrol Blackjack": "Blackjack Controls",
  "Semua Menang": "All Win",
  "Semua Seri": "All Push",
  "Semua Kalah": "All Lose",
  "Batalkan Hand & Kembalikan Chip": "Cancel Hand & Refund Chips",
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
  "Tawarkan sebagai dealer": "Offer as Dealer",
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
  "Kamu sudah tidak duduk di meja ini":
    "You are no longer seated at this table",
  "Riwayat Permainan": "Game History",
  "Kode Room (6 Karakter)": "Room Code (6 characters)",
  "Aplikasi chip virtual untuk mencatat permainan Poker & Blackjack bersama teman.":
    "A virtual chip app for tracking Poker & Blackjack games with friends.",
  "Room tidak ditemukan": "Room Not Found",
  "Pemain dikeluarkan oleh Bandar": "Player removed by dealer",
  "Room tidak ditemukan atau telah ditutup!":
    "Room not found or already closed!",
  "Game History": "Game History",
  Taruhanmu: "Your Bet",
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
  Keluarkan: "Remove",
  "Reset semua chip?": "Reset all chips?",
  Tampilan: "Appearance",
  "Buat Room": "Create Room",
  Poker: "Poker",
  Blackjack: "Blackjack",
  Fold: "Fold",
  Raise: "Raise",
  Check: "Check",
  Call: "Call",
  Pot: "Pot",
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
  Pemain: "Player",
  Dealer: "Dealer",
  Bandar: "Dealer",
  Taruhan: "Bet",
  menang: "won",
  Menerima: "Received",
  "telah meninggalkan meja": "left the table",
  GILIRAN: "YOUR TURN",
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
  "Kamu sudah tidak duduk di meja ini":
    "You are no longer seated at this table",
  "Kode room salah atau room sudah ditutup. Periksa lagi kode dari Bandar.":
    "The room code is incorrect or the room has closed. Check the code with the dealer.",
  "Room sudah ditutup atau server baru saja restart. Buat atau gabung room lagi.":
    "The room has closed or the server restarted. Create or join another room.",
  "Room tidak ditemukan atau telah ditutup!":
    "Room not found or already closed!",
  "Minimal 2 pemain yang memiliki chip":
    "At least 2 players with chips are required",
  "Hand masih berjalan": "A hand is still in progress",
  "Selesaikan ronde yang berjalan terlebih dahulu!":
    "Finish the current round first!",
  "Mode saat ini bukan Poker": "The current game mode is not Poker",
  "Menunggu Bandar konfirmasi pembukaan kartu fisik terlebih dahulu!":
    "Wait for the dealer to confirm the physical cards first!",
  "Jumlah taruhan tidak valid": "Invalid bet amount",
  "Raise harus lebih besar dari taruhan saat ini":
    "Raise must exceed the current bet",
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
  "Bandar telah mengonfirmasi pembukaan kartu": "Dealer confirmed the cards",
  "Tunggu Bandar mengonfirmasi pembukaan kartu":
    "Wait for the dealer to confirm the",
  "di meja fisik...": "cards at the physical table...",
  "Tampilkan Kartu": "Confirm Cards",
  "Daftar Pemain": "Players",
  "Belum ada pemain": "No players yet",
  "Pemain belum memberikan taruhan": "Players have not placed bets yet",
  Giliranmu: "Your Turn",
  "Showdown — Tentukan Pemenang": "Showdown — Select the Winner",
  "Menunggu Bandar memilih pemenang…":
    "Waiting for the dealer to select the winner…",
  "Daftar Taruhan Pemain": "Player Bets",
  "Taruhanmu:": "Your Bet:",
  "Kunci Taruhan & Bagi Kartu": "Lock Bets & Deal",
  "Pengaturan Meja": "Table Settings",
  "♠ Poker": "♠ Poker",
  "♣ Blackjack": "♣ Blackjack",
  "Simpan Pengaturan": "Save Settings",
  "Kelola Pemain": "Manage Players",
  "Tawarkan sebagai dealer": "Offer as Dealer",
  "Reset Semua Chip": "Reset All Chips",
  "Selamat Datang di Chips-in": "Welcome to Chips-in",
  "Aplikasi chip virtual untuk mencatat permainan Poker & Blackjack bersama teman.":
    "A virtual chip app for tracking Poker & Blackjack games with friends.",
  "— ATAU —": "— OR —",
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
  "Aplikasi chip virtual untuk mencatat permainan Poker & Blackjack bersama teman.":
    "A virtual chip app for tracking Poker & Blackjack games with friends.",
  Menunggu: "Waiting for",
  "menerima peran Bandar…": "to accept the dealer role…",
  Batalkan: "Cancel",
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
  Terima: "Accept",
  Tolak: "Decline",
  OK: "OK",
  Dealer: "Dealer",
  D: "D",
  FOLD: "FOLD",
  GILIRAN: "YOUR TURN",
  Pemain: "Player",
  Chip: "Chips",
  "Nama tidak boleh kosong": "Name cannot be empty",
  "Nama sudah dipakai": "That name is already taken",
  "Room tidak ditemukan atau telah ditutup!":
    "Room not found or already closed!",
  "Hanya Bandar yang memiliki akses ini!": "Only the dealer can do this!",
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
  "Chip tidak cukup untuk Melakukan Split": "Not enough chips to split",
  "Bukan giliranmu": "It is not your turn",
  "Aksi tidak dikenal": "Unknown action",
  "Hasil tidak valid": "Invalid result",
  "Taruhan tidak valid": "Invalid bet",
  "Sesi sebelumnya tidak ditemukan": "Previous session not found",
  "Tidak dapat melanjutkan sesi pemain":
    "Could not resume the player session",
  "Pilih nama dan foto profil Bandar dulu":
    "Choose the dealer's name and avatar first",
  "Selesaikan ronde yang berjalan terlebih dahulu!":
    "Finish the current round first!",
  "Tidak bisa mengubah urutan saat ronde berjalan":
    "Cannot change the seating order during a hand",
  "Urutan pemain tidak valid": "Invalid player order",
  "Pemain tidak ditemukan": "Player not found",
  "Selesaikan ronde yang berjalan sebelum mengganti Bandar":
    "Finish the current round before changing the dealer",
  "Tawaran Bandar sudah tidak berlaku": "The dealer offer has expired",
  "Tawaran ini bukan untukmu": "This offer is not for you",
  "Ronde sedang berjalan, tawaran dibatalkan":
    "A round is in progress; the offer was cancelled",
  "Tunggu hingga ronde selesai": "Wait until the round ends",
  "Hand masih berjalan": "A hand is still in progress",
  "Belum ada pemain yang memasang taruhan": "No players have placed bets yet",
  "Ronde Blackjack dibatalkan": "Blackjack round cancelled",
  "Ronde tidak dapat dibatalkan": "This round can no longer be canceled",
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
  Blackjack: "Blackjack",
};
let currentLanguage = LANGUAGES[localStorage.cb_language]
  ? localStorage.cb_language
  : "id";
document.title =
  currentLanguage === "en"
    ? "Chips-in - Virtual Poker & Blackjack Chips"
    : "Chips-in - Chip Virtual Poker & Blackjack";
let currentVolume = Number(localStorage.cb_volume);
if (!Number.isFinite(currentVolume)) currentVolume = 1;
currentVolume = Math.max(0, Math.min(currentVolume, 1));
let soundMuted = localStorage.cb_muted === "true";
let backgroundMusicVolume = Number(localStorage.cb_bgm_volume);
if (!Number.isFinite(backgroundMusicVolume)) backgroundMusicVolume = 0.3;
backgroundMusicVolume = Math.max(0, Math.min(backgroundMusicVolume, 1));
let backgroundMusicMuted = localStorage.cb_bgm_muted === "true";
let settingsOpen = false;
// Theme, language, and volume settings are stored locally per device.
document.documentElement.lang = currentLanguage;
let currentTheme = THEMES[localStorage.cb_theme]
  ? localStorage.cb_theme
  : "default";
document.documentElement.setAttribute("data-theme", currentTheme);

const APP_VER = "3.10";
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
function avatarWithBorder(
  player,
  size,
  isLeader = false,
) {
  if (!player) return avatar("default", size);
  const borderProducts = [
    "red",
    "blue",
    "green",
    "purple",
    "orange",
    "pink",
    "cyan",
    "white",
    "neon-green-white",
    "neon-green-black",
    "neon-orange-magenta",
    "neon-orange-electric-blue",
    "neon-green-denim",
  ];
  const leaderStyle =
    isLeader &&
    (player.leaderBorderColor === "rgb" ||
      borderProducts.includes(player.leaderBorderColor));
  const borderColor = leaderStyle
    ? player.leaderBorderColor === "rgb"
      ? null
      : player.leaderBorderColor
    : player.profileBorderColor;
  const productBorder = borderProducts.includes(borderColor);
  if (!leaderStyle && !productBorder) return avatar(player.avatar, size);
  const classes = [
    "avatar-border",
    productBorder ? `pl-border-${borderColor}` : "",
    leaderStyle && productBorder ? "pl-leader-style" : "",
    leaderStyle && !productBorder ? "pl-fire-leader" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `<span class="${classes}" style="width:${size}px;height:${size}px">${avatar(player.avatar, size)}</span>`;
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
