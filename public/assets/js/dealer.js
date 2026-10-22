function hostPanel() {
  const orderLocked = st.poker.active || st.bj.phase === "playing";
  let h =
    `<div class="card"><h3>Pengaturan Meja</h3>
    <div class="tabs row" style="margin-bottom:8px"><button class="${st.mode === "poker" ? "y" : "g"}" onclick="changeGameMode('poker')">♠ Poker</button><button class="${st.mode === "blackjack" ? "y" : "g"}" onclick="changeGameMode('blackjack')">♣ Blackjack</button></div>
    <div class="row"><div style="flex:1"><div class="mut">Chip Awal</div><input id="sc" type="number" value="${d("sc", st.startChips)}" oninput="setD('sc',this.value)"></div>
    ${
      st.mode === "poker"
        ? `<div style="flex:1"><div class="mut">Small Blind</div><input id="sb" type="number" value="${d("sb", st.sb)}" oninput="setD('sb',this.value)"></div>
    <div style="flex:1"><div class="mut">Big Blind</div><input id="bb" type="number" value="${d("bb", st.bb)}" oninput="setD('bb',this.value)"></div>`
        : ""
    }</div>
    <button class="ok" style="width:100%;margin-top:8px" onclick="api('setup',{startChips:num('sc'),${st.mode === "poker" ? "sb:num('sb'),bb:num('bb')" : ""}})">Simpan Pengaturan</button></div>
    
    <div class="card"><h3>Kelola Pemain</h3>` +
    ((st.players || []).length
      ? st.players
          .map(
            (p) => `<div class="manage-player" data-player-id="${p.id}">
          <div class="manage-player-summary"><button class="g manage-player-drag-handle" aria-label="${translateText("Seret untuk memindahkan")} ${esc(p.name)}" title="${translateText("Seret untuk memindahkan")}" ${orderLocked ? "disabled" : ""} onpointerdown="startPlayerDrag(event,${p.id})"><svg viewBox="0 0 16 24" aria-hidden="true"><circle cx="5" cy="5" r="1.5"/><circle cx="11" cy="5" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="11" cy="12" r="1.5"/><circle cx="5" cy="19" r="1.5"/><circle cx="11" cy="19" r="1.5"/></svg></button>${avatar(p.avatar, 34)}<div class="manage-player-identity"><b data-player-name>${esc(p.name)}</b><span class="manage-player-chips">${fmtChips(p.chips)}</span></div></div>
      <div class="manage-player-actions manage-player-actions-primary">
      <button class="g s" onclick="if(confirm(translateText('Tawarkan peran Bandar ke ${esc(p.name)}? Dia harus menyetujui dulu.')))api('transferHost',{targetId:${p.id}})">${translateText("Tawarkan sebagai dealer")}</button>
      <button class="g s" aria-label="${translateText("Keluarkan pemain")} ${esc(p.name)}" onclick="if(confirm(translateText('Keluarkan ${esc(p.name)}?')))api('kick',{id:${p.id}})">${translateText("Keluarkan pemain")}</button>
      </div><div class="manage-player-actions manage-player-actions-secondary">
      <button class="ok s" onclick="openChipAdjustment(${p.id},1)">${translateText("Tambah Chip")}</button>
      <button class="r s" onclick="openChipAdjustment(${p.id},-1)">${translateText("Kurangi Chip")}</button>
      </div></div>`,
          )
          .join("")
      : `<div class="mut">${translateText("Belum ada pemain yang join, sebarkan kode room agar mereka bisa bergabung.")}</div>`) +
    `</div>`;
  return h;
}
function changeGameMode(mode) {
  const hasBlackjackBets = (st.players || []).some(
    (player) => player.bjBet || player.bjSplitBet,
  );
  if (
    mode === "poker" &&
    st.mode === "blackjack" &&
    hasBlackjackBets
  ) {
    const message = translateText(
      "Pindah ke Poker? Taruhan Blackjack yang belum dikunci akan dibatalkan dan chip dikembalikan.",
    );
    if (!confirm(message))
      return;
    api("setup", { mode, cancelBlackjackBets: true });
    return;
  }
  api("setup", { mode });
}
let playerDragState = null;

