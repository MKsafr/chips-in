# Chips-in

Aplikasi chip digital untuk membantu bermain **Poker** dan **Blackjack** bersama teman. Buat room, bagikan kode kepada pemain, lalu kelola chip dan jalannya ronde dari satu meja bersama.

> **Buka Chips-in:** [https://online-poker-chips.onrender.com/](https://online-poker-chips.onrender.com/)

Chips-in menyinkronkan room, pemain, chip, taruhan, dan hasil ronde. Kartu tetap dimainkan secara fisik; aplikasi ini menyediakan pencatatan chip dan kontrol permainan.

## Fitur

- Room terpisah dengan kode unik untuk setiap meja.
- Mode Poker dan Blackjack.
- Saldo chip, taruhan, pot, dan riwayat permainan.
- Kontrol dealer untuk memulai ronde, mengatur meja, dan mengelola pemain.
- Pemain dapat bergabung menggunakan kode room dan mengatur profil.
- Bisa dipasang sebagai aplikasi web progresif (PWA) pada browser/perangkat yang mendukung.
- Antarmuka tersedia dalam Bahasa Indonesia dan English, dengan pilihan tema.

## Cara menggunakan

### Dealer

1. Buka [Chips-in](https://online-poker-chips.onrender.com/) dan pilih **Host Room (Buat Meja Baru)**.
2. Isi nama dan pilih avatar dealer.
3. Bagikan kode room yang tampil kepada para pemain.
4. Buka **Kontrol Dealer** untuk memilih Poker atau Blackjack dan mengatur chip awal. Untuk Poker, dealer juga dapat mengatur Small Blind dan Big Blind.
5. Kelola pemain dari panel yang sama: ubah urutan tempat duduk, tambahkan atau kurangi chip, tawarkan peran dealer, atau keluarkan pemain.
6. Mulai ronde dari tombol di bawah profil dealer:
   - **Poker:** pilih **Mulai Hand Baru**. Dealer mengonfirmasi pembukaan kartu komunitas ketika diperlukan dan menentukan pemenang pada showdown.
   - **Blackjack:** pemain memasang chip terlebih dahulu, lalu dealer memilih **Kunci Taruhan & Bagi Kartu**. Setelah permainan kartu fisik selesai, catat hasil pemain melalui kontrol Blackjack.

### Pemain

1. Masukkan kode room dari dealer, lalu pilih **Join Room**.
2. Isi nama dan pilih avatar.
3. Ikuti permainan sesuai mode:
   - **Poker:** lakukan aksi saat giliranmu, seperti fold, call/check, raise, atau all-in.
   - **Blackjack:** pilih chip untuk menentukan taruhan sebelum dealer mengunci taruhan. Gunakan opsi tambahan yang tersedia selama ronde bila sesuai.
4. Saldo chip, taruhan, dan pembaruan room akan tersinkron otomatis.

Jika koneksi terputus, buka kembali room di browser dengan sesi yang sama untuk melanjutkan apabila sesi sebelumnya masih tersedia.

## Menjalankan secara lokal

**Persyaratan:** Node.js 18 atau lebih baru.

```bash
npm start
```

Buka [http://localhost:3000](http://localhost:3000). Untuk menggunakan port lain, atur environment variable `PORT` sebelum menjalankan server.

## Struktur project

Susunan folder terinspirasi CodeIgniter 4 dan disesuaikan untuk server Node.js tanpa framework:

```text
app/
  Config/
    paths.js
  Controllers/
    RoomController.js
  Views/
    index.html
public/
  assets/
    css/
      app.css
    js/
      state.js
      sound.js
      room.js
      display.js
      i18n.js
      ui-controls.js
      profile.js
      player-row.js
      poker.js
      blackjack.js
      dealer.js
      app.js
    logo/
    sounds/
  manifest.json
  sw.js
server.js
```

- `server.js` adalah entry point aplikasi.
- `app/Controllers/RoomController.js` menangani server HTTP, room, dan logika permainan.
- `app/Views/index.html` adalah halaman utama.
- `public/` berisi stylesheet, script browser, gambar, suara, manifest, dan service worker.

Script browser dimuat berurutan dari `app/Views/index.html` karena beberapa file menggunakan state dan helper yang didefinisikan oleh file sebelumnya.

## Kredit

Diinisiasi oleh **Ado, Anoy, Isan, dan Kholid**.

Kode dibuat sepenuhnya dengan menggunakan bantuan AI.
