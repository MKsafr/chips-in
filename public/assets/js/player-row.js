      function getUniqueChipLeader(players, isPoker) {
        let leaderId = null;
        let maxChips = 0;
        let hasTie = false;
        for (const player of players) {
          const total =
            (player.chips || 0) +
            (isPoker
              ? player.contrib || 0
              : (player.bjBet || 0) + (player.bjSplitBet || 0));
          if (total > maxChips) {
            leaderId = player.id;
            maxChips = total;
            hasTie = false;
          } else if (total === maxChips && total > 0) {
            hasTie = true;
          }
        }
        return hasTie ? null : leaderId;
      }

      function playerSpotlight(
        player,
        game,
        fireLeader = false,
        extraContent = "",
      ) {
        if (!player) return "";
        const isPoker = game === "poker";
        const hasPokerTurn = isPoker && st.poker?.active && st.poker.turn === player.id;
        const bet = isPoker
          ? player.bet || 0
          : (player.bjBet || 0) + (player.bjSplitBet || 0);
        const heading = isPoker
          ? st.poker?.active
            ? "Giliran pemain"
            : "Pemain di meja"
          : "Sorotan Blackjack";
        const status = hasPokerTurn ? "Sedang mendapat giliran" : "Sorotan di meja";
        const betDetails =
          !isPoker && player.bjSplitBet
            ? `<span>${translateText("Bet 1")}: ${fmt(player.bjBet)}</span><span>${translateText("Bet 2")}: ${fmt(player.bjSplitBet)}</span>`
            : "";

        return `<section class="player-spotlight ${fireLeader ? "pl-fire-leader" : ""}" aria-label="${translateText("Pemain yang sedang disorot")}">
    <div class="player-spotlight-heading"><span>${translateText(heading)}</span><span>${translateText(isPoker ? "Poker" : "Blackjack")}</span></div>
    <div class="player-spotlight-identity">${avatar(player.avatar, 56)}<div class="player-spotlight-name"><b data-player-name>${esc(player.name)}</b><div class="mut">${translateText(status)}</div></div></div>
    <div class="player-spotlight-stats">
      <div class="player-spotlight-stat"><span>${translateText("Total Taruhan")}</span><b>${fmt(bet)}</b>${betDetails}</div>
      <div class="player-spotlight-stat"><span>${translateText("Chip Tersisa")}</span><b>${fmt(player.chips)}</b></div>
    </div>
    ${extraContent}
  </section>`;
      }

      function pRow(p, extra = "", blackjackHand = null, fireLeader = false) {
        if (!p) return "";
        const k = st.poker || {},
          pk = st.mode === "poker";
        const t = [];
        if (pk && k.active && k.dealer === p.id)
          t.push('<span class="tag d">D</span>');
        if (pk && k.active && k.sbId === p.id)
          t.push('<span class="tag">SB</span>');
        if (pk && k.active && k.bbId === p.id)
          t.push('<span class="tag">BB</span>');
        if (p.folded) t.push('<span class="tag">FOLD</span>');
        if (p.allin) t.push('<span class="tag a">ALL-IN</span>');
        if (pk && k.turn === p.id) t.push('<span class="tag t">GILIRAN</span>');

        const bet = pk
          ? p.bet
            ? `<div class="mut">bet ${fmt(p.bet)}</div>`
            : ""
          : blackjackHand
            ? `<div class="mut">${blackjackHand.label ? `${blackjackHand.label}: ` : ""}${fmt(blackjackHand.amount)}</div>`
            : p.bjBet || p.bjSplitBet
            ? `<div class="mut">${p.bjSplitBet ? `${p.bjBet ? `Bet 1: ${fmt(p.bjBet)}<br>` : ""}Bet 2: ${fmt(p.bjSplitBet)}` : fmt(p.bjBet)}</div>`
            : "";
        const out = pk && k.active && (!p.inHand || p.folded);
        const name = `${esc(p.name)}${blackjackHand && blackjackHand.label ? ` (${blackjackHand.label})` : ""}`;
        return `<div class="pl ${k.turn === p.id && pk ? "turn" : ""} ${out ? "out" : ""} ${p.id === st.you ? "me" : ""} ${fireLeader ? "pl-fire-leader" : ""}">
    <div class="row" style="flex-wrap:nowrap;gap:8px;align-items:flex-start">${avatar(p.avatar, 32)}<div><b data-player-name>${name}</b>${t.join("")}${extra}</div></div>
    <div style="text-align:right">${blackjackHand ? "" : `<b style="color:var(--gold)">${fmt(p.chips)}</b>`}${bet}</div></div>`;
      }
