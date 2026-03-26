# AI Radar Live Dashboard 🎯

![AI Radar Dashboard](https://img.shields.io/badge/Status-Active-success) ![Made with Vanilla JS](https://img.shields.io/badge/Tech-Vanilla%20JS%20%2F%20HTML%20%2F%20CSS-blue)
> Der stets aktuelle Kompass für die besten KI-Modelle, Preise & Anwendungsgebiete.

Das **AI Radar Live Dashboard** ist eine schlanke, extrem performante Web-Anwendung, die es dir ermöglicht, im rasant wachsenden Markt der KI-Modelle stets den überblick zu behalten. Es nutzt die offizielle **OpenRouter API**, um Daten in Echtzeit abzurufen.

## ✨ Features

- **Live-Synchronisation:** Modelle, Preise und Kontextfenster sind immer auf dem neuesten Stand. Sobald OpenRouter ein Modell hinzufügt (z.B. GPT-5, Claude Next), erscheint es automatisch in diesem Dashboard.
- **Kein Setup notwendig:** Reines HTML, CSS und Vanilla Javascript. Kein Node.js, kein NPM, kein Build-Step erforderlich.
- **Use-Case Matcher:** Filtere Modelle gezielt nach bestimmten Anforderungen:
  - 💻 **Programmieren** (Finde die besten Coder-Modelle wie Sonnet 3.5 oder GPT-4o)
  - 🧠 **Logik & Mathe** (Finde Reasoning-Modelle der o1-Klasse)
  - ⚡ **Günstig & Schnell** (Modelle, die unter $0.50 pro 1M Tokens kosten)
  - 📚 **Großer Kontext** (alles >= 128k Tokens)
- **Kosten-Standardisierung:** Die API-Preise werden automatisch in den Branchenstandard "Preis pro 1.000.000 Tokens" umgerechnet und dargestellt.
- **Hochwertiges UI/UX:** Atemberaubendes Dark-Mode-Design mit Glassmorphism-Effekten, leuchtenden Akzenten und weichen Mikro-Animationen.

## 🚀 Wie starte ich das Dashboard?

Es ist wirklich kinderleicht:

1. Lade dieses Repository auf deinen Computer herunter (oder klone es).
2. Öffne den Ordner.
3. Klicke doppelt auf die `index.html`-Datei.

Das war's! Das Dashboard öffnet sich in deinem Standard-Browser und lädt sofort die Live-Daten.

## 🛠️ Technologien

- **Struktur:** HTML5
- **Design:** Modernes Vanilla CSS3 (Custom Properties, Flexbox, Grid, Backdrop-Filter)
- **Logik:** JavaScript (ES6+ mit Fetch API)
- **Datenquelle:** [OpenRouter API](https://openrouter.ai/docs#models)
- **Icons & Fonts:** Lucide SVG Icons (inline), Google Fonts (Outfit, Inter)

## 🤝 Anpassung

Möchtest du eigene Filter hinzufügen?
Öffne einfach die Datei `app.js` und schau in die Funktion `getModelTags()`. Dort kannst du individuelle Such- und Filter-Heuristiken ergänzen.

---

*Erstellt mit Fokus auf Performance, Design und absolute Nutzerfreundlichkeit.*
