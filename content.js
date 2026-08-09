(function() {
    'use strict';

    const panelViejo = document.getElementById('sstradu-panel');
    if (panelViejo) panelViejo.remove();
    const botonViejo = document.getElementById('ss-toggle');
    if (botonViejo) botonViejo.remove();
    window._sstraduFullLoaded = true;

    const panelHTML = `
        <div id="sstradu-panel" style="position:fixed;bottom:70px;right:20px;background:rgba(20,20,20,0.98);border:1px solid #444;padding:12px 14px;border-radius:10px;z-index:2147483647;width:270px;color:white;font-family:'YouTube Sans',Roboto,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,0.6);backdrop-filter:blur(10px); max-height: 90vh; overflow-y: auto; display:none;">
            
            <h4 id="ss-title" style="margin:0 0 6px 0;color:#ff4d4d;text-align:center;font-size:15px;border-bottom:1px solid #333;padding-bottom:7px;cursor:pointer;user-select:none;" title="Haz clic para opciones avanzadas">🚀 Unlimited Tradu Web</h4>
            
            <div style="text-align:center;margin-bottom:8px;">
                <a href="https://aistudio.google.com/api-keys?project=gen-lang-client-0548273710" target="_blank" style="font-size:11px;color:#3ea6ff;text-decoration:underline;"><span id="ss-lbl-apilink">🔑 Consigue tu API Key gratis aquí</span></a>
            </div>
            
            <div style="margin-bottom:7px;">
                <label id="ss-lbl-key" style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">Gemini API Key:</label>
                <input type="password" id="ss-key" placeholder="Pega tu Key aquí..." style="width:100%;background:#000;color:#fff;border:1px solid #555;padding:6px 8px;border-radius:5px;box-sizing:border-box;font-size:12px;">
            </div>
            
            <div style="margin-bottom:7px;">
                <label id="ss-lbl-src" style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">Idioma Origen:</label>
                <select id="ss-source" style="width:100%;background:#000;color:#fff;border:1px solid #555;padding:6px 8px;border-radius:5px;font-size:12px;">
                    <option value="auto">Auto detectar</option>
                    <option value="Portuguese" selected>Portugués</option>
                    <option value="Japanese">Japonés</option>
                    <option value="English">Inglés</option>
                    <option value="Spanish">Español</option>
                    <option value="Korean">Coreano</option>
                    <option value="Chinese">Chino</option>
                </select>
            </div>
            
            <div style="margin-bottom:7px;">
                <label id="ss-lbl-dst" style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">Idioma Destino:</label>
                <select id="ss-target" style="width:100%;background:#000;color:#fff;border:1px solid #555;padding:6px 8px;border-radius:5px;font-size:12px;">
                    <option value="Spanish" selected>Español</option>
                    <option value="Portuguese">Portugués</option>
                    <option value="English">Inglés</option>
                    <option value="French">Francés</option>
                    <option value="German">Alemán</option>
                    <option value="Italian">Italiano</option>
                    <option value="Japanese">Japonés</option>
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
            
            <div style="margin-bottom:8px;background:#111;padding:7px 8px;border-radius:6px;border:1px solid #333;">
                <label style="font-size:11px;color:#ccc;display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span id="ss-lbl-scale">📐 Escala:</span><span id="ss-scale-val" style="color:#ff4d4d;font-weight:bold;">1.0x</span>
                </label>
                <input type="range" id="ss-scale" min="0.5" max="2.0" step="0.05" value="1.0" style="width:100%;cursor:pointer;margin:0;">
                <label style="font-size:11px;color:#ccc;display:flex;justify-content:space-between;margin-top:7px;margin-bottom:3px;">
                    <span id="ss-lbl-margin">↕️ Margen V:</span><span id="ss-margin-val" style="color:#ff4d4d;font-weight:bold;">0%</span>
                </label>
                <input type="range" id="ss-margin" min="-50" max="50" step="1" value="0" style="width:100%;cursor:pointer;margin:0;">
            </div>
            
            <div style="margin-bottom:7px;">
                <label id="ss-ui-lang-label" style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">🌐 Idioma de la ventana:</label>
                <select id="ss-ui-lang" style="width:100%;background:#000;color:#fff;border:1px solid #555;padding:6px 8px;border-radius:5px;font-size:12px;">
                    <option value="es" selected>Español</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                </select>
            </div>
            
            <div id="ss-video-info" style="background:#111;border:1px solid #333;border-radius:5px;padding:5px 8px;margin-bottom:7px;font-size:10px;color:#666;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Sin video detectado</div>

            <div style="margin-bottom:7px;">
                <label id="ss-lbl-style" style="font-size:11px;color:#aaa;display:block;margin-bottom:3px;">🎨 Estilo:</label>
                <select id="ss-style" style="width:100%;background:#000;color:#fff;border:1px solid #555;padding:6px 8px;border-radius:5px;font-size:12px;">
                    <option value="full">Con todos los efectos</option>
                    <option value="nobox">Sin cajas</option>
                    <option value="clean">Solo texto limpio</option>
                    <option value="srt">SRT (blanco/negro)</option>
                    <option value="srt_color">SRT estilizado (colores)</option>
                </select>
            </div>

            <div id="ss-fx-panel" style="background:#111;border:1px solid #333;border-radius:6px;padding:7px 10px;margin-bottom:7px;">
                <div id="ss-lbl-fx" style="font-size:11px;color:#aaa;margin-bottom:6px;">✨ Efectos:</div>
                <div style="display:flex;flex-direction:column;gap:5px;">
                    <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#ccc;cursor:pointer;">
                        <span id="ss-lbl-chroma">Chromas / Glitch</span>
                        <input type="checkbox" id="ss-fx-chroma" checked style="width:14px;height:14px;cursor:pointer;">
                    </label>
                    <div style="display:flex; flex-direction:column; gap:3px;">
                        <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#ccc;cursor:pointer;">
                            <span id="ss-lbl-box">Cajas de fondo (SRT)</span>
                            <input type="checkbox" id="ss-fx-box" style="width:14px;height:14px;cursor:pointer;">
                        </label>
                        <div id="ss-box-options" style="display:none; padding-left: 5px; font-size:10px; background:#0a0a0a; border-radius:4px; padding:6px; margin-top:2px; border:1px solid #222;">
                            <label style="display:flex; justify-content:space-between; color:#999; margin-bottom:4px; align-items:center;">
                                Opacidad: <span id="ss-box-op-val" style="color:#ff4d4d;font-weight:bold;">80%</span>
                            </label>
                            <input type="range" id="ss-box-opacity" min="0" max="100" value="80" style="width:100%; margin:0 0 6px 0; cursor:pointer;">
                            <label style="display:flex; align-items:center; justify-content:space-between; color:#999; cursor:pointer;">
                                Color Custom
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <input type="checkbox" id="ss-box-color-enable" title="Activar color personalizado">
                                    <input type="color" id="ss-box-color" value="#000000" disabled style="width:20px; height:18px; border:none; padding:0; background:none; cursor:pointer;">
                                </div>
                            </label>
                        </div>
                    </div>
                    <label style="display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#ccc;cursor:pointer;">
                        <span id="ss-lbl-anim">Animaciones de Color/Fad/Alpha</span>
                        <input type="checkbox" id="ss-fx-anim" checked style="width:14px;height:14px;cursor:pointer;">
                    </label>
                </div>
            </div>

            <div id="ss-stats" style="font-size:10px;color:#555;text-align:center;margin-bottom:6px;display:none;"></div>

            <div style="display:flex;gap:6px;">
                <button id="ss-btn-tradu" style="flex:1;background:#ff4d4d;color:white;border:none;padding:10px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">Traducir e Inyectar</button>
                <button id="ss-btn-stop" title="Quitar subtítulos" style="background:#333;color:white;border:1px solid #555;padding:10px 11px;border-radius:6px;cursor:pointer;font-size:15px;">⏹</button>
            </div>
            <div id="ss-msg" style="font-size:11px;margin-top:5px;color:#999;text-align:center;min-height:15px;">Listo para inyectar.</div>
            <button id="ss-btn-del-cache" style="display:none;width:100%;margin-top:8px;background:#2a2a2a;color:#ff6b6b;border:1px solid #ff6b6b44;padding:7px;border-radius:6px;cursor:pointer;font-size:11px;font-weight:bold;">🗑 Eliminar traducción en caché</button>
            <div style="display:flex;gap:6px;margin-top:8px;">
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

    const SS_UI_STRINGS = {
        "es": {
            "key_label": "Gemini API Key:", "key_ph": "Pega tu Key aquí...",
            "src_label": "Idioma Origen:", "dst_label": "Idioma Destino:",
            "ui_label": "🌐 Idioma de la ventana:", "scale_label": "📐 Escala:", "margin_label": "↕️ Margen V:",
            "no_video": "Sin video detectado", "style_label": "🎨 Estilo:", "fx_label": "✨ Efectos:",
            "fx_chroma": "Chromas / Glitch", "fx_box": "Cajas de fondo (SRT)", "fx_anim": "Anim. Color/Fad/Alpha",
            "btn_tradu": "Traducir e Inyectar", "btn_stop_tt": "Quitar subtítulos", "msg_ready": "Listo para inyectar.",
            "style_full": "Con todos los efectos", "style_nobox": "Sin cajas", "style_clean": "Solo texto limpio",
            "style_srt": "SRT (blanco/negro)", "style_srtc": "SRT estilizado (colores)",
            "lbl_apilink": "🔑 Consigue tu API Key gratis aquí",
            "langs_src": ["Auto detectar", "Portugués", "Japonés", "Inglés", "Español", "Coreano", "Chino"],
            "langs_dst": ["Español", "Portugués", "Inglés", "Francés", "Alemán", "Italiano", "Japonés", "Coreano", "Chino (Simplificado)", "Ruso", "Árabe", "Turco", "Polaco", "Holandés", "Indonesio"]
        },
        "en": {
            "key_label": "Gemini API Key:", "key_ph": "Paste your key here...",
            "src_label": "Source Language:", "dst_label": "Target Language:",
            "ui_label": "🌐 Interface Language:", "scale_label": "📐 Scale:", "margin_label": "↕️ V-Margin:",
            "no_video": "No video detected", "style_label": "🎨 Style:", "fx_label": "✨ Effects:",
            "fx_chroma": "Chroma / Glitch", "fx_box": "Background boxes (SRT)", "fx_anim": "Color/Fad/Alpha Anim",
            "btn_tradu": "Translate & Inject", "btn_stop_tt": "Remove subtitles", "msg_ready": "Ready to inject.",
            "style_full": "All effects", "style_nobox": "No boxes", "style_clean": "Clean text only",
            "style_srt": "SRT (white/black)", "style_srtc": "Styled SRT (colors)",
            "lbl_apilink": "🔑 Get your free API Key here",
            "langs_src": ["Auto detect", "Portuguese", "Japanese", "English", "Spanish", "Korean", "Chinese"],
            "langs_dst": ["Spanish", "Portuguese", "English", "French", "German", "Italian", "Japanese", "Korean", "Chinese (Simplified)", "Russian", "Arabic", "Turkish", "Polish", "Dutch", "Indonesian"]
        },
        "pt": {
            "key_label": "Chave da API Gemini:", "key_ph": "Cole sua chave aqui...",
            "src_label": "Idioma de Origem:", "dst_label": "Idioma de Destino:",
            "ui_label": "🌐 Idioma da janela:", "scale_label": "📐 Escala:", "margin_label": "↕️ Margem Vertical:",
            "no_video": "Nenhum vídeo detectado", "style_label": "🎨 Estilo:", "fx_label": "✨ Efeitos:",
            "fx_chroma": "Chroma / Glitch", "fx_box": "Caixas de fundo (SRT)", "fx_anim": "Animação Cor/Desv/Alfa",
            "btn_tradu": "Traduzir e Injetar", "btn_stop_tt": "Remover legendas", "msg_ready": "Pronto para injetar.",
            "style_full": "Todos os efeitos", "style_nobox": "Sem caixas", "style_clean": "Apenas texto limpo",
            "style_srt": "SRT (branco/preto)", "style_srtc": "SRT estilizado (cores)",
            "lbl_apilink": "🔑 Obtenha sua chave API gratuita aqui",
            "langs_src": ["Detectar automaticamente", "Português", "Japonês", "Inglês", "Espanhol", "Coreano", "Chinês"],
            "langs_dst": ["Espanhol", "Português", "Inglês", "Francês", "Alemão", "Italiano", "Japonês", "Coreano", "Chinês (Simplificado)", "Russo", "Árabe", "Turco", "Polonês", "Holandês", "Indonésio"]
        },
        "fr": {
            "key_label": "Clé API Gemini :", "key_ph": "Collez votre clé ici...",
            "src_label": "Langue source :", "dst_label": "Langue cible :",
            "ui_label": "🌐 Langue de l'interface :", "scale_label": "📐 Échelle :", "margin_label": "↕️ Marge verticale :",
            "no_video": "Aucune vidéo détectée", "style_label": "🎨 Style :", "fx_label": "✨ Effets :",
            "fx_chroma": "Chroma / Glitch", "fx_box": "Boîtes de fond (SRT)", "fx_anim": "Anim Couleur/Fondu/Alpha",
            "btn_tradu": "Traduire et Injecter", "btn_stop_tt": "Supprimer les sous-titres", "msg_ready": "Prêt à injecter.",
            "style_full": "Tous les effets", "style_nobox": "Sans boîtes", "style_clean": "Texte propre uniquement",
            "style_srt": "SRT (blanc/noir)", "style_srtc": "SRT stylisé (couleurs)",
            "lbl_apilink": "🔑 Obtenez votre clé API gratuite ici",
            "langs_src": ["Détection automatique", "Portugais", "Japonais", "Anglais", "Espagnol", "Coréen", "Chinois"],
            "langs_dst": ["Espagnol", "Portugais", "Anglais", "Français", "Allemand", "Italien", "Japonais", "Coréen", "Chinois (simplifié)", "Russe", "Arabe", "Turco", "Polonais", "Néerlandais", "Indonésien"]
        },
        "de": {
            "key_label": "Gemini API-Schlüssel:", "key_ph": "Fügen Sie Ihren Schlüssel hier ein...",
            "src_label": "Quellsprache:", "dst_label": "Zielsprache:",
            "ui_label": "🌐 Oberflächensprache:", "scale_label": "📐 Skalierung:", "margin_label": "↕️ V-Rand:",
            "no_video": "Kein Video erkannt", "style_label": "🎨 Stil:", "fx_label": "✨ Effekte:",
            "fx_chroma": "Chroma / Glitch", "fx_box": "Hintergrundboxen (SRT)", "fx_anim": "Farbe/Fade/Alpha-Anim",
            "btn_tradu": "Übersetzen & Einfügen", "btn_stop_tt": "Untertitel entfernen", "msg_ready": "Bereit zum Einfügen.",
            "style_full": "Alle Effekte", "style_nobox": "Keine Boxen", "style_clean": "Nur reiner Text",
            "style_srt": "SRT (weiß/schwarz)", "style_srtc": "Gestyltes SRT (Farben)",
            "lbl_apilink": "🔑 Holen Sie sich hier Ihren kostenlosen API-Schlüssel",
            "langs_src": ["Automatisch erkennen", "Portugiesisch", "Japanisch", "Englisch", "Spanisch", "Koreanisch", "Chinesisch"],
            "langs_dst": ["Spanisch", "Portugiesisch", "Englisch", "Französisch", "Deutsch", "Italienisch", "Japanisch", "Koreanisch", "Chinesisch (vereinfacht)", "Russisch", "Arabisch", "Türkisch", "Polnisch", "Niederländisch", "Indonesisch"]
        },
        "ja": {
            "key_label": "Gemini APIキー:", "key_ph": "ここにキーを貼り付けてください...",
            "src_label": "元の言語:", "dst_label": "ターゲット言語:",
            "ui_label": "🌐 インターフェース言語:", "scale_label": "📐 スケール:", "margin_label": "↕️ 垂直マージン:",
            "no_video": "ビデオが検出されません", "style_label": "🎨 スタイル:", "fx_label": "✨ エフェクト:",
            "fx_chroma": "クロマ / グリッチ", "fx_box": "背景ボックス (SRT)", "fx_anim": "カラー/フェード/アルファアニメ",
            "btn_tradu": "翻訳して注入", "btn_stop_tt": "字幕を削除", "msg_ready": "注入の準備ができました。",
            "style_full": "すべてのエフェクト", "style_nobox": "ボックスなし", "style_clean": "クリーンテキストのみ",
            "style_srt": "SRT (白/黒)", "style_srtc": "スタイル付きSRT (カラー)",
            "lbl_apilink": "🔑 ここで無料のAPIキーを取得",
            "langs_src": ["自動検出", "ポルトガル語", "日本語", "英語", "スペイン語", "韓国語", "中国語"],
            "langs_dst": ["スペイン語", "ポルトガル語", "英語", "フランス語", "ドイツ語", "イタリア語", "日本語", "韓国語", "中国語（簡体字）", "ロシア語", "アラビア語", "トルコ語", "ポーランド語", "オランダ語", "インドネシア語"]
        },
        "ko": {
            "key_label": "Gemini API 키:", "key_ph": "여기에 키를 붙여넣으세요...",
            "src_label": "출발어:", "dst_label": "도착어:",
            "ui_label": "🌐 인터페이스 언어:", "scale_label": "📐 비율:", "margin 기": "↕️ 수직 여백:",
            "no_video": "비디오가 감지되지 않음", "style_label": "🎨 스타일:", "fx_label": "✨ 효과:",
            "fx_chroma": "크로마 / 글리치", "fx_box": "배경 상자 (SRT)", "fx_anim": "색상/페이드/알파 애니메이션",
            "btn_tradu": "번역 및 주입", "btn_stop_tt": "자막 제거", "msg_ready": "주입 준비 완료.",
            "style_full": "모든 효과", "style_nobox": "상자 없음", "style_clean": "일반 텍스트만",
            "style_srt": "SRT (흰색/검은색)", "style_srtc": "스타일이 적용된 SRT (색상)",
            "lbl_apilink": "🔑 여기에서 무료 API 키를 받으세요",
            "langs_src": ["자동 감지", "포르투갈어", "일본어", "영어", "스페인어", "한국어", "중국어"],
            "langs_dst": ["스페인어", "포르투갈어", "영어", "프랑스어", "독일어", "이탈리아어", "일본어", "한국어", "중국어(간체)", "러시아어", "아랍어", "튀르키예어", "폴란드어", "네덜란드어", "인도네시아어"]
        }
    };

    function applyUILang(lang) {
        const s = SS_UI_STRINGS[lang] || SS_UI_STRINGS['es'];
        const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };

        set('ss-lbl-key', s.key_label); set('ss-lbl-src', s.src_label); set('ss-lbl-dst', s.dst_label);
        set('ss-lbl-scale', s.scale_label); set('ss-lbl-margin', s.margin_label); set('ss-lbl-apilink', s.lbl_apilink);
        set('ss-ui-lang-label', s.ui_label); set('ss-lbl-style', s.style_label); set('ss-lbl-fx', s.fx_label);
        set('ss-lbl-chroma', s.fx_chroma); set('ss-lbl-box', s.fx_box); set('ss-lbl-anim', s.fx_anim);

        const styleOpts = document.getElementById('ss-style')?.options;
        if (styleOpts && styleOpts.length >= 5) {
            styleOpts[0].text = s.style_full; styleOpts[1].text = s.style_nobox;
            styleOpts[2].text = s.style_clean; styleOpts[3].text = s.style_srt; styleOpts[4].text = s.style_srtc;
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
        if (infoEl && infoEl.style.color === 'rgb(102, 102, 102)') infoEl.textContent = s.no_video;

        try { chrome.storage.local.set({ ssUiLang: lang }); } catch(_) {}
    }

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

    chrome.storage.local.get(['ssApiKeySaved','ssScaleSaved','ssMarginSaved','ssSourceSaved','ssStyleSaved','ssUiLang'], (res) => {
        if (res.ssApiKeySaved) document.getElementById('ss-key').value = res.ssApiKeySaved;
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
        const msg = document.getElementById('ss-msg');
        
        if (!apiKey) { msg.innerText = '❌ Ingresa tu API Key'; return; }
        
        try { chrome.storage.local.set({ ssApiKeySaved: apiKey }); } catch(e) {}
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
                
                chrome.runtime.sendMessage({
                    action: 'hacerFetchInseguro',
                    payload: { 
                        api_key: apiKey, 
                        xml_data: xmlTexto, 
                        video_id: videoId,
                        video_title: videoTitle, 
                        idioma_destino: destino, 
                        idioma_origen: origen 
                    }
                }, (data) => {
                    if (!data) { msg.innerText = '❌ Sin respuesta del servidor'; return; }
                    if (data.error) { msg.innerText = '❌ ' + data.error; return; }
                    if (!data.ass_data) { msg.innerText = '❌ Actualiza servidor.py'; return; }
                    
                    msg.innerText = data.cache ? '⚡ Inyectado desde caché' : '✅ Traducido e inyectado';
                    window._ssLastXmlData  = xmlTexto;
                    window._ssLastVideoId  = videoId;
                    window._ssLastDestino  = destino;
                    window._ssLastOrigen   = origen;
                    
                    if (window.SSTraduEngine) {
                        window.SSTraduEngine.iniciarMotor(data.ass_data);
                        
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

    document.getElementById('ss-btn-del-cache').onclick = async () => {
        const btnDel = document.getElementById('ss-btn-del-cache');
        const msg    = document.getElementById('ss-msg');
        if (!window._ssLastXmlData) { msg.innerText = '⚠️ Traduce primero para poder borrar el caché'; return; }
        
        btnDel.disabled = true;
        btnDel.textContent = '⏳ Eliminando...';
        
        try {
            const resp = await fetch('http://localhost:5001/eliminar-cache', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    video_id:        window._ssLastVideoId,
                    idioma_destino:  window._ssLastDestino,
                    idioma_origen:   window._ssLastOrigen,
                    xml_data:        window._ssLastXmlData,
                })
            });
            const data = await resp.json();
            if (data.status === 'eliminado') {
                msg.innerText = '🗑 Caché eliminado — ya puedes volver a traducir';
            } else if (data.status === 'no_encontrado') {
                msg.innerText = '⚠️ No había caché guardado para este video';
            } else {
                msg.innerText = '❌ ' + (data.error || 'Error desconocido');
            }
        } catch(e) {
            msg.innerText = '❌ No se pudo conectar al servidor: ' + e.message;
        }
        
        btnDel.disabled = false;
        btnDel.textContent = '🗑 Eliminar traducción en caché';
        btnDel.style.display = 'none';
        window._ssLastXmlData = null;
    };

    setInterval(() => {
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
            
            btn.onclick = () => { 
                const m = document.getElementById('sstradu-panel'); 
                m.style.display = m.style.display === 'none' ? 'block' : 'none'; 
            };
            controls.prepend(btn);
        }
        
        const infoEl = document.getElementById('ss-video-info');
        if (!infoEl) return;
        const vid = new URLSearchParams(window.location.search).get('v');
        if (!vid) { infoEl.textContent = 'Sin video detectado'; infoEl.style.color = '#666'; return; }
        const title = document.querySelector('#title h1 yt-formatted-string, ytd-video-primary-info-renderer h1')?.textContent?.trim()
                   || document.title.replace(' - YouTube', '').trim() || '';
        infoEl.textContent = title ? title.substring(0, 52) + (title.length > 52 ? '...' : '') : vid;
        infoEl.style.color = '#aaa';
    }, 1500);

    document.addEventListener('keydown', (e) => {
        const tagName = e.target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
            return; 
        }

        if (e.key.toLowerCase() === 'u') {
            const panel = document.getElementById('sstradu-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        }
    });

})();