(function() {
    'use strict';

    const panelViejo = document.getElementById('sstradu-panel');
    if (panelViejo) panelViejo.remove();
    const botonViejo = document.getElementById('ss-toggle');
    if (botonViejo) botonViejo.remove();
    window._sstraduFullLoaded = true;

    // --- DISEÑO ACTUALIZADO: CSS dinámico para que no se corte la animación ---
    const panelHTML = `
        <style>
            #sstradu-panel {
                display: block !important;
                position: absolute !important; /* Anclado al reproductor de video */
                top: 15px !important;
                right: 15px !important;
                bottom: auto !important;
                height: auto !important;
                max-height: calc(100% - 30px) !important;
                
                transform: translateX(40px) scale(0.95);
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                
                /* Estilo base (Normal) */
                background: rgba(45, 27, 78, 0.95) !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                border: 1px solid #5b21b6 !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
                
                transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease, visibility 0.35s, background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease !important;
                z-index: 9999999 !important;
            }
            
            /* Estado abierto (Desliza hacia adentro) */
            #sstradu-panel[data-open="true"] {
                transform: translateX(0) scale(1) !important;
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
            }

            /* Estado Pantalla Completa (Cristal transparente) */
            #sstradu-panel[data-fullscreen="true"] {
                background: rgba(20, 5, 35, 0.15) !important;
                backdrop-filter: blur(4px) !important;
                -webkit-backdrop-filter: blur(4px) !important;
                border-color: rgba(168, 85, 247, 0.25) !important;
                box-shadow: none !important;
                transform-origin: top right !important; /* Ancla la escala a la esquina superior derecha */
            }

            /* --- NUEVO: Aumentar el tamaño del panel un 22% cuando está abierto en Fullscreen --- */
            #sstradu-panel[data-open="true"][data-fullscreen="true"] {
                transform: translateX(0) scale(1.22) !important; 
            }

            /* Textos en blanco, negrita y con contorno (outline) en Fullscreen */
            #sstradu-panel[data-fullscreen="true"],
            #sstradu-panel[data-fullscreen="true"] * {
                color: #ffffff !important;
                font-weight: bold !important;
            }

            /* Contorno negro sólido (Múltiple text-shadow) para garantizar lectura extrema */
            #sstradu-panel[data-fullscreen="true"] h4,
            #sstradu-panel[data-fullscreen="true"] label,
            #sstradu-panel[data-fullscreen="true"] span,
            #sstradu-panel[data-fullscreen="true"] div,
            #sstradu-panel[data-fullscreen="true"] a {
                text-shadow: 
                    -1px -1px 0 #000,  
                     1px -1px 0 #000,
                    -1px  1px 0 #000,
                     1px  1px 0 #000,
                     0px  2px 4px rgba(0,0,0,0.9) !important;
            }

            /* Oscurecemos un poco los inputs y selects para que no queden 100% transparentes */
            #sstradu-panel[data-fullscreen="true"] input[type="password"],
            #sstradu-panel[data-fullscreen="true"] select {
                background: rgba(0, 0, 0, 0.6) !important;
                text-shadow: none !important;
                border-color: rgba(255, 255, 255, 0.3) !important;
            }
        </style>

        <div id="sstradu-panel" data-open="false" data-fullscreen="false" style="padding:15px;border-radius:12px;width:260px;color:#f3e8ff;font-family:'YouTube Sans',Roboto,sans-serif;overflow-y:auto;">
            
            <h4 id="ss-title" style="margin:0 0 10px 0;color:#d8b4fe;text-align:center;font-size:15px;border-bottom:1px solid #4c1d95;padding-bottom:10px;cursor:pointer;user-select:none;font-weight:bold;" title="Haz clic para opciones avanzadas">✨ Unlimited Tradu Web</h4>

            <div style="margin-bottom:10px;">
                <select id="ss-motor" style="width:100%;background:#1a0b2e;color:#fff;border:1px solid #4c1d95;padding:8px 10px;border-radius:6px;box-sizing:border-box;font-size:12px;outline:none;font-weight:bold;cursor:pointer;">
                    <option value="gemini" selected>🌐 Gemini (con API Key)</option>
                    <option value="local">🖥️ Local (sin API Key)</option>
                </select>
            </div>

            <div style="display:flex;gap:6px;margin-bottom:10px;">
                <select id="ss-modo" style="flex:1.6;min-width:0;background:#1a0b2e;color:#fff;border:1px solid #4c1d95;padding:7px 6px;border-radius:6px;box-sizing:border-box;font-size:12px;outline:none;cursor:pointer;"></select>
                <select id="ss-tipo" title="Canción: la letra entera, y la primera parte (hasta el estribillo) se ve apenas está. Video: por segmentos, para videos largos sin partes repetidas" style="flex:1;min-width:0;background:#1a0b2e;color:#fff;border:1px solid #4c1d95;padding:7px 4px;border-radius:6px;box-sizing:border-box;font-size:12px;outline:none;cursor:pointer;">
                    <option value="cancion" title="La letra entera, con todo su contexto; la primera parte (hasta el estribillo) se ve apenas está">🎵 Canción</option>
                    <option value="video" title="Por segmentos, para videos largos sin partes repetidas (vlogs, series, MrBeast...)">🎬 Video</option>
                </select>
            </div>

            <div id="ss-gemini-fields">
                <div style="text-align:center;margin-bottom:12px;">
                    <a href="https://aistudio.google.com/api-keys?project=gen-lang-client-0548273710" target="_blank" style="font-size:11px;color:#a855f7;text-decoration:none;font-weight:bold;"><span id="ss-lbl-apilink">🔑 Consigue tu API Key gratis aquí</span></a>
                </div>

                <div style="margin-bottom:10px;">
                    <input type="password" id="ss-key" placeholder="Pega tu API Key aquí..." style="width:100%;background:#1a0b2e;color:#fff;border:1px solid #4c1d95;padding:8px 10px;border-radius:6px;box-sizing:border-box;font-size:12px;outline:none;">
                </div>
            </div>

            <div style="display:flex; gap:8px; margin-bottom:10px;">
                <div style="flex:1;">
                    <label id="ss-lbl-src" style="font-size:10px;color:#c084fc;display:block;margin-bottom:4px;">Origen:</label>
                    <select id="ss-source" style="width:100%;background:#1a0b2e;color:#fff;border:1px solid #4c1d95;padding:6px;border-radius:6px;font-size:11px;outline:none;">
                        <option value="auto">Auto</option>
                        <option value="Portuguese" selected>Portugués</option>
                        <option value="Japanese">Japonés</option>
                        <option value="English">Inglés</option>
                        <option value="Spanish">Español</option>
                        <option value="Korean">Coreano</option>
                        <option value="Chinese">Chino</option>
                    </select>
                </div>
                <div style="flex:1;">
                    <label id="ss-lbl-dst" style="font-size:10px;color:#c084fc;display:block;margin-bottom:4px;">Destino:</label>
                    <select id="ss-target" style="width:100%;background:#1a0b2e;color:#fff;border:1px solid #4c1d95;padding:6px;border-radius:6px;font-size:11px;outline:none;">
                        <option value="Spanish" selected>Español</option>
                        <option value="Portuguese">Portugués</option>
                        <option value="English">Inglés</option>
                        <option value="French">Francés</option>
                        <option value="German">Alemán</option>
                        <option value="Japanese">Japonés</option>
                        <option value="Italian">Italiano</option>
                        <option value="Korean">Coreano</option>
                        <option value="Chinese Simplified">Chino (Simplificado)</option>
                        <option value="Russian">Ruso</option>
                        <option value="Arabic">Árabe</option>
                        <option value="Turkish">Turco</option>
                        <option value="Polish">Polaco</option>
                        <option value="Dutch">Holandés</option>
                        <option value="Indonesian">Indonesio</option>
                    </select>
                </div>
            </div>
            
            <div style="margin-bottom:10px;background:#251446;padding:10px;border-radius:8px;border:1px solid #4c1d95;">
                <label style="font-size:11px;color:#d8b4fe;display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span id="ss-lbl-scale">📐 Escala:</span><span id="ss-scale-val" style="color:#a855f7;font-weight:bold;">1.0x</span>
                </label>
                <input type="range" id="ss-scale" min="0.5" max="2.0" step="0.05" value="1.0" style="width:100%;cursor:pointer;margin:0;accent-color:#a855f7;">
                
                <label style="font-size:11px;color:#d8b4fe;display:flex;justify-content:space-between;margin-top:10px;margin-bottom:6px;">
                    <span id="ss-lbl-margin">↕️ Margen V:</span><span id="ss-margin-val" style="color:#a855f7;font-weight:bold;">0%</span>
                </label>
                <input type="range" id="ss-margin" min="-50" max="50" step="1" value="0" style="width:100%;cursor:pointer;margin:0;accent-color:#a855f7;">
            </div>
            
            <div style="display:flex; gap:8px; margin-bottom:10px;">
                <div style="flex:1;">
                    <label id="ss-ui-lang-label" style="font-size:10px;color:#c084fc;display:block;margin-bottom:4px;">🌐 Interfaz:</label>
                    <select id="ss-ui-lang" style="width:100%;background:#1a0b2e;color:#fff;border:1px solid #4c1d95;padding:6px;border-radius:6px;font-size:11px;outline:none;">
                        <option value="es" selected>Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                    </select>
                </div>
                <div style="flex:1;">
                    <label id="ss-lbl-style" style="font-size:10px;color:#c084fc;display:block;margin-bottom:4px;">🎨 Estilo:</label>
                    <select id="ss-style" style="width:100%;background:#1a0b2e;color:#fff;border:1px solid #4c1d95;padding:6px;border-radius:6px;font-size:11px;outline:none;">
                        <option value="full">Todos los FX</option>
                        <option value="nobox">Sin cajas</option>
                        <option value="clean">Texto limpio</option>
                        <option value="srt">SRT clásico</option>
                        <option value="srt_color">SRT colores</option>
                        <option value="traduccion" title="Original arriba y traducción abajo: para aprender y entender la letra">Traducción</option>
                    </select>
                </div>
            </div>

            <div id="ss-fx-panel" style="background:#251446;border:1px solid #4c1d95;border-radius:8px;padding:10px;margin-bottom:12px;">
                <div id="ss-lbl-fx" style="font-size:11px;color:#d8b4fe;margin-bottom:8px;font-weight:bold;">✨ Efectos:</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#e9d5ff;cursor:pointer;">
                        <span id="ss-lbl-chroma">Chromas / Glitch</span>
                        <input type="checkbox" id="ss-fx-chroma" checked style="width:14px;height:14px;cursor:pointer;accent-color:#a855f7;">
                    </label>
                    <div style="display:flex; flex-direction:column; gap:3px;">
                        <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#e9d5ff;cursor:pointer;">
                            <span id="ss-lbl-box">Cajas de fondo (SRT)</span>
                            <input type="checkbox" id="ss-fx-box" style="width:14px;height:14px;cursor:pointer;accent-color:#a855f7;">
                        </label>
                        <div id="ss-box-options" style="display:none; padding-left: 5px; font-size:10px; background:#1a0b2e; border-radius:4px; padding:6px; margin-top:4px; border:1px solid #4c1d95;">
                            <label style="display:flex; justify-content:space-between; color:#c084fc; margin-bottom:4px; align-items:center;">
                                Opacidad: <span id="ss-box-op-val" style="color:#a855f7;font-weight:bold;">80%</span>
                            </label>
                            <input type="range" id="ss-box-opacity" min="0" max="100" value="80" style="width:100%; margin:0 0 6px 0; cursor:pointer; accent-color:#a855f7;">
                            <label style="display:flex; align-items:center; justify-content:space-between; color:#c084fc; cursor:pointer;">
                                Color Custom
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <input type="checkbox" id="ss-box-color-enable" title="Activar color personalizado" style="accent-color:#a855f7;">
                                    <input type="color" id="ss-box-color" value="#000000" disabled style="width:20px; height:18px; border:none; padding:0; background:none; cursor:pointer;">
                                </div>
                            </label>
                        </div>
                    </div>
                    <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#e9d5ff;cursor:pointer;">
                        <span id="ss-lbl-anim">Anim. Color/Fad/Alpha</span>
                        <input type="checkbox" id="ss-fx-anim" checked style="width:14px;height:14px;cursor:pointer;accent-color:#a855f7;">
                    </label>
                </div>
            </div>

            <div id="ss-video-info" style="background:#1a0b2e;border:1px dashed #4c1d95;border-radius:6px;padding:6px;margin-bottom:10px;font-size:10px;color:#a855f7;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Sin video detectado</div>
            <div id="ss-stats" style="font-size:10px;color:#c084fc;text-align:center;margin-bottom:10px;display:none;"></div>

            <div style="display:flex;gap:8px;">
                <button id="ss-btn-tradu" style="flex:1;background:#a855f7;color:white;border:none;padding:12px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:13px;transition:background 0.2s;">Traducir</button>
                <button id="ss-btn-stop" title="Quitar subtítulos" style="background:#251446;color:#d8b4fe;border:1px solid #4c1d95;padding:12px;border-radius:8px;cursor:pointer;font-size:14px;transition:background 0.2s;">⏹</button>
            </div>
            
            <div id="ss-msg" style="font-size:11px;margin-top:8px;color:#c084fc;text-align:center;min-height:15px;">Listo para inyectar.</div>
            <div id="ss-id" title="Tu ID de acceso al modo local. Clic para copiarlo." style="display:none;font-size:10px;margin-top:4px;color:#a78bfa;text-align:center;cursor:pointer;user-select:all;"></div>
            <button id="ss-btn-del-cache" style="display:none;width:100%;margin-top:10px;background:#3b0764;color:#f87171;border:1px solid #7f1d1d;padding:8px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:bold;">🗑 Eliminar caché</button>
            
            <div style="display:flex;gap:6px;margin-top:10px;">
                <a href="https://discord.gg/xJhyqvDP6V" target="_blank" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;background:#5865F2;color:white;text-decoration:none;padding:7px 0;border-radius:5px;font-size:11px;font-weight:bold;">
                    <svg width="13" height="13" viewBox="0 0 127.14 96.36" fill="white"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
                    Discord
                </a>
                <a href="https://ko-fi.com/sonizzidk" target="_blank" style="flex:1;display:flex;align-items:center;justify-content:center;gap:4px;background:#FF5E5B;color:white;text-decoration:none;padding:7px 0;border-radius:5px;font-size:11px;font-weight:bold;">☕ Ko-fi</a>
            </div>
            <div style="margin-top:6px;text-align:center;">
                <a id="ss-tutorial-btn" href="https://youtu.be/HwJ27_pJQ_s" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;background:#FF0000;color:white;text-decoration:none;padding:7px 20px;border-radius:5px;font-size:11px;font-weight:bold;">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="white"><path d="M13.73 1.56A1.75 1.75 0 0 0 12.5.32C11.4 0 7 0 7 0S2.6 0 1.5.32A1.75 1.75 0 0 0 .27 1.56C0 2.67 0 5 0 5s0 2.33.27 3.44A1.75 1.75 0 0 0 1.5 9.68C2.6 10 7 10 7 10s4.4 0 5.5-.32a1.75 1.75 0 0 0 1.23-1.24C14 7.33 14 5 14 5s0-2.33-.27-3.44ZM5.6 7.14V2.86L9.27 5 5.6 7.14Z"/></svg>
                    <span id="ss-tutorial-label">Tutorial de uso</span>
                </a>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', panelHTML);

    const togglePanelUI = (forceClose = false) => {
        const p = document.getElementById('sstradu-panel');
        if (!p) return;
        
        if (forceClose) {
            p.dataset.open = 'false';
        } else {
            p.dataset.open = (p.dataset.open === 'true') ? 'false' : 'true';
        }
    };

    const SS_UI_STRINGS = {
        "es": {
            "key_label": "Gemini API Key:", "key_ph": "Pega tu Key aquí...",
            "src_label": "Origen:", "dst_label": "Destino:",
            "ui_label": "🌐 Interfaz:", "scale_label": "📐 Escala:", "margin_label": "↕️ Margen V:",
            "no_video": "Sin video detectado", "style_label": "🎨 Estilo:", "fx_label": "✨ Efectos:",
            "fx_chroma": "Chromas / Glitch", "fx_box": "Cajas de fondo (SRT)", "fx_anim": "Anim. Color/Fad/Alpha",
            "btn_tradu": "Traducir", "btn_stop_tt": "Quitar subtítulos", "msg_ready": "Listo para inyectar.",
            "style_full": "Todos los FX", "style_nobox": "Sin cajas", "style_clean": "Texto limpio",
            "style_srt": "SRT clásico", "style_srtc": "SRT colores", "style_dual": "Traducción",
            "lbl_apilink": "🔑 Consigue tu API Key gratis aquí",
            "langs_src": ["Auto", "Portugués", "Japonés", "Inglés", "Español", "Coreano", "Chino"],
            "langs_dst": ["Español", "Portugués", "Inglés", "Francés", "Alemán", "Japonés", "Italiano", "Coreano", "Chino (Simplificado)", "Ruso", "Árabe", "Turco", "Polaco", "Holandés", "Indonesio"]
        },
        "en": {
            "key_label": "Gemini API Key:", "key_ph": "Paste your key here...",
            "src_label": "Source:", "dst_label": "Target:",
            "ui_label": "🌐 Interface:", "scale_label": "📐 Scale:", "margin_label": "↕️ V-Margin:",
            "no_video": "No video detected", "style_label": "🎨 Style:", "fx_label": "✨ Effects:",
            "fx_chroma": "Chroma / Glitch", "fx_box": "Background boxes (SRT)", "fx_anim": "Color/Fad/Alpha Anim",
            "btn_tradu": "Translate", "btn_stop_tt": "Remove subtitles", "msg_ready": "Ready to inject.",
            "style_full": "All effects", "style_nobox": "No boxes", "style_clean": "Clean text",
            "style_srt": "Classic SRT", "style_srtc": "Styled SRT", "style_dual": "Translation",
            "lbl_apilink": "🔑 Get your free API Key here",
            "langs_src": ["Auto", "Portuguese", "Japanese", "English", "Spanish", "Korean", "Chinese"],
            "langs_dst": ["Spanish", "Portuguese", "English", "French", "German", "Japanese", "Italian", "Korean", "Chinese (Simplified)", "Russian", "Arabic", "Turkish", "Polish", "Dutch", "Indonesian"]
        },
        "pt": {
            "key_label": "Chave API Gemini:", "key_ph": "Cole sua chave aqui...",
            "src_label": "Origem:", "dst_label": "Destino:",
            "ui_label": "🌐 Interface:", "scale_label": "📐 Escala:", "margin_label": "↕️ Margem V:",
            "no_video": "Nenhum vídeo detectado", "style_label": "🎨 Estilo:", "fx_label": "✨ Efeitos:",
            "fx_chroma": "Chroma / Glitch", "fx_box": "Caixas de fundo (SRT)", "fx_anim": "Anim Cor/Desv/Alfa",
            "btn_tradu": "Traduzir", "btn_stop_tt": "Remover legendas", "msg_ready": "Pronto para injetar.",
            "style_full": "Todos os efeitos", "style_nobox": "Sem caixas", "style_clean": "Texto limpo",
            "style_srt": "SRT clássico", "style_srtc": "SRT cores", "style_dual": "Tradução",
            "lbl_apilink": "🔑 Obtenha sua chave API gratuita aqui",
            "langs_src": ["Auto", "Português", "Japonês", "Inglês", "Espanhol", "Coreano", "Chinês"],
            "langs_dst": ["Espanhol", "Português", "Inglês", "Francês", "Alemão", "Japonês", "Italiano", "Coreano", "Chinês (Simplificado)", "Russo", "Árabe", "Turco", "Polonês", "Holandês", "Indonésio"]
        },
        "fr": {
            "key_label": "Clé API Gemini :", "key_ph": "Collez votre clé ici...",
            "src_label": "Source :", "dst_label": "Cible :",
            "ui_label": "🌐 Interface :", "scale_label": "📐 Échelle :", "margin_label": "↕️ Marge V :",
            "no_video": "Aucune vidéo détectée", "style_label": "🎨 Style :", "fx_label": "✨ Effets :",
            "fx_chroma": "Chroma / Glitch", "fx_box": "Boîtes de fond (SRT)", "fx_anim": "Anim Couleur/Fondu/Alpha",
            "btn_tradu": "Traduire", "btn_stop_tt": "Supprimer les sous-titres", "msg_ready": "Prêt à injecter.",
            "style_full": "Tous les effets", "style_nobox": "Sans boîtes", "style_clean": "Texte propre",
            "style_srt": "SRT classique", "style_srtc": "SRT stylisé", "style_dual": "Traduction",
            "lbl_apilink": "🔑 Obtenez votre clé API gratuite ici",
            "langs_src": ["Auto", "Portugais", "Japonais", "Anglais", "Espagnol", "Coréen", "Chinois"],
            "langs_dst": ["Espagnol", "Portugais", "Anglais", "Français", "Allemand", "Japonais", "Italien", "Coréen", "Chinois (simplifié)", "Russe", "Arabe", "Turc", "Polonais", "Néerlandais", "Indonésien"]
        },
        "de": {
            "key_label": "Gemini API Key:", "key_ph": "Fügen Sie Ihren Key hier ein...",
            "src_label": "Quelle:", "dst_label": "Ziel:",
            "ui_label": "🌐 Oberfläche:", "scale_label": "📐 Skalierung:", "margin_label": "↕️ V-Rand:",
            "no_video": "Kein Video erkannt", "style_label": "🎨 Stil:", "fx_label": "✨ Effekte:",
            "fx_chroma": "Chroma / Glitch", "fx_box": "Hintergrundboxen (SRT)", "fx_anim": "Farbe/Fade/Alpha Anim",
            "btn_tradu": "Übersetzen", "btn_stop_tt": "Untertitel entfernen", "msg_ready": "Bereit zum Einfügen.",
            "style_full": "Alle Effekte", "style_nobox": "Keine Boxen", "style_clean": "Reiner Text",
            "style_srt": "Klassisches SRT", "style_srtc": "Gestyltes SRT", "style_dual": "Übersetzung",
            "lbl_apilink": "🔑 Holen Sie sich hier Ihren kostenlosen API Key",
            "langs_src": ["Auto", "Portugiesisch", "Japanisch", "Englisch", "Spanisch", "Koreanisch", "Chinesisch"],
            "langs_dst": ["Spanisch", "Portugiesisch", "Englisch", "Französisch", "Deutsch", "Japanisch", "Italienisch", "Koreanisch", "Chinesisch (vereinfacht)", "Russisch", "Arabisch", "Türkisch", "Polnisch", "Niederländisch", "Indonesisch"]
        },
        "ja": {
            "key_label": "Gemini APIキー:", "key_ph": "ここにキーを貼り付け...",
            "src_label": "元の言語:", "dst_label": "翻訳先:",
            "ui_label": "🌐 インターフェース:", "scale_label": "📐 スケール:", "margin_label": "↕️ 垂直マージン:",
            "no_video": "ビデオなし", "style_label": "🎨 スタイル:", "fx_label": "✨ エフェクト:",
            "fx_chroma": "クロマ/グリッチ", "fx_box": "背景ボックス(SRT)", "fx_anim": "カラー/フェード/アルファ",
            "btn_tradu": "翻訳", "btn_stop_tt": "字幕を削除", "msg_ready": "準備完了。",
            "style_full": "全てのエフェクト", "style_nobox": "ボックスなし", "style_clean": "テキストのみ",
            "style_srt": "クラシックSRT", "style_srtc": "カラーSRT", "style_dual": "翻訳",
            "lbl_apilink": "🔑 無料のAPIキーを取得",
            "langs_src": ["自動", "ポルトガル語", "日本語", "英語", "スペイン語", "韓国語", "中国語"],
            "langs_dst": ["スペイン語", "ポルトガル語", "英語", "フランス語", "ドイツ語", "日本語", "イタリア語", "韓国語", "中国語（簡体字）", "ロシア語", "アラビア語", "トルコ語", "ポーランド語", "オランダ語", "インドネシア語"]
        },
        "ko": {
            "key_label": "Gemini API 키:", "key_ph": "여기에 키를 붙여넣기...",
            "src_label": "출발어:", "dst_label": "도착어:",
            "ui_label": "🌐 인터페이스:", "scale_label": "📐 비율:", "margin_label": "↕️ 수직 여백:",
            "no_video": "비디오 없음", "style_label": "🎨 스타일:", "fx_label": "✨ 효과:",
            "fx_chroma": "크로마/글리치", "fx_box": "배경 상자(SRT)", "fx_anim": "색상/페이드/알파",
            "btn_tradu": "번역", "btn_stop_tt": "자막 제거", "msg_ready": "준비 완료.",
            "style_full": "모든 효과", "style_nobox": "상자 없음", "style_clean": "일반 텍스트",
            "style_srt": "클래식 SRT", "style_srtc": "컬러 SRT", "style_dual": "번역",
            "lbl_apilink": "🔑 무료 API 키 받기",
            "langs_src": ["자동", "포르투갈어", "일본어", "영어", "스페인어", "한국어", "중국어"],
            "langs_dst": ["스페인어", "포르투갈어", "영어", "프랑스어", "독일어", "일본어", "이탈리아어", "한국어", "중국어(간체)", "러시아어", "아랍어", "터키어", "폴란드어", "네덜란드어", "인도네시아어"]
        }
    };

    function applyUILang(lang) {
        const s = SS_UI_STRINGS[lang] || SS_UI_STRINGS['es'];
        const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

        set('ss-lbl-src', s.src_label); set('ss-lbl-dst', s.dst_label);
        set('ss-lbl-scale', s.scale_label); set('ss-lbl-margin', s.margin_label); set('ss-lbl-apilink', s.lbl_apilink);
        set('ss-ui-lang-label', s.ui_label); set('ss-lbl-style', s.style_label); set('ss-lbl-fx', s.fx_label);
        set('ss-lbl-chroma', s.fx_chroma); set('ss-lbl-box', s.fx_box); set('ss-lbl-anim', s.fx_anim);

        const styleOpts = document.getElementById('ss-style')?.options;
        if (styleOpts && styleOpts.length >= 5) {
            styleOpts[0].text = s.style_full; styleOpts[1].text = s.style_nobox;
            styleOpts[2].text = s.style_clean; styleOpts[3].text = s.style_srt; styleOpts[4].text = s.style_srtc;
            if (styleOpts[5] && s.style_dual) styleOpts[5].text = s.style_dual;
        }

        const srcSelect = document.getElementById('ss-source');
        if (srcSelect && s.langs_src) {
            Array.from(srcSelect.options).forEach((opt, idx) => {
                if (s.langs_src[idx]) {
                    opt.text = s.langs_src[idx];
                    opt.textContent = s.langs_src[idx];
                }
            });
        }
        
        const dstSelect = document.getElementById('ss-target');
        if (dstSelect && s.langs_dst) {
            Array.from(dstSelect.options).forEach((opt, idx) => {
                if (s.langs_dst[idx]) {
                    opt.text = s.langs_dst[idx];
                    opt.textContent = s.langs_dst[idx];
                }
            });
        }

        const keyInput = document.getElementById('ss-key'); if (keyInput) keyInput.placeholder = s.key_ph;
        const btnTrad = document.getElementById('ss-btn-tradu'); if (btnTrad) btnTrad.textContent = s.btn_tradu;
        const btnStop = document.getElementById('ss-btn-stop'); if (btnStop) btnStop.title = s.btn_stop_tt;

        const msg = document.getElementById('ss-msg');
        const defaultMsgs = ['Listo para inyectar.','Ready to inject.','Pronto para injetar.'];
        if (msg && defaultMsgs.includes(msg.innerText)) msg.innerText = s.msg_ready;

        const infoEl = document.getElementById('ss-video-info');
        if (infoEl && infoEl.innerText === 'Sin video detectado' || infoEl.innerText === 'No video detected' || infoEl.innerText === 'Nenhum vídeo detectado') {
             infoEl.textContent = s.no_video;
        }

        try { chrome.storage.local.set({ ssUiLang: lang }); } catch(_) {}
    }

    // Modo de traducción: cada motor tiene los suyos y recuerda el último elegido.
    const MODOS_MOTOR = {
        local: [
            ['fidelidad', '🎯 Modo fidelidad', 'Traducción con los efectos acomodados pieza por pieza (karaoke por sílaba, texto vertical, typewriter)'],
            ['base', '⚙️ Modo base', 'Traducción con los tags del sistema matemático de siempre'],
            ['lectura', '📖 Modo lectura', 'Solo la traducción: una línea limpia por momento, color plano, sin efectos']
        ],
        gemini: [
            ['base', '⚙️ Modo base', 'El uso normal de siempre: traducción con los tags del sistema matemático'],
            ['lectura', '📖 Modo lectura', 'Solo la traducción: una línea limpia por momento, color plano, sin efectos']
        ]
    };
    const modosGuardados = { local: 'fidelidad', gemini: 'base' };
    const claveMotor = (motor) => (motor === 'local' ? 'local' : 'gemini');

    function llenarModos(motor) {
        const sel = document.getElementById('ss-modo');
        if (!sel) return;
        const lista = MODOS_MOTOR[claveMotor(motor)];
        sel.innerHTML = '';
        lista.forEach(([valor, texto, ayuda]) => {
            const opt = document.createElement('option');
            opt.value = valor;
            opt.textContent = texto;
            opt.title = ayuda;
            sel.appendChild(opt);
        });
        const guardado = modosGuardados[claveMotor(motor)];
        sel.value = lista.some(m => m[0] === guardado) ? guardado : lista[0][0];
        sel.title = (lista.find(m => m[0] === sel.value) || lista[0])[2];
    }

    function aplicarModoMotor(motor) {
        const geminiFields = document.getElementById('ss-gemini-fields');
        if (geminiFields) geminiFields.style.display = (motor === 'local') ? 'none' : 'block';
        const tipoSel = document.getElementById('ss-tipo');
        if (tipoSel) tipoSel.style.display = (motor === 'local') ? '' : 'none';
        const idEl = document.getElementById('ss-id');
        if (idEl) idEl.style.display = (motor === 'local') ? 'block' : 'none';
        llenarModos(motor);
    }

    // Código propio de esta extensión (secreto, se genera una sola vez). El servidor
    // lo usa para saber quién puede usar el modo local desde otra PC; si alguien no
    // está aprobado, el aviso del servidor le muestra su código.
    let usuarioId = '';
    const datosUsuario = () => ({ id: usuarioId });
    // El ID corto que ve el usuario (1A2B-3C4D): con él el dueño (o la membresía) le da
    // acceso. El código completo sigue secreto: otra extensión no puede hacerse pasar por él.
    const idCorto = (id) => {
        const h = (id || '').replace(/[^0-9a-f]/gi, '').toUpperCase().slice(0, 8);
        return h.length === 8 ? `${h.slice(0, 4)}-${h.slice(4)}` : '';
    };
    function mostrarId() {
        const el = document.getElementById('ss-id');
        if (el) el.textContent = idCorto(usuarioId) ? `🔑 Tu ID: ${idCorto(usuarioId)}` : '';
    }

    function prepararUsuario(guardado) {
        usuarioId = guardado || (crypto.randomUUID ? crypto.randomUUID()
            : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''));
        if (!guardado) {
            try { chrome.storage.local.set({ ssUsuarioId: usuarioId }); } catch(_) {}
        }
        mostrarId();
    }

    llenarModos(document.getElementById('ss-motor')?.value || 'gemini');

    document.getElementById('ss-modo').addEventListener('change', (e) => {
        const motor = document.getElementById('ss-motor')?.value || 'gemini';
        modosGuardados[claveMotor(motor)] = e.target.value;
        const elegido = MODOS_MOTOR[claveMotor(motor)].find(m => m[0] === e.target.value);
        if (elegido) e.target.title = elegido[2];
        try { chrome.storage.local.set({ ssModosSaved: modosGuardados }); } catch(_) {}
    });

    document.getElementById('ss-id').addEventListener('click', () => {
        const id = idCorto(usuarioId);
        if (!id) return;
        const el = document.getElementById('ss-id');
        const listo = () => { el.textContent = '✅ ID copiado'; setTimeout(mostrarId, 1500); };
        try { navigator.clipboard.writeText(id).then(listo, listo); } catch(_) { listo(); }
    });

    document.getElementById('ss-tipo').addEventListener('change', (e) => {
        try { chrome.storage.local.set({ ssTipoSaved: e.target.value }); } catch(_) {}
    });

    document.getElementById('ss-motor').addEventListener('change', (e) => {
        const motor = e.target.value;
        aplicarModoMotor(motor);
        try { chrome.storage.local.set({ ssMotorSaved: motor }); } catch(_) {}
    });

    document.getElementById('ss-ui-lang').addEventListener('change', e => applyUILang(e.target.value));

    document.getElementById('ss-title').addEventListener('click', () => {
        const btnDel = document.getElementById('ss-btn-del-cache');
        if (btnDel) {
            btnDel.style.display = (btnDel.style.display === 'none') ? 'block' : 'none';
        }
    });

    document.getElementById('ss-fx-box').addEventListener('change', (e) => {
        document.getElementById('ss-box-options').style.display = e.target.checked ? 'block' : 'none';
        if (window.SSTraduEngine) window.SSTraduEngine.forceRender();
    });

    document.getElementById('ss-box-opacity').addEventListener('input', (e) => {
        document.getElementById('ss-box-op-val').innerText = e.target.value + '%';
        if (window.SSTraduEngine) window.SSTraduEngine.forceRender();
    });

    document.getElementById('ss-box-color-enable').addEventListener('change', (e) => {
        document.getElementById('ss-box-color').disabled = !e.target.checked;
        if (window.SSTraduEngine) window.SSTraduEngine.forceRender();
    });

    document.getElementById('ss-box-color').addEventListener('input', () => {
        if (window.SSTraduEngine) window.SSTraduEngine.forceRender();
    });

    ['ss-fx-chroma','ss-fx-anim'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => {
            if (window.SSTraduEngine) window.SSTraduEngine.forceRender();
        });
    });

    chrome.storage.local.get(['ssApiKeySaved','ssScaleSaved','ssMarginSaved','ssSourceSaved','ssStyleSaved','ssUiLang','ssMotorSaved','ssModosSaved','ssUsuarioId','ssTipoSaved'], (res) => {
        if (res.ssApiKeySaved) document.getElementById('ss-key').value = res.ssApiKeySaved;
        prepararUsuario(res.ssUsuarioId);
        if (res.ssTipoSaved) document.getElementById('ss-tipo').value = res.ssTipoSaved;
        if (res.ssModosSaved) Object.assign(modosGuardados, res.ssModosSaved);
        const motorGuardado = res.ssMotorSaved || 'gemini';
        document.getElementById('ss-motor').value = motorGuardado;
        aplicarModoMotor(motorGuardado);
        if (res.ssScaleSaved) {
            document.getElementById('ss-scale').value = res.ssScaleSaved;
            document.getElementById('ss-scale-val').innerText = parseFloat(res.ssScaleSaved).toFixed(2) + 'x';
        }
        if (res.ssMarginSaved) {
            document.getElementById('ss-margin').value = res.ssMarginSaved;
            document.getElementById('ss-margin-val').innerText = res.ssMarginSaved + '%';
        }
        if (res.ssSourceSaved) document.getElementById('ss-source').value = res.ssSourceSaved;
        if (res.ssStyleSaved) document.getElementById('ss-style').value = res.ssStyleSaved;
        
        const lang = res.ssUiLang || 'es';
        document.getElementById('ss-ui-lang').value = lang;
        applyUILang(lang);
    });

    document.getElementById('ss-style').addEventListener('change', (e) => {
        try { chrome.storage.local.set({ ssStyleSaved: e.target.value }); } catch(_) {}
        if (window.SSTraduEngine) window.SSTraduEngine.forceRender();
    });

    document.getElementById('ss-scale').addEventListener('input', (e) => {
        document.getElementById('ss-scale-val').innerText = parseFloat(e.target.value).toFixed(2) + 'x';
        try { chrome.storage.local.set({ ssScaleSaved: e.target.value }); } catch(_) {}
        if (window.SSTraduEngine) window.SSTraduEngine.forceRender();
    });

    document.getElementById('ss-margin').addEventListener('input', (e) => {
        document.getElementById('ss-margin-val').innerText = e.target.value + '%';
        try { chrome.storage.local.set({ ssMarginSaved: e.target.value }); } catch(_) {}
        if (window.SSTraduEngine) window.SSTraduEngine.forceRender();
    });

    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) { 
            lastUrl = location.href; 
            if (window.SSTraduEngine) window.SSTraduEngine.limpiar(); 
        }
    }).observe(document.body, { childList: true, subtree: true });

    document.getElementById('ss-btn-stop').onclick = () => {
        if (window.SSTraduEngine) window.SSTraduEngine.limpiar();
        document.getElementById('ss-msg').innerText = '⏹ Subtítulos quitados.';
    };

    document.getElementById('ss-btn-tradu').onclick = () => {
        const apiKey = document.getElementById('ss-key').value.trim();
        const destino = document.getElementById('ss-target').value;
        const origen  = document.getElementById('ss-source').value;
        const motor   = document.getElementById('ss-motor')?.value || 'gemini';
        const modo    = document.getElementById('ss-modo')?.value || '';
        const tipo    = document.getElementById('ss-tipo')?.value || 'cancion';
        const msg = document.getElementById('ss-msg');

        if (motor !== 'local' && !apiKey) { msg.innerText = '❌ Ingresa tu API Key'; return; }

        if (motor !== 'local') {
            try { chrome.storage.local.set({ ssApiKeySaved: apiKey }); } catch(e) {}
        }
        try { chrome.storage.local.set({ ssSourceSaved: origen }); } catch(e) {}
        
        if (!chrome.runtime?.id) { msg.innerText = '❌ Recarga la extensión (F5)'; return; }

        const videoId = new URLSearchParams(window.location.search).get('v');
        const videoTitle = document.querySelector('#title h1 yt-formatted-string, ytd-video-primary-info-renderer h1')?.textContent?.trim()
                        || document.title.replace(' - YouTube', '').trim() || '';

        const _enviar = async (yttUrl) => {
            try {
                msg.innerText = '🤖 Traduciendo...';
                const xmlTexto = await (await fetch(yttUrl)).text();
                if (!xmlTexto || xmlTexto.length < 30) { msg.innerText = '❌ Track vacío'; return; }
                
                const payload = {
                    xml_data: xmlTexto,
                    video_id: videoId,
                    video_title: videoTitle,
                    idioma_destino: destino,
                    idioma_origen: origen,
                    motor: motor,
                    modo: modo
                };
                if (motor !== 'local') payload.api_key = apiKey;
                if (motor === 'local') {
                    payload.usuario = datosUsuario();
                    payload.tipo = tipo;
                }
                if (motor === 'local') msg.innerText = '🖥️ Enviando al motor local...';

                let originalRecibido = null;   // el .ass sin traducir (estilo "Traducción")

                const aplicarResultado = (data) => {
                    if (!data.ass_data) { msg.innerText = '❌ Actualiza servidor.py'; return; }

                    msg.innerText = data.cache ? '⚡ Inyectado desde caché' : '✅ Traducido e inyectado';
                    window._ssLastXmlData  = xmlTexto;
                    window._ssLastVideoId  = videoId;
                    window._ssLastDestino  = destino;
                    window._ssLastOrigen   = origen;
                    window._ssLastMotor    = motor;
                    window._ssLastModo     = modo;
                    window._ssLastTipo     = tipo;
                    
                    if (window.SSTraduEngine) {
                        window.SSTraduEngine.iniciarMotor(data.ass_data, data.ass_original || originalRecibido);
                        
                        setTimeout(() => {
                            const stats = document.getElementById('ss-stats');
                            const engineStats = window.SSTraduEngine.getStats();
                            if (stats && engineStats && engineStats.cuesCount > 0) {
                                stats.textContent = `${engineStats.cuesCount} líneas · ${engineStats.duration}s · ${data.cache ? 'caché' : 'nuevo'}`;
                                stats.style.display = 'block';
                            }
                        }, 300);
                    } else {
                        msg.innerText = '❌ Error: ass_parser.js no cargado';
                    }
                };

                // Motor local: el servidor traduce en segundo plano; se consulta el avance
                // cada 1,5 s (un pedido abierto varios minutos lo corta Chrome).
                // Cada parte lista (hasta el estribillo, o un segmento del video) se muestra
                // enseguida; el servidor la manda solo si es más nueva que la que ya se ve.
                const esperarTrabajoLocal = (job) => {
                    const t0 = Date.now();
                    let versionVista = 0;
                    const consultar = () => {
                        if (!chrome.runtime?.id) { msg.innerText = '❌ Recarga la extensión (F5)'; return; }
                        chrome.runtime.sendMessage({ action: 'estadoLocal', payload: { job, usuario: payload.usuario, version: versionVista } }, (d) => {
                            if (!d) { msg.innerText = '❌ Sin respuesta del servidor local'; return; }
                            if (d.error) { msg.innerText = '❌ ' + d.error; return; }
                            if (d.status === 'procesando') {
                                const seg = Math.round((Date.now() - t0) / 1000);
                                if (d.parcial && d.version > versionVista) {
                                    versionVista = d.version;
                                    if (d.ass_original) originalRecibido = d.ass_original;
                                    if (window.SSTraduEngine) window.SSTraduEngine.iniciarMotor(d.parcial, originalRecibido);
                                }
                                msg.innerText = (versionVista ? '▶️ Ya puedes ir viendo · ' : '🖥️ ') +
                                                `${d.progreso || 'Traduciendo...'} (${seg}s)`;
                                setTimeout(consultar, 1500);
                                return;
                            }
                            aplicarResultado(d);
                        });
                    };
                    consultar();
                };

                chrome.runtime.sendMessage({
                    action: 'hacerFetchInseguro',
                    payload: payload
                }, (data) => {
                    if (!data) { msg.innerText = '❌ Sin respuesta del servidor'; return; }
                    if (data.error) { msg.innerText = '❌ ' + data.error; return; }
                    if (data.status === 'procesando' && data.job) { esperarTrabajoLocal(data.job); return; }
                    aplicarResultado(data);
                });

            } catch(e) { msg.innerText = '❌ ' + e.message; }
        };

        try {
            const tracks = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
            let track = null;
            if (origen !== 'auto' && tracks.length > 0) {
                track = tracks.find(t =>
                    t.name?.simpleText?.toLowerCase().includes(origen.toLowerCase()) ||
                    origen.toLowerCase().includes((t.languageCode || '').toLowerCase().slice(0, 3))
                ) || tracks[0];
            } else if (tracks.length > 0) {
                track = tracks[0];
            }
            if (track?.baseUrl) {
                const url = track.baseUrl.includes('fmt=') ? track.baseUrl.replace(/fmt=[^&]*/, 'fmt=srv3') : track.baseUrl + '&fmt=srv3';
                _enviar(url);
                return;
            }
        } catch(e) {}

        chrome.runtime.sendMessage({ action: 'getUrl' }, (response) => {
            if (!response?.url) { msg.innerText = '❌ Activa los subtítulos del video primero'; return; }
            _enviar(response.url.replace(/fmt=[^&]*/, 'fmt=srv3'));
        });
    };

    // --- CÓDIGO CORREGIDO: SE COMUNICA CON EL BACKGROUND PARA EVITAR BLOQUEO ---
    document.getElementById('ss-btn-del-cache').onclick = () => {
        const btnDel = document.getElementById('ss-btn-del-cache');
        const msg    = document.getElementById('ss-msg');
        if (!window._ssLastXmlData) { msg.innerText = '⚠️ Traduce primero para poder borrar el caché'; return; }
        
        btnDel.disabled = true;
        btnDel.textContent = '⏳ Eliminando...';
        
        chrome.runtime.sendMessage({
            action: 'eliminarCacheInseguro',
            payload: {
                video_id:        window._ssLastVideoId,
                idioma_destino:  window._ssLastDestino,
                idioma_origen:   window._ssLastOrigen,
                xml_data:        window._ssLastXmlData,
                motor:           window._ssLastMotor,
                modo:            window._ssLastModo,
                tipo:            window._ssLastTipo,
                usuario:         datosUsuario(),
            }
        }, (data) => {
            btnDel.disabled = false;
            btnDel.textContent = '🗑 Eliminar caché';
            
            if (!data) { msg.innerText = '❌ Sin respuesta del background'; return; }
            if (data.error) { msg.innerText = '❌ ' + data.error; return; }
            
            if (data.status === 'eliminado') {
                msg.innerText = '🗑 Caché eliminado — ya puedes volver a traducir';
                btnDel.style.display = 'none';
                window._ssLastXmlData = null;
            } else if (data.status === 'no_encontrado') {
                msg.innerText = '⚠️ No había caché guardado para este video';
                btnDel.style.display = 'none';
                window._ssLastXmlData = null;
            } else {
                msg.innerText = '❌ ' + (data.error || 'Error desconocido');
            }
        });
    };

    // --- MAGIA DE INYECCIÓN ---
    setInterval(() => {
        const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
        const panel = document.getElementById('sstradu-panel');
        
        if (player && panel && panel.parentElement !== player) {
            player.appendChild(panel);
        }

        const controls = document.querySelector('.ytp-right-controls');
        if (controls && !document.getElementById('ss-toggle')) {
            const btn = document.createElement('button');
            btn.id = 'ss-toggle'; 
            btn.className = 'ytp-button';
            btn.title = 'Panel UnlimitedTradu (U)';
            
            const logoUrl = chrome.runtime.getURL("logo.png");
            btn.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                    <img src="${logoUrl}" style="width: 34px; height: 34px; object-fit: contain; border-radius: 4px;">
                 </div>`;
            
            btn.onclick = (e) => {
                e.stopPropagation();
                togglePanelUI();
            };
            controls.prepend(btn);
        }
        
        const infoEl = document.getElementById('ss-video-info');
        if (!infoEl) return;
        const vid = new URLSearchParams(window.location.search).get('v');
        if (!vid) { infoEl.textContent = 'Sin video detectado'; infoEl.style.color = '#a855f7'; return; }
        const title = document.querySelector('#title h1 yt-formatted-string, ytd-video-primary-info-renderer h1')?.textContent?.trim()
                   || document.title.replace(' - YouTube', '').trim() || '';
        infoEl.textContent = title ? title.substring(0, 52) + (title.length > 52 ? '...' : '') : vid;
        infoEl.style.color = '#d8b4fe';
    }, 1500);

    document.addEventListener('keydown', (e) => {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) return; 

        if (e.key.toLowerCase() === 'u') togglePanelUI();
    });

    // --- LÓGICA DE PANTALLA COMPLETA ---
    document.addEventListener('fullscreenchange', () => {
        const panel = document.getElementById('sstradu-panel');
        if (!panel) return;

        if (document.fullscreenElement) {
            // Cerramos la ventana CON animación
            if (panel.dataset.open === 'true') {
                togglePanelUI(true);
            }
            
            // Esperamos a que la ventana se termine de ocultar (0.35s) 
            // antes de cambiarle los colores al modo "cristal" para que no se vea el salto
            setTimeout(() => {
                if (panel) panel.dataset.fullscreen = 'true';
            }, 350); 
            
        } else {
            // Si estaba abierta en fullscreen, la cerramos al salir
            if (panel.dataset.open === 'true') {
                togglePanelUI(true);
            }
            
            // Retrasamos la vuelta a los colores oscuros
            setTimeout(() => {
                if (panel) panel.dataset.fullscreen = 'false';
            }, 350);
        }
    });

})();