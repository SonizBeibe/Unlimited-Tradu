window.SSTraduEngine = (function() {
    let subtitleData = null;
    let syncInterval = null;
    let overlayContainer = null;
    let lastRenderedTime = -1; 

    function limpiar() {
        if (syncInterval) clearInterval(syncInterval);
        if (overlayContainer) overlayContainer.remove();
        subtitleData = null;
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

    function iniciarMotor(assContent) {
        limpiar();
        subtitleData = parseASS(assContent);
        if (!subtitleData || !subtitleData.cues.length) return false;

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

        const activeCues = subtitleData.cues.filter(c => timeMs >= c.start && timeMs <= c.end);
        
        activeCues.forEach(cue => {
            const div = document.createElement('div');
            div.style.position = 'absolute';
            div.style.zIndex = 10 + (cue.layer || 0);
            div.style.whiteSpace = 'nowrap';
            renderASSCue(div, cue, timeMs - cue.start, cue.end - cue.start, videoRect.width, videoRect.height, scaleX, scaleY);
            overlayContainer.appendChild(div);
        });
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
                    if (style) styles[style.name.toLowerCase()] = style; 
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
        const style = { outline: 2, shadow: 2, alignment: 2, fontsize: 20, marginl: 10, marginr: 10, marginv: 10, scalex: 100, scaley: 100, borderstyle: 1 };
        const defaultOrder = ['name', 'fontname', 'fontsize', 'primarycolour', 'secondarycolour', 'outlinecolour', 'backcolour', 'bold', 'italic', 'underline', 'strikeout', 'scalex', 'scaley', 'spacing', 'angle', 'borderstyle', 'outline', 'shadow', 'alignment', 'marginl', 'marginr', 'marginv', 'encoding'];
        const order = formatOrder.length > 0 ? formatOrder : defaultOrder;
        
        order.forEach((field, idx) => { if (idx < parts.length) style[field] = parts[idx]; });
        
        ['fontsize', 'bold', 'italic', 'underline', 'strikeout', 'scalex', 'scaley', 'spacing', 'angle', 'borderstyle', 'outline', 'shadow', 'alignment', 'marginl', 'marginr', 'marginv'].forEach(field => {
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
        const _styleMode = document.getElementById('ss-style')?.value || 'full';
        
        if (_styleMode === 'nobox' && styleName.includes('Box')) styleName = styleName.replace('Box', '');
        
        const baseStyle = styles[styleName.toLowerCase()] || styles['default'] || getDefaultASSStyle();
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
                    const baseR = (value && allStyles[value.toLowerCase()]) ? allStyles[value.toLowerCase()] : (allStyles['default'] || getDefaultASSStyle());
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

    function applyFontToSpan(span, fontName) {
        const fn = String(fontName || '').trim().toLowerCase();
        let fontFamily = 'Roboto, Arial, sans-serif';
        let fontVariant = 'normal';

        if (fn.includes('courier') || fn.includes('serif mono') || fn.includes('nimbus') || fn.includes('cutive')) {
            fontFamily = '"Courier New", Courier, monospace';
        } else if (fn.includes('times') || fn.includes('georgia') || fn.includes('serif propor') || fn.includes('cambria') || fn.includes('pt serif')) {
            fontFamily = '"Times New Roman", Times, serif';
        } else if (fn.includes('lucida') || fn.includes('consolas') || fn.includes('sans-serif mono') || fn.includes('sans serif mono') || fn.includes('dejavu')) {
            fontFamily = '"Lucida Console", Monaco, monospace';
        } else if (fn.includes('comic') || fn.includes('casual') || fn.includes('handlee')) {
            fontFamily = '"Comic Sans MS", "Comic Sans", cursive, sans-serif';
        } else if (fn.includes('corsiva') || fn.includes('cursiva') || fn.includes('chancery') || fn.includes('dancing') || fn.includes('script')) {
            fontFamily = '"Monotype Corsiva", "Apple Chancery", cursive';
        } else if (fn.includes('carrois') || fn.includes('versalitas') || fn.includes('small caps')) {
            fontFamily = 'Arial, sans-serif';
            fontVariant = 'small-caps';
        }

        span.style.setProperty('font-family', fontFamily, 'important');
        span.style.setProperty('font-variant', fontVariant, 'important');
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
        
        if (_styleMode === 'clean' || _styleMode === 'srt' || _styleMode === 'srt_color') {
            cue.pos = null; cue.move = null; cue.frz = cue.frx = cue.fry = null; cue.fscx = cue.fscy = null;
            style.alignment = 2; cue.marginV = 20; style.animations = [];
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
                span.style.whiteSpace = 'pre';
                
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
                } else if (_styleMode === 'srt_color') {
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

                applyFontToSpan(span, sStyle.fontname || sStyle.fontName);

                span.style.setProperty('font-size', `${Math.max(14, (sStyle.fontsize || 20) * scaleY * 0.85 * _userScale)}px`, 'important');
                span.style.setProperty('font-weight', sStyle.bold ? 'bold' : 'normal', 'important');
                span.style.setProperty('font-style', sStyle.italic ? 'italic' : 'normal', 'important');
                
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

                let outSize = sStyle.outline || 0;
                let shadSize = sStyle.shadow || 0;
                let blurSize = sStyle.blur || 0;

                const isNativeBox = (sStyle.borderstyle === 3);

                if (_styleMode === 'full' || _styleMode === 'nobox') {
                    outSize = outSize * _userScale * 0.48; if (outSize > 0) {
                        const glow1 = (outSize * 1.8).toFixed(2);
                        const glow2 = (outSize * 3.0).toFixed(2);
                        shadows.push(`0 0 ${glow1}px ${oColor}`);
                        shadows.push(`0 0 ${glow2}px ${oColor}`);
                    }
                    shadSize = shadSize * _userScale; 
                    blurSize = blurSize * _userScale; 
                }

                if (isNativeBox) {
                    span.style.setProperty('background-color', oColor, 'important');
                    span.style.setProperty('padding', '2px 6px', 'important');
                    span.style.setProperty('border-radius', '2px', 'important');
                    
                    if (shadSize > 0) {
                        const sBlur = blurSize > 0 ? blurSize : (shadSize * 1.2);
                        span.style.setProperty('box-shadow', `${shadSize}px ${shadSize}px ${sBlur}px ${sColor}`, 'important');
                    }
                } else {
                    if (outSize > 0) {
                        const d = (outSize * 0.7071).toFixed(2);
                        const outStr = outSize.toFixed(2);
                        shadows.push(
                            `${outStr}px 0 ${blurSize}px ${oColor}`,
                            `-${outStr}px 0 ${blurSize}px ${oColor}`,
                            `0 ${outStr}px ${blurSize}px ${oColor}`,
                            `0 -${outStr}px ${blurSize}px ${oColor}`,
                            `${d}px ${d}px ${blurSize}px ${oColor}`,
                            `-${d}px ${d}px ${blurSize}px ${oColor}`,
                            `${d}px -${d}px ${blurSize}px ${oColor}`,
                            `-${d}px -${d}px ${blurSize}px ${oColor}`
                        );
                    }

                    if (shadSize > 0) {
                        const sBlur = blurSize > 0 ? blurSize : (shadSize * 1.2);
                        shadows.push(`${shadSize}px ${shadSize}px ${sBlur}px ${sColor}`);
                    }

                    if (blurSize > 0 && shadSize === 0 && outSize === 0) {
                        shadows.push(`0 0 ${blurSize}px ${oColor}`);
                    }

                    span.style.setProperty('text-shadow', shadows.length ? shadows.join(', ') : 'none', 'important');
                }
                
                if (!isNativeBox && _fxBoxGlobal && (_styleMode === 'srt' || _styleMode === 'srt_color' || _styleMode === 'clean')) {
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
            });
        });
    }

    return { limpiar, iniciarMotor, forceRender, getStats };
})();