      function bjView(me) {
        const bj = st.bj || {};
        let h = `<div class="grid-2">
    <div class="card pot"><div class="mut">Blackjack</div><div class="big">${fmt((st.players || []).reduce((a, p) => a + (p.bjBet || 0) + (p.bjSplitBet || 0), 0))}</div><div class="mut">Total Taruhan</div></div>
    <div class="card"><h3>Feed Terbaru</h3><div class="mut" style="font-weight:bold;color:var(--gold)">${esc(st.lastEvent || "-")}</div></div>
  </div>`;

        const playing = bj.phase === "playing";
        h +=
          `<div class="card"><h3>Daftar Taruhan Pemain</h3>` +
          (st.players || [])
            .map((p) => {
              let ex = "";
              if (
                st.isHost &&
                playing &&
                ((p.bjBet || 0) > 0 || (p.bjSplitBet || 0) > 0)
              ) {
                ex = `<div class="row" style="margin-top:6px">
        <button class="ok s" onclick="api('bjResolve',{id:${p.id},result:'win'})">Menang</button>
        <button class="y s" onclick="api('bjResolve',{id:${p.id},result:'bj'})">BJ 3:2</button>
        <button class="g s" onclick="api('bjResolve',{id:${p.id},result:'push'})">Seri</button>
        <button class="r s" onclick="api('bjResolve',{id:${p.id},result:'lose'})">Kalah</button></div>`;
              }
              return pRow(p, ex);
            })
            .join("") +
          "</div>";

        if (me && me.chips === 0) {
          h += `<div class="card"><div class="mut">Chip kamu habis, tunggu ronde berikutnya atau minta Bandar menambahkan chip.</div></div>`;
        } else if (me && bj.phase === "betting") {
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

        if (me && playing && (me.bjBet || 0) > 0) {
          h += `<div class="card"><h3>Opsi Tambahan</h3>
      <div class="row"><button class="b f" onclick="api('add',{amount:${me.bjBet}})">Double (+${fmt(me.bjBet)})</button>
      <button class="y f" onclick="api('splitBJ')">Split (+${fmt(me.bjBet)})</button></div></div>`;
        }

        return h;
      }
