// Lazy-loaded: QR room scanner (Phase 2 component split)
// Real implementations. Invoked by the openRoomScanner() wrapper in ui-controls.js.
// The html5-qrcode library is itself lazy-loaded on demand below.

let roomScanner = null;
let roomScanHandled = false;
let roomScannerLibraryPromise = null;

function openRoomScannerModal() {
  roomScanHandled = false;
  $("#modal").innerHTML =
    `<div class="modal" onpointerdown="rememberModalPointerDown(event)" onclick="closeOnModalBackdrop(event,closeRoomScanner)"><div class="mbox room-scanner-modal" role="dialog" aria-modal="true" aria-label="${translateText("Scan QR Room dengan Kamera")}">
    <div class="row sp"><h2>${translateText("Scan QR Room")}</h2><button class="g s" aria-label="${translateText("Tutup")}" onclick="closeRoomScanner()">×</button></div>
    <p class="mut">${translateText("Arahkan kamera ke QR room.")}</p>
    <div id="roomQrReader"></div>
    <p id="roomScannerStatus" class="mut room-scanner-status" role="status">${translateText("Meminta akses kamera…")}</p>
    <button class="g" style="width:100%" onclick="closeRoomScanner()">${translateText("Batal")}</button>
  </div></div>`;
  localizeTree($("#modal"));
  startRoomScanner();
}

async function startRoomScanner() {
  if (!window.Html5Qrcode) {
    try {
      await loadRoomScannerLibrary();
    } catch {
      setRoomScannerStatus("Pemindai QR tidak dapat dimuat.");
      return;
    }
  }
  const scanner = new Html5Qrcode("roomQrReader");
  roomScanner = scanner;
  try {
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        aspectRatio: 1,
        qrbox: (width, height) => {
          const size = Math.floor(Math.min(width, height, 280) * 0.82);
          return { width: size, height: size };
        },
      },
      async (decodedText) => {
        if (roomScanHandled) return;
        const code = roomCodeFromScan(decodedText);
        if (!code) {
          setRoomScannerStatus("QR bukan kode atau link room yang valid.");
          return;
        }
        roomScanHandled = true;
        await closeRoomScanner();
        const input = $("#rc");
        if (input) {
          input.value = code;
          joinRoom();
        }
      },
      () => {},
    );
    if (roomScanner !== scanner) {
      await scanner.stop();
      scanner.clear();
    }
  } catch {
    if (roomScanner === scanner) {
      roomScanner = null;
      try {
        scanner.clear();
      } catch {}
      setRoomScannerStatus(
        "Kamera tidak dapat dibuka. Izinkan akses kamera dan gunakan HTTPS.",
      );
    }
  }
}

function loadRoomScannerLibrary() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (!roomScannerLibraryPromise) {
    roomScannerLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/assets/js/html5-qrcode.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        roomScannerLibraryPromise = null;
        reject(new Error("QR scanner script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return roomScannerLibraryPromise;
}

function roomCodeFromScan(value) {
  const text = String(value || "").trim();
  if (/^[A-Z0-9]{6}$/i.test(text)) return text.toUpperCase();
  try {
    const url = new URL(text);
    if (url.origin !== window.location.origin) return "";
    const code = (url.searchParams.get("room") || "").trim().toUpperCase();
    return /^[A-Z0-9]{6}$/.test(code) ? code : "";
  } catch {
    return "";
  }
}

function setRoomScannerStatus(message) {
  const status = $("#roomScannerStatus");
  if (status) status.textContent = translateText(message);
}

async function closeRoomScanner() {
  const scanner = roomScanner;
  roomScanner = null;
  if (scanner) {
    try {
      await scanner.stop();
    } catch {}
    try {
      scanner.clear();
    } catch {}
  }
  $("#modal").innerHTML = "";
}
