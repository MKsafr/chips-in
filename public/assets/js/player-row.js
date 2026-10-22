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
