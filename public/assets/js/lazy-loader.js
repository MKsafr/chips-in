// Phase 2: minimal lazy script loader (keeps global-script architecture; no ES modules).
let __lazyScripts = Object.create(null);

function loadScriptOnce(src) {
  if (__lazyScripts[src]) return __lazyScripts[src];
  __lazyScripts[src] = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      delete __lazyScripts[src];
      script.remove();
      reject(new Error("Failed to load " + src));
    };
    document.head.appendChild(script);
  });
  return __lazyScripts[src];
}
