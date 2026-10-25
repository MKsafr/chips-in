function pokerView(me) {
  const k = st.poker || {};
  const uniqueLeaderId = getUniqueChipLeader(st.players || [], true);
  let h = `<div class="grid-2">`;

  const stageLabel =
    k.stage === "idle" || !k.stage
      ? translateText("Belum Dimulai")
      : k.stage.toUpperCase();
  h += `<div><div class="card pot"><div class="mut">${stageLabel}${k.active && k.currentBet ? " • Taruhan saat ini " + fmt(k.currentBet) : ""}</div>
    <div class="big">${fmt(k.pot)}</div><div class="mut">${translateText("Jumlah Pot")}</div>
    <button class="y s poker-guide-trigger" onclick="openPokerHandGuide()">🃏 ${translateText("Panduan Hand Poker")}</button></div></div>`;

  h += `<div><div class="card"><h3>Feed Terbaru</h3><div class="latest-feed-message">${esc(st.lastEvent || "-")}</div></div></div></div>`;

  if (
    st.isHost &&
    k.active &&
    !st.dealerConfirmedStage &&
    k.stage !== "showdown"
  ) {
    const stage = (k.stage || "").toUpperCase();
    h += `<div class="card" style="border-color:var(--gold)"><h3>Aksi Bandar</h3>
      <div class="mut" style="margin-bottom:8px">${translateText("Buka kartu")} <b>${stage}</b> ${translateText("di meja fisik, lalu tekan tombol di bawah ini agar pemain bisa bertaruh.")}</div>
      <button class="y" style="width:100%" onclick="api('confirmDealerStage')">${translateText("Tampilkan Kartu")} ${stage}</button></div>`;
  }

  if (k.active) h += roundStartControl();

  const spotlightPlayer =
    (st.players || []).find((player) => player.id === k.turn) ||
    me ||
    (st.players || [])[0];
  h += playerSpotlight(
    spotlightPlayer,
    "poker",
    spotlightPlayer?.id === uniqueLeaderId,
  );

  if (me && me.chips === 0) {
    h += `<div class="card"><div class="mut">Chip kamu habis, tunggu ronde berikutnya atau minta Bandar menambahkan chip.</div></div>`;
  } else if (me && k.active && k.turn === me.id) {
    if (!st.dealerConfirmedStage) {
      h += `<div class="card" style="border-color:var(--gold)"><h3>Giliranmu</h3><div class="mut">${translateText("Tunggu Bandar mengonfirmasi pembukaan kartu")} ${(k.stage || "").toUpperCase()} ${translateText("di meja fisik...")}</div></div>`;
    } else {
      const toCall = (k.currentBet || 0) - (me.bet || 0),
        callAmt = Math.min(toCall, me.chips),
        maxTo = me.bet + me.chips,
        minTo = Math.min((k.currentBet || 0) + (k.minRaise || 0), maxTo);
      const canRaise = maxTo > (k.currentBet || 0);
      h += `<div class="card" style="border-color:var(--gold)"><h3>Giliranmu</h3>
        <div class="row"><button class="r f" onclick="api('act',{a:'fold'})">Fold</button>
        <button class="ok f" onclick="pokerCall()">${toCall > 0 ? "Call " + fmt(callAmt) : "Check"}</button></div>`;
      if (canRaise) {
        h += `<div class="mut" style="margin:10px 0 4px">Raise ke (Min ${fmt(minTo)})</div>
        <div class="row"><input id="raise" type="number" inputmode="numeric" value="${d("raise", minTo)}" oninput="setD('raise',this.value)">
        <button class="y" onclick="pokerRaise()">Raise</button></div>
        <div class="row" style="margin-top:6px">
        <button class="g s" onclick="qr(${minTo},0)">Min</button>
        <button class="g s" onclick="qr(0,.5)">½ Pot</button>
        <button class="g s" onclick="qr(0,1)">Pot</button>
        <button class="r s" onclick="askAllInConfirmation('poker',${me.chips})">All-in ${fmt(me.chips)}</button></div>`;
      }
      h += "</div>";
    }
  }

  h += `<div class="card"><h3>Daftar Pemain</h3>${(st.players || []).map((p) => pRow(p, "", null, p.id === uniqueLeaderId)).join("") || '<div class="mut">Belum ada pemain</div>'}</div>`;

  if (k.stage === "showdown") h += showdown();
  if (!k.active) {
    h += roundStartControl();
    h += resetAllControl();
  }
  return h;
}

