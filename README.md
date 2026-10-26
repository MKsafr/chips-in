<p align="center">
  <img src="public/assets/logo/logo-main.png" alt="Logo Chips-in" width="120">
</p>

<h1 align="center">Chips-in</h1>

<p align="center">
  Aplikasi chip digital untuk bermain <strong>Poker</strong> dan <strong>Blackjack</strong> bersama teman.
  Buat room, bagikan kodenya, dan kelola permainan dari satu meja bersama.
</p>

<p align="center">
  <a href="https://chips-in-online.onrender.com/"><strong>Mainkan Chips-in</strong></a>
  &nbsp;·&nbsp;
  <a href="README.en.md">English</a> ·
  <a href="https://github.com/MKsafr/chips-in">GitHub</a>
</p>

Chips-in menyinkronkan room, pemain, chip, taruhan, dan hasil ronde. Kartu tetap dimainkan secara fisik; aplikasi ini menyediakan pencatatan chip dan kontrol permainan.

Versi aplikasi saat ini: **3.9** (versi klien/server, terpisah dari versi paket Node.js).

## Daftar isi

- [Fitur](#fitur)
- [Cara menggunakan](#cara-menggunakan)
- [Menjalankan secara lokal](#menjalankan-secara-lokal)
- [Struktur project](#struktur-project)
- [Kredit](#kredit)

## Fitur

- Room terpisah dengan kode unik untuk setiap meja.
- Mode Poker dan Blackjack.
- Saldo chip, taruhan, pot, dan riwayat permainan.
- Toko border dengan kategori border satu warna seharga 5.000 chip dan border dua warna animasi seharga 10.000 chip.
- Border dapat dibeli untuk sorotan pemain dan avatar profil secara terpisah, atau dibeli sebagai bundle serasi dengan diskon 25%.
- Border sorotan ditampilkan dalam bentuk persegi, sedangkan preview border profil berbentuk lingkaran.
- Pemimpin chip unik dapat menggunakan gaya RGB gratis atau memilih border toko saat memimpin. Gaya pemimpin tidak memberikan kepemilikan border.
- Pemimpin chip unik dapat membuka semua gaya trial non-RGB seharga 5.000 chip. Pembukaan trial tersimpan pada pemain, tetapi gaya pilihannya hanya aktif saat ia memimpin.
- Antarmuka toko border tersedia dalam Bahasa Indonesia dan English, termasuk kategori untuk gaya pemimpin, border profil, dan bundle.
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

1. Buka [Chips-in](https://chips-in-online.onrender.com/) dan pilih **Buat Ruangan**.
2. Ubah nama lalu pilih avatar.
3. Bagikan kode room yang tampil kepada para pemain.
4. Buka **Kontrol Dealer** untuk memilih Poker atau Blackjack, mengatur chip awal, dan—untuk Poker—mengatur Small Blind serta Big Blind.
5. Kelola pemain melalui panel **Kontrol Dealer**: ubah urutan duduk, tambah/kurangi chip, tawarkan peran dealer, atau keluarkan pemain.
6. Aksi ronde dilakukan langsung dari meja:
   - **Poker:** pilih **Mulai Hand Baru**. Saat permainan meminta kartu komunitas dibuka, dealer membuka kartu di meja fisik lalu menekan tombol konfirmasi di meja aplikasi. Pada **Showdown**, pilih nama pemenang untuk setiap pot (termasuk side pot), lalu pilih **Kirim Pot**.
   - **Blackjack:** pemain memasang taruhan terlebih dahulu. Dealer memilih **Kunci Taruhan & Bagi Kartu**, lalu setelah permainan kartu fisik selesai mencatat hasil tiap pemain. Tombol hasil massal tersedia untuk menyelesaikan semua taruhan dengan hasil yang sama; **Batal** mengembalikan taruhan ronde.
7. Tombol **Reset Semua Chip** tersedia di meja saat ronde tidak sedang berjalan.

### Pemain

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
│   │   ├── images/
│   │   ├── js/
│   │   ├── logo/
│   │   └── sounds/
│   ├── pages/
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
- `public/pages/` berisi halaman About, Privacy, dan Terms.
- `public/assets/` berisi stylesheet, script browser, QR scanner, gambar, logo, dan suara.
- Script browser dimuat berurutan dari `app/Views/index.html` karena beberapa file menggunakan state dan helper yang didefinisikan oleh file sebelumnya.
- Data room disimpan di memori server, sehingga room yang belum selesai tidak bertahan jika proses server dimulai ulang.

## Kredit

Diinisiasi oleh **Ado, Anoy, Isan, dan Kholid**.

Kode dibuat sepenuhnya dengan menggunakan bantuan AI.

Situs: https://chips-in-online.onrender.com/ · Repo: https://github.com/MKsafr/chips-in
