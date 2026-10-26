<p align="center">
  <img src="public/assets/logo/logo-main.png" alt="Logo Chips-in" width="120">
</p>

<h1 align="center">Chips-in</h1>

<p align="center">
  Aplikasi chip digital untuk bermain <strong>Poker</strong> dan <strong>Blackjack</strong> bersama teman.
  Buat room, bagikan kodenya, dan kelola permainan dari satu meja bersama.
</p>

<p align="center">
<<<<<<< HEAD
  <a href="https://chips-in-online.onrender.com/"><strong>Mainkan Chips-in</strong></a>
=======
  <a href="https://chips-in-online.onrender.com/"><strong> Mainkan Chips-in </strong></a>
>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6
  &nbsp;·&nbsp;
  <a href="README.en.md">English</a> ·
  <a href="https://github.com/MKsafr/chips-in">GitHub</a>
</p>

Chips-in menyinkronkan room, pemain, chip, taruhan, dan hasil ronde. Kartu tetap dimainkan secara fisik; aplikasi ini menyediakan pencatatan chip dan kontrol permainan.

<<<<<<< HEAD
Versi aplikasi saat ini: **3.9** (versi klien/server, terpisah dari versi paket Node.js).
=======
Versi aplikasi saat ini: **3.7.4** (versi klien/server, terpisah dari versi paket Node.js).
>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6

## Daftar isi

