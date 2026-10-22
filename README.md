<p align="center">
  <img src="public/assets/logo/logo-main.png" alt="Logo Chips-in" width="120">
</p>

<h1 align="center">Chips-in</h1>

<p align="center">
  Aplikasi chip digital untuk bermain <strong>Poker</strong> dan <strong>Blackjack</strong> bersama teman.
  Buat room, bagikan kodenya, dan kelola permainan dari satu meja bersama.
</p>

<p align="center">
  <a href="https://online-poker-chips.onrender.com/"><strong> Mainkan Chips-in </strong></a>
  &nbsp;·&nbsp;
  <a href="README.en.md">English</a>
</p>

Chips-in menyinkronkan room, pemain, chip, taruhan, dan hasil ronde. Kartu tetap dimainkan secara fisik; aplikasi ini menyediakan pencatatan chip dan kontrol permainan.

## Daftar isi

- [Fitur](#fitur)
- [Cara menggunakan](#cara-menggunakan)
- [Struktur project](#struktur-project)
- [Kredit](#kredit)

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

## Struktur project

```text
app/
  Config/paths.js
  Controllers/RoomController.js
  Views/index.html
public/
  assets/
    css/app.css
    images/poker-felt-pattern.svg
    js/
      app.js
      blackjack.js
      dealer.js
      display.js
      html5-qrcode.min.js
      i18n.js
      player-row.js
      poker.js
      profile.js
      room.js
      sound.js
      state.js
      ui-controls.js
    logo/
      logo-main.png
      logo-small.png
    sounds/*.mp3
  manifest.json
  sw.js
server.js
package.json
package-lock.json
start.bat
```

- `server.js` adalah entry point aplikasi.
- `app/Controllers/RoomController.js` menangani server HTTP, room, dan logika permainan.
- `app/Views/index.html` adalah halaman utama.
- `public/` berisi stylesheet, script browser, QR scanner, gambar, suara, manifest, dan service worker.
- Script browser dimuat berurutan dari `app/Views/index.html` karena beberapa file menggunakan state dan helper yang didefinisikan oleh file sebelumnya.
- Data room disimpan di memori server, sehingga room yang belum selesai tidak bertahan jika proses server dimulai ulang.

## Kredit

Diinisiasi oleh **Ado, Anoy, Isan, dan Kholid**.

Kode dibuat sepenuhnya dengan menggunakan bantuan AI.

https://canva.link/un0tf2zzl0s5jy0
