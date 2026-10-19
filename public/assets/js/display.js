      const d = (k, def) => (draft[k] !== undefined ? draft[k] : def);
      const setD = (k, v) => {
        draft[k] = v;
      };
      const num = (id) => Math.floor(+($("#" + id) || {}).value || 0);

      // Logo utama dipakai di halaman; logo kecil khusus ikon tab dan layar utama.
      let logoOk = false;
      (function () {
        const im = new Image();
        im.onload = () => {
          logoOk = true;
          render();
        };
        im.onerror = () => {
          logoOk = false;
        };
        im.src = "/assets/logo/logo-main.png";
      })();
      function logoHTML(size) {
        size = size || 34;
        return logoOk
          ? `<img class="logo-pic" src="/assets/logo/logo-main.png" alt="Chips-in" style="width:${size}px;height:${size}px">`
          : `<span class="logo-ph" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.6)}px">♠</span>`;
      }

      function syncThemeColor() {
        const m = document.querySelector("meta[name=theme-color]");
        if (m)
          m.content =
            getComputedStyle(document.documentElement)
              .getPropertyValue("--bg")
              .trim() || "#0a1a13";
      }
      function translateText(text) {
        if (currentLanguage !== "en") return text;
        const trimmed = text.trim().replace(/\s+/g, " ");
        if (!trimmed) return text;
        let translated = EN_TEXT[trimmed];
        if (!translated) {
          translated = translateEvent(trimmed);
        }
        if (!translated) return text;
        const start = text.match(/^\s*/)[0];
        const end = text.match(/\s*$/)[0];
        return start + translated + end;
      }
      function translateEvent(text) {
        const directTranslation = EN_TEXT[text];
        if (directTranslation) return directTranslation;
        let match = text.match(/^\[(\d{2}[:.]\d{2})\]\s*(.*)$/);
        if (match) return `[${match[1]}] ${translateEvent(match[2])}`;
        match = text.match(/^([A-Z]+) • Taruhan saat ini (.+)$/);
        if (match) return `${match[1]} • Current bet ${match[2]}`;
        match = text.match(/^Raise ke \(Min ([^)]+)\)$/);
        if (match) return `Raise to (Min ${match[1]})`;
        match = text.match(/^Side Pot (\d+)$/);
        if (match) return `Side Pot ${match[1]}`;
        match = text.match(/^(.+) MENANG KASINO!$/);
        if (match) return `${match[1]} WINS THE GAME!`;
        match = text.match(
          /^(.+) sekarang menjadi Bandar(?: • Bandar sebelumnya duduk sebagai (.+))?$/,
        );
        if (match)
          return `${match[1]} is now the dealer${match[2] ? ` • The previous dealer is now seated as ${match[2]}` : ""}`;
        match = text.match(
          /^Menjadi satu-satunya pemenang yang menguasai semua chip!$/,
        );
        if (match) return "Is now the only player with all the chips!";
        match = text.match(
          /^Minta Bandar mengisi chip kamu untuk bermain kembali\.$/,
        );
        if (match) return "Ask the dealer to add chips so you can play again.";
        match = text.match(
          /^Hand baru dimulai • Dealer: (.+) • Blind (\d+)\/(\d+)$/,
        );
        if (match)
          return `New hand started • Dealer: ${match[1]} • Blinds ${match[2]}/${match[3]}`;
        if (text.includes(" • "))
          return text.split(" • ").map(translateEvent).join(" • ");
        match = text.match(
          /^Menunggu Bandar menampilkan kartu (.+) di meja fisik\.$/,
        );
        if (match) return `Waiting for dealer to reveal the ${match[1]} cards.`;
        match = text.match(/^Bandar telah mengonfirmasi pembukaan kartu (.+)$/);
        if (match) return `Dealer confirmed the ${match[1]} cards.`;
        match = text.match(/^(.+) join meja$/);
        if (match) return `${match[1]} joined the table`;
        match = text.match(/^(.+) telah meninggalkan meja$/);
        if (match) return `${match[1]} left the table`;
        match = text.match(/^(.+) Fold$/);
        if (match) return `${match[1]} folded`;
        match = text.match(/^(.+) Call (\d+)( \(ALL-IN\))?$/);
        if (match) return `${match[1]} called ${match[2]}${match[3] || ""}`;
        match = text.match(/^(.+) Check$/);
        if (match) return `${match[1]} checked`;
        match = text.match(/^(.+) (Raise ke|ALL-IN ke) (\d+)$/);
        if (match)
          return `${match[1]} ${match[2] === "Raise ke" ? "raised to" : "went all-in to"} ${match[3]}`;
        match = text.match(
          /^(Pot Utama|Side Pot \d+) \((\d+)\) dikirim ke: (.+)$/,
        );
        if (match)
          return `${match[1] === "Pot Utama" ? "Main Pot" : match[1]} (${match[2]}) awarded to: ${match[3]}`;
        match = text.match(/^(.+) menang (\d+) chip \(semua pemain fold\)$/);
        if (match)
          return `${match[1]} won ${match[2]} chips (everyone folded)`;
        match = text.match(
          /^(.+): (WIN|BJ|PUSH|LOSE) \(Menerima (\d+) chip\)$/,
        );
        if (match)
          return `${match[1]}: ${match[2]} (Received ${match[3]} chips)`;
        match = text.match(/^(.+) memasang taruhan ([\d.,]+)$/);
        if (match) return `${match[1]} placed a bet of ${match[2]}`;
        match = text.match(/^(.+) mengubah taruhan menjadi ([\d.,]+)$/);
        if (match) return `${match[1]} changed their bet to ${match[2]}`;
        match = text.match(/^(.+) Double taruhan \+(\d+)$/);
        if (match) return `${match[1]} doubled their bet (+${match[2]})`;
        match = text.match(/^(.+) Melakukan SPLIT \(\+(\d+) chip\)$/);
        if (match) return `${match[1]} split (+${match[2]} chips)`;
        match = text.match(
          /^Bandar menawarkan peran Bandar ke (.+)\. Menunggu persetujuan…$/,
        );
        if (match)
          return `Dealer offered the role to ${match[1]}. Waiting for their response…`;
        match = text.match(/^Tawaran Bandar ke (.+) kedaluwarsa$/);
        if (match) return `Dealer offer to ${match[1]} expired`;
        match = text.match(/^(.+) menolak peran Bandar$/);
        if (match) return `${match[1]} declined the dealer role`;
        match = text.match(/^(.+) dikeluarkan oleh Bandar$/);
        if (match) return `${match[1]} was removed by the dealer`;
        match = text.match(/^Bandar (menambah|mengurangi) (\d+) chip untuk (.+)$/);
        if (match)
          return `Dealer ${match[1] === "menambah" ? "added" : "removed"} ${match[2]} chips ${match[1] === "menambah" ? "for" : "from"} ${match[3]}`;
        match = text.match(/^Mode game diubah ke (.+)$/);
        if (match) return `Game mode changed to ${match[1]}`;
        match = text.match(/^(.+) membuat room sebagai Bandar$/);
        if (match) return `${match[1]} created a room as Dealer`;
        match = text.match(
          /^Ronde dibatalkan karena pergantian Bandar\. Semua chip dikembalikan$/,
        );
        if (match)
          return "Round cancelled because the dealer changed. All chips were returned";
        match = text.match(
          /^Bandar mengubah urutan tempat duduk pemain$|^Bandar merubah urutan tempat duduk pemain$/,
        );
        if (match) return "Dealer changed the player seating order";
        match = text.match(/^Tawaran Bandar dibatalkan$/);
        if (match) return "Dealer offer cancelled";
        match = text.match(/^Menunggu Bandar (.+)$/);
        if (match) return `Waiting for the dealer ${match[1]}`;
        match = text.match(/^Minimal raise ke (\d+)$/);
        if (match) return `Minimum raise to ${match[1]}`;
        match = text.match(/^Semua pemain fold$/);
        if (match) return "Everyone folded";
        match = text.match(/^Bandar terputus\. Mencari Bandar baru secara otomatis…$/);
        if (match)
          return "Dealer disconnected. Automatically finding a new dealer…";
        match = text.match(/^Tawarkan peran Bandar ke (.+)\? Dia harus menyetujui dulu\.$/);
        if (match)
          return `Offer the dealer role to ${match[1]}? They must accept first.`;
        match = text.match(/^Keluarkan (.+)\?$/);
        if (match) return `Remove ${match[1]}?`;
        match = text.match(/^Small Blind menjadi (\d+)$/);
        if (match) return `Small Blind set to ${match[1]}`;
        match = text.match(/^Big Blind menjadi (\d+)$/);
        if (match) return `Big Blind set to ${match[1]}`;
        match = text.match(/^Chip Awal menjadi (\d+)$/);
        if (match) return `Starting Chips set to ${match[1]}`;
        return text;
      }

      syncThemeColor();
