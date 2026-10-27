const sfxCache = {};
const audioGainNodes = new WeakMap();
const backgroundMusic = new Audio("/assets/sounds/bgmusic.mp3");
backgroundMusic.loop = true;
backgroundMusic.preload = "none";
let backgroundMusicStarting = false;
let mvpMusicTracks = [];
let mvpMusicTracksLoaded = false;
let pendingMvpMusicTrackId = null;
let mvpMusicAudio = null;

fetch("/assets/sounds/mvp/tracks.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((tracks) => {
    if (
      !Array.isArray(tracks) ||
      tracks.some(
        (track) =>
          !track ||
          typeof track.id !== "string" ||
          !/^[a-z0-9][a-z0-9-]*$/.test(track.id) ||
          typeof track.title !== "string" ||
          typeof track.src !== "string" ||
          !track.src.startsWith("/assets/sounds/mvp/"),
      )
    )
      throw new Error("Format katalog musik MVP tidak valid");
    mvpMusicTracks = tracks;
    mvpMusicTracksLoaded = true;
    if (pendingMvpMusicTrackId) playMvpMusic(pendingMvpMusicTrackId);
    if (typeof render === "function") render();
  })
  .catch((error) => {
    console.error("Katalog musik MVP gagal dimuat:", error);
    mvpMusicTracksLoaded = true;
    if (typeof render === "function") render();
  });

function getAudioContext() {
  const AudioContextConstructor =
    window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContextConstructor();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function getAudioGainNode(media) {
  const existingGain = audioGainNodes.get(media);
  if (existingGain) return existingGain;
  const context = getAudioContext();
  if (!context) return null;
  try {
    const source = context.createMediaElementSource(media);
    const gain = context.createGain();
    source.connect(gain);
    gain.connect(context.destination);
    media.volume = 1;
    media.muted = false;
    audioGainNodes.set(media, gain);
    return gain;
  } catch {
    return null;
  }
}

function setMediaGain(media, volume, muted = false) {
  const gain = getAudioGainNode(media);
  if (!gain) {
    media.volume = volume;
    media.muted = muted;
    return;
  }
  const context = getAudioContext();
  const targetVolume = muted ? 0 : volume;
  gain.gain.cancelScheduledValues(context.currentTime);
  gain.gain.setTargetAtTime(targetVolume, context.currentTime, 0.02);
}

function syncBackgroundMusic() {
  setMediaGain(backgroundMusic, backgroundMusicVolume, backgroundMusicMuted);
}

function syncMvpMusicVolume() {
  if (mvpMusicAudio)
    setMediaGain(mvpMusicAudio, backgroundMusicVolume, backgroundMusicMuted);
}

function playMvpMusic(trackId) {
  const track = mvpMusicTracks.find((item) => item.id === trackId);
  if (!track) {
    pendingMvpMusicTrackId = trackId;
    return;
  }
  pendingMvpMusicTrackId = null;
  if (!mvpMusicAudio) {
    mvpMusicAudio = new Audio(track.src);
    mvpMusicAudio.addEventListener("ended", () => {
      mvpMusicAudio = null;
    });
  } else {
    mvpMusicAudio.pause();
    mvpMusicAudio.src = track.src;
  }
  mvpMusicAudio.currentTime = 0;
  setMediaGain(mvpMusicAudio, backgroundMusicVolume, backgroundMusicMuted);
  mvpMusicAudio.play().catch((error) => {
    console.warn("Musik MVP tidak dapat diputar:", error);
  });
}

function syncSoundEffects() {
  Object.values(sfxCache).forEach((media) => {
    setMediaGain(media, currentVolume, soundMuted);
  });
}

function unlockAudio() {
  const context = getAudioContext();
  if (context) {
    syncBackgroundMusic();
    syncSoundEffects();
  }
  if (context && context.state === "suspended")
    context.resume().catch(() => {});
  startBackgroundMusic();
}

function startBackgroundMusic() {
  if (
    !backgroundMusic.paused ||
    backgroundMusicStarting ||
    backgroundMusicMuted ||
    backgroundMusicVolume === 0
  )
    return;
  backgroundMusic.currentTime = 0;
  backgroundMusicStarting = true;
  backgroundMusic
    .play()
    .then(() => {
      backgroundMusicStarting = false;
    })
    .catch(() => {
      backgroundMusicStarting = false;
    });
}

document.addEventListener("pointerdown", unlockAudio);
document.addEventListener("touchend", unlockAudio);
document.addEventListener("keydown", unlockAudio);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) unlockAudio();
});

function playSFX(file) {
  if (soundMuted || currentVolume === 0) return;
  try {
    if (!sfxCache[file])
      sfxCache[file] = new Audio("/assets/sounds/" + file + ".mp3");
    const a = sfxCache[file];
    setMediaGain(a, currentVolume, false);
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
  else if (event.includes("LOSE") || event.includes("Kalah")) playSFX("bjlose");
  else if (event.includes("WIN") || event.includes("BJ")) playSFX("bjwin");
  else if (event.includes("Double")) playSFX("double");
  else if (event.includes("SPLIT")) playSFX("split");
  else if (event.includes("taruhan") || event.includes("Blind")) playSFX("bet");
  else if (event.includes("dikeluarkan")) playSFX("kick");
  else if (event.includes("direset") || event.includes("reset"))
    playSFX("reset");
  else if (event.includes("Bandar")) playSFX("transfer");
  else playSFX("stage");
}
