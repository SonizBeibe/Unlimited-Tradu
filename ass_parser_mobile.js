// =========================================================================
// MOTOR S&S TRADU - ass_parser.js
// Procesamiento de archivos ASS, lógicas de efectos y renderizado en Video
// =========================================================================

window.SSTraduEngine = (function() {
    let subtitleData = null;
    let syncInterval = null;
    let overlayContainer = null;

    // --- CONTROLES DEL MOTOR ---
    function limpiar() {
        if (syncInterval) clearInterval(syncInterval);
        if (overlayContainer) overlayContainer.remove();
        subtitleData = null;
        syncInterval = null;
        overlayContainer = null;
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

    function iniciarMotor(assContent) {
        limpiar();
        subtitleData = parseASS(assContent);
        
        if (!subtitleData || !subtitleData.cues.length) return false;

        // REQUISITO: Filtro Anti-Chromas / Glitch (Deduplicación)
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
                    if ((cue.layer || 0) > (existente.layer || 0)) {
                        mapUnicos.set(key, cue);
                    }
                }
            });
            subtitleData.cues = Array.from(mapUnicos.values());
        }

        createOverlay();
        startSync();
        return true;
    }

    // --- CAPA VISUAL Y SINCRONIZACIÓN ---
    function createOverlay() {
        const video = document.querySelector('video');
        if (!video) return;
        const container = video.parentElement;
        
        overlayContainer = document.createElement('div');
        overlayContainer.id = 'sstradu-overlay';
        overlayContainer.style.position = 'absolute';
        overlayContainer.style.top = '0';
        overlayContainer.style.left = '0';
        overlayContainer.style.width = '100%';
        overlayContainer.style.height = '100%';
        overlayContainer.style.pointerEvents = 'none';
        overlayContainer.style.zIndex = '40'; // Encima del video, bajo los controles de YouTube
        container.appendChild(overlayContainer);
    }

    function startSync() {
        if (syncInterval) clearInterval(syncInterval);
        syncInterval = setInterval(() => {
            const video = document.querySelector('video');
            if (video && !video.paused) {
                renderCues(video.currentTime);
            }
        }, 33); // Aprox ~30fps
    }

    function renderCues(currentTimeSec) {
        if (!subtitleData || !overlayContainer) return;
        const timeMs = currentTimeSec * 1000;
        overlayContainer.innerHTML = ''; 
        
        const video = document.querySelector('video');
        if (!video) return;
        
        const vW = video.offsetWidth;
        const vH = video.offsetHeight;
        const scaleX = vW / subtitleData.playResX;
        const scaleY = vH / subtitleData.playResY;

        const activeCues = subtitleData.cues.filter(c => timeMs >= c.start && timeMs <= c.end);
        
        activeCues.forEach(cue => {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            renderASSCue(div, cue, timeMs - cue.start, cue.end - cue.start, vW, vH, scaleX, scaleY);
            overlayContainer.appendChild(div);
        });
    }

    // --- PARSER DEL ARCHIVO ASS ---
    function parseASS(content) {
        const lines = content.split(/\r?\n/);
        const styles = {};
        const cues = [];
        let playResX = 1280, playResY = 720;
        let currentSection = '', formatOrder = [], styleFormatOrder = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('[')) { 
                currentSection = trimmed.toLowerCase(); 
                continue; 
            }
            if (currentSection === '[script info]') {
                if (trimmed.startsWith('PlayResX:')) playResX = parseInt(trimmed.split(':')[1]) || 1280;
                if (trimmed.startsWith('PlayResY:')) playResY = parseInt(trimmed.split(':')[1]) || 720;
            }
            if (currentSection === '[v4+ styles]' || currentSection === '[v4 styles]') {
                if (trimmed.startsWith('Format:')) {
                    styleFormatOrder = trimmed.substring(7).split(',').map(s => s.trim().toLowerCase());
                } else if (trimmed.startsWith('Style:')) {
                    const style = parseASSStyle(trimmed.substring(6), styleFormatOrder);
                    if (style) styles[style.name] = style;
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
        const style = { outline: 2, shadow: 2, alignment: 2, fontsize: 20, marginl: 10, marginr: 10, marginv: 10 };
        const defaultOrder = ['name', 'fontname', 'fontsize', 'primarycolour', 'secondarycolour', 'outlinecolour', 'backcolour', 'bold', 'italic', 'underline', 'strikeout', 'scalex', 'scaley', 'spacing', 'angle', 'borderstyle', 'outline', 'shadow', 'alignment', 'marginl', 'marginr', 'marginv', 'encoding'];
        const order = formatOrder.length > 0 ? formatOrder : defaultOrder;
        
        order.forEach((field, idx) => { 
            if (idx < parts.length) style[field] = parts[idx]; 
        });
        
        ['fontsize', 'bold', 'italic', 'outline', 'shadow', 'alignment', 'marginl', 'marginr', 'marginv'].forEach(field => {
            if (style[field] !== undefined) style[field] = parseFloat(style[field]) || 0;
        });
        
        style.primaryColor = assColorToCSS(style.primarycolour);
        style.secondaryColor = assColorToCSS(style.secondarycolour);
        style.outlineColor = assColorToCSS(style.outlinecolour);
        style.backColor = assColorToCSS(style.backcolour);
        
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
        
        let styleName = dialogue.style || 'Default';
        
        // REQUISITO: "Sin cajas" -> Reemplazar sufijo Box
        const _styleMode = document.getElementById('ss-style')?.value || 'full';
        if (_styleMode === 'nobox' && styleName.includes('Box')) {
            styleName = styleName.replace('Box', '');
        }
        
        const baseStyle = styles[styleName] || getDefaultASSStyle();
        const globalTags = extractGlobalTags(dialogue.text);
        const style = { ...baseStyle, ...globalTags };
        
        return {
            start, end, duration: end - start, 
            style, styleName,
            spans: processASSText(dialogue.text, style).spans,
            layer: parseInt(dialogue.layer) || 0,
            marginL: parseInt(dialogue.marginl) || style.marginl || 0,
            marginR: parseInt(dialogue.marginr) || style.marginr || 0,
            marginV: parseInt(dialogue.marginv) || style.marginv || 0,
            pos: globalTags.pos, move: globalTags.move,
            fadeIn: globalTags.fadeIn || 0, fadeOut: globalTags.fadeOut || 0,
            playResX, playResY
        };
    }

    // --- PROCESAMIENTO DE TAGS Y TEXTOS ---
    function extractGlobalTags(text) {
        const tags = {};
        
        const posMatch = text.match(/\\pos\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
        if (posMatch) tags.pos = { x: parseFloat(posMatch[1]), y: parseFloat(posMatch[2]) };
        
        const moveMatch = text.match(/\\move\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)\s*,\s*([\d.-]+)/);
        if (moveMatch) {
            tags.move = { 
                x1: parseFloat(moveMatch[1]), y1: parseFloat(moveMatch[2]), 
                x2: parseFloat(moveMatch[3]), y2: parseFloat(moveMatch[4]) 
            };
        }
        
        const fadMatch = text.match(/\\fad\s*\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
        if (fadMatch) { 
            tags.fadeIn = parseFloat(fadMatch[1]); 
            tags.fadeOut = parseFloat(fadMatch[2]); 
        }
        
        const anMatch = text.match(/\\an\s*(\d+)/);
        if (anMatch) tags.alignment = parseInt(anMatch[1]);
        
        return tags;
    }

    function processASSText(text, baseStyle) {
        const spans = [];
        let currentStyle = { ...baseStyle };
        const parts = text.split(/(\{.*?\})/g);
        let karaokeOffset = 0;
        
        parts.forEach(part => {
            if (part.startsWith('{') && part.endsWith('}')) {
                const tags = part.slice(1, -1);
                
                const cMatch = tags.match(/\\1?c&H([0-9a-fA-F]+)/i);
                if (cMatch) currentStyle.primaryColor = assColorToCSS('&H' + cMatch[1]);
                
                const c2Match = tags.match(/\\2c&H([0-9a-fA-F]+)/i);
                if (c2Match) currentStyle.secondaryColor = assColorToCSS('&H' + c2Match[1]);
                
                const alphaMatch = tags.match(/\\alpha&H([0-9a-fA-F]+)/i);
                if (alphaMatch) currentStyle.alpha = (255 - parseInt(alphaMatch[1], 16)) / 255;
                
                const kMatch = tags.match(/\\[kK][fo]?(\d+)/);
                if (kMatch) {
                    currentStyle.karaokeDuration = parseInt(kMatch[1]) * 10;
                    currentStyle.karaokeType = tags.includes('\\kf') ? 'kf' : 'k';
                }
            } else if (part.length > 0) {
                spans.push({
                    text: part,
                    style: { ...currentStyle },
                    karaokeOffset: karaokeOffset,
                    baseStyle: baseStyle
                });
                if (currentStyle.karaokeDuration) karaokeOffset += currentStyle.karaokeDuration;
                currentStyle.karaokeDuration = 0; // Reset
            }
        });
        
        if (spans.length === 0 && text.trim() !== '') {
            spans.push({ text: text, style: baseStyle, karaokeOffset: 0, baseStyle: baseStyle });
        }
        
        return { spans };
    }

    // --- UTILIDADES ---
    function parseASSTimestamp(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        if (parts.length < 3) return 0;
        const sParts = parts[2].split('.');
        return (parseInt(parts[0]) * 3600000) + 
               (parseInt(parts[1]) * 60000) + 
               (parseInt(sParts[0]) * 1000) + 
               (sParts[1] ? parseInt(sParts[1].padEnd(3, '0')) : 0);
    }

    function assColorToCSS(colorStr) {
        if (!colorStr) return 'rgba(255,255,255,1)';
        const m = colorStr.match(/&H([0-9a-fA-F]{2})?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/i);
        if (m) {
            const a = m[1] ? (255 - parseInt(m[1], 16)) / 255 : 1;
            return `rgba(${parseInt(m[4], 16)}, ${parseInt(m[3], 16)}, ${parseInt(m[2], 16)}, ${a})`;
        }
        return 'rgba(255,255,255,1)';
    }

    function hexToRGBA(hex, alpha) {
        if (hex.startsWith('#')) {
            let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return hex; 
    }

    function applyAlphaToColor(colorStr, alpha) {
        if (colorStr.startsWith('rgba')) {
            return colorStr.replace(/[\d\.]+\)$/g, alpha + ')');
        } else if (colorStr.startsWith('rgb')) {
            return colorStr.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        return colorStr;
    }

    function getDefaultASSStyle() {
        return {
            name: 'Default', fontname: 'Arial', fontsize: 20,
            primaryColor: 'rgba(255,255,255,1)', secondaryColor: 'rgba(255,0,0,1)',
            outlineColor: 'rgba(0,0,0,1)', backColor: 'rgba(0,0,0,0.5)',
            bold: 0, italic: 0, outline: 2, shadow: 2, alignment: 2,
            marginl: 10, marginr: 10, marginv: 10
        };
    }

    function getASSFontFamily(fontName) {
        const fn = String(fontName).trim().toLowerCase();
        if (fn.includes('courier')) return '"Courier New", Courier, monospace';
        if (fn.includes('times') || fn.includes('georgia')) return '"Times New Roman", serif';
        if (fn.includes('comic')) return '"Comic Sans MS", cursive, sans-serif';
        if (fn.includes('impact') || fn.includes('carrois')) return '"Carrois Gothic SC", Impact, sans-serif';
        return 'Roboto, Arial, sans-serif';
    }

    function getASSTransform(alignment) {
        const transforms = {
            1: 'translate(0%, -100%)', 2: 'translate(-50%, -100%)', 3: 'translate(-100%, -100%)',
            4: 'translate(0%, -50%)',  5: 'translate(-50%, -50%)',  6: 'translate(-100%, -50%)',
            7: 'translate(0%, 0%)',    8: 'translate(-50%, 0%)',    9: 'translate(-100%, 0%)'
        };
        return transforms[alignment] || 'translate(-50%, -100%)';
    }

    // --- RENDERIZADO DEL SUBTÍTULO ---
    function renderASSCue(container, cue, relativeTimeMs, cueDurationMs, videoWidth, videoHeight, scaleX, scaleY) {
        const style = cue.style || {};
        const _styleMode = document.getElementById('ss-style')?.value || 'full';
        
        // REQUISITO: Anulación estricta para SRT Limpio
        if (_styleMode === 'clean' || _styleMode === 'srt') {
            cue.pos = null; cue.move = null; 
            style.alignment = 2; 
            cue.marginV = 20;
        }

        const _fxAnim = document.getElementById('ss-fx-anim')?.checked !== false;
        const _fxBox = document.getElementById('ss-fx-box')?.checked === true;
        const _ssMarginV = parseFloat(document.getElementById('ss-margin')?.value || '0') / 100;
        
        let posX, posY;
        const alignment = style.alignment || 2;
        
        // Coordenadas
        if (cue.move) {
            let progress = (relativeTimeMs <= 0) ? 0 : (relativeTimeMs >= cueDurationMs) ? 1 : (relativeTimeMs / cueDurationMs);
            posX = cue.move.x1 + (cue.move.x2 - cue.move.x1) * progress;
            posY = cue.move.y1 + (cue.move.y2 - cue.move.y1) * progress;
        } else if (cue.pos) {
            posX = cue.pos.x; 
            posY = cue.pos.y;
        } else {
            const mLeft = cue.marginL || 10;
            const mRight = cue.marginR || 10;
            const mVert = cue.marginV || 10;
            
            posX = (alignment % 3 === 1) ? mLeft : (alignment % 3 === 0) ? cue.playResX - mRight : cue.playResX / 2;
            posY = (alignment >= 7) ? mVert : (alignment >= 4) ? cue.playResY / 2 : cue.playResY - mVert;
        }
        
        container.style.left = (posX * scaleX) + 'px';
        container.style.top = ((posY * scaleY) + (_ssMarginV * videoHeight)) + 'px';
        container.style.transform = getASSTransform(alignment);
        container.style.textAlign = (alignment % 3 === 1) ? 'left' : (alignment % 3 === 0) ? 'right' : 'center';

        // REQUISITO: Transiciones / Animaciones
        if (_fxAnim) {
            let opacity = 1;
            if (cue.fadeIn > 0 && relativeTimeMs < cue.fadeIn) {
                opacity = relativeTimeMs / cue.fadeIn;
            } else if (cue.fadeOut > 0 && relativeTimeMs > (cueDurationMs - cue.fadeOut)) {
                opacity = Math.max(0, (cueDurationMs - relativeTimeMs) / cue.fadeOut);
            }
            container.style.opacity = opacity;
        } else {
            container.style.opacity = 1;
        }

        // REQUISITO: Cajas Independientes
        if (_fxBox) {
            const op = parseInt(document.getElementById('ss-box-opacity')?.value || '80') / 100;
            let bgColor = applyAlphaToColor(style.backColor || 'rgba(0,0,0,1)', op);
            if (document.getElementById('ss-box-color-enable')?.checked) {
                bgColor = hexToRGBA(document.getElementById('ss-box-color').value, op);
            }
            container.style.backgroundColor = bgColor;
            container.style.padding = '4px 10px'; 
            container.style.borderRadius = '5px';
        }

        const _userScale = parseFloat(document.getElementById('ss-scale')?.value || '1') || 1;

        // Render de Letras/Spans
        cue.spans.forEach(spanData => {
            if (!spanData.text) return;
            const lines = spanData.text.split('\\n').join('\\N').split('\\N');
            
            lines.forEach((lineText, lineIdx) => {
                if (lineIdx > 0) container.appendChild(document.createElement('br'));
                if (!lineText) return;
                
                const span = document.createElement('span');
                let sStyle = { ...spanData.style };

                // Apagar Karaokes si se desactivó animaciones
                if (!_fxAnim) { 
                    sStyle.karaokeDuration = 0; 
                    sStyle.secondaryColor = sStyle.primaryColor; 
                }

                // REQUISITOS: Overrides "Solo Limpio", "SRT B/N" y "SRT Color"
                if (_styleMode === 'clean') {
                    sStyle.primaryColor = 'rgba(255,255,255,1)'; 
                    sStyle.outline = 0; 
                    sStyle.shadow = 0;
                } else if (_styleMode === 'srt') {
                    sStyle.primaryColor = 'rgba(255,255,255,1)'; 
                    sStyle.outlineColor = 'rgba(0,0,0,1)'; 
                    sStyle.outline = 1.5; 
                    sStyle.shadow = 1.5;
                } else if (_styleMode === 'srt_color') {
                    sStyle.secondaryColor = sStyle.primaryColor; 
                    sStyle.outlineColor = 'rgba(0,0,0,1)'; 
                    sStyle.outline = 1.5; 
                    sStyle.shadow = 1.5;
                }

                // Aplicar estilos calculados
                span.style.fontFamily = getASSFontFamily(sStyle.fontname || sStyle.fontName || '');
                span.style.fontSize = `${Math.max(14, (sStyle.fontsize || 20) * scaleY * 0.8625 * _userScale)}px`;
                span.style.color = applyAlphaToColor(sStyle.primaryColor, sStyle.alpha || 1);
                span.style.fontWeight = sStyle.bold ? 'bold' : 'normal';
                span.style.fontStyle = sStyle.italic ? 'italic' : 'normal';
                
                const shadows = [];
                if (sStyle.outline > 0) {
                    const oColor = applyAlphaToColor(sStyle.outlineColor, sStyle.alpha || 1);
                    shadows.push(`1.2px 0 0 ${oColor}`, `-1.2px 0 0 ${oColor}`, `0 1.2px 0 ${oColor}`, `0 -1.2px 0 ${oColor}`);
                }
                if (sStyle.shadow > 0) {
                    const sColor = applyAlphaToColor(sStyle.backColor || 'rgba(0,0,0,0.5)', sStyle.alpha || 1);
                    shadows.push(`${sStyle.shadow}px ${sStyle.shadow}px ${sStyle.shadow * 1.2}px ${sColor}`);
                }
                span.style.textShadow = shadows.length ? shadows.join(', ') : 'none';

                // Efecto Karaoke Nativo (Degradado Webkit)
                const kOffset = spanData.karaokeOffset || 0;
                const kDur = sStyle.karaokeDuration || 0;
                
                if (kDur > 0 || kOffset > 0) {
                    if (relativeTimeMs < kOffset) {
                        span.style.color = sStyle.secondaryColor || 'rgba(255,0,0,1)';
                        span.style.textShadow = 'none';
                    } else if (sStyle.karaokeType === 'kf' && relativeTimeMs < kOffset + kDur) {
                        const prog = (relativeTimeMs - kOffset) / kDur;
                        const pCol = sStyle.primaryColor;
                        const sCol = sStyle.secondaryColor;
                        span.style.background = `linear-gradient(to right, ${pCol} ${prog * 100}%, ${sCol} ${prog * 100}%)`;
                        span.style.webkitBackgroundClip = 'text';
                        span.style.webkitTextFillColor = 'transparent';
                    }
                }

                span.textContent = lineText;
                container.appendChild(span);
            });
        });
    }

    // Exponer solo las funciones necesarias para content.js
    return {
        limpiar,
        iniciarMotor,
        forceRender,
        getStats
    };
})();