---
name: frontend-design-system
description: Modern UI/UX engineering, design tokens, responsive layouts, micro-animations, accessible components, and Generative UI widgets. Use when creating or refining user interfaces.
---

# Frontend Engineering & Design Systems

Guidelines for creating modern, responsive, high-aesthetic web interfaces that look state-of-the-art.

## Design Aesthetics Standard
- **Curated Palette**: Avoid raw primaries (`#ff0000`, `#0000ff`). Use harmonious HSL/Hex palettes (e.g., slate/indigo/emerald/violet), dark/light mode balance, and subtle borders.
- **Modern Typography**: Use clean font stacks (Inter, Plus Jakarta Sans, Outfit, system-ui) with clear scale hierarchy (`text-xs` to `text-4xl`).
- **Depth & Polish**: Glassmorphism (`backdrop-blur`), soft layered shadows (`shadow-sm`, `shadow-xl`), and subtle micro-borders (`border border-slate-700/50`).
- **Dynamic Interaction**: Hover transitions (`transition-all duration-200 ease-in-out`), scale effects (`hover:scale-105`), active button press feedback.
- **Zero Placeholders**: Never leave raw text placeholders or broken images. Use `generate_image` or styled SVG avatars/icons.

## Generative UI Inline Artifacts
When presenting interactive UI previews, calculators, or diagrams in chat:
1. Save standalone HTML with allowlisted Tailwind to the artifact directory.
2. Include the Tailwind script in the `<head>`:
   `<script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>`
3. Embed inline using `<agent-embed src="file:///<artifact_path>/widget.html"></agent-embed>`.

See [design-tokens.md](./references/design-tokens.md) for pre-approved token palettes.