function openPokerHandGuide() {
  const hands = [
    {
      name: "High Card",
      description: "Tidak ada kombinasi di atas; nilai kartu tertinggi yang menentukan.",
      cards: ["A♠", "J♥", "8♦", "5♣", "2♠"],
    },
    {
      name: "One Pair",
      description: "Sepasang kartu dengan angka yang sama, ditambah tiga kartu lain.",
      cards: ["10♠", "10♥", "K♦", "7♣", "2♠"],
    },
    {
      name: "Two Pair",
      description: "Dua pasang kartu dengan angka yang sama, ditambah satu kartu lain.",
      cards: ["J♠", "J♥", "4♦", "4♣", "A♠"],
    },
    {
      name: "Three of a Kind",
      description: "Tiga kartu dengan angka yang sama, ditambah dua kartu lain.",
      cards: ["Q♠", "Q♥", "Q♦", "8♣", "3♥"],
    },
    {
      name: "Straight",
      description: "Lima kartu berurutan dengan simbol yang berbeda-beda.",
      cards: ["9♠", "8♥", "7♦", "6♣", "5♠"],
    },
    {
      name: "Flush",
      description: "Lima kartu dengan simbol yang sama, tidak harus berurutan.",
      cards: ["A♣", "J♣", "8♣", "4♣", "2♣"],
    },
    {
      name: "Full House",
      description: "Tiga kartu dengan angka yang sama dan sepasang kartu dengan angka yang sama.",
      cards: ["K♠", "K♥", "K♦", "7♣", "7♥"],
    },
    {
      name: "Four of a Kind",
      description: "Empat kartu dengan angka yang sama, ditambah satu kartu lain.",
      cards: ["A♠", "A♥", "A♦", "A♣", "9♠"],
    },
    {
      name: "Straight Flush",
      description: "Lima kartu berurutan dengan simbol yang sama.",
      cards: ["9♥", "8♥", "7♥", "6♥", "5♥"],
    },
    {
      name: "Royal Flush",
      description: "Lima kartu berurutan dari 10 sampai As dengan simbol yang sama.",
      cards: ["A♠", "K♠", "Q♠", "J♠", "10♠"],
    },
  ];
  const suitNames = { "♠": "sekop", "♥": "hati", "♦": "wajik", "♣": "keriting" };
  const handMarkup = hands
    .map(
      ({ name, description, cards }, index) => `
        <article class="poker-hand-guide-item">
          <div class="poker-hand-guide-heading">
            <span class="poker-hand-guide-rank">${index + 1}</span>
            <h3>${translateText(name)}</h3>
          </div>
          <div class="poker-hand-guide-cards" aria-label="${translateText("Contoh kartu")}">
            ${cards
              .map((card) => {
                const rank = card.slice(0, -1);
                const suit = card.slice(-1);
                const color = suit === "♥" || suit === "♦" ? "red" : "black";
                return `<span class="poker-playing-card ${color}" aria-label="${rank} ${translateText(suitNames[suit])}"><span>${rank}</span><span>${suit}</span></span>`;
              })
              .join("")}
          </div>
          <p>${translateText(description)}</p>
        </article>`,
    )
    .join("");
  $("#modal").innerHTML = `
    <div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closePokerHandGuide)">
      <div class="mbox poker-hand-guide-modal" role="dialog" aria-modal="true" aria-labelledby="pokerHandGuideTitle">
        <div class="row sp poker-hand-guide-title">
          <h2 id="pokerHandGuideTitle">${translateText("Urutan Hand Poker")}</h2>
          <button class="g s" aria-label="${translateText("Tutup")}" onclick="closePokerHandGuide()">×</button>
        </div>
        <p class="mut poker-hand-guide-intro">${translateText("Menangkan pot dengan membuat semua pemain lain fold atau bertahan hingga showdown dengan kombinasi lima kartu terkuat. Berikut urutan hand dari yang terendah hingga tertinggi.")}</p>
        <div class="poker-hand-guide-list">${handMarkup}</div>
      </div>
    </div>`;
  localizeTree($("#modal"));
  if (pokerHandGuideKeyHandler)
    document.removeEventListener("keydown", pokerHandGuideKeyHandler);
  pokerHandGuideKeyHandler = (event) => {
    if (event.key === "Escape") closePokerHandGuide();
  };
  document.addEventListener("keydown", pokerHandGuideKeyHandler);
  $("#modal .poker-hand-guide-title button")?.focus();
}

