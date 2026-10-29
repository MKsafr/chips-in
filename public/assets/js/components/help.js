// Lazy-loaded: Help & FAQ modal (Phase 2 component split)
// Real implementations. Invoked by the openHelp() wrapper in ui-controls.js.

function openHelpModal() {
  setModalContent(
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeHelp)"><div class="mbox help-modal" role="dialog" aria-modal="true" aria-labelledby="helpTitle">
    <div class="row sp"><h2 id="helpTitle">${translateText("Bantuan dan FAQ")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeHelp()">×</button></div>
    <section class="help-section">
      <h3>${translateText("Pertanyaan Umum")}</h3>
      <details><summary>${translateText("Bagaimana cara membuat atau bergabung ke room?")}</summary><p>${translateText("Pilih Buat Ruangan untuk menjadi Bandar, atau masukkan kode room dari Bandar lalu pilih Gabung Room. Kamu juga bisa memindai QR room.")}</p></details>
      <details><summary>${translateText("Apakah kartu dimainkan di aplikasi?")}</summary><p>${translateText("Tidak. Kartu dimainkan secara fisik. Aplikasi membantu mencatat pemain, chip, taruhan, pot, dan hasil permainan.")}</p></details>
      <details><summary>${translateText("Bagaimana cara kerja chip?")}</summary><p>${translateText("Chip hanya untuk mencatat permainan sosial. Chip tidak memiliki nilai uang, tidak dapat dibeli, dan tidak dapat dicairkan.")}</p></details>
      <details><summary>${translateText("Pengaturan suara saya tidak tersimpan di perangkat lain, kenapa?")}</summary><p>${translateText("Pengaturan suara disimpan di browser dan perangkat yang kamu gunakan, jadi tidak otomatis dibagikan ke perangkat lain.")}</p></details>
      <details><summary>${translateText("Apa yang harus dilakukan jika koneksi terputus?")}</summary><p>${translateText("Kembali ke tab Chips-in dan tunggu browser menyambungkan ulang. Sesi room dapat dipulihkan selama room masih tersedia.")}</p></details>
    </section>
    <section class="help-section">
      <h3>${translateText("Laporkan Bug")}</h3>
      <p class="mut">${translateText("Isi judul dan langkah untuk mengulangi masalah. Kamu akan diarahkan ke GitHub untuk meninjau dan mengirim laporan.")}</p>
      <form class="bug-report-form" action="https://github.com/MKsafr/chips-in/issues/new" method="get" target="_blank" onsubmit="prepareBugReport(event)">
        <label>${translateText("Judul masalah")}<input name="title" maxlength="120" required placeholder="${translateText("Contoh: Suara tidak bisa diatur di Safari")}"></label>
        <label>${translateText("Langkah atau keterangan")}<textarea name="body" maxlength="4000" required placeholder="${translateText("Apa yang kamu lakukan, apa yang terjadi, dan apa yang seharusnya terjadi?")}"></textarea></label>
        <p class="mut">${translateText("GitHub akan menampilkan laporan secara publik. Login dan tekan Submit new issue untuk mengirim. Jangan sertakan kata sandi atau informasi pribadi.")}</p>
        <button class="ok" type="submit">${translateText("Lanjutkan ke GitHub")}</button>
      </form>
    </section>
  </div></div>`,
  );
}

function closeHelp() {
  $("#modal").innerHTML = "";
}

function prepareBugReport(event) {
  const form = event.currentTarget;
  if (form.dataset.metadataAdded) return;
  const details = form.elements.body.value.trim();
  form.elements.body.value =
    `${details}\n\n---\nApp version: ${APP_VER}\nLanguage: ${currentLanguage}`;
  form.dataset.metadataAdded = "true";
}
