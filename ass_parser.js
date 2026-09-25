window.SSTraduEngine = (function() {
    let subtitleData = null;
    let subtitleOriginal = null;   // el .ass sin traducir (estilo "Traducción": original arriba)
    let syncInterval = null;
    let overlayContainer = null;
    let lastRenderedTime = -1; 

    // Inyectar Google Fonts para asegurarnos de que "Carrois Gothic SC" (Versalitas) siempre cargue
    (function cargarFuentesExternas() {
        if (!document.getElementById('ss-google-fonts')) {
            const link = document.createElement('link');
            link.id = 'ss-google-fonts';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Carrois+Gothic+SC&family=Roboto:wght@400;700&display=swap';
            document.head.appendChild(link);
        }
    })();

    function limpiar() {
        if (syncInterval) clearInterval(syncInterval);
        if (overlayContainer) overlayContainer.remove();
        subtitleData = null;
        subtitleOriginal = null;
        syncInterval = null;
        overlayContainer = null;
        lastRenderedTime = -1;
    }

    function forceRender() {
        const video = document.querySelector('video');
        if (video) renderCues(video.currentTime);
    }

    function getStats() {
        if (!subtitleData || !subtitleData.cues) return null;
        const count = subtitleData.cues.length;
        const durMs = count > 0 ? subtitleData.cues[count - 1].end : 0;
        return { cuesCount: count, duration: Math.round(durMs / 1000) };
    }

    function iniciarMotor(assContent, assOriginal) {
        limpiar();
        subtitleData = parseASS(assContent);
        if (!subtitleData || !subtitleData.cues.length) return false;
        subtitleOriginal = assOriginal ? parseASS(assOriginal) : null;

        const fxChroma = document.getElementById('ss-fx-chroma')?.checked !== false;
        if (!fxChroma) {
            const mapUnicos = new Map();
            subtitleData.cues.forEach(cue => {
                const textoBase = cue.spans.map(s => s.text).join('').trim();
                const key = `${cue.start.toFixed(1)}-${cue.end.toFixed(1)}-${textoBase}`;
                if (!mapUnicos.has(key)) {
                    mapUnicos.set(key, cue);
                } else {
                    const existente = mapUnicos.get(key);
                    if ((cue.layer || 0) > (existente.layer || 0)) mapUnicos.set(key, cue);
                }
            });
            subtitleData.cues = Array.from(mapUnicos.values());
        }

        subtitleData.cues.sort((a, b) => (a.layer || 0) - (b.layer || 0));

        createOverlay();
        startSync();
        return true;
    }

    function createOverlay() {
        const video = document.querySelector('video');
        if (!video) return;
        
        let playerContainer = document.querySelector('#movie_player') || document.querySelector('.html5-video-player') || video.parentElement;
        
        overlayContainer = document.createElement('div');
        overlayContainer.id = 'sstradu-overlay';
        overlayContainer.style.cssText = `
            position: absolute !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important; height: 100% !important;
            pointer-events: none !important;
            z-index: 2147483647 !important;
            overflow: hidden !important;
        `;
        playerContainer.appendChild(overlayContainer);
    }

    function startSync() {
        if (syncInterval) clearInterval(syncInterval);
        syncInterval = setInterval(() => {
            const video = document.querySelector('video');
            if (!video) return;
            
            if (!video.paused || video.currentTime !== lastRenderedTime) {
                renderCues(video.currentTime);
                lastRenderedTime = video.currentTime;
            }
        }, 25); 
    }

    function renderCues(currentTimeSec) {
        if (!subtitleData || !overlayContainer) return;
        const timeMs = currentTimeSec * 1000;
        overlayContainer.innerHTML = ''; 
        
        const video = document.querySelector('video');
        if (!video) return;
        
        const videoRect = video.getBoundingClientRect();
        const playerRect = overlayContainer.parentElement.getBoundingClientRect();
        const videoOffsetX = videoRect.left - playerRect.left;
        const videoOffsetY = videoRect.top - playerRect.top;
        
        overlayContainer.style.left = videoOffsetX + 'px';
        overlayContainer.style.top = videoOffsetY + 'px';
        overlayContainer.style.width = videoRect.width + 'px';
        overlayContainer.style.height = videoRect.height + 'px';

        const scaleX = videoRect.width / subtitleData.playResX;
        const scaleY = videoRect.height / subtitleData.playResY;

        const modo = document.getElementById('ss-style')?.value || 'full';
        const activeCues = modo === 'traduccion' ? cuesTraduccion(timeMs)
            : esModoSRT() ? cuesSRT(timeMs)
            : subtitleData.cues.filter(c => timeMs >= c.start && timeMs <= c.end);

        activeCues.forEach(cue => {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.zIndex = 10 + (cue.layer || 0);
            div.style.whiteSpace = 'nowrap';
            if (cue.srt) {
                // una sola línea que puede partirse si no entra en el ancho del video
                div.style.whiteSpace = 'normal';
                div.style.width = 'max-content';
                div.style.maxWidth = '90%';
            }
            renderASSCue(div, cue, timeMs - cue.start, cue.end - cue.start, videoRect.width, videoRect.height, scaleX, scaleY);
            overlayContainer.appendChild(div);
        });
    }

    // ==========================================
    // MODOS SRT / TEXTO LIMPIO: UNA LÍNEA LIMPIA POR MOMENTO
    // ==========================================
    // Un .ass con efectos dibuja cada frase con muchas líneas a la vez: capas de
    // glow y sombra, una copia por palabra resaltada del karaoke (con el resto
    // transparente), cuadro por cuadro de cada fade, fragmentos repartidos por la
    // pantalla y glitches de 1-2 cuadros. Si se dibujan todas abajo al centro y sin
    // transparencias, se ven encimadas y "tipo karaoke". Acá se arman eventos de
    // texto y en cada instante se muestra una sola línea limpia.
    function esModoSRT() {
        const modo = document.getElementById('ss-style')?.value || 'full';
        return modo === 'srt' || modo === 'srt_color' || modo === 'clean' || modo === 'traduccion';
    }

    function textoPlanoCue(cue) {
        const texto = cue.spans.map(s => s.text).join('').replace(/ /g, ' ');
        const lineas = texto.split('\n').map(l => l.trim()).filter(Boolean);
        if (!lineas.length) return '';
        // texto vertical o en escalera (I/N/C/..., DU/VI/DOU?): va junto, como una palabra
        if (lineas.length > 1 && lineas.every(l => l.length <= 3)) return lineas.join('');
        return lineas.join(' ').replace(/\s+/g, ' ');
    }

    function estiloVisible(cue) {
        // el color de la parte que se ve (en el karaoke el resto está transparente)
        const conTexto = cue.spans.filter(s => s.text.trim());
        const visible = conTexto.find(s => {
            const a = s.style?.primaryAlpha ?? s.style?.alpha ?? 1;
            return a > 0.1;
        });
        return (visible || conTexto[0] || cue.spans[0] || {}).style || cue.style;
    }

    function luminancia(color) {
        const m = (color || '').match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (!m) return 1;
        return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) / 255;
    }

    function colorLegible(estilo) {
        // En SRT el contorno pasa a negro: un texto oscuro que en el original se leía
        // gracias a su glow de color (azul con glow naranja) quedaría invisible.
        const texto = estilo.primaryColor, borde = estilo.outlineColor;
        if (luminancia(texto) >= 0.35) return texto;
        if (luminancia(borde) >= 0.35) return borde;
        return 'rgba(255, 255, 255, 1)';
    }

    function armarEventosSRT(datos = subtitleData) {
        const cues = [...datos.cues].sort((a, b) => a.start - b.start);
        const porTexto = new Map();
        for (const cue of cues) {
            const texto = textoPlanoCue(cue);
            if (!texto || !/[\p{L}\p{N}]/u.test(texto)) continue;   // decoración sin letras
            let lista = porTexto.get(texto);
            if (!lista) { lista = []; porTexto.set(texto, lista); }
            const ultimo = lista[lista.length - 1];
            if (ultimo && cue.start <= ultimo.end + 250) {
                ultimo.end = Math.max(ultimo.end, cue.end);
            } else {
                const p = cue.pos || (cue.move && { x: cue.move.x1, y: cue.move.y1 }) || { x: cue.playResX / 2, y: cue.playResY };
                // arriba: \an7/8/9 (en estos videos, casi siempre nombres del cast)
                const arriba = [7, 8, 9].includes(cue.style?.alignment);
                lista.push({ texto, mostrar: texto, start: cue.start, end: cue.end, x: p.x, y: p.y, estilo: estiloVisible(cue), arriba });
            }
        }
        let eventos = [];
        porTexto.forEach(lista => eventos.push(...lista));

        // glitches: textos que en todo el video se ven menos de 150 ms
        const visto = new Map();
        eventos.forEach(e => visto.set(e.texto, (visto.get(e.texto) || 0) + (e.end - e.start)));
        eventos = eventos.filter(e => visto.get(e.texto) >= 150);
        eventos.sort((a, b) => a.start - b.start);

        // typewriter / armado: si el texto sigue creciendo en el que aparece cuando
        // este se va ('Junto al ca' -> 'Junto al camaleón'), se muestra el completo
        for (const e of eventos) {
            let actual = e;
            for (let paso = 0; paso < 40; paso++) {
                const sig = eventos.find(o => o !== actual && Math.abs(o.start - actual.end) <= 150 &&
                    o.texto.length > actual.texto.length &&
                    (o.texto.startsWith(actual.texto) || o.texto.endsWith(actual.texto)));
                if (!sig) break;
                actual = sig;
            }
            e.mostrar = actual.texto;
        }
        return eventos;
    }

    function cuesSRT(timeMs) {
        if (!subtitleData.eventosSRT) subtitleData.eventosSRT = armarEventosSRT();
        const activos = activosSRT(subtitleData.eventosSRT, timeMs);
        return activos.length ? [cueSRT([activos], 2)] : [];
    }

    // Estilo "Traducción" (para aprender y entender la letra): el original arriba y la
    // traducción abajo. Lo que va con \an8 (nombres del cast) va abajo, encima de la
    // traducción, porque arriba está el original.
    function cuesTraduccion(timeMs) {
        if (!subtitleData.eventosSRT) subtitleData.eventosSRT = armarEventosSRT();
        const trad = activosSRT(subtitleData.eventosSRT, timeMs);
        const salida = [];
        // los adornos sin letras (✦•┈๑⋅⋯) de arriba no se bajan
        const nombres = trad.filter(e => e.arriba && /\p{L}/u.test(e.mostrar)), principales = trad.filter(e => !e.arriba);
        if (nombres.length || principales.length) salida.push(cueSRT([nombres, principales], 2));
        if (subtitleOriginal) {
            if (!subtitleOriginal.eventosSRT) subtitleOriginal.eventosSRT = armarEventosSRT(subtitleOriginal);
            const orig = activosSRT(subtitleOriginal.eventosSRT, timeMs).filter(e => !e.arriba);
            if (orig.length) salida.push(cueSRT([orig], 8, 0.9));
        }
        return salida;
    }

    function activosSRT(eventos, timeMs) {
        let activos = eventos.filter(e => timeMs >= e.start && timeMs <= e.end);
        if (!activos.length) return [];

        // sin repetidos (el mismo texto a los dos lados de la pantalla, glow + sombra)
        const vistos = new Set();
        activos = activos.filter(e => {
            const k = e.mostrar.toLowerCase();
            if (vistos.has(k)) return false;
            vistos.add(k);
            return true;
        });
        // sin pedazos de un texto que ya está entero ('RO', 'BO' junto a 'ROBOTÓN')
        activos = activos.filter(e => !activos.some(o => o !== e && o.mostrar.length > e.mostrar.length &&
            o.mostrar.toLowerCase().includes(e.mostrar.toLowerCase())));
        // orden de lectura: como fueron apareciendo; si aparecen juntos, de arriba a abajo
        activos.sort((a, b) => (a.start - b.start) || (a.y - b.y) || (a.x - b.x));
        return activos;
    }

    // Una línea limpia con los eventos de cada grupo; cada grupo en su renglón
    function cueSRT(grupos, alineacion, escala = 1) {
        const base = subtitleData.styles['ytplain'] || subtitleData.styles['default'] || getDefaultASSStyle();
        const spans = [];
        const todos = [];
        grupos.filter(g => g.length).forEach((grupo, k) => {
            grupo.forEach((e, i) => {
                todos.push(e);
                spans.push({
                    text: (i ? ' ' : (k ? '\n' : '')) + e.mostrar,
                    karaokeOffset: 0,
                    style: {
                        ...e.estilo, primaryColor: colorLegible(e.estilo),
                        fontsize: (base.fontsize || 38) * escala, scalex: 100, scaley: 100, spacing: 0,
                        rotateX: 0, rotateY: 0, rotateZ: 0, animations: [], karaokeDuration: 0,
                        alpha: 1, primaryAlpha: 1, outlineAlpha: 1, backAlpha: 1, borderstyle: 1, ytruby: null
                    }
                });
            });
        });
        return {
            srt: true, srtAlign: alineacion,
            start: Math.min(...todos.map(e => e.start)), end: Math.max(...todos.map(e => e.end)),
            style: { ...base, alignment: alineacion, animations: [], borderstyle: 1 }, spans, layer: 0,
            marginL: 0, marginR: 0, marginV: 20, pos: null, move: null, fadeIn: 0, fadeOut: 0,
            playResX: subtitleData.playResX, playResY: subtitleData.playResY
        };
    }

    function parseASS(content) {
        const lines = content.split(/\r?\n/);
        const styles = {};
        const cues = [];
        let playResX = 1280, playResY = 720;
        let currentSection = '', formatOrder = [], styleFormatOrder = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('[')) { currentSection = trimmed.toLowerCase(); continue; }
            
            if (currentSection === '[script info]') {
                if (trimmed.startsWith('PlayResX:')) playResX = parseInt(trimmed.split(':')[1]) || 1280;
                if (trimmed.startsWith('PlayResY:')) playResY = parseInt(trimmed.split(':')[1]) || 720;
            }
            if (currentSection === '[v4+ styles]' || currentSection === '[v4 styles]') {
                if (trimmed.startsWith('Format:')) {
                    styleFormatOrder = trimmed.substring(7).split(',').map(s => s.trim().toLowerCase());
                } else if (trimmed.startsWith('Style:')) {
                    const style = parseASSStyle(trimmed.substring(6), styleFormatOrder);
                    if (style && style.name) {
                        styles[style.name.toLowerCase()] = style;
                        styles[style.name] = style;
                    }
                }
            }
            if (currentSection === '[events]') {
                if (trimmed.startsWith('Format:')) {
                    formatOrder = trimmed.substring(7).split(',').map(s => s.trim().toLowerCase());
                } else if (trimmed.startsWith('Dialogue:')) {
                    const cue = parseASSDialogue(trimmed.substring(9), formatOrder, styles, playResX, playResY);
                    if (cue) cues.push(cue);
                }
            }
        }
        return { cues, styles, playResX, playResY };
    }

    function parseASSStyle(styleData, formatOrder) {
        const parts = styleData.split(',').map(s => s.trim());
        const style = { outline: 2, shadow: 2, alignment: 2, fontsize: 20, marginl: 10, marginr: 10, marginv: 10, scalex: 100, scaley: 100, borderstyle: 1, underline: 0, strikeout: 0, bold: 0, italic: 0 };
        const defaultOrder = ['name', 'fontname', 'fontsize', 'primarycolour', 'secondarycolour', 'outlinecolour', 'backcolour', 'bold', 'italic', 'underline', 'strikeout', 'scalex', 'scaley', 'spacing', 'angle', 'borderstyle', 'outline', 'shadow', 'alignment', 'marginl', 'marginr', 'marginv', 'encoding'];
        const order = formatOrder.length > 0 ? formatOrder : defaultOrder;
        
        order.forEach((field, idx) => { 
            if (idx < parts.length) style[field.toLowerCase()] = parts[idx]; 
        });
        
        if (!style.name && parts.length > 0) style.name = parts[0];
        
        ['fontsize', 'bold', 'italic', 'underline', 'strikeout', 'scalex', 'scaley', 'spacing', 'angle', 'borderstyle', 'outline', 'shadow', 'alignment', 'marginl', 'marginr', 'marginv'].forEach(field => {
            if (style[field] !== undefined) style[field] = parseFloat(style[field]) || 0;
        });
        
        const getCol = (keys) => {
            for (const k of keys) {
                if (style[k] !== undefined) return assColorToCSS(style[k]);
            }
            return null;
        };

        style.primaryColor = getCol(['primarycolour', 'primarycolor', 'primary_color']) || 'rgba(255, 255, 255, 1)';
        style.secondaryColor = getCol(['secondarycolour', 'secondarycolor', 'secondary_color']) || 'rgba(255, 0, 0, 1)';
        style.outlineColor = getCol(['outlinecolour', 'outlinecolor', 'outline_color']) || 'rgba(0, 0, 0, 1)';
        style.backColor = getCol(['backcolour', 'backcolor', 'back_color']) || 'rgba(0, 0, 0, 0.5)';
        
        return style;
    }

    function parseASSDialogue(dialogueData, formatOrder, styles, playResX, playResY) {
        const parts = dialogueData.split(',');
        const dialogue = {};
        formatOrder.forEach((field, idx) => {
            if (field === 'text') dialogue.text = parts.slice(idx).join(',').trim();
            else if (idx < parts.length) dialogue[field] = parts[idx].trim();
        });
        
        const start = parseASSTimestamp(dialogue.start);
        const end = parseASSTimestamp(dialogue.end);
        if (isNaN(start) || isNaN(end)) return null;
        
        let styleName = (dialogue.style || 'Default').trim();
        const _styleMode = document.getElementById('ss-style')?.value || 'full';
        
        if (_styleMode === 'nobox' && styleName.includes('Box')) styleName = styleName.replace('Box', '');
        
        const baseStyle = styles[styleName.toLowerCase()] || styles[styleName] || styles['default'] || styles['Default'] || getDefaultASSStyle();
        const globalTags = extractGlobalTags(dialogue.text);
        const style = { ...baseStyle, ...globalTags };
        
        return {
            start, end, duration: end - start, 
            style, styleName,
            spans: processASSText(dialogue.text, style, styles).spans,
            layer: parseInt(dialogue.layer) || 0,
            marginL: parseInt(dialogue.marginl) || style.marginl || 0,
            marginR: parseInt(dialogue.marginr) || style.marginr || 0,
            marginV: parseInt(dialogue.marginv) || style.marginv || 0,
            pos: globalTags.pos, move: globalTags.move,
            org: globalTags.org, clip: globalTags.clip,
            fadeIn: globalTags.fadeIn || 0, fadeOut: globalTags.fadeOut || 0,
            playResX, playResY
        };
    }

    function extractGlobalTags(text) {
        const tags = {};
        const posMatch = text.match(/\\pos\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
        if (posMatch) tags.pos = { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]) };
        
        const moveMatch = text.match(/\\+move\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)(?:\s*,\s*([\d.-]+)\s*,\s*([\d.-]+))?\s*\)/);
        if (moveMatch) {
            tags.move = {
                x1: parseFloat(moveMatch[1]), y1: parseFloat(moveMatch[2]),
                x2: parseFloat(moveMatch[3]), y2: parseFloat(moveMatch[4]),
                t1: moveMatch[5] ? parseFloat(moveMatch[5]) : 0,
                t2: moveMatch[6] ? parseFloat(moveMatch[6]) : null
            };
        }
        
        const fadMatch = text.match(/\\+fad\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
        if (fadMatch) { tags.fadeIn = parseFloat(fadMatch[1]); tags.fadeOut = parseFloat(fadMatch[2]); }
        
        const anMatch = text.match(/\\an\s*(\d+)/);
        if (anMatch) tags.alignment = parseInt(anMatch[1]);

        const orgMatch = text.match(/\\org\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
        if (orgMatch) tags.org = { x: parseFloat(orgMatch[1]), y: parseFloat(orgMatch[2]) };

        return tags;
    }

    function processASSText(text, baseStyle, allStyles) {
        const spans = [];
        let currentStyle = { ...baseStyle };
        let currentText = '';
        let i = 0;
        let karaokeTime = 0;
        
        text = text.replace(/[\u200B\u200C\u200D\uFEFF\u200E\u200F]/g, '');
        text = text.replace(/\\N/g, '\n').replace(/\\n/g, '\n').replace(/\\h/g, '\u00A0');
        
        while (i < text.length) {
            if (text[i] === '{') {
                const endBrace = text.indexOf('}', i);
                if (endBrace === -1) { currentText += text[i]; i++; continue; }
                const tagContent = text.substring(i + 1, endBrace);
                
                if (tagContent.startsWith('*')) { i = endBrace + 1; continue; }
                
                if (currentText) {
                    spans.push({ text: currentText, style: { ...currentStyle }, karaokeOffset: karaokeTime, baseStyle: baseStyle });
                    if (currentStyle.karaokeDuration) karaokeTime += currentStyle.karaokeDuration;
                    currentStyle.karaokeDuration = 0;
                    currentText = '';
                }
                currentStyle = processOverrideTags(tagContent, currentStyle, allStyles);
                i = endBrace + 1;
            } else {
                currentText += text[i];
                i++;
            }
        }
        
        if (currentText) spans.push({ text: currentText, style: { ...currentStyle }, karaokeOffset: karaokeTime, baseStyle: baseStyle });
        return { spans };
    }

    function processOverrideTags(tagString, currentStyle, allStyles) {
        const style = { ...currentStyle };
        const tAnimations = [];
        
        let processedTagString = tagString.replace(/\\t\(([^)}]*(?:\([^)]*\)[^)}]*)*)[)}]?/gi, (match, content) => {
            if (content) tAnimations.push(content);
            return ''; 
        });
        
        if (tAnimations.length > 0) {
            style.animations = (style.animations || []).concat(tAnimations);
        }
        
        const tagRegex = /\\(\d?[a-zA-Z]+)([^\\]*)/g;
        let match;
        
        while ((match = tagRegex.exec(processedTagString)) !== null) {
            let tag = match[1].toLowerCase();
            let value = match[2].trim();

            // RECOMBINAR \fn CUANDO VIENE PEGADO AL NOMBRE (ej: \fnComic Sans MS)
            if (tag.startsWith('fn') && tag.length > 2) {
                value = tag.slice(2) + (value ? ' ' + value : '');
                tag = 'fn';
            }

            if (match[1].length > 1 && match[1][0] === 'r' && /[A-Z]/.test(match[1][1])) {
                value = match[1].slice(1) + (match[2] ? match[2].trim() : '');
                tag = 'r';
            }

            switch (tag) {
                case 'b': style.bold = (value === '1' || value === '' || parseInt(value) >= 700) ? 1 : 0; break;
                case 'i': style.italic = (value === '1' || value === '') ? 1 : 0; break;
                case 'u': style.underline = (value === '1' || value === '') ? 1 : 0; break;
                case 's': style.strikeout = (value === '1' || value === '') ? 1 : 0; break;
                case 'fn': style.fontname = value || currentStyle.fontname; break;
                case 'fs': style.fontsize = parseFloat(value) || currentStyle.fontsize; break;
                case 'fscx': style.scalex = parseFloat(value) || 100; break;
                case 'fscy': style.scaley = parseFloat(value) || 100; break;
                case 'fsp': style.spacing = parseFloat(value) || 0; break;
                case 'c': case '1c': style.primaryColor = assColorToCSS(value); break;
                case '2c': style.secondaryColor = assColorToCSS(value); break;
                case '3c': style.outlineColor = assColorToCSS(value); break;
                case '4c': style.backColor = assColorToCSS(value); break;
                case 'alpha': 
                    const aVal = parseInt(value.replace(/&H|&/g, ''), 16) || 0;
                    const cssAlpha = (255 - aVal) / 255;
                    style.alpha = style.primaryAlpha = style.secondaryAlpha = style.outlineAlpha = style.backAlpha = cssAlpha;
                    break;
                case '1a': style.primaryAlpha = parseASSAlpha(value); break;
                case '3a': style.outlineAlpha = parseASSAlpha(value); break;
                case '4a': style.backAlpha = parseASSAlpha(value); break;
                case 'bord': style.outline = parseFloat(value) || 0; break;
                case 'shad': style.shadow = parseFloat(value) || 0; break;
                case 'be': case 'blur': style.blur = parseFloat(value) || 0; break;
                case 'frx': style.rotateX = parseFloat(value) || 0; break;
                case 'fry': style.rotateY = parseFloat(value) || 0; break;
                case 'frz': case 'fr': style.rotateZ = parseFloat(value) || 0; break;
                case 'an': style.alignment = parseInt(value) || 2; break;
                case 'k': case 'kf': case 'ko': case 'K':
                    style.karaokeDuration = parseInt(value) * 10 || 0; 
                    style.karaokeType = tag;
                    break;
                case 'r':
                    const baseR = (value && (allStyles[value.toLowerCase()] || allStyles[value])) ? (allStyles[value.toLowerCase()] || allStyles[value]) : (allStyles['default'] || allStyles['Default'] || getDefaultASSStyle());
                    ['primaryAlpha','outlineAlpha','backAlpha','alpha','primaryColor','outlineColor','backColor','fontname','fontsize','bold','italic','underline','strikeout','scalex','scaley','spacing','outline','shadow','blur','animations','karaokeDuration'].forEach(k => delete style[k]);
                    Object.assign(style, baseR);
                    break;
            }
        }
        return style;
    }

    function parseAndApplyAnimations(style, relativeTimeMs, cueDurationMs) {
        if (!style.animations || style.animations.length === 0) return style;
        const animatedStyle = { ...style };
        
        for (const animStr of style.animations) {
            let t1 = 0, t2 = cueDurationMs, accel = 1, styleStr = animStr;
            const timingMatch = animStr.match(/^([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?,?\s*\\(.+)/);
            if (timingMatch) {
                t1 = parseFloat(timingMatch[1]); t2 = parseFloat(timingMatch[2]);
                if (timingMatch[3]) accel = parseFloat(timingMatch[3]);
                styleStr = '\\' + timingMatch[4];
            }
            
            let progress = 0;
            if (relativeTimeMs > t1 && relativeTimeMs < t2 && t2 > t1) progress = (relativeTimeMs - t1) / (t2 - t1);
            else if (relativeTimeMs >= t2) progress = 1;
            
            if (accel !== 1) progress = Math.pow(progress, accel);
            
            const tagRegex = /\\(\d?[a-zA-Z]+)([^\\]*)/g;
            let match;
            while ((match = tagRegex.exec(styleStr)) !== null) {
                const tag = match[1].toLowerCase();
                const value = match[2].trim();
                
                switch (tag) {
                    case 'fs': animatedStyle.fontsize = (animatedStyle.fontsize || 20) + (parseFloat(value) - (animatedStyle.fontsize || 20)) * progress; break;
                    case 'c': case '1c': if (progress > 0) animatedStyle.primaryColor = interpolateColor(animatedStyle.primaryColor || 'rgba(255,255,255,1)', assColorToCSS(value), progress); break;
                    case '3c': if (progress > 0) animatedStyle.outlineColor = interpolateColor(animatedStyle.outlineColor || 'rgba(0,0,0,1)', assColorToCSS(value), progress); break;
                    case '4c': if (progress > 0) animatedStyle.backColor = interpolateColor(animatedStyle.backColor || 'rgba(0,0,0,0.5)', assColorToCSS(value), progress); break;
                    case 'fscx': animatedStyle.scalex = (animatedStyle.scalex || 100) + (parseFloat(value) - (animatedStyle.scalex || 100)) * progress; break;
                    case 'fscy': animatedStyle.scaley = (animatedStyle.scaley || 100) + (parseFloat(value) - (animatedStyle.scaley || 100)) * progress; break;
                    case 'frz': case 'fr': animatedStyle.rotateZ = (animatedStyle.rotateZ || 0) + (parseFloat(value) - (animatedStyle.rotateZ || 0)) * progress; break;
                    case 'frx': animatedStyle.rotateX = (animatedStyle.rotateX || 0) + (parseFloat(value) - (animatedStyle.rotateX || 0)) * progress; break;
                    case 'fry': animatedStyle.rotateY = (animatedStyle.rotateY || 0) + (parseFloat(value) - (animatedStyle.rotateY || 0)) * progress; break;
                    case 'alpha': case '1a': 
                        const curA = animatedStyle.primaryAlpha !== undefined ? animatedStyle.primaryAlpha : 1;
                        animatedStyle.primaryAlpha = curA + (parseASSAlpha(value) - curA) * progress;
                        animatedStyle.alpha = animatedStyle.outlineAlpha = animatedStyle.backAlpha = animatedStyle.primaryAlpha;
                        break;
                }
            }
        }
        return animatedStyle;
    }

    function interpolateColor(color1, color2, progress) {
        const parse = (c) => {
            const m = c.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
            if (m) return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: parseFloat(m[4] || 1) };
            return { r: 255, g: 255, b: 255, a: 1 };
        };
        const c1 = parse(color1), c2 = parse(color2);
        return `rgba(${Math.round(c1.r + (c2.r - c1.r) * progress)}, ${Math.round(c1.g + (c2.g - c1.g) * progress)}, ${Math.round(c1.b + (c2.b - c1.b) * progress)}, ${(c1.a + (c2.a - c1.a) * progress).toFixed(2)})`;
    }

    function parseASSTimestamp(ts) {
        if (!ts) return NaN;
        const match = ts.match(/(\d+):(\d{2}):(\d{2})\.(\d{2,3})/);
        if (!match) return NaN;
        const msPart = match[4].length === 2 ? parseInt(match[4]) * 10 : parseInt(match[4]);
        
        return (parseInt(match[1]) * 3600000) + 
               (parseInt(match[2]) * 60000) + 
               (parseInt(match[3]) * 1000) + 
               msPart;
    }

    function assColorToCSS(color) {
        if (!color) return 'rgba(255, 255, 255, 1)';
        let hex = color.toString().replace(/&H|&/gi, '');
        while (hex.length < 8) hex = '0' + hex;
        return `rgba(${parseInt(hex.substring(6, 8), 16)}, ${parseInt(hex.substring(4, 6), 16)}, ${parseInt(hex.substring(2, 4), 16)}, ${((255 - parseInt(hex.substring(0, 2), 16)) / 255).toFixed(2)})`;
    }

    function parseASSAlpha(value) { return (255 - (parseInt(value.replace('&H', '').replace('&', ''), 16) || 0)) / 255; }

    function hexToRGBA(hex, alpha) {
        if (hex.startsWith('#')) return `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${alpha})`;
        return hex; 
    }

    function applyAlphaToColor(color, alpha) {
        const match = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/);
        return match ? `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha.toFixed(2)})` : color;
    }

    function getDefaultASSStyle() {
        return { name: 'Default', fontname: 'Roboto', fontsize: 20, primaryColor: 'rgba(255, 255, 255, 1)', secondaryColor: 'rgba(255, 0, 0, 1)', outlineColor: 'rgba(0, 0, 0, 1)', backColor: 'rgba(0, 0, 0, 0.5)', outline: 2, shadow: 2, alignment: 2, marginl: 10, marginr: 10, marginv: 10, scalex: 100, scaley: 100, borderstyle: 1 };
    }

    // ==========================================
    // MAPEO DE FUENTES EXACTO (EVITA FALLBACKS ERRÓNEOS)
    // ==========================================
    function applyFontToSpan(span, fontName) {
        if (!fontName) fontName = 'Roboto';
        const raw = String(fontName).trim();
        // Limpiamos la cadena de espacios, guiones y signos para un match perfecto
        const fn = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        let fontFamily = '"YouTube Noto", Roboto, "Arial Unicode Ms", Arial, sans-serif'; 

        if (fn.includes('serifmono') || fn.includes('courier') || fn.includes('cutive') || fn.includes('nimbus')) {
            fontFamily = '"Courier New", Courier, "Nimbus Mono L", "Cutive Mono", monospace';
        } else if (fn.includes('serifpropor') || fn.includes('times') || fn.includes('georgia') || fn.includes('cambria')) {
            fontFamily = '"Times New Roman", Times, Georgia, Cambria, "PT Serif Caption", serif';
        } else if (fn.includes('sansserifmono') || fn.includes('lucida') || fn.includes('consolas') || fn.includes('monaco')) {
            fontFamily = '"Lucida Console", "DejaVu Sans Mono", Monaco, Consolas, "PT Mono", monospace';
        } else if (fn.includes('casual') || fn.includes('comic') || fn.includes('handlee')) {
            fontFamily = '"Comic Sans MS", Impact, Handlee, fantasy';
        } else if (fn.includes('cursiva') || fn.includes('corsiva') || fn.includes('chancery') || fn.includes('dancing')) {
            fontFamily = '"Monotype Corsiva", "URW Chancery L", "Apple Chancery", "Dancing Script", cursive';
        } else if (fn.includes('versalitas') || fn.includes('carrois') || fn.includes('smallcaps')) {
            fontFamily = '"Carrois Gothic SC", sans-serif';
            span.style.setProperty('font-variant', 'small-caps', 'important');
        } else if (fn.includes('roboto') || fn.includes('sansserifpropor') || fn.includes('arial') || fn.includes('default')) {
            fontFamily = '"YouTube Noto", Roboto, "Arial Unicode Ms", Arial, sans-serif';
        } else {
            fontFamily = `"${raw}", "YouTube Noto", Roboto, Arial, sans-serif`;
        }

        span.style.setProperty('font-family', fontFamily, 'important');
    }

    function getASSTransform(alignment) {
        const transforms = { 1: 'translate(0%, -100%)', 2: 'translate(-50%, -100%)', 3: 'translate(-100%, -100%)', 4: 'translate(0%, -50%)', 5: 'translate(-50%, -50%)', 6: 'translate(-100%, -50%)', 7: 'translate(0%, 0%)', 8: 'translate(-50%, 0%)', 9: 'translate(-100%, 0%)' };
        return transforms[alignment] || 'translate(-50%, -100%)';
    }

    function getTransformOrigin(alignment) {
        const origins = { 1: 'left bottom', 2: 'center bottom', 3: 'right bottom', 4: 'left center', 5: 'center center', 6: 'right center', 7: 'left top', 8: 'center top', 9: 'right top' };
        return origins[alignment] || 'center bottom';
    }

    function renderASSCue(container, cue, relativeTimeMs, cueDurationMs, videoWidth, videoHeight, scaleX, scaleY) {
        const style = cue.style || {};
        const _styleMode = document.getElementById('ss-style')?.value || 'full';
        
        if (_styleMode === 'clean' || _styleMode === 'srt' || _styleMode === 'srt_color' || _styleMode === 'traduccion') {
            cue.pos = null; cue.move = null; cue.frz = cue.frx = cue.fry = null; cue.fscx = cue.fscy = null;
            style.alignment = cue.srtAlign || 2; cue.marginV = 20; style.animations = [];
            cue.fadeIn = 0; cue.fadeOut = 0; 
        }

        const _fxFade = document.getElementById('ss-fx-fade')?.checked !== false;
        const _fxShadow = document.getElementById('ss-fx-shadow')?.checked !== false;
        const _fxBoxGlobal = document.getElementById('ss-fx-box')?.checked === true; 
        const _ssMarginV = parseFloat(document.getElementById('ss-margin')?.value || '0') / 100;
        const _userScale = parseFloat(document.getElementById('ss-scale')?.value || '1') || 1;
        
        let posX, posY;
        const alignment = style.alignment || 2;
        
        if (cue.move) {
            const t1 = cue.move.t1 || 0, t2 = cue.move.t2 !== null ? cue.move.t2 : cueDurationMs;
            let progress = (relativeTimeMs <= t1) ? 0 : (relativeTimeMs >= t2) ? 1 : (relativeTimeMs - t1) / (t2 - t1);
            posX = cue.move.x1 + (cue.move.x2 - cue.move.x1) * progress;
            posY = cue.move.y1 + (cue.move.y2 - cue.move.y1) * progress;
        } else if (cue.pos) {
            posX = cue.pos.x; posY = cue.pos.y;
        } else {
            posX = (alignment % 3 === 1) ? (cue.marginL || 10) : (alignment % 3 === 0) ? cue.playResX - (cue.marginR || 10) : cue.playResX / 2;
            posY = (alignment >= 7) ? (cue.marginV || 10) : (alignment >= 4) ? cue.playResY / 2 : cue.playResY - (cue.marginV || 10);
        }
        
        container.style.left = (posX * scaleX) + 'px';
        container.style.top = ((posY * scaleY) + (_ssMarginV * videoHeight)) + 'px';
        
        let transformStr = getASSTransform(alignment);
        const rotZ = style.rotateZ || 0, rotX = style.rotateX || 0, rotY = style.rotateY || 0;
        
        if (rotX !== 0) transformStr += ` rotateX(${rotX}deg)`;
        if (rotY !== 0) transformStr += ` rotateY(${rotY}deg)`;
        if (rotZ !== 0) transformStr += ` rotateZ(${-rotZ}deg)`; 
        
        container.style.transform = transformStr;
        container.style.transformOrigin = getTransformOrigin(alignment);
        if (rotX || rotY || rotZ) {
            container.style.transformStyle = 'preserve-3d';
            container.parentElement.style.perspective = '1000px';
        }

        container.style.textAlign = (alignment % 3 === 1) ? 'left' : (alignment % 3 === 0) ? 'right' : 'center';

        if (_fxFade && cue.fadeIn === undefined && cue.fadeOut === undefined) {
             container.style.opacity = 1;
        } else if (_fxFade) {
            let opacity = 1;
            if (cue.fadeIn > 0 && relativeTimeMs < cue.fadeIn) opacity = relativeTimeMs / cue.fadeIn;
            else if (cue.fadeOut > 0 && relativeTimeMs > (cueDurationMs - cue.fadeOut)) opacity = Math.max(0, (cueDurationMs - relativeTimeMs) / cue.fadeOut);
            container.style.opacity = opacity;
        } else {
            container.style.opacity = 1;
        }

        cue.spans.forEach(spanData => {
            if (!spanData.text) return;
            const lines = spanData.text.split('\n');
            
            lines.forEach((lineText, lineIdx) => {
                if (lineIdx > 0) container.appendChild(document.createElement('br'));
                if (!lineText) return;
                
                const span = document.createElement('span');
                span.style.whiteSpace = cue.srt ? 'pre-wrap' : 'pre';
                
                let sStyle = { ...(spanData.style || style) };
                
                if (sStyle.animations && sStyle.animations.length > 0) {
                    sStyle = parseAndApplyAnimations(sStyle, relativeTimeMs, cueDurationMs);
                }

                if (_styleMode === 'clean') {
                    sStyle.primaryColor = 'rgba(255,255,255,1)';
                    sStyle.secondaryColor = 'rgba(255,255,255,1)';
                    sStyle.outline = 0; 
                    sStyle.shadow = 0; 
                    sStyle.animations = []; 
                    sStyle.karaokeDuration = 0;
                    sStyle.alpha = 1; 
                    sStyle.primaryAlpha = 1;
                    sStyle.outlineAlpha = 1;
                    sStyle.backAlpha = 1;
                    sStyle.bold = 0; 
                    sStyle.italic = 0;
                    sStyle.borderstyle = 1;
                } else if (_styleMode === 'srt') {
                    sStyle.primaryColor = 'rgba(255,255,255,1)'; 
                    sStyle.outlineColor = 'rgba(0,0,0,1)'; 
                    sStyle.outline = 1.5; 
                    sStyle.shadow = 1.5; 
                    sStyle.animations = [];
                    sStyle.alpha = 1; 
                    sStyle.primaryAlpha = 1; 
                    sStyle.karaokeDuration = 0;
                    sStyle.borderstyle = 1;
                } else if (_styleMode === 'srt_color' || _styleMode === 'traduccion') {
                    sStyle.secondaryColor = sStyle.primaryColor;
                    sStyle.outlineColor = 'rgba(0,0,0,1)'; 
                    sStyle.outline = 1.5; 
                    sStyle.shadow = 1.5; 
                    sStyle.animations = [];
                    sStyle.alpha = 1; 
                    sStyle.primaryAlpha = 1; 
                    sStyle.karaokeDuration = 0;
                    sStyle.borderstyle = 1;
                }

                if (!_fxShadow) { sStyle.outline = 0; sStyle.shadow = 0; sStyle.blur = 0; }

                // BÚSQUEDA JERÁRQUICA DE LA FUENTE (Span -> Cue -> Base -> Default)
                const fontNombreFinal = sStyle.fontname || sStyle.fontName || style.fontname || style.fontName || 'Roboto';
                applyFontToSpan(span, fontNombreFinal);

                const calcSize = (sStyle.fontsize || style.fontsize || 20) * scaleY * _userScale * 0.85;

                span.style.setProperty('font-size', `${calcSize}px`, 'important');
                span.style.setProperty('line-height', '1.2', 'important');
                span.style.setProperty('font-weight', sStyle.bold ? 'bold' : 'normal', 'important');
                span.style.setProperty('font-style', sStyle.italic ? 'italic' : 'normal', 'important');
                
                let textDeco = [];
                if (sStyle.underline) textDeco.push('underline');
                if (sStyle.strikeout) textDeco.push('line-through');
                span.style.setProperty('text-decoration', textDeco.length > 0 ? textDeco.join(' ') : 'none', 'important');
                
                if (sStyle.spacing) span.style.setProperty('letter-spacing', `${sStyle.spacing * scaleX}px`, 'important');

                const scaleXAttr = sStyle.scalex !== undefined ? sStyle.scalex : 100;
                const scaleYAttr = sStyle.scaley !== undefined ? sStyle.scaley : 100;
                if (scaleXAttr !== 100 || scaleYAttr !== 100) {
                    span.style.setProperty('display', 'inline-block', 'important');
                    span.style.setProperty('transform', `scale(${scaleXAttr/100}, ${scaleYAttr/100})`, 'important');
                }
                
                let pAlpha = sStyle.primaryAlpha !== undefined ? sStyle.primaryAlpha : (sStyle.alpha !== undefined ? sStyle.alpha : null);
                span.style.setProperty('color', pAlpha !== null ? applyAlphaToColor(sStyle.primaryColor, pAlpha) : sStyle.primaryColor, 'important');
                
                const shadows = [];
                let oAlpha = sStyle.outlineAlpha !== undefined ? sStyle.outlineAlpha : (sStyle.alpha !== undefined ? sStyle.alpha : null);
                let oColor = oAlpha !== null ? applyAlphaToColor(sStyle.outlineColor, oAlpha) : sStyle.outlineColor;
                
                let bAlpha = sStyle.backAlpha !== undefined ? sStyle.backAlpha : (sStyle.alpha !== undefined ? sStyle.alpha : null);
                let sColor = bAlpha !== null ? applyAlphaToColor(sStyle.backColor || 'rgba(0,0,0,0.5)', bAlpha) : (sStyle.backColor || 'rgba(0,0,0,0.5)');

                let outSize = sStyle.outline !== undefined ? sStyle.outline : (style.outline !== undefined ? style.outline : 2);
                let shadSize = sStyle.shadow !== undefined ? sStyle.shadow : (style.shadow !== undefined ? style.shadow : 2);
                let blurSize = sStyle.blur !== undefined ? sStyle.blur : (style.blur !== undefined ? style.blur : 0);

                const isNativeBox = (sStyle.borderstyle === 3 || style.borderstyle === 3);

                if (isNativeBox) {
                    span.style.setProperty('background-color', oColor, 'important');
                    span.style.setProperty('padding', '2px 6px', 'important');
                    span.style.setProperty('border-radius', '2px', 'important');
                } else if (_styleMode === 'full' || _styleMode === 'nobox' || _styleMode === 'srt' || _styleMode === 'srt_color' || _styleMode === 'traduccion') {
                    // ==========================================
                    // GLOW DIFUMINADO NATIVO + CONTORNOS + DROP SHADOW
                    // ==========================================
                    if (outSize > 0) {
                        const o = Math.min(Math.max(outSize * 0.4, 0.5), 1.4);
                        // Aplicamos el desenfoque base para simular el halo luminoso del render nativo
                        const blurBorde = 1.4; 
                        
                        shadows.push(
                            `0px 0px ${blurBorde}px ${oColor}`,
                            `0px 0px ${blurBorde * 1.5}px ${oColor}`,
                            `${o}px 0px ${blurBorde}px ${oColor}`, `-${o}px 0px ${blurBorde}px ${oColor}`,
                            `0px ${o}px ${blurBorde}px ${oColor}`, `0px -${o}px ${blurBorde}px ${oColor}`,
                            `${o}px ${o}px ${blurBorde}px ${oColor}`, `-${o}px -${o}px ${blurBorde}px ${oColor}`,
                            `${o}px -${o}px ${blurBorde}px ${oColor}`, `-${o}px ${o}px ${blurBorde}px ${oColor}`
                        );
                    }

                    if (shadSize > 0 || blurSize > 0) {
                        const sX = Math.min(Math.max(shadSize * 0.8, 1.5), 3);
                        const sY = Math.min(Math.max(shadSize * 0.8, 1.5), 3);
                        const b = blurSize > 0 ? Math.max(blurSize, 3) : 4; 
                        
                        shadows.push(`${sX}px ${sY}px ${b}px ${sColor}`);
                        shadows.push(`${sX * 1.2}px ${sY * 1.2}px ${b * 1.5}px ${sColor}`);
                        shadows.push(`0px 0px ${b}px ${sColor}`); // Relleno oscuro central
                    }
                    
                    span.style.setProperty('text-shadow', shadows.length ? shadows.join(', ') : 'none', 'important');
                    // ==========================================
                }
                
                if (!isNativeBox && _fxBoxGlobal && (_styleMode === 'srt' || _styleMode === 'srt_color' || _styleMode === 'clean' || _styleMode === 'traduccion')) {
                    const op = parseInt(document.getElementById('ss-box-opacity')?.value || '80') / 100;
                    let bgColor = applyAlphaToColor('rgba(0,0,0,1)', op);
                    if (document.getElementById('ss-box-color-enable')?.checked) bgColor = hexToRGBA(document.getElementById('ss-box-color').value, op);
                    span.style.setProperty('background-color', bgColor, 'important');
                    span.style.setProperty('padding', '4px 10px', 'important');
                    span.style.setProperty('border-radius', '5px', 'important');
                }

                const kOffset = spanData.karaokeOffset || 0, kDur = sStyle.karaokeDuration || 0;
                if (kDur > 0 || kOffset > 0) {
                    if (relativeTimeMs < kOffset) {
                        span.style.setProperty('color', sStyle.secondaryColor || 'rgba(255,0,0,1)', 'important');
                        span.style.setProperty('text-shadow', 'none', 'important');
                    } else if (sStyle.karaokeType === 'kf' && relativeTimeMs < kOffset + kDur) {
                        const prog = (relativeTimeMs - kOffset) / kDur;
                        span.style.setProperty('background', `linear-gradient(to right, ${sStyle.primaryColor} ${prog * 100}%, ${sStyle.secondaryColor} ${prog * 100}%)`, 'important');
                        span.style.setProperty('-webkit-background-clip', 'text', 'important');
                        span.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
                    }
                }

                span.textContent = lineText;
                container.appendChild(span);

                // --- NUEVO: SOPORTE PARA FURIGANA / \ytruby ---
                if (sStyle.ytruby) {
                    const rubyElem = document.createElement('ruby');
                    rubyElem.style.setProperty('ruby-position', 'over', 'important');
                    rubyElem.style.setProperty('ruby-align', 'center', 'important');
                    
                    const rtElem = document.createElement('rt');
                    rtElem.textContent = sStyle.ytruby;
                    rtElem.style.setProperty('font-size', '0.5em', 'important');
                    rtElem.style.setProperty('line-height', '1', 'important');
                    rtElem.style.setProperty('user-select', 'none', 'important');
                    
                    rubyElem.appendChild(document.createTextNode(lineText));
                    rubyElem.appendChild(rtElem);
                    span.appendChild(rubyElem);
                } else {
                    span.textContent = lineText;
                }

                container.appendChild(span);
            });
        });
    }

    return { limpiar, iniciarMotor, forceRender, getStats };
})();