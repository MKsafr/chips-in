function bjView(me) {
  const bj = st.bj || {},
    players = st.players || [],
    uniqueLeaderId = getUniqueChipLeader(players, false);
  let h = `<div class="grid-2">
    <div class="card pot"><div class="mut">Blackjack</div><div class="big" data-testid="bj-total-bet">${fmt((st.players || []).reduce((a, p) => a + (p.bjBet || 0) + (p.bjSplitBet || 0), 0))}</div><div class="mut">Total Taruhan</div>
    <button class="y s poker-guide-trigger" onclick="openBlackjackGuide()">🃏 ${translateText("Panduan Blackjack")}</button></div>
    <div class="card"><h3>Feed Terbaru</h3><div class="latest-feed-message">${esc(st.lastEvent || "-")}</div></div>
  </div>`;

  const playing = bj.phase === "playing";
  const dealerTurn = bj.dealerTurn;
  const dealerTurnPlayer = dealerTurn
    ? players.find((player) => player.id === dealerTurn.id)
    : null;
  const dealerTurnAmount =
    dealerTurnPlayer &&
    (dealerTurn.betSlot === "main"
      ? dealerTurnPlayer.bjBet
      : dealerTurnPlayer.bjSplitBet);
  const spotlightPlayer =
    (playing && dealerTurnPlayer) ||
    players.find((player) => player.id === uniqueLeaderId) ||
    players.find((player) => player.id === st.you) ||
    players.find((player) => player.bjBet || player.bjSplitBet) ||
    players[0];
  let dealerActions = "";
  if (st.isHost && playing) {
    if (dealerTurnPlayer && dealerTurnAmount > 0) {
      const betLabel =
        dealerTurn.betSlot === "split"
          ? "Bet 2"
          : dealerTurnPlayer.bjSplitBet
            ? "Bet 1"
            : "Taruhan";
      const canBlackjack =
        dealerTurn.betSlot === "main" &&
        !dealerTurnPlayer.bjHasSplit &&
        !dealerTurnPlayer.bjDoubled;
      dealerActions = `<div class="player-spotlight-actions" data-testid="bj-dealer-turn">
        <div class="player-spotlight-heading"><span>${translateText("Giliran Bandar")}</span><span>${esc(dealerTurnPlayer.name)} · ${translateText(betLabel)}: ${fmt(dealerTurnAmount)}</span></div>
        <div class="bj-dealer-controls">
          <button class="ok s" data-testid="bj-resolve-win" onclick="api('bjResolve',{id:${dealerTurnPlayer.id},betSlot:'${dealerTurn.betSlot}',result:'win'})">${translateText("Menang")}</button>
          ${canBlackjack ? `<button class="y s" data-testid="bj-resolve-bj" onclick="api('bjResolve',{id:${dealerTurnPlayer.id},betSlot:'${dealerTurn.betSlot}',result:'bj'})">${translateText("BJ 3:2")}</button>` : ""}
          <button class="g s" data-testid="bj-resolve-push" onclick="api('bjResolve',{id:${dealerTurnPlayer.id},betSlot:'${dealerTurn.betSlot}',result:'push'})">${translateText("Seri")}</button>
          <button class="r s" data-testid="bj-resolve-lose" onclick="api('bjResolve',{id:${dealerTurnPlayer.id},betSlot:'${dealerTurn.betSlot}',result:'lose'})">${translateText("Kalah")}</button>
        </div>
      </div>`;
    } else {
      dealerActions = `<div class="player-spotlight-actions"><div class="mut">${translateText("Semua taruhan sudah mendapat giliran.")}</div></div>`;
    }
  }
  h += playerSpotlight(
    spotlightPlayer,
    "blackjack",
    spotlightPlayer?.id === uniqueLeaderId,
    dealerActions,
  );
  if (st.isHost && playing) {
    h += `<div class="card"><h3>Kontrol Blackjack</h3><div class="bj-dealer-controls">
      <button class="ok" data-testid="bj-all-win" onclick="api('bjAll',{result:'win'})">Semua Menang</button>
      <button class="g" data-testid="bj-all-push" onclick="api('bjAll',{result:'push'})">Semua Seri</button>
      <button class="r" data-testid="bj-all-lose" onclick="api('bjAll',{result:'lose'})">Semua Kalah</button>
    </div></div>`;
  }
  h += `<div class="card"><h3>Daftar Pemain</h3>${players.map((p) => pRow(p, "", null, p.id === uniqueLeaderId)).join("") || '<div class="mut">Belum ada pemain</div>'}</div>`;
  h += roundStartControl();
  h += resetAllControl();

  if (me && me.chips > 0 && bj.phase === "betting") {
    const maxCustomBet = me.chips + (me.bjBet || 0);
    const minCustomBet = Math.min(100, maxCustomBet);
    h +=
      `<div class="card"><h3>${translateText("Taruhanmu:")} ${fmt(me.bjBet)}</h3><div class="chips">` +
      [5, 10, 25, 100, 500, 1000]
        .map(
          (v) =>
            `<button class="chip c${v}" data-testid="bj-bet-${v}" onclick="placeBlackjackBet(${(me.bjBet || 0) + v})">${v}</button>`,
        )
        .join("") +
      `<button class="chip callin" data-testid="bj-bet-allin" onclick="askAllInConfirmation('blackjack',${(me.chips || 0) + (me.bjBet || 0)})">ALL IN</button>
      <div class="bj-custom-bet">
        <output id="bjCustomBetValue" for="bjCustomBet">${fmt(minCustomBet)}</output>
        <input id="bjCustomBet" data-testid="bj-bet-custom" type="range" min="${minCustomBet}" max="${maxCustomBet}" step="1" value="${minCustomBet}" aria-label="${translateText("Jumlah taruhan")}" oninput="updateBlackjackBetAmount(this.value)">
        <button class="y s" data-testid="bj-bet-place" onclick="placeSelectedBlackjackBet()">${translateText("Masukkan")}</button>
      </div>` +
      `</div><div class="row"><button class="g f" data-testid="bj-bet-reset" onclick="placeBlackjackBet(0)">Reset</button>
      ${me.last ? `<button class="g f" onclick="placeBlackjackBet(${me.last})">${translateText("Ulang")} (${fmt(me.last)})</button>` : ""}</div></div>`;
  }

  if (
    me &&
    playing &&
    (me.bjBet || 0) > 0 &&
    (!me.bjDoubled || !me.bjSplitBet)
  ) {
    h += `<div class="card"><h3>Opsi Tambahan</h3>
      <div class="row">${me.bjDoubled ? "" : `<button class="b f" data-testid="bj-double" onclick="api('add',{amount:${me.bjBet}})">Double (+${fmt(me.bjBet)})</button>`}
      ${me.bjSplitBet || me.bjDoubled ? "" : `<button class="y f" data-testid="bj-split" onclick="api('splitBJ')">Split (+${fmt(me.bjBet)})</button>`}</div></div>`;
  }

  return h;
}

function updateBlackjackBetAmount(value) {
  const slider = $("#bjCustomBet");
  if (!slider) return;
  const maxAmount = Number(slider.max);
  const minAmount = Number(slider.min);
  const rawAmount = Math.max(minAmount, Math.min(Number(value), maxAmount));
  const amount =
    rawAmount >= maxAmount - 50
      ? maxAmount
      : Math.max(minAmount, Math.round(rawAmount / 100) * 100);
  slider.value = String(amount);
  const output = $("#bjCustomBetValue");
  if (output) output.textContent = fmt(amount);
}

function placeSelectedBlackjackBet() {
  const slider = $("#bjCustomBet");
  const amount = Number(slider?.value);
  if (
    Number.isSafeInteger(amount) &&
    amount >= Number(slider?.min) &&
    amount <= Number(slider?.max)
  )
    placeBlackjackBet(amount);
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
