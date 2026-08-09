<div align="center">

# 🌌 Unlimited Tradu Web
**Break the language barrier. Preserve the art.**

[![Chrome Extension](https://img.shields.io/badge/Platform-Google_Chrome-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](#)
[![Powered by Gemini](https://img.shields.io/badge/AI_Engine-Google_Gemini-8E75B2?style=flat-square&logo=googlebard&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/Code-Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](#)
[![License](https://img.shields.io/badge/License-All_Rights_Reserved-red?style=flat-square)](#license--fair-use)

*A next-gen Chrome extension that translates heavily styled YouTube subtitles (SRV3 / ASS) into any language, flawlessly preserving their original visual effects, typography, and animations.*

<br>

[🇺🇸 **Read in English**](#-english) &nbsp; | &nbsp; [🇪🇸 **Leer en Español**](#-español)

<br>
<hr>
</div>

<h2 id="-english">🇺🇸 English Documentation</h2>

> **The Problem:** YouTube’s native "Auto-Translate" feature destroys all advanced subtitle formatting. Beautifully crafted fonts, dynamic colors, karaoke effects, and precise screen positions are instantly reduced to boring, static text at the bottom of the video.
>
> **The Solution:** Unlimited Tradu Web intercepts the original styled subtitles, translates them using advanced Contextual AI (Gemini), and re-injects them into a custom rendering engine directly over your video. **You get the translation you need, with the cinematic experience you deserve.**

### ✨ Core Features

*   🎭 **Flawless Visual Rendering:** A custom, high-performance ASS/SRV3 engine that natively supports animations (`\t`), precise positioning (`\pos`, `\move`), opacity fades (`\fad`), and complex typographies.
*   🧠 **Limitless AI Translation:** Powered by the Google Gemini API. Forget literal, broken line-by-line translations. Enjoy semantic, context-aware subtitles in any language.
*   🌟 **Native-Like Glow & Shadows:** Advanced multi-layer algorithms replicate YouTube's soft glows, hard borders, and dynamic backgrounds without looking jagged or pixelated.
*   🎛️ **On-The-Fly Customization:**
    *   **Global Scale & Margins:** Adjust subtitle sizes and vertical positions seamlessly.
    *   **Style Filters:** Choose from `Full Effects`, `No Boxes`, `Clean Text`, or `SRT Mode` to tone down heavily stylized videos.
    *   **Toggle Elements:** Disable chromas, shadows, or fades with a single click.

### ⚙️ How to Install (Developer Mode)

1. Download the latest `.zip` file from the [Releases](https://github.com/SonizBeibe/Unlimited-Tradu/releases/tag/v1.0.0) tab and extract it to a folder.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Toggle **"Developer mode"** on (top right corner).
4. Click **"Load unpacked"** and select the folder you extracted.
5. Open any YouTube video with subtitles, click the S&S icon in the player, input your free Gemini API Key, and hit *Inject*.

### 💻 Architecture (Under the Hood)
Built entirely in Vanilla JS for maximum performance. It uses a **Secure Service Worker** for fast, CORS-free API communication, a **Hybrid ASS/SRV3 Parser** to calculate dynamic timestamps and rendering tags, and a **25ms DOM Injector** that adapts perfectly to fullscreen and theater modes.

### ⚖️ License & Fair Use

**All Rights Reserved.** 
The source code for this extension is published in this repository strictly for **transparency and security auditing purposes**. You are encouraged to inspect the code to ensure your data is safe. 

However, **copying, modifying, distributing, or publishing derivative versions is strictly prohibited** without explicit written permission from the author. 

**Why?** Translating subtitles via AI requires servers. The official version of this extension includes lightweight, non-intrusive ads that cover these high server costs, keeping the tool free for the community. Clones or "ad-free" derivatives harm the sustainability of the project. Thank you for supporting the official release!

<br>
<div align="center">
  <a href="https://ko-fi.com/TU_USUARIO"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi"></a>
</div>
<br>

---

<h2 id="-español">🇪🇸 Documentación en Español</h2>

> **El Problema:** La función nativa de "Traducción automática" de YouTube destruye todo el formato avanzado de los subtítulos. Fuentes hermosas, colores dinámicos, efectos de karaoke y posiciones precisas se reducen instantáneamente a un texto aburrido y estático en la parte inferior del video.
>
> **La Solución:** Unlimited Tradu Web intercepta los subtítulos estilizados originales, los traduce utilizando IA Contextual avanzada (Gemini) y los re-inyecta en un motor de renderizado propio directamente sobre tu video. **Obtienes la traducción que necesitas, con la experiencia cinematográfica que mereces.**

### ✨ Características Principales

*   🎭 **Renderizado Visual Perfecto:** Un motor ASS/SRV3 de alto rendimiento que soporta de forma nativa animaciones (`\t`), posicionamiento exacto (`\pos`, `\move`), desvanecimientos (`\fad`) y tipografías complejas.
*   🧠 **Traducción IA Sin Límites:** Impulsado por la API de Google Gemini. Olvídate de las traducciones literales línea por línea. Disfruta de subtítulos con sentido semántico y contextual en cualquier idioma.
*   🌟 **Glow y Sombras Nativas:** Algoritmos multicapa avanzados que replican los resplandores suaves de YouTube, los bordes duros y los fondos dinámicos sin verse dentados ni pixelados.
*   🎛️ **Personalización en Tiempo Real:**
    *   **Escala y Márgenes:** Ajusta el tamaño de los subtítulos y su posición vertical fluidamente.
    *   **Filtros de Estilo:** Elige entre `Full Efectos`, `Sin Cajas`, `Texto Limpio` o `Modo SRT` para simplificar videos muy recargados.
    *   **Interruptores de Efectos:** Desactiva chromas, sombras o fades con un solo clic.

### ⚙️ Cómo Instalar (Modo Desarrollador)

1. Descarga el archivo `.zip` más reciente desde la pestaña de [Releases](https://github.com/TU_USUARIO/TU_REPOSITORIO/releases) y extráelo en una carpeta.
2. Abre Google Chrome y navega a `chrome://extensions/`.
3. Activa el **"Modo desarrollador"** (esquina superior derecha).
4. Haz clic en **"Cargar descomprimida"** y selecciona la carpeta que extrajiste.
5. Abre un video de YouTube con subtítulos, haz clic en el ícono de S&S en el reproductor, ingresa tu API Key gratuita de Gemini y presiona *Inyectar*.

### 💻 Arquitectura (Bajo el Capó)
Construido completamente en Vanilla JS para máximo rendimiento. Utiliza un **Service Worker Seguro** para comunicación API rápida y sin bloqueos de CORS, un **Parser Híbrido ASS/SRV3** para calcular marcas de tiempo y etiquetas de renderizado, y un **Inyector DOM a 25ms** que se adapta perfectamente a los modos de pantalla completa y teatro.

### ⚖️ Licencia y Uso Justo

**Todos los Derechos Reservados.** 
El código fuente de esta extensión se publica en este repositorio estrictamente con fines de **transparencia y auditoría de seguridad**. Te invitamos a inspeccionar el código para asegurarte de que tus datos están seguros.

Sin embargo, **la copia, modificación, distribución o publicación de versiones derivadas está estrictamente prohibida** sin el permiso explícito por escrito del autor.

**¿Por qué?** Traducir subtítulos mediante IA requiere servidores. La versión oficial de esta extensión incluye anuncios ligeros y no intrusivos que cubren estos altos costos de servidor, manteniendo la herramienta gratuita para la comunidad. Los clones o derivados "sin anuncios" perjudican la sostenibilidad del proyecto. ¡Gracias por apoyar la versión oficial!

<br>
<div align="center">
  <a href="https://ko-fi.com/TU_USUARIO"><img src="https://ko-fi.com/img/githubbutton_sm.svg" alt="Support me on Ko-fi"></a>
</div>
<br>

---
<div align="center">
  <p>Made with ❤️ by <strong><a href="https://github.com/SonizBeibe">Soniz</a></strong></p>
</div>
