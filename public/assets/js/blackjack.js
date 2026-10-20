      function bjView(me) {
        const bj = st.bj || {},
          players = st.players || [],
          bettingPlayers = players.filter(
            (p) => (p.bjBet || 0) > 0 || (p.bjSplitBet || 0) > 0,
          );
        let h = `<div class="grid-2">
    <div class="card pot"><div class="mut">Blackjack</div><div class="big">${fmt((st.players || []).reduce((a, p) => a + (p.bjBet || 0) + (p.bjSplitBet || 0), 0))}</div><div class="mut">Total Taruhan</div></div>
    <div class="card"><h3>Feed Terbaru</h3><div class="mut" style="font-weight:bold;color:var(--gold)">${esc(st.lastEvent || "-")}</div></div>
  </div>`;

        const playing = bj.phase === "playing";
        h += `<div class="card"><h3>Daftar Pemain</h3>${players.map((p) => pRow(p)).join("") || '<div class="mut">Belum ada pemain</div>'}</div>`;
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
                const ex = st.isHost && playing
                  ? `<div class="row bj-result-actions" style="margin-top:6px">
        <button class="ok s" onclick="api('bjResolve',{id:${p.id},betSlot:'${hand.betSlot}',result:'win'})">Menang</button>
        <button class="y s" onclick="api('bjResolve',{id:${p.id},betSlot:'${hand.betSlot}',result:'bj'})">BJ 3:2</button>
        <button class="g s" onclick="api('bjResolve',{id:${p.id},betSlot:'${hand.betSlot}',result:'push'})">Seri</button>
        <button class="r s" onclick="api('bjResolve',{id:${p.id},betSlot:'${hand.betSlot}',result:'lose'})">Kalah</button></div>`
                    : "";
                return pRow(p, ex, hand);
              });
            })
            .join("");
        }
        h += "</div>";

        if (me && me.chips > 0 && bj.phase === "betting") {
          h +=
            `<div class="card"><h3>Taruhanmu: ${fmt(me.bjBet)}</h3><div class="chips">` +
            [5, 10, 25, 100, 500]
              .map(
                (v) =>
                  `<button class="chip c${v}" onclick="api('bet',{amount:${(me.bjBet || 0) + v}})">${v}</button>`,
              )
              .join("") +
            `<button class="chip callin" onclick="api('bet',{amount:${(me.chips || 0) + (me.bjBet || 0)}})">ALL IN</button>` +
            `</div><div class="row"><button class="g f" onclick="api('bet',{amount:0})">Reset</button>
      ${me.last ? `<button class="g f" onclick="api('bet',{amount:${me.last}})">Ulang (${fmt(me.last)})</button>` : ""}</div></div>`;
        }

        if (
          me &&
          playing &&
          (me.bjBet || 0) > 0 &&
          (!me.bjDoubled || !me.bjSplitBet)
        ) {
          h += `<div class="card"><h3>Opsi Tambahan</h3>
      <div class="row">${me.bjDoubled ? "" : `<button class="b f" onclick="api('add',{amount:${me.bjBet}})">Double (+${fmt(me.bjBet)})</button>`}
      ${me.bjSplitBet ? "" : `<button class="y f" onclick="api('splitBJ')">Split (+${fmt(me.bjBet)})</button>`}</div></div>`;
        }

        if (st.isHost && playing) {
          h += `<div class="card"><h3>Kontrol Blackjack</h3><div class="bj-dealer-controls">
      <button class="ok" onclick="api('bjAll',{result:'win'})">Semua Menang</button>
      <button class="g" onclick="api('bjAll',{result:'push'})">Semua Seri</button>
      <button class="r" onclick="api('bjAll',{result:'lose'})">Semua Kalah</button>
      <button class="g" onclick="if(confirm(translateText('Batalkan ronde?')))api('bjCancel')">Batal</button>
    </div></div>`;
        }

        return h;
      }