let pokerHandGuideKeyHandler = null;

function closePokerHandGuide() {
  if (pokerHandGuideKeyHandler) {
    document.removeEventListener("keydown", pokerHandGuideKeyHandler);
    pokerHandGuideKeyHandler = null;
  }
  $("#modal").innerHTML = "";
}

function pokerCall() {
  const me = (st.players || []).find((p) => p.id === st.you);
  const callAmount = Math.min(
    (st.poker.currentBet || 0) - (me?.bet || 0),
    me?.chips || 0,
  );
  if (callAmount > 0 && callAmount === me.chips) {
    askAllInConfirmation("poker", me.chips);
    return;
  }
  api("act", { a: "call" });
}

function pokerRaise() {
  const me = (st.players || []).find((p) => p.id === st.you);
  if (me && num("raise") >= me.bet + me.chips) {
    askAllInConfirmation("poker", me.chips);
    return;
  }
  api("act", { a: "raise", amount: num("raise") });
}

function qr(minTo, frac) {
  const k = st.poker || {},
    me = (st.players || []).find((p) => p.id === st.you) || {},
    maxTo = (me.bet || 0) + (me.chips || 0),
    toCall = (k.currentBet || 0) - (me.bet || 0);
  let v = frac
    ? (k.currentBet || 0) + Math.round(((k.pot || 0) + toCall) * frac)
    : minTo;
  v = Math.max(
    Math.min((k.currentBet || 0) + (k.minRaise || 0), maxTo),
    Math.min(v, maxTo),
  );
  draft.raise = v;
  render();
}

function showdown() {
  const k = st.poker || {},
    nm = (id) => {
      const p = (st.players || []).find((x) => x.id === id);
      return p ? esc(p.name) : "Pemain";
    };
  let h = `<div class="card showdown-card" style="border-color:var(--gold)"><h3>Showdown — Tentukan Pemenang</h3>`;
  (k.layers || []).forEach((l, i) => {
    h += `<div class="showdown-pot"><div class="showdown-pot-title"><b>${i === 0 ? "Pot Utama" : "Side Pot " + i}</b><span>${fmt(l.amount)}</span></div>`;
    h += st.isHost
      ? `<div class="winner-options">${l.elig
          .map((id) => {
            const selected = !!draft.w[i + "_" + id];
            return `<button type="button" class="winner-choice ${selected ? "selected" : ""}" aria-pressed="${selected}" onclick="toggleWinner(${i},${id})">${nm(id)}</button>`;
          })
          .join("")}</div>`
      : l.elig.map((id) => `<div class="mut">• ${nm(id)}</div>`).join("");
    h += "</div>";
  });
  h += st.isHost
    ? `<button class="ok" style="width:100%;margin-top:10px" onclick="doAward()">Kirim Pot</button>`
    : `<div class="mut" style="margin-top:8px">Menunggu Bandar memilih pemenang…</div>`;
  return h + "</div>";
}

function toggleWinner(layer, id) {
  const key = layer + "_" + id;
  draft.w[key] = !draft.w[key];
  render();
}

function doAward() {
  const winners = (st.poker.layers || []).map((l, i) =>
    l.elig.filter((id) => draft.w[i + "_" + id]),
  );
  api("award", { winners });
}