function startPlayerDrag(event, id) {
  if (
    (event.button !== undefined && event.button !== 0) ||
    !st.isHost ||
    st.poker.active ||
    st.bj.phase === "playing" ||
    playerDragState
  )
    return;
  const row = event.currentTarget.closest(".manage-player");
  if (!row) return;
  event.preventDefault();
  playerDragState = {
    id,
    pointerId: event.pointerId,
    startY: event.clientY,
    active: false,
    row,
    parent: row.parentElement,
    originalOrder: [
      ...row.parentElement.querySelectorAll(".manage-player"),
    ].map((player) => Number(player.dataset.playerId)),
  };
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {}
  document.addEventListener("pointermove", handlePlayerDragMove);
  document.addEventListener("pointerup", finishPlayerDrag);
  document.addEventListener("pointercancel", finishPlayerDrag);
}

function handlePlayerDragMove(event) {
  const drag = playerDragState;
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (!drag.active && Math.abs(event.clientY - drag.startY) < 5) return;
  event.preventDefault();
  drag.active = true;
  drag.row.classList.add("dragging");

  const target = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest(".manage-player");
  if (target && target !== drag.row && target.parentElement === drag.parent) {
    const rect = target.getBoundingClientRect();
    drag.parent.insertBefore(
      drag.row,
      event.clientY > rect.top + rect.height / 2
        ? target.nextElementSibling
        : target,
    );
  }

  const scrollArea = drag.row.closest(".mbox");
  if (scrollArea) {
    const bounds = scrollArea.getBoundingClientRect();
    if (event.clientY < bounds.top + 44) scrollArea.scrollTop -= 12;
    else if (event.clientY > bounds.bottom - 44) scrollArea.scrollTop += 12;
  }
}

function finishPlayerDrag(event) {
  const drag = playerDragState;
  if (!drag || event.pointerId !== drag.pointerId) return;
  document.removeEventListener("pointermove", handlePlayerDragMove);
  document.removeEventListener("pointerup", finishPlayerDrag);
  document.removeEventListener("pointercancel", finishPlayerDrag);
  drag.row.classList.remove("dragging");
  playerDragState = null;
  if (!drag.active) return;

  const newOrder = [...drag.parent.querySelectorAll(".manage-player")].map(
    (player) => Number(player.dataset.playerId),
  );
  if (newOrder.some((id, index) => id !== drag.originalOrder[index]))
    api("reorderPlayers", { newOrder });
}
function roundStartControl() {
  if (!st.isHost) return "";
  const pokerActive = st.mode === "poker" && st.poker && st.poker.active;
  const blackjackActive = st.mode === "blackjack" && st.bj.phase === "playing";
  if (pokerActive || blackjackActive) {
    if (blackjackActive && st.bj.resolved) return "";
    const cancelAction = pokerActive ? "cancel" : "bjCancel";
    return `<button class="r" style="width:100%;margin-bottom:10px;padding:12px" onclick="if(confirm(translateText('Batalkan ronde?')))api('${cancelAction}')">Batalkan Hand & Kembalikan Chip</button>`;
  }

  let h = "";
  if (st.mode === "poker" && st.poker && !st.poker.active) {
    const canStart = (st.players || []).filter((p) => p.chips > 0).length >= 2;
    h += `<button class="y" style="width:100%;margin-bottom:10px;padding:14px" ${canStart ? "" : "disabled"} onclick="api('start')">▶ Mulai Hand Baru</button>`;
  }
  if (st.mode === "blackjack" && st.bj.phase !== "playing") {
    const hasBets = (st.players || []).some((p) => p.bjBet > 0);
    h += `<button class="y" style="width:100%;margin-bottom:10px;padding:14px" ${hasBets ? "" : "disabled"} onclick="api('bjDeal')">▶ Kunci Taruhan & Bagi Kartu</button>`;
  }
  return h;
}

function resetAllControl() {
  if (!st.isHost || st.poker.active || st.bj.phase === "playing") return "";
  const hasPlayers = (st.players || []).length > 0;
  return `<button class="g s" style="width:100%;margin-bottom:10px" ${hasPlayers ? "" : "disabled"} onclick="if(confirm(translateText('Reset semua chip?')))api('resetAll')">Reset Semua Chip</button>`;
}
