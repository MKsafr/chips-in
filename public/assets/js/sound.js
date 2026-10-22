const sfxCache = {};
const audioGainNodes = new WeakMap();
const backgroundMusic = new Audio("/assets/sounds/bgmusic.mp3");
backgroundMusic.loop = true;
backgroundMusic.preload = "auto";
let backgroundMusicStarting = false;

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

function syncSoundEffects() {
  Object.values(sfxCache).forEach((media) => {
    setMediaGain(media, currentVolume, soundMuted);
  });
}

function unlockAudio() {
  const context = getAudioContext();
  if (context && context.state === "suspended")
    context.resume().catch(() => {});
  startBackgroundMusic();
}

function startBackgroundMusic() {
  if (!backgroundMusic.paused || backgroundMusicStarting) return;
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

syncBackgroundMusic();
startBackgroundMusic();
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
