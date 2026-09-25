let lastSubtitleUrls = {};

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.url.includes("timedtext")) {
      lastSubtitleUrls[details.tabId] = details.url;
      console.log("¡Enlace atrapado en la pestaña " + details.tabId + "!");
    }
  },
  { urls: ["*://*.youtube.com/api/timedtext*"] }
);

const ORACLE_BASE = 'http://129.146.84.143:5001';
const LOCAL_BASE   = 'http://localhost:5001';
// El puente por internet (Cloudflare Worker) hacia el servidor del dueño. Lo completa
// puente/desplegar.bat; vacío = solo el servidor de esta PC.
const PUENTE_BASE  = 'https://utraduu.dennisaxel17.workers.dev';

// TEMPORAL (prueba): Gemini también va al servidor local. Volver a false para usar Oracle.
const GEMINI_POR_LOCAL = false;

// Modo local: el servidor de esta PC si está encendido (el dueño); si no, el puente.
// Se recuerda un minuto para no probar en cada consulta del avance.
let localElegido = null;
async function servidorLocal(payload) {
  const url = String(payload?.servidor || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\/[^\s\/]+$/i.test(url)) return url;
  if (!PUENTE_BASE) return LOCAL_BASE;
  if (localElegido && Date.now() - localElegido.t < 60000) return localElegido.base;
  let base = PUENTE_BASE;
  try {
    await fetch(LOCAL_BASE + '/salud', { signal: AbortSignal.timeout(800) });
    base = LOCAL_BASE;
  } catch (_) {}
  localElegido = { base, t: Date.now() };
  return base;
}

async function baseUrlPara(motor, payload) {
  return (motor === 'local' || GEMINI_POR_LOCAL) ? servidorLocal(payload) : ORACLE_BASE;
}

// El puente verifica al usuario por este encabezado sin leer el cuerpo (que puede pesar MB)
function encabezados(payload) {
  const h = { 'Content-Type': 'application/json' };
  const id = String(payload?.usuario?.id || '');
  if (id) h['X-UTraduu-Usuario'] = id;
  return h;
}

function sinRespuesta(base) {
  if (base === ORACLE_BASE) return "El servidor de Oracle no responde o está apagado.";
  if (base === PUENTE_BASE) return "No se pudo conectar con el servidor del modo local (revisá tu internet).";
  return "El servidor local no responde o está apagado.";
}

// Pedido al servidor: siempre devuelve JSON (el error del servidor, o uno propio si no responde)
function pedirJson(base, ruta, payload, sendResponse) {
  fetch(base + ruta, { method: 'POST', headers: encabezados(payload), body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(data => sendResponse(data))
    .catch(() => {
      if (base === LOCAL_BASE) localElegido = null;   // se apagó: la próxima vez se prueba de nuevo
      sendResponse({ error: sinRespuesta(base) });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Manejador para obtener la URL del track de subtítulos atrapada
  if (request.action === "getUrl") {
    sendResponse({ url: lastSubtitleUrls[sender.tab.id] });
  }

  // Manejador para solicitar la traducción ignorando el bloqueo HTTPS -> HTTP
  if (request.action === "hacerFetchInseguro") {
    baseUrlPara(request.payload?.motor, request.payload)
      .then(base => pedirJson(base, '/traducir', request.payload, sendResponse));
    return true; // Mantiene el canal de mensajes abierto para respuestas asíncronas
  }

  // Motor local: la traducción corre en segundo plano en el servidor y se consulta su avance
  if (request.action === "estadoLocal") {
    servidorLocal(request.payload)
      .then(base => pedirJson(base, '/estado', request.payload, sendResponse));
    return true;
  }

  // Manejador para eliminar la traducción del caché
  if (request.action === "eliminarCacheInseguro") {
    baseUrlPara(request.payload?.motor, request.payload)
      .then(base => pedirJson(base, '/eliminar-cache', request.payload, sendResponse));
    return true; // Mantiene el canal de mensajes abierto para respuestas asíncronas
  }
});