function bjView(me) {
  const bj = st.bj || {},
    players = st.players || [],
    uniqueLeaderId = getUniqueChipLeader(players, false),
    bettingPlayers = players.filter(
      (p) => (p.bjBet || 0) > 0 || (p.bjSplitBet || 0) > 0,
    );
  let h = `<div class="grid-2">
    <div class="card pot"><div class="mut">Blackjack</div><div class="big">${fmt((st.players || []).reduce((a, p) => a + (p.bjBet || 0) + (p.bjSplitBet || 0), 0))}</div><div class="mut">Total Taruhan</div>
    <button class="y s poker-guide-trigger" onclick="openBlackjackGuide()">🃏 ${translateText("Panduan Blackjack")}</button></div>
    <div class="card"><h3>Feed Terbaru</h3><div class="latest-feed-message">${esc(st.lastEvent || "-")}</div></div>
  </div>`;

  const playing = bj.phase === "playing";
  h += `<div class="card"><h3>Daftar Pemain</h3>${players.map((p) => pRow(p, "", null, p.id === uniqueLeaderId)).join("") || '<div class="mut">Belum ada pemain</div>'}</div>`;
  h += roundStartControl();
  h += resetAllControl();
  h += `<div class="card"><h3>Daftar Taruhan Pemain</h3>`;
  if (!players.length) {
    h += `<div class="mut">Belum ada pemain</div>`;
  } else if (!bettingPlayers.length) {
    h += `<div class="mut">Pemain belum memberikan taruhan</div>`;
  } else {
    h += bettingPlayers
      .flatMap((p) => {
        const hands = [
          p.bjBet > 0
            ? {
                label: p.bjSplitBet > 0 ? "Bet 1" : "",
                amount: p.bjBet,
                betSlot: "main",
              }
            : null,
          p.bjSplitBet > 0
            ? { label: "Bet 2", amount: p.bjSplitBet, betSlot: "split" }
            : null,
        ].filter(Boolean);
        return hands.map((hand) => {
          const ex =
            st.isHost && playing
              ? `<div class="row bj-result-actions" style="margin-top:6px">
        <button class="ok s" onclick="api('bjResolve',{id:${p.id},betSlot:'${hand.betSlot}',result:'win'})">Menang</button>
        ${p.bjHasSplit || p.bjDoubled ? "" : `<button class="y s" onclick="api('bjResolve',{id:${p.id},betSlot:'${hand.betSlot}',result:'bj'})">BJ 3:2</button>`}
        <button class="g s" onclick="api('bjResolve',{id:${p.id},betSlot:'${hand.betSlot}',result:'push'})">Seri</button>
        <button class="r s" onclick="api('bjResolve',{id:${p.id},betSlot:'${hand.betSlot}',result:'lose'})">Kalah</button></div>`
              : "";
          return pRow(p, ex, hand, p.id === uniqueLeaderId);
        });
      })
      .join("");
  }
  h += "</div>";

  if (me && me.chips > 0 && bj.phase === "betting") {
    h +=
      `<div class="card"><h3>${translateText("Taruhanmu:")} ${fmt(me.bjBet)}</h3><div class="chips">` +
      [5, 10, 25, 100, 500]
        .map(
          (v) =>
            `<button class="chip c${v}" onclick="placeBlackjackBet(${(me.bjBet || 0) + v})">${v}</button>`,
        )
        .join("") +
      `<button class="chip callin" onclick="askAllInConfirmation('blackjack',${(me.chips || 0) + (me.bjBet || 0)})">ALL IN</button>` +
      `</div><div class="row"><button class="g f" onclick="placeBlackjackBet(0)">Reset</button>
      ${me.last ? `<button class="g f" onclick="placeBlackjackBet(${me.last})">${translateText("Ulang")} (${fmt(me.last)})</button>` : ""}</div></div>`;
  }

  if (
    me &&
    playing &&
    (me.bjBet || 0) > 0 &&
    (!me.bjDoubled || !me.bjSplitBet)
  ) {
    h += `<div class="card"><h3>Opsi Tambahan</h3>
      <div class="row">${me.bjDoubled ? "" : `<button class="b f" onclick="api('add',{amount:${me.bjBet}})">Double (+${fmt(me.bjBet)})</button>`}
      ${me.bjSplitBet || me.bjDoubled ? "" : `<button class="y f" onclick="api('splitBJ')">Split (+${fmt(me.bjBet)})</button>`}</div></div>`;
  }

  if (st.isHost && playing) {
    h += `<div class="card"><h3>Kontrol Blackjack</h3><div class="bj-dealer-controls">
      <button class="ok" onclick="api('bjAll',{result:'win'})">Semua Menang</button>
      <button class="g" onclick="api('bjAll',{result:'push'})">Semua Seri</button>
      <button class="r" onclick="api('bjAll',{result:'lose'})">Semua Kalah</button>
    </div></div>`;
  }

  return h;
}

