# Panduan Testing — Chips-in

Dokumen ini menjelaskan cara menyiapkan, menjalankan, dan menulis test otomatis (Playwright) untuk Chips-in di perangkat masing-masing.

## 1. Prasyarat

- **Node.js >= 18** (disarankan versi 22).
- **Google Chrome** terpasang. Test memakai Chrome bawaan sistem (`channel: "chrome"`), jadi **tidak perlu mengunduh browser Playwright**.
- Koneksi internet hanya dibutuhkan saat `npm install` pertama.

## 2. Setup sekali saja

```powershell
npm install
```

Jika proses instalasi mencoba mengunduh browser Playwright, hentikan dan jalankan ulang dengan:

```powershell
$env:PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD='1'
npm install
```

## 3. Menjalankan aplikasi secara manual

```powershell
npm start
```

Buka `http://localhost:3000`.

## 4. Menjalankan test otomatis

```powershell
npm run test:e2e            # headless (tanpa jendela)
npm run test:e2e:headed     # dengan jendela Chrome, bisa dilihat
npm run test:e2e:ui         # mode debug interaktif
```

Menjalankan satu file:

```powershell
npx playwright test tests/e2e/smoke.spec.js
npx playwright test tests/e2e/poker.spec.js --headed
```

Catatan penting:

- Test otomatis menyalakan server sendiri di **port 3100** (bukan 3000), lalu mematikannya. Sesi manual di `localhost:3000` tidak terganggu.
- Chrome dijalankan dengan **profil sementara**, sehingga bookmark/login pribadi tidak tersentuh.
- Exit code `0` berarti semua lulus; selain `0` berarti ada kegagalan.
- Laporan HTML: buka `playwright-report/index.html` (atau jalankan `npx playwright show-report`).
- Screenshot/trace saat gagal: folder `test-results/`.

## 5. Struktur test

```text
tests/e2e/
  helpers.js        # helper bersama (buat host, join pemain, baca saldo, dll.)
  smoke.spec.js     # lobby, lazy loading, aset audio
  room.spec.js      # multiplayer, sinkronisasi SSE, ganti mode
  store.spec.js     # toko border/musik, preview audio
  poker.spec.js     # hand penuh, side pot, cancel
  blackjack.spec.js # hasil, double, split, all-in, cancel
  chips.spec.js     # adjust, reset, transfer, reorder, kick, host
  session.spec.js   # refresh, reconnect, validasi kode room
```

Test yang direncanakan/ditambahkan bertahap:

```text
tests/e2e/
  borders.spec.js
  music.spec.js
  qr.spec.js
  profile-i18n.spec.js
  legal.spec.js
  responsive.spec.js
```

## 6. Konvensi menulis test

1. **Satu skenario = satu context** (`browser.newContext()`), selalu tutup context di akhir test.
2. **Pin bahasa** ke `id` agar teks UI stabil:
   ```js
   await context.addInitScript(() => {
     localStorage.cb_language = "id";
   });
   ```
3. **Auto-accept dialog** `confirm()`:
   ```js
   page.on("dialog", (dialog) => dialog.accept());
   ```
4. Utamakan selector stabil:
   - `data-testid="..."` untuk tombol/kontrol penting.
   - `data-player-name` / `data-player-id` untuk elemen pemain.
   - Hindari selector berbasis teks yang mudah berubah.
5. Gunakan `expect.poll` untuk data yang datang lewat SSE:
   ```js
   await expect.poll(() =>
     page.evaluate(() => st?.players?.find((p) => p.name === "Budi")?.chips),
   ).toBe(1010);
   ```
6. Jangan mengandalkan urutan test. Setiap test harus berdiri sendiri.
7. Setelah mengubah kode JS, jalankan `node --check <file>` sebelum test.

## 7. Cakupan test saat ini

| Fitur | File | Status |
|---|---|---|
| Lobby tampil + tombol Buat Ruangan | `smoke.spec.js` | Ada |
| Lazy-load Help & QR Scanner | `smoke.spec.js` | Ada |
| Aset audio MVP (`ltg.mp3`, `tracks.json`) | `smoke.spec.js` | Ada |
| Host buat room + pemain join via SSE | `room.spec.js` | Ada |
| Ganti mode ke Blackjack | `room.spec.js` | Ada |
| Toko border default + tab musik | `store.spec.js` | Ada |
| Preview musik play/stop | `store.spec.js` | Ada |
| Poker: hand penuh, side pot, cancel | `poker.spec.js` | Ada |
| Blackjack: menang/seri/kalah/BJ/double/split/all/cancel | `blackjack.spec.js` | Ada |
| Kelola chip: adjust, reset, transfer, reorder, kick, transfer host | `chips.spec.js` | Ada |
| Sesi: refresh/reconnect, validasi kode room | `session.spec.js` | Ada |
| Border: beli/equip/persist/bundle/leader | `borders.spec.js` | Ada |
| Musik: beli + MVP diputar saat menang | `music.spec.js` | Ada |
| QR room + scanner fallback | `qr.spec.js` | Ada |
| Profil, bahasa, tema, volume | `profile-i18n.spec.js` | Ada |
| Halaman legal | `legal.spec.js` | Ada |
| Viewport mobile | `responsive.spec.js` | Ada |

Catatan cakupan:

- Modal resume hanya muncul setelah sesi benar-benar terputus melewati grace period server (2 menit). Test sesi memakai refresh/reopen cepat (reconnect ke kursi yang sama) agar suite tetap cepat.
- Reorder pemain diuji lewat API `reorderPlayers` sebagai fallback drag; urutan state dan tampilan tetap diverifikasi.

## 8. Troubleshooting

| Masalah | Solusi |
|---|---|
| "Chrome tidak ditemukan" | Pastikan Google Chrome terpasang, atau ubah `channel` di `playwright.config.js`. |
| Error versi Playwright/Chrome | `npm i -D @playwright/test@latest` lalu ulangi. |
| Port 3100 bentrok | Set `E2E_PORT` atau ubah port di `playwright.config.js`. |
| Test gagal karena audio | Normal di headless; test hanya memeriksa state audio, bukan suara fisik. |
| Test flaky | Jalankan ulang dengan `npm run test:e2e:headed`, lihat langkah gagal di laporan HTML. |
| Ingin melihat trace | `npx playwright show-trace test-results/<folder>/trace.zip` |
| Server test tidak berhenti | Pastikan tidak ada proses `node server.js` lain di port 3100. |

## 9. Catatan git

- File test, konfigurasi, dan `TESTING.md` **di-commit** ke repository.
- `node_modules/`, `test-results/`, `playwright-report/`, `blob-report/`, `.playwright/`, dan `.env` **tidak** di-commit.
- `AGENTS.md` bersifat lokal (aturan AI) dan tidak di-commit.
