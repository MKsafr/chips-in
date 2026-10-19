      const sfxCache = {};
      function playSFX(file) {
        if (soundMuted || currentVolume === 0) return;
        try {
          if (!sfxCache[file])
            sfxCache[file] = new Audio("/assets/sounds/" + file + ".mp3");
          const a = sfxCache[file];
          a.volume = currentVolume;
          a.currentTime = 0;
          a.play().catch(() => {});
        } catch (e) {}
      }

      function playEventSound(event) {
        if (event.includes("ALL-IN")) playSFX("allin");
        else if (event.includes("Raise")) playSFX("raise");
        else if (event.includes("Call")) playSFX("call");
        else if (event.includes("Check")) playSFX("check");
        else if (event.includes("Fold")) playSFX("fold");
        else if (event.includes("Showdown")) playSFX("showdown");
        else if (
          event.includes("FLOP") ||
          event.includes("TURN") ||
          event.includes("RIVER") ||
          event.includes("Kartu dikocok")
        )
          playSFX("stage");
        else if (event.includes("dikirim ke") || event.includes("menang"))
          playSFX("award");
        else if (event.includes("LOSE") || event.includes("Kalah"))
          playSFX("bjlose");
        else if (event.includes("WIN") || event.includes("BJ"))
          playSFX("bjwin");
        else if (event.includes("Double")) playSFX("double");
        else if (event.includes("SPLIT")) playSFX("split");
        else if (event.includes("taruhan") || event.includes("Blind"))
          playSFX("bet");
        else if (event.includes("dikeluarkan")) playSFX("kick");
        else if (event.includes("direset") || event.includes("reset"))
          playSFX("reset");
        else if (event.includes("Bandar")) playSFX("transfer");
        else playSFX("stage");
      }
