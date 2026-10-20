<h1><img src="public/assets/logo/logo-main.png" alt="Chips-in logo" width="48" height="48" align="absmiddle"> Chips-in</h1>

[Bahasa Indonesia](README.md) | [English](README.en.md)

Aplikasi chip digital untuk membantu bermain **Poker** dan **Blackjack** bersama teman. Buat room, bagikan kode kepada pemain, lalu kelola chip dan jalannya ronde dari satu meja bersama.

> **Mainkan Chips-in:** [https://online-poker-chips.onrender.com/](https://online-poker-chips.onrender.com/)

Chips-in menyinkronkan room, pemain, chip, taruhan, dan hasil ronde. Kartu tetap dimainkan secara fisik; aplikasi ini menyediakan pencatatan chip dan kontrol permainan.

## Fitur

- Room terpisah dengan kode unik untuk setiap meja.
- Mode Poker dan Blackjack.
- Saldo chip, taruhan, pot, dan riwayat permainan.
- Panel dealer untuk mengatur meja dan mengelola pemain.
- Pengelolaan pemain: ubah urutan duduk, tambah/kurangi chip, tawarkan peran dealer, dan keluarkan pemain.
- Pemain dapat bergabung menggunakan kode room dan mengatur profil.
- Pemulihan sesi pemain maupun dealer setelah koneksi terputus, selama room dan sesi masih tersedia.
- Bisa dipasang sebagai aplikasi web progresif (PWA) pada browser/perangkat yang mendukung.
- Antarmuka tersedia dalam Bahasa Indonesia dan English, dengan pilihan tema.

## Cara menggunakan

### Dealer

1. Buka [Chips-in](https://online-poker-chips.onrender.com/) dan pilih **Host Room (Buat Meja Baru)**.
2. Ubah nama lalu pilih avatar.
3. Bagikan kode room yang tampil kepada para pemain.
4. Buka **Kontrol Dealer** untuk memilih Poker atau Blackjack, mengatur chip awal, dan—untuk Poker—mengatur Small Blind serta Big Blind.
5. Kelola pemain melalui panel **Kontrol Dealer**: ubah urutan duduk, tambah/kurangi chip, tawarkan peran dealer, atau keluarkan pemain.
6. Aksi ronde dilakukan langsung dari meja:
   - **Poker:** pilih **Mulai Hand Baru**. Saat permainan meminta kartu komunitas dibuka, dealer membuka kartu di meja fisik lalu menekan tombol konfirmasi di meja aplikasi. Pada **Showdown**, pilih nama pemenang untuk setiap pot (termasuk side pot), lalu pilih **Kirim Pot**.
   - **Blackjack:** pemain memasang taruhan terlebih dahulu. Dealer memilih **Kunci Taruhan & Bagi Kartu**, lalu setelah permainan kartu fisik selesai mencatat hasil tiap pemain. Tombol hasil massal tersedia untuk menyelesaikan semua taruhan dengan hasil yang sama; **Batal** mengembalikan taruhan ronde.
7. Tombol **Reset Semua Chip** tersedia di meja saat ronde tidak sedang berjalan.

### Pemain

1. Masukkan kode room dari dealer, lalu pilih **Join Room**.
2. Ubah nama lalu pilih avatar.
3. Ikuti permainan sesuai mode:
   - **Poker:** lakukan aksi saat giliranmu, seperti fold, call/check, raise, atau all-in. Jika chipmu habis saat all-in, tunggu sampai showdown dan dealer membagikan pot.
   - **Blackjack:** pilih chip untuk menentukan taruhan sebelum dealer membagikan kartu. Saat ronde berlangsung, gunakan opsi **Double** atau **Split** jika tersedia.
4. Saldo chip, taruhan, dan pembaruan room akan tersinkron otomatis.

Jika koneksi terputus atau tab tertutup, buka kembali situs dengan browser yang sama. Jika room dan sesi masih tersedia, akan muncul pilihan untuk melanjutkan sebagai pemain atau dealer. Pemain kembali dengan saldo sebelumnya; dealer yang kembali mengambil lagi perannya. Sesi tidak dapat dilanjutkan jika room sudah tidak tersedia, misalnya setelah server dimulai ulang.

## Menjalankan secara lokal

Panduan ini untuk menjalankan server Chips-in di komputer sendiri (localhost).

### 1. Pasang Node.js

Unduh dan pasang **Node.js versi 18 atau lebih baru** dari [nodejs.org](https://nodejs.org/). Installer Node.js juga menyertakan npm, yang digunakan untuk menjalankan aplikasi.

Setelah instalasi selesai, buka terminal baru dan pastikan keduanya tersedia:

```bash
node --version
npm --version
```

Jika perintah belum dikenali, tutup lalu buka kembali terminal atau VS Code setelah memasang Node.js.

### 2. Buka folder project di terminal

Di VS Code, buka folder project `online-poker-chips`, lalu pilih **Terminal → New Terminal**. Pastikan terminal berada di folder yang berisi `package.json`. Jika belum, pindah ke folder tersebut menggunakan `cd`, misalnya:

```powershell
cd "C:\path\ke\online-poker-chips"
```

### 3. Jalankan server

Di terminal, jalankan:

```bash
npm start
```

Saat server berhasil berjalan, terminal akan menampilkan alamat/port server. Biarkan terminal tetap terbuka selama aplikasi digunakan.

### 4. Buka aplikasi

Buka browser dan kunjungi [http://localhost:3000](http://localhost:3000). Alamat `localhost` hanya dapat dibuka dari komputer yang menjalankan server.

Untuk menghentikan server, kembali ke terminal lalu tekan **Ctrl+C**.

### Kendala umum

- **`npm` atau `node` tidak dikenali:** pastikan Node.js 18 atau lebih baru sudah terpasang, lalu buka terminal baru.
- **Port 3000 sudah digunakan:** jalankan server pada port lain. Di PowerShell:

  ```powershell
  $env:PORT=3001
  npm start
  ```

  Kemudian buka [http://localhost:3001](http://localhost:3001).
- **Halaman tidak bisa dibuka:** pastikan proses `npm start` masih berjalan dan periksa pesan error di terminal.

## Struktur project

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
    images/
      poker-felt-pattern.svg
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
      logo-main.png
      logo-small.png
    sounds/
      ...
  manifest.json
  sw.js
server.js
package.json
start.bat
```

- `server.js` adalah entry point aplikasi.
- `app/Controllers/RoomController.js` menangani server HTTP, room, dan logika permainan.
- `app/Views/index.html` adalah halaman utama.
- `public/` berisi stylesheet, script browser, gambar, suara, manifest, dan service worker.
- Script browser dimuat berurutan dari `app/Views/index.html` karena beberapa file menggunakan state dan helper yang didefinisikan oleh file sebelumnya.
- Data room disimpan di memori server, sehingga room yang belum selesai tidak bertahan jika proses server dimulai ulang.

## Kredit

Diinisiasi oleh **Ado, Anoy, Isan, dan Kholid**.

Kode dibuat sepenuhnya dengan menggunakan bantuan AI.