function openBlackjackGuide() {
  const sections = [
    {
      title: "Tujuan permainan",
      text: "Dapatkan nilai kartu lebih tinggi dari bandar tanpa melewati 21. Kamu juga menang jika bandar melewati 21 sementara nilaimu tidak.",
    },
    {
      title: "Nilai kartu dan hand",
      text: "Kartu 2–10 bernilai sesuai angkanya; J, Q, dan K bernilai 10. As bernilai 1 atau 11, pilih nilai yang tidak membuat total melewati 21 jika memungkinkan. Hand adalah total nilai kartu yang kamu pegang.",
      example: ["A♠", "K♥"],
      exampleText: "Contoh: As + King = Blackjack natural (21 dari dua kartu).",
    },
    {
      title: "Menang, kalah, seri, dan bust",
      text: "Jika totalmu melewati 21, kamu bust dan kalah. Jika tidak bust, bandingkan total dengan bandar: lebih tinggi menang, lebih rendah kalah, dan sama berarti seri (push, taruhan kembali).",
    },
    {
      title: "Blackjack natural",
      text: "Blackjack adalah 21 dari dua kartu pertama: satu As dan satu kartu bernilai 10. Dalam aturan umum, payout-nya 3:2. Tiga kartu atau lebih yang totalnya 21 bukan Blackjack natural.",
      example: ["A♦", "Q♣"],
      exampleText: "Contoh natural: As + Queen. Aplikasi mencatat hasil yang dipilih bandar; kartu tidak diperiksa otomatis.",
    },
    {
      title: "Hit dan stand",
      text: "Hit berarti mengambil kartu tambahan; stand berarti berhenti mengambil kartu. Tentukan aksi pada kartu fisik bersama bandar—aplikasi ini hanya mencatat taruhan dan hasil.",
    },
    {
      title: "Double",
      text: "Double berarti menambah taruhan sebesar taruhan awal, lalu mengambil satu kartu terakhir. Umumnya dilakukan pada dua kartu awal. Di aplikasi, opsi Double menambahkan taruhan yang sama; Split tidak dapat dilakukan setelah Double.",
    },
    {
      title: "Split",
      text: "Jika dua kartu awal memiliki nilai yang sama, aturan umum mengizinkan kartu itu dipisah menjadi dua hand dengan taruhan tambahan yang sama. Mainkan dan tentukan hasil tiap hand secara terpisah. Aplikasi mendukung satu Split per ronde; Split memerlukan chip yang cukup dan tidak dapat dilakukan setelah Double. Blackjack pada hand hasil Split tidak mendapat payout natural 3:2.",
    },
    {
      title: "Taruhan dan payout di aplikasi",
      text: "Taruhan dipasang sebelum kartu dibagikan. Hasil Menang mengembalikan total 2× taruhan (termasuk taruhan awal), push mengembalikan 1×, dan kalah mengembalikan 0. Hasil BJ membayar total 2,5× taruhan, dibulatkan ke chip terdekat. Bandar mencatat hasil secara manual.",
    },
  ];
  const suits = { "♠": "sekop", "♥": "hati", "♦": "wajik", "♣": "keriting" };
  const sectionsMarkup = sections
    .map(
      ({ title, text, example, exampleText }, index) => `
        <article class="poker-hand-guide-item">
          <div class="poker-hand-guide-heading">
            <span class="poker-hand-guide-rank">${index + 1}</span>
            <h3>${translateText(title)}</h3>
          </div>
          <p>${translateText(text)}</p>
          ${
            example
              ? `<div class="poker-hand-guide-cards" aria-label="${translateText("Contoh kartu")}">
                  ${example
                    .map((card) => {
                      const rank = card.slice(0, -1);
                      const suit = card.slice(-1);
                      const color =
                        suit === "♥" || suit === "♦" ? "red" : "black";
                      return `<span class="poker-playing-card ${color}" aria-label="${rank} ${translateText(suits[suit])}"><span>${rank}</span><span>${suit}</span></span>`;
                    })
                    .join("")}
                </div><p>${translateText(exampleText)}</p>`
              : ""
          }
        </article>`,
    )
    .join("");
  $("#modal").innerHTML = `
    <div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeBlackjackGuide)">
      <div class="mbox poker-hand-guide-modal" role="dialog" aria-modal="true" aria-labelledby="blackjackGuideTitle">
        <div class="row sp poker-hand-guide-title">
          <h2 id="blackjackGuideTitle">${translateText("Panduan Blackjack")}</h2>
          <button class="g s" aria-label="${translateText("Tutup")}" onclick="closeBlackjackGuide()">×</button>
        </div>
        <p class="mut poker-hand-guide-intro">${translateText("Ringkasan aturan umum Blackjack. Aturan meja dapat berbeda; kartu dimainkan secara fisik dan hasil di aplikasi dicatat manual oleh bandar.")}</p>
        <div class="poker-hand-guide-list">${sectionsMarkup}</div>
      </div>
    </div>`;
  localizeTree($("#modal"));
  if (blackjackGuideKeyHandler)
    document.removeEventListener("keydown", blackjackGuideKeyHandler);
  blackjackGuideKeyHandler = (event) => {
    if (event.key === "Escape") closeBlackjackGuide();
  };
  document.addEventListener("keydown", blackjackGuideKeyHandler);
  $("#modal .poker-hand-guide-title button")?.focus();
}

let blackjackGuideKeyHandler = null;

function closeBlackjackGuide() {
  if (blackjackGuideKeyHandler) {
    document.removeEventListener("keydown", blackjackGuideKeyHandler);
    blackjackGuideKeyHandler = null;
  }
  $("#modal").innerHTML = "";
}

function placeBlackjackBet(amount) {
  const me = (st.players || []).find((p) => p.id === st.you);
  if (!me) return;
  const allInAmount = me.chips + (me.bjBet || 0);
  const targetAmount = Math.min(amount, allInAmount);
  if (me.chips > 0 && targetAmount === allInAmount) {
    askAllInConfirmation("blackjack", targetAmount);
    return;
  }
  api("bet", { amount: targetAmount });
}