- [Fitur](#fitur)
- [Cara menggunakan](#cara-menggunakan)
<<<<<<< HEAD
- [Menjalankan secara lokal](#menjalankan-secara-lokal)
=======
>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6
- [Struktur project](#struktur-project)
- [Kredit](#kredit)

## Fitur

- Room terpisah dengan kode unik untuk setiap meja.
- Mode Poker dan Blackjack.
- Saldo chip, taruhan, pot, dan riwayat permainan.
<<<<<<< HEAD
- Toko border dengan kategori border satu warna seharga 5.000 chip dan border dua warna animasi seharga 10.000 chip.
- Border dapat dibeli untuk sorotan pemain dan avatar profil secara terpisah, atau dibeli sebagai bundle serasi dengan diskon 25%.
- Border sorotan ditampilkan dalam bentuk persegi, sedangkan preview border profil berbentuk lingkaran.
- Pemimpin chip unik dapat menggunakan gaya RGB gratis atau memilih border toko saat memimpin. Gaya pemimpin tidak memberikan kepemilikan border.
- Pemimpin chip unik dapat membuka semua gaya trial non-RGB seharga 5.000 chip. Pembukaan trial tersimpan pada pemain, tetapi gaya pilihannya hanya aktif saat ia memimpin.
- Antarmuka toko border tersedia dalam Bahasa Indonesia dan English, termasuk kategori untuk gaya pemimpin, border profil, dan bundle.
=======
>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6
- Panduan interaktif Poker dan Blackjack yang menjelaskan hand, aturan, dan cara bermain.
- Panel dealer untuk mengatur meja dan mengelola pemain.
- Pengelolaan pemain: ubah urutan duduk, tambah/kurangi chip, tawarkan peran dealer, dan keluarkan pemain.
- Pemain dapat bergabung menggunakan kode room dan mengatur profil.
- Pemulihan sesi pemain maupun dealer setelah koneksi terputus, selama room dan sesi masih tersedia.
- Bisa dipasang sebagai aplikasi web progresif (PWA) pada browser/perangkat yang mendukung.
- Antarmuka tersedia dalam Bahasa Indonesia dan English, dengan pilihan tema.
- FAQ dan formulir pelaporan bug tersedia dari tombol bantuan di lobby.
- Kontak dukungan: chips.in.support@gmail.com.
- Laporan bug dibuka sebagai GitHub Issue yang dapat dilihat publik; pengguna harus login dan mengirimkannya dari GitHub.

## Cara menggunakan

### Dealer

<<<<<<< HEAD
1. Buka [Chips-in](https://chips-in-online.onrender.com/) dan pilih **Buat Ruangan**.
=======
1. Buka [Chips-in](https://chips-in-online.onrender.com/) dan pilih **Host Room (Buat Meja Baru)**.
>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6
2. Ubah nama lalu pilih avatar.
3. Bagikan kode room yang tampil kepada para pemain.
4. Buka **Kontrol Dealer** untuk memilih Poker atau Blackjack, mengatur chip awal, dan—untuk Poker—mengatur Small Blind serta Big Blind.
5. Kelola pemain melalui panel **Kontrol Dealer**: ubah urutan duduk, tambah/kurangi chip, tawarkan peran dealer, atau keluarkan pemain.
6. Aksi ronde dilakukan langsung dari meja:
   - **Poker:** pilih **Mulai Hand Baru**. Saat permainan meminta kartu komunitas dibuka, dealer membuka kartu di meja fisik lalu menekan tombol konfirmasi di meja aplikasi. Pada **Showdown**, pilih nama pemenang untuk setiap pot (termasuk side pot), lalu pilih **Kirim Pot**.
   - **Blackjack:** pemain memasang taruhan terlebih dahulu. Dealer memilih **Kunci Taruhan & Bagi Kartu**, lalu setelah permainan kartu fisik selesai mencatat hasil tiap pemain. Tombol hasil massal tersedia untuk menyelesaikan semua taruhan dengan hasil yang sama; **Batal** mengembalikan taruhan ronde.
7. Tombol **Reset Semua Chip** tersedia di meja saat ronde tidak sedang berjalan.

### Pemain

<<<<<<< HEAD
1. Masukkan kode room dari dealer, lalu pilih **Gabung Room**.
2. Ubah nama lalu pilih avatar.
3. Buka **Toko Border** untuk membeli border satu warna seharga 5.000 chip atau border dua warna animasi seharga 10.000 chip. Pembelian tersedia di antara ronde dan tersimpan di room. Border sorotan dan profil yang serasi dapat dibeli sebagai bundle dengan diskon 25%. Saat menjadi pemimpin chip, kamu juga dapat memilih gaya RGB gratis atau border toko; gaya tersebut tidak aktif ketika kamu kehilangan posisi pemimpin dan bukan pembelian border.
4. Ikuti permainan sesuai mode:
   - **Poker:** lakukan aksi saat giliranmu, seperti fold, call/check, raise, atau all-in. Jika chipmu habis saat all-in, tunggu sampai showdown dan dealer membagikan pot.
   - **Blackjack:** pilih chip untuk menentukan taruhan sebelum dealer membagikan kartu. Saat ronde berlangsung, gunakan opsi **Double** atau **Split** jika tersedia.
5. Saldo chip, taruhan, dan pembaruan room akan tersinkron otomatis.

Jika koneksi terputus atau tab tertutup, buka kembali situs dengan browser yang sama. Jika room dan sesi masih tersedia, akan muncul pilihan untuk melanjutkan sebagai pemain atau dealer. Pemain kembali dengan saldo sebelumnya; dealer yang kembali mengambil lagi perannya. Sesi tidak dapat dilanjutkan jika room sudah tidak tersedia, misalnya setelah server dimulai ulang.

## Menjalankan secara lokal

1. Pastikan Node.js versi 18 atau lebih baru sudah terpasang.
2. Jalankan `npm install` dari folder project.
3. Jalankan `npm start`.
4. Buka `http://localhost:3000` di browser.

=======
1. Masukkan kode room dari dealer, lalu pilih **Join Room**.
2. Ubah nama lalu pilih avatar.
3. Ikuti permainan sesuai mode:
   - **Poker:** lakukan aksi saat giliranmu, seperti fold, call/check, raise, atau all-in. Jika chipmu habis saat all-in, tunggu sampai showdown dan dealer membagikan pot.
   - **Blackjack:** pilih chip untuk menentukan taruhan sebelum dealer membagikan kartu. Saat ronde berlangsung, gunakan opsi **Double** atau **Split** jika tersedia.
4. Saldo chip, taruhan, dan pembaruan room akan tersinkron otomatis.

Jika koneksi terputus atau tab tertutup, buka kembali situs dengan browser yang sama. Jika room dan sesi masih tersedia, akan muncul pilihan untuk melanjutkan sebagai pemain atau dealer. Pemain kembali dengan saldo sebelumnya; dealer yang kembali mengambil lagi perannya. Sesi tidak dapat dilanjutkan jika room sudah tidak tersedia, misalnya setelah server dimulai ulang.

>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6
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
<<<<<<< HEAD
│   │   ├── images/
│   │   ├── js/
│   │   ├── logo/
│   │   └── sounds/
│   ├── pages/
=======
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
│   │       └── win.mp3
│   ├── pages/
│   │   ├── about.html
│   │   ├── privacy.html
│   │   └── terms.html
>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6
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
<<<<<<< HEAD
- `public/pages/` berisi halaman About, Privacy, dan Terms.
=======
- `public/pages/` berisi halaman About, Privacy, dan Terms; `public/assets/css/legal.css` dan `public/assets/js/legal.js` mendukung halaman-halaman tersebut.
- `public/robots.txt` dan `public/sitemap.xml` menyediakan arahan crawling dan daftar halaman publik untuk mesin pencari.
>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6
- `public/assets/` berisi stylesheet, script browser, QR scanner, gambar, logo, dan suara.
- Script browser dimuat berurutan dari `app/Views/index.html` karena beberapa file menggunakan state dan helper yang didefinisikan oleh file sebelumnya.
- Data room disimpan di memori server, sehingga room yang belum selesai tidak bertahan jika proses server dimulai ulang.

## Kredit

Diinisiasi oleh **Ado, Anoy, Isan, dan Kholid**.

Kode dibuat sepenuhnya dengan menggunakan bantuan AI.

<<<<<<< HEAD
=======
https://canva.link/un0tf2zzl0s5jy0

>>>>>>> e0ddb80f1ad572e0ed9783b4e87343ef82a5a1e6
Situs: https://chips-in-online.onrender.com/ · Repo: https://github.com/MKsafr/chips-in
