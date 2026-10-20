      function showNotice(type, name) {
        clearTimeout(noticeTimer);
        notice = { type, name };
        noticeTimer = setTimeout(closeNotice, 5000);
      }

      function closeNotice() {
        clearTimeout(noticeTimer);
        noticeTimer = null;
        notice = null;
        render();
      }

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
            if (!st && pendingEntrySound && data.lastEvent) {
              playEventSound(data.lastEvent);
              pendingEntrySound = false;
            } else if (
              st &&
              data.lastEvent &&
              st.lastEventId !== data.lastEventId
            ) {
              playEventSound(data.lastEvent);
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
                data.lastEvent ===
                  `${previousMe.name} dikeluarkan oleh Bandar`;
              exitRoom();
              if (wasKicked)
                showAlert(
                  "Kamu telah dikeluarkan",
                  "Bandar telah mengeluarkan kamu dari room.",
                );
              else flash("Kamu sudah tidak duduk di meja ini");
              return;
            }
            if (st && !data.isHost) {
              const previousMe = (st.players || []).find(
                (p) => p.id === st.you,
              );
              const currentMe = (data.players || []).find(
                (p) => p.id === data.you,
              );
              const pokerFinished = st.poker.active && !data.poker.active;
              const blackjackFinished =
                st.bj.phase === "playing" && data.bj.phase !== "playing";
              const lostAllChips =
                previousMe &&
                currentMe &&
                currentMe.chips === 0 &&
                ((previousMe.chips > 0 &&
                  (!data.poker.active || currentMe.folded) &&
                  data.bj.phase !== "playing" &&
                  !currentMe.bjBet &&
                  !currentMe.bjSplitBet) ||
                  ((pokerFinished || blackjackFinished) &&
                    previousMe.chips === 0));
              const playerKey = `${roomCode}:${data.you}`;
              const winnerKey = `${roomCode}:${data.winnerName}`;
              const blackjackWinner =
                data.mode === "blackjack" &&
                blackjackFinished &&
                data.winnerName;
              if (currentMe && currentMe.chips > 0)
                noChipsNoticeKey = null;
              if (!data.winnerName) casinoWinnerNoticeKey = null;
              if (lostAllChips && noChipsNoticeKey !== playerKey) {
                noChipsNoticeKey = playerKey;
                showNotice("loser", currentMe.name);
              } else if (
                ((data.winnerName && !st.winnerName) || blackjackWinner) &&
                casinoWinnerNoticeKey !== winnerKey
              ) {
                casinoWinnerNoticeKey = winnerKey;
                playSFX("win");
                showNotice("winner", data.winnerName);
              }
            }
            st = data;
            render();
          } catch (err) {
            console.error(err);
          }
        };
      }
