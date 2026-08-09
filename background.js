let lastSubtitleUrls = {};

// El radar: Captura el enlace en segundo plano cuando activas los subtítulos
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Si la petición es de subtítulos, la atrapamos
    if (details.url.includes("timedtext")) {
      lastSubtitleUrls[details.tabId] = details.url;
      console.log("¡Enlace atrapado en la pestaña " + details.tabId + "!");
    }
  },
  { urls: ["*://*.youtube.com/api/timedtext*"] }
);

// Escuchar cuando el content.js pide el enlace o pide comunicarse con Oracle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getUrl") {
    // Le enviamos la URL correspondiente a la pestaña actual
    sendResponse({ url: lastSubtitleUrls[sender.tab.id] });
  }
  
  if (request.action === "hacerFetchInseguro") {
    // El background sí puede saltarse la restricción de Mixed Content
    fetch('http://129.146.84.143:5001/traducir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.payload)
    })
    .then(res => res.json())
    .then(data => sendResponse(data))
    .catch(err => sendResponse({ error: "El servidor de Oracle no responde o está apagado." }));
    
    // IMPORTANTE: Retornar true mantiene el canal de comunicación abierto hasta que el fetch termine
    return true; 
  }
});