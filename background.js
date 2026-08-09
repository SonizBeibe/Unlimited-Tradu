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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getUrl") {
    sendResponse({ url: lastSubtitleUrls[sender.tab.id] });
  }
  
  if (request.action === "hacerFetchInseguro") {
    fetch('http://129.146.84.143:5001/traducir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.payload)
    })
    .then(res => res.json())
    .then(data => sendResponse(data))
    .catch(err => sendResponse({ error: "El servidor de Oracle no responde o está apagado." }));

    return true; 
  }
});