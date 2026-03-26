# Phantom Design System — Midnight Editorial

## Theme Identity

**Midnight Editorial** — Structured, data-forward, crisp hierarchy. Phantom feels like a serious analytics command center with clear information architecture. Not playful, not flashy — confident and precise.

The reference implementation is in [`REFERENCE_DASHBOARD.jsx`](REFERENCE_DASHBOARD.jsx).

## Quick Reference

### Fonts
- **Primary:** IBM Plex Sans (300, 400, 500, 600, 700)
- **Mono:** IBM Plex Mono (400, 500, 600)
- Rule: mono for data/labels/timestamps, sans for content/headings

### Core Colors
```
Page background:     #101014
Surface/cards:       #15151a
Raised/hover:        #1a1a24
Borders:             #222228
Text primary:        #e8e8ec
Text secondary:      #888890
Text tertiary:       #55555e
Accent (purple):     #6C3AED
Accent light:        #A78BFA
```

### Layer Colors (The Four Layers)
```
Shield   (defensive):  text #34D399  bg #0d2818  border #134e2a
Brain    (AI):         text #A78BFA  bg #1a1040  border #2d1b69
Sword    (offense):    text #F87171  bg #2a0f0f  border #5c1a1a
Autopilot (auto):      text #60A5FA  bg #1a2332  border #1e3a5f
```

### Key Rules
1. No gradients on cards — flat fills only
2. No drop shadows — only colored glow on status indicators
3. 1px borders only — structural, not decorative
4. Layer colors encode meaning — never use them for other purposes
5. Stagger entry animations (0.05-0.08s between siblings)
6. Large numbers: 40px weight 300, letter-spacing -2
7. Sidebar: 230px fixed, grouped nav with mono uppercase section headers
