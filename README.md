<p align="center">
  <img src="public/assets/logo/logo-main.png" alt="Logo Chips-in" width="120">
</p>

<h1 align="center">Chips-in</h1>

<p align="center">
  Aplikasi chip digital untuk bermain <strong>Poker</strong> dan <strong>Blackjack</strong> bersama teman.
  Buat room, bagikan kodenya, dan kelola permainan bersama di satu meja.
</p>

<p align="center">
  <a href="https://chips-in-online.onrender.com/"><strong>Mainkan Chips-in</strong></a>
  &nbsp;·&nbsp;
  <a href="README.en.md">English</a> ·
  <a href="https://github.com/MKsafr/chips-in">GitHub</a>
</p>

Chips-in menyinkronkan room, pemain, chip, taruhan, dan hasil permainan. Kartu tetap dimainkan secara fisik; aplikasi ini mencatat chip dan membantu mengelola permainan.

Versi aplikasi saat ini: **3.9** (versi klien/server, terpisah dari versi paket Node.js).

## Daftar isi

- [Fitur](#fitur)
- [Cara menggunakan](#cara-menggunakan)
- [Struktur project](#struktur-project)
- [Kredit](#kredit)

## Fitur

- Room terpisah dengan kode unik untuk setiap meja.
- Mode Poker dan Blackjack.
- Saldo chip, taruhan, pot, dan riwayat permainan.
- Toko border dengan kategori border satu warna dan border dua warna animasi yang ditampilkan berdampingan, serta preview persegi yang dapat dibeli dengan chip.
- Border yang dibeli dapat digunakan secara terpisah untuk sorotan pemain atau avatar profil, atau dibeli bersama sebagai bundle serasi dengan diskon 25%.
- Preview border profil berbentuk lingkaran dan dikelompokkan ke dalam kategori satu warna dan dua warna, sama seperti bundle border serasi.
- Pemimpin chip unik dapat menggunakan gaya RGB gratis atau gaya border toko dari kategori satu warna atau dua warna; gaya hanya tampil selama pemain memimpin dan tidak memberikan kepemilikan permanen.
- Pemimpin chip unik dapat membuka semua gaya trial non-RGB seharga 5.000 chip; pembukaan tersimpan pada pemain, sedangkan gaya trial yang dipilih hanya aktif selama pemain memimpin.
- Toko umum menyediakan pilihan tema dan musik MVP; tema berlaku di perangkat sendiri. Jika pemenang Poker atau Blackjack memiliki musik MVP, lagu miliknya diputar di semua perangkat dalam room dan mengikuti volume efek suara. Musik latar dijeda selama lagu MVP diputar lalu dilanjutkan kembali. Pemenang tanpa musik MVP tetap menggunakan musik default. Suara kemenangan tidak diputar untuk pemain yang saldonya habis.
- Panduan interaktif Poker dan Blackjack yang menjelaskan kombinasi kartu, aturan, dan cara bermain.
- Panel dealer untuk mengatur meja dan mengelola pemain.
- Pengelolaan pemain: mengubah urutan duduk, menambah atau mengurangi chip, menawarkan peran dealer, dan mengeluarkan pemain.
- Pemain dapat bergabung menggunakan kode room dan mengatur profil.
- Sesi pemain dan dealer dapat dilanjutkan setelah koneksi terputus selama room dan sesi masih tersedia.
- Dapat dipasang sebagai aplikasi web progresif (PWA) di browser dan perangkat yang mendukung.
- Antarmuka dalam Bahasa Indonesia dan English, dengan pilihan tema.
- FAQ dan formulir pelaporan bug tersedia melalui tombol bantuan di lobby.
- Kontak dukungan: chips.in.support@gmail.com.
- Laporan bug dibuka sebagai GitHub Issue publik; pengguna harus login dan mengirim laporan melalui GitHub.

## Cara menggunakan

### Dealer

1. Buka [Chips-in](https://chips-in-online.onrender.com/) dan pilih **Buat Ruangan**.
2. Ubah nama dan pilih avatar.
3. Bagikan kode room kepada para pemain.
4. Buka **Kontrol Dealer** untuk memilih Poker atau Blackjack, mengatur chip awal, dan—untuk Poker—mengatur Small Blind serta Big Blind.
5. Kelola pemain melalui **Kontrol Dealer**: ubah urutan duduk, tambah atau kurangi chip, tawarkan peran dealer, atau keluarkan pemain.
6. Jalankan setiap ronde dari meja:
   - **Poker:** pilih **Mulai Hand Baru**. Saat diminta membuka kartu komunitas, buka kartu di meja fisik lalu pilih **Konfirmasi Kartu** di aplikasi. Pada **Showdown**, pilih pemenang untuk setiap pot (termasuk side pot), lalu pilih **Bagikan Pot**.
   - **Blackjack:** pemain memasang taruhan terlebih dahulu. Pilih **Kunci Taruhan & Bagi Kartu**, lalu catat hasil setiap pemain setelah permainan kartu fisik selesai. Tombol hasil massal menyelesaikan semua taruhan dengan hasil yang sama; **Batal** mengembalikan taruhan ronde tersebut.
7. **Reset Semua Chip** tersedia saat tidak ada ronde yang berjalan.

### Pemain

1. Masukkan kode room dari dealer, lalu pilih **Gabung Room**.
2. Ubah nama dan pilih avatar.
3. Buka **Toko** dan pilih tab **Toko Border** untuk menggunakan atau membeli border. Border satu warna seharga 5.000 chip dan border dua warna animasi seharga 10.000 chip. Pembelian hanya tersedia di antara ronde dan tersimpan di room. Beli border sorotan dan profil yang serasi sekaligus untuk mendapatkan diskon 25%. Saat memimpin chip, kamu juga dapat memilih gaya RGB gratis atau gaya border toko; gaya itu tidak aktif lagi saat kamu kehilangan posisi pemimpin dan bukan merupakan pembelian. Tab **Toko Musik** menampilkan musik MVP yang dapat dibeli dengan chip. Jika pemilik lagu menang ronde, lagunya diputar di semua perangkat dalam room. Jika pemenang tidak memiliki musik, semua perangkat tetap menggunakan musik default. Untuk menambahkan lagu, masukkan file MP3 di `public/assets/sounds/mvp/` dan daftarkan pada `tracks.json` dengan `id`, `title`, dan `src`.
4. Bermain sesuai mode yang dipilih:
   - **Poker:** lakukan aksi saat giliranmu, seperti fold, call/check, raise, atau all-in. Jika chipmu habis saat all-in, tunggu showdown dan dealer membagikan pot.
   - **Blackjack:** pilih chip untuk menentukan taruhan sebelum dealer membagikan kartu. Jumlah taruhan setiap pemain tampil di daftar pemain, termasuk Bet 1 dan Bet 2 setelah Split. Saat ronde berlangsung, gunakan **Double** atau **Split** jika tersedia.
5. Saldo chip, taruhan, dan pembaruan room tersinkron secara otomatis.

Jika koneksi terputus atau tab tertutup, buka kembali situs di browser yang sama. Jika room dan sesi masih tersedia, kamu dapat memilih untuk melanjutkan sebagai pemain atau dealer. Pemain kembali dengan saldo sebelumnya; dealer yang kembali melanjutkan perannya. Sesi tidak dapat dilanjutkan jika room sudah tidak tersedia, misalnya setelah server dimulai ulang.

## Struktur project

```text
.
├── app/
│   ├── Config/
│   │   └── paths.js
│   ├── Controllers/
│   │   └── RoomController.js
│   └── Views/
│       └── index.html
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── app.css
│   │   │   └── legal.css
│   │   ├── images/
│   │   │   └── poker-felt-pattern.svg
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   ├── blackjack.js
│   │   │   ├── dealer.js
│   │   │   ├── display.js
│   │   │   ├── html5-qrcode.min.js
│   │   │   ├── i18n.js
│   │   │   ├── legal.js
│   │   │   ├── player-row.js
│   │   │   ├── poker.js
│   │   │   ├── profile.js
│   │   │   ├── room.js
│   │   │   ├── sound.js
│   │   │   ├── state.js
│   │   │   └── ui-controls.js
│   │   ├── logo/
│   │   │   ├── logo-main.png
│   │   │   └── logo-small.png
│   │   └── sounds/
│   │       ├── allin.mp3
│   │       ├── award.mp3
│   │       ├── bet.mp3
│   │       ├── bgmusic.mp3
│   │       ├── bjlose.mp3
│   │       ├── bjwin.mp3
│   │       ├── call.mp3
│   │       ├── check.mp3
│   │       ├── double.mp3
│   │       ├── fold.mp3
│   │       ├── kick.mp3
│   │       ├── raise.mp3
│   │       ├── reset.mp3
│   │       ├── showdown.mp3
│   │       ├── split.mp3
│   │       ├── stage.mp3
│   │       ├── transfer.mp3
│   │       ├── win.mp3
│   │       └── mvp/
│   │           └── tracks.json
│   ├── pages/
│   │   ├── about.html
│   │   ├── privacy.html
│   │   └── terms.html
│   ├── manifest.json
│   ├── robots.txt
│   ├── sitemap.xml
│   └── sw.js
├── package-lock.json
├── package.json
├── README.en.md
├── README.md
├── server.js
└── start.bat
```

- `server.js` adalah entry point aplikasi.
- `app/Controllers/RoomController.js` menangani server HTTP, room, dan logika permainan.
- `app/Views/index.html` adalah halaman utama.
- `public/pages/` berisi halaman About, Privacy, dan Terms; `public/assets/css/legal.css` dan `public/assets/js/legal.js` mendukung halaman tersebut.
- `public/robots.txt` dan `public/sitemap.xml` menyediakan arahan crawling dan daftar halaman publik untuk mesin pencari.
- `public/assets/` berisi stylesheet, script browser, QR scanner, gambar, logo, dan suara.
- Script browser dimuat secara berurutan dari `app/Views/index.html` karena beberapa file menggunakan state dan helper yang didefinisikan oleh file sebelumnya.
- Data room disimpan di memori server, sehingga room yang belum selesai tidak tersimpan jika proses server dimulai ulang.

## Kredit

Dibuat oleh **Ado, Anoy, Isan, dan Kholid**.

Dibuat sepenuhnya dengan bantuan AI.

Situs: https://chips-in-online.onrender.com/ · Repo: https://github.com/MKsafr/chips-in
