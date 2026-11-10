# RipUI ⚡

> **1-Click Real DOM & Computed CSS Reverse-Engineering into Clean React + Tailwind CSS Components.**
> *No Vision Guessing. 100% Pixel Precision. Pure Mathematical Certainty.*

[![GitHub stars](https://img.shields.io/github/stars/cpttbtptp2812/RipUI?style=social)](https://github.com/cpttbtptp2812/RipUI)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/cpttbtptp2812/RipUI/pulls)

---

## 💡 Why RipUI?

In the AI era, tools like `screenshot-to-code` try to turn webpage screenshots into code using Multimodal Vision LLMs (GPT-4o). **However, vision-based reconstruction fundamentally fails in real-world engineering:**

| Feature | Vision Screenshot-to-Code | RipUI ⚡ (Real DOM Ripper) |
| :--- | :--- | :--- |
| **Spacing & Padding** | ❌ Hallucinated / Guessed | ✅ **100% Exact computed pixels** (`p-4`, `gap-6`) |
| **SVG Icons** | ❌ Flattened into black squares / broken PNGs | ✅ **100% Lossless vector `<path>` & `viewBox`** |
| **Colors & Opacity** | ❌ Blurred by color-space compression | ✅ **Exact HEX / RGBA / Tailwind palette** |
| **Dynamic Backdrop & Blur** | ❌ Rendered as static grey backgrounds | ✅ **`backdrop-blur-md` & native filters** |
| **Private Dashboards** | ❌ Requires exposing screenshots or public URLs | ✅ **Works on authenticated localhost & internal SaaS** |
| **Speed & Cost** | ❌ 15s latency + Vision LLM API costs | ✅ **Instant (< 50ms) + 100% Free & Local** |

---

## ✨ Features

- 🎯 **Laser Inspector**: Hover over any UI element on any webpage with real-time dimensions and tag badges.
- ⚡ **Native CSS to Tailwind Converter**: Converts `getComputedStyle()` into idiomatic Tailwind CSS classes (Flexbox, Grid, Typography, Colors, Borders, Shadows).
- 🎨 **100% Lossless SVG Extraction**: Preserves raw SVG geometry without losing vector fidelity.
- 📦 **Multi-Framework Export**:
  - **React (TSX)**: Clean functional components with TypeScript typings.
  - **Vue 3**: Single-File Components (`<script setup lang="ts">`).
  - **Clean HTML**: Standalone semantic HTML + Tailwind.
- 🛡️ **Shadow DOM Isolation**: The Inspector and Drawer run inside an isolated Shadow Root `#ripui-shadow-host` to prevent host site CSS leaks.

---

## 🚀 Quick Start

### 1. Interactive Web Playground (Local Dev)

Clone the repository and start the Vite development playground:

```bash
git clone https://github.com/cpttbtptp2812/RipUI.git
cd RipUI
npm install
npm run dev
```

Visit `http://localhost:5173`, press **`Alt + R`** or click **Inspect UI**, and click on any demo card to rip it into React code!

### 2. Build as Chrome Extension (Manifest V3)

```bash
npm run build:extension
```

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right corner).
3. Click **Load unpacked** and select the `dist/` directory.
4. Press `Alt + R` on any website (Linear, Stripe, Vercel, etc.) to inspect and rip components!

---

## 🛠️ Architecture

```
RipUI Architecture:
┌─────────────────┐       ┌────────────────────────┐       ┌──────────────────────┐
│  Target DOM Node │ ───> │ window.getComputedStyle│ ───> │ CSS-to-Tailwind Engine│
└─────────────────┘       └────────────────────────┘       └──────────────────────┘
         │                                                            │
         ▼                                                            ▼
┌─────────────────┐                                        ┌──────────────────────┐
│ Lossless Vector │                                        │ React / Vue / HTML   │
│   SVG Paths     │ ─────────────────────────────────────> │      Generators      │
└─────────────────┘                                        └──────────────────────┘
                                                                      │
                                                                      ▼
                                                           ┌──────────────────────┐
                                                           │ Shadow DOM Drawer UI │
                                                           └──────────────────────┘
```

---

## 🗺️ Roadmap

- [x] High-precision Real DOM tree recursive extraction
- [x] Lossless SVG vector icon capture
- [x] Computed CSS to Tailwind class mapping
- [x] React (TSX), Vue 3, HTML generators
- [x] Shadow DOM isolated slide-out drawer
- [ ] Framer Motion animation state reverse-engineering
- [ ] Export to shadcn/ui component format

---

## 📄 License

MIT License © 2026 [Wang Xu](https://github.com/cpttbtptp2812) & RipUI Contributors.

