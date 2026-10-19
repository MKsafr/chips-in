      function hostPanel() {
        let h =
          `<div class="card"><h3>Pengaturan Meja</h3>
    <div class="tabs row" style="margin-bottom:8px"><button class="${st.mode === "poker" ? "y" : "g"}" onclick="api('setup',{mode:'poker'})">♠ Poker</button><button class="${st.mode === "blackjack" ? "y" : "g"}" onclick="api('setup',{mode:'blackjack'})">♣ Blackjack</button></div>
    <div class="row"><div style="flex:1"><div class="mut">Chip Awal</div><input id="sc" type="number" value="${d("sc", st.startChips)}" oninput="setD('sc',this.value)"></div>
    ${st.mode === "poker" ? `<div style="flex:1"><div class="mut">Small Blind</div><input id="sb" type="number" value="${d("sb", st.sb)}" oninput="setD('sb',this.value)"></div>
    <div style="flex:1"><div class="mut">Big Blind</div><input id="bb" type="number" value="${d("bb", st.bb)}" oninput="setD('bb',this.value)"></div>` : ""}</div>
    <button class="ok" style="width:100%;margin-top:8px" onclick="api('setup',{startChips:num('sc'),${st.mode === "poker" ? "sb:num('sb'),bb:num('bb')" : ""}})">Simpan Pengaturan</button></div>
    
    <div class="card"><h3>Kelola Pemain</h3>` +
          ((st.players || []).length
            ? st.players
            .map(
              (
                p, index,
              ) => `<div class="manage-player">
      <div class="manage-player-summary">${avatar(p.avatar, 34)}<div class="manage-player-identity"><b data-player-name>${esc(p.name)}</b><span class="manage-player-chips">${fmt(p.chips)} chip</span></div></div>
      <div class="manage-player-actions manage-player-actions-primary">
      <button class="g s" aria-label="Naikkan pemain" ${index === 0 ? "disabled" : ""} onclick="movePlayer(${p.id},-1)">↑</button>
      <button class="g s" aria-label="Turunkan pemain" ${index === st.players.length - 1 ? "disabled" : ""} onclick="movePlayer(${p.id},1)">↓</button>
      <button class="g s" onclick="if(confirm(translateText('Tawarkan peran Bandar ke ${esc(p.name)}? Dia harus menyetujui dulu.')))api('transferHost',{targetId:${p.id}})">Tawarkan Bandar</button>
      </div><div class="manage-player-actions manage-player-actions-secondary">
      <button class="ok s" onclick="openChipAdjustment(${p.id},1)">+ Chip</button>
      <button class="r s" onclick="openChipAdjustment(${p.id},-1)">- Chip</button>
      <button class="r s" aria-label="Keluarkan ${esc(p.name)}" onclick="if(confirm(translateText('Keluarkan ${esc(p.name)}?')))api('kick',{id:${p.id}})">✕</button></div></div>`,
            )
            .join("")
            : `<div class="mut">${translateText("Belum ada pemain yang join, sebarkan kode room agar mereka bisa bergabung.")}</div>`) +
          `</div>`;
        return h;
      }
      function movePlayer(id, offset) {
        const order = (st.players || []).map((p) => p.id);
        const index = order.indexOf(id);
        const target = index + offset;
        if (index < 0 || target < 0 || target >= order.length) return;
        [order[index], order[target]] = [order[target], order[index]];
        api("reorderPlayers", { newOrder: order });
      }
      function roundStartControl() {
        if (!st.isHost) return "";
        const roundActive =
          st.mode === "poker"
            ? st.poker && st.poker.active
            : st.bj.phase === "playing";
        if (roundActive) return "";

        let h = "";
        if (st.mode === "poker" && st.poker && !st.poker.active)
          h += `<button class="y" style="width:100%;margin-bottom:10px;padding:14px" onclick="api('start')">▶ Mulai Hand Baru</button>`;
        if (st.mode === "blackjack" && st.bj.phase !== "playing") {
          const hasBets = (st.players || []).some((p) => p.bjBet > 0);
          h += `<button class="y" style="width:100%;margin-bottom:10px;padding:14px" ${hasBets ? "" : "disabled"} onclick="api('bjDeal')">▶ Kunci Taruhan & Bagi Kartu</button>`;
        }
        h += `<button class="g s" style="width:100%;margin-bottom:10px" onclick="if(confirm(translateText('Reset semua chip?')))api('resetAll')">Reset Semua Chip</button>`;
        return h;
      }
