async function api(type, extra = {}) {
  try {
    const r = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, roomCode, type, ...extra }),
    });
    const j = await r.json();
    if (j.err) {
      if (/Room tidak ditemukan/i.test(j.err))
        showAlert(
          translateText("Room tidak ditemukan"),
          "Kode room salah atau room sudah ditutup. Periksa lagi kode dari Bandar.",
        );
      else flash(j.err);
    }
    if (j.roomCode) {
      roomCode = j.roomCode;
      localStorage.cb_room = roomCode;
      connect();
    }
    return j;
  } catch {
    flash("Koneksi ke server terputus");
  }
}

function flash(m) {
  toastMsg = translateText(m);
  render();
  setTimeout(() => {
    toastMsg = "";
    render();
  }, 2500);
}

let es = null;
function connect() {
  if (!roomCode) return;
  if (es) es.close();
  es = new EventSource(`/events?token=${token}&room=${roomCode}`);
  es.onerror = () => {
    if (!st) render();
  };
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (
        data.ver &&
        data.ver !== APP_VER &&
        sessionStorage.cb_rl !== data.ver
      ) {
        sessionStorage.cb_rl = data.ver; // server sudah versi baru -> muat ulang halaman sekali
        location.reload();
        return;
      }
      if (data.error === "ROOM_NOT_FOUND") {
        if (leaving) return;
        exitRoom();
        showAlert(
          "Room tidak ditemukan",
          "Room sudah ditutup atau server baru saja restart. Buat atau gabung room lagi.",
        );
        return;
      }
      const mvpMusicStarted = Boolean(
        data.mvpMusicTrackId &&
          (!st || data.mvpMusicEventId !== st.mvpMusicEventId),
      );
      const mvpMusicEventChanged =
        st && data.mvpMusicEventId !== st.mvpMusicEventId;
      const roomHasEmptyStack = (data.players || []).some(
        (player) => player.chips <= 0,
      );
      const isChipDepletionSoundEvent =
        typeof data.lastEvent === "string" &&
        /(menang|\bWIN\b|\bBJ\b)/i.test(data.lastEvent);
      const suppressDepletionSound =
        roomHasEmptyStack && isChipDepletionSoundEvent;
      const newRoomEvent =
        data.lastEvent && (!st || st.lastEventId !== data.lastEventId);
      if (!st && pendingEntrySound && data.lastEvent) {
        if (!mvpMusicStarted && !suppressDepletionSound)
          playEventSound(data.lastEvent);
        pendingEntrySound = false;
      } else if (st && newRoomEvent && !mvpMusicStarted) {
        if (!suppressDepletionSound) playEventSound(data.lastEvent);
      }
      if (!data.isHost && data.you == null && !leaving) {
        if (data.resumeOffer) {
          st = data;
          render();
          return;
        }
        const previousMe = (st && st.players ? st.players : []).find(
          (p) => p.id === st.you,
        );
        const wasKicked =
          previousMe &&
          data.lastEvent === `${previousMe.name} dikeluarkan oleh Bandar`;
        exitRoom();
        if (wasKicked)
          showAlert(
            "Kamu telah dikeluarkan",
            "Bandar telah mengeluarkan kamu dari room.",
          );
        else flash("Kamu sudah tidak duduk di meja ini");
        return;
      }
      if (
        st &&
        !data.isHost &&
        !roomHasEmptyStack &&
        !mvpMusicStarted
      ) {
        const blackjackFinished =
          st.bj.phase === "playing" && data.bj.phase !== "playing";
        const blackjackWinner =
          data.mode === "blackjack" && blackjackFinished && data.winnerName;
        if ((data.winnerName && !st.winnerName) || blackjackWinner)
          playSFX("win");
      }
      if (
        data.mvpMusicTrackId &&
        (!st || mvpMusicEventChanged)
      ) {
        playMvpMusic(data.mvpMusicTrackId);
      } else if (mvpMusicEventChanged) {
        stopMvpMusic();
      }
      if (
        data.poker.stage === "showdown" &&
        (!st || st.poker.stage !== "showdown")
      )
        draft.w = {};
      st = data;
      render();
    } catch (err) {
      console.error(err);
    }
  };
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) connect();
});
