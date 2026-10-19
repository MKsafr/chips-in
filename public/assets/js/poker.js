      function pokerView(me) {
        const k = st.poker || {};
        let h = `<div class="grid-2">`;

        h += `<div><div class="card pot"><div class="mut">${(k.stage || "IDLE").toUpperCase()}${k.active && k.currentBet ? " • Taruhan saat ini " + fmt(k.currentBet) : ""}</div>
    <div class="big">${fmt(k.pot)}</div><div class="mut">Total Pot</div></div></div>`;

        h += `<div><div class="card"><h3>Feed Terbaru</h3><div class="mut" style="font-weight:bold;color:var(--gold)">${esc(st.lastEvent || "-")}</div></div></div></div>`;

        h += `<div class="card"><h3>Daftar Pemain</h3>${(st.players || []).map((p) => pRow(p)).join("") || '<div class="mut">Belum ada pemain</div>'}</div>`;

        if (me && me.chips === 0) {
          h += `<div class="card"><div class="mut">Chip kamu habis, tunggu ronde berikutnya atau minta Bandar menambahkan chip.</div></div>`;
        } else if (me && k.active && k.turn === me.id) {
          if (!st.dealerConfirmedStage) {
            h += `<div class="card" style="border-color:var(--gold)"><h3>Giliranmu</h3><div class="mut">Tunggu Bandar mengonfirmasi pembukaan kartu ${(k.stage || "").toUpperCase()} di meja fisik...</div></div>`;
          } else {
            const toCall = (k.currentBet || 0) - (me.bet || 0),
              callAmt = Math.min(toCall, me.chips),
              maxTo = me.bet + me.chips,
              minTo = Math.min((k.currentBet || 0) + (k.minRaise || 0), maxTo);
            const canRaise = maxTo > (k.currentBet || 0);
            h += `<div class="card" style="border-color:var(--gold)"><h3>Giliranmu</h3>
        <div class="row"><button class="r f" onclick="api('act',{a:'fold'})">Fold</button>
        <button class="ok f" onclick="api('act',{a:'call'})">${toCall > 0 ? "Call " + fmt(callAmt) : "Check"}</button></div>`;
            if (canRaise) {
              h += `<div class="mut" style="margin:10px 0 4px">Raise ke (Min ${fmt(minTo)})</div>
        <div class="row"><input id="raise" type="number" inputmode="numeric" value="${d("raise", minTo)}" oninput="setD('raise',this.value)">
        <button class="y" onclick="api('act',{a:'raise',amount:num('raise')})">Raise</button></div>
        <div class="row" style="margin-top:6px">
        <button class="g s" onclick="qr(${minTo},0)">Min</button>
        <button class="g s" onclick="qr(0,.5)">½ Pot</button>
        <button class="g s" onclick="qr(0,1)">Pot</button>
        <button class="r s" onclick="api('act',{a:'allin'})">All-in ${fmt(me.chips)}</button></div>`;
            }
            h += "</div>";
          }
        }

        if (k.stage === "showdown") h += showdown();
        return h;
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
        let h = `<div class="card" style="border-color:var(--gold)"><h3>Showdown — Tentukan Pemenang</h3>`;
        (k.layers || []).forEach((l, i) => {
          h += `<div style="margin-top:8px"><b>${i === 0 ? "Pot Utama" : "Side Pot " + i}</b> <span style="color:var(--gold)">(${fmt(l.amount)})</span>`;
          h += l.elig
            .map((id) =>
              st.isHost
                ? `<label style="display:flex;gap:8px;align-items:center;padding:4px 0"><input type="checkbox" ${draft.w[i + "_" + id] ? "checked" : ""} onchange="draft.w['${i}_${id}']=this.checked"> ${nm(id)}</label>`
                : `<div class="mut">• ${nm(id)}</div>`,
            )
            .join("");
          h += "</div>";
        });
        h += st.isHost
          ? `<button class="ok" style="width:100%;margin-top:10px" onclick="doAward()">Kirim Pot</button>`
          : `<div class="mut" style="margin-top:8px">Menunggu Bandar memilih pemenang…</div>`;
        return h + "</div>";
      }

      function doAward() {
        const winners = (st.poker.layers || []).map((l, i) =>
          l.elig.filter((id) => draft.w[i + "_" + id]),
        );
        api("award", { winners });
      }
