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
let roomRenderScheduled = false;
function scheduleRoomRender() {
  if (roomRenderScheduled) return;
  roomRenderScheduled = true;
  requestAnimationFrame(() => {
    roomRenderScheduled = false;
    render();
  });
}

function connect() {
  if (!roomCode) return;
  if (es) {
    es.onmessage = null;
    es.onerror = null;
    es.close();
    es = null;
  }
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
        sessionStorage.cb_rl = data.ver; // server sudah versi baru -&gt; muat ulang data saja, jangan reload halaman
        api("refresh"); // Panggil fungsi untuk sinkronisasi ulang data
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
      const bjWinFallbackStarted = Boolean(
        st &&
          data.mode === "blackjack" &&
          mvpMusicEventChanged &&
          !data.mvpMusicTrackId &&
          data.mvpMusicEligiblePlayerIds?.length,
      );
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
        if (
          !mvpMusicStarted &&
          !bjWinFallbackStarted &&
          !suppressDepletionSound
        )
          playEventSound(data.lastEvent);
        pendingEntrySound = false;
      } else if (
        st &&
        newRoomEvent &&
        !mvpMusicStarted &&
        !bjWinFallbackStarted
      ) {
        if (!suppressDepletionSound) playEventSound(data.lastEvent);
      }
      if (!data.isHost && data.you == null && !leaving) {
        if (data.resumeOffer) {
          st = data;
          scheduleRoomRender();
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
      if (bjWinFallbackStarted) playSFX("bjwin");
      if (
        data.poker.stage === "showdown" &&
        (!st || st.poker.stage !== "showdown")
      )
        draft.w = {};
      st = data;
      scheduleRoomRender();
    } catch (err) {
      console.error(err);
    }
  };
}

function visibilityHandler() {
  if (!document.hidden) connect();
}

document.removeEventListener("visibilitychange", visibilityHandler);
document.addEventListener("visibilitychange", visibilityHandler);

