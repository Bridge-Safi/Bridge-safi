# Bridge Shark — Design Theme Guide

This document describes the exact visual design system used in the Bridge Safi main app.
The game at `https://de74e39f-30c2-4a4e-81c6-35b38d5328e6-00-2kdljcxzty31v.riker.replit.dev/` must match this theme precisely.

---

## Colors

| Token | Hex | Usage |
|---|---|---|
| Background dark | `#04110A` | Page background (top) |
| Background mid | `#071C11` | Page background (mid) |
| Green primary | `#059669` | Borders, buttons, glows |
| Green light | `#4ADE80` | Accent text, highlights |
| Yellow primary | `#FDE047` | Diamonds, scores |
| Yellow soft | `#FCD34D` | Bonus card titles |
| Gold | `#D9C5A0` | Logo text, subtle labels |
| White text | `#FFFFFF` | Headings |
| Muted text | `rgba(255,255,255,0.4)` | Labels, secondary |
| Body text | `rgba(255,255,255,0.75)` | Descriptions |

### Background Gradient
```css
background: linear-gradient(180deg, #04110A 0%, #071C11 50%, #050F08 100%);
```

### Glow effects (absolutely positioned, pointer-events:none)
- Top left: `radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)` — 300px circle
- Top right: `radial-gradient(circle, rgba(253,224,71,0.08) 0%, transparent 70%)` — 220px circle
- Bottom: `radial-gradient(circle, rgba(6,95,70,0.15) 0%, transparent 70%)` — 280x200px

---

## Typography

- **Font**: System UI / sans-serif (same as host device)
- **Headings**: `font-weight: 900`, `letter-spacing: 0.3em`, `text-transform: uppercase`
- **Sub-labels**: `font-size: 9-11px`, `font-weight: 800`, `letter-spacing: 0.15em`, `text-transform: uppercase`
- **Body**: `font-size: 12px`, `font-weight: 600`, `line-height: 1.4`
- **Scores/IDs**: `font-size: 18-26px`, `font-weight: 900`, color `#4ADE80` or `#FDE047`

---

## Card / Panel Style

```css
background: rgba(255,255,255,0.05);
border: 1px solid rgba(74,222,128,0.2);   /* or rgba(253,224,71,0.25) for yellow */
border-radius: 18px;
padding: 14px 18px;
```

### Bonus card (orange/yellow)
```css
background: linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(251,191,36,0.08) 100%);
border: 1px solid rgba(251,191,36,0.4);
border-radius: 18px;
```

### Bonus card (green)
```css
background: linear-gradient(135deg, rgba(6,95,70,0.2) 0%, rgba(74,222,128,0.08) 100%);
border: 1px solid rgba(74,222,128,0.35);
border-radius: 18px;
```

---

## Primary Button (PLAY)

```css
background: linear-gradient(135deg, #059669 0%, #4ADE80 50%, #059669 100%);
background-size: 200% 100%;
border: none;
border-radius: 20px;
padding: 18px 0;
color: #fff;
font-size: 18px;
font-weight: 900;
letter-spacing: 0.1em;
box-shadow: 0 0 30px rgba(74,222,128,0.4), 0 4px 24px rgba(5,150,105,0.5);
animation: shimmer 2.5s linear infinite;
```

```css
@keyframes shimmer {
  0%   { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}
```

---

## Progress Bar

```css
/* Track */
background: rgba(0,0,0,0.3);
border-radius: 99px;
height: 10px;
overflow: hidden;

/* Fill */
background: linear-gradient(90deg, #065F46, #4ADE80);
box-shadow: 0 0 10px rgba(74,222,128,0.5);
border-radius: 99px;
```

---

## Mascot Circle

```css
width: 175px;
height: 175px;
border-radius: 50%;
border: 3px solid #059669;
box-shadow: 0 0 40px rgba(5,150,105,0.5), 0 0 80px rgba(5,150,105,0.2);
background: #071C11;
overflow: hidden;
```

### Spinning rings around mascot
```css
/* Ring 1 */
position: absolute; width: 200px; height: 200px;
border-radius: 50%;
border: 2px solid rgba(74,222,128,0.2);
animation: spin 12s linear infinite;

/* Ring 2 */
position: absolute; width: 220px; height: 220px;
border-radius: 50%;
border: 1px dashed rgba(74,222,128,0.12);
animation: spin 20s linear infinite reverse;
```

### LIVE badge (bottom-right of mascot)
```css
background: #059669;
border: 2px solid #04110A;
border-radius: 20px;
padding: 3px 10px;
```
```css
/* Pulse dot inside */
width: 6px; height: 6px;
border-radius: 50%;
background: #4ADE80;
box-shadow: 0 0 6px #4ADE80;
animation: blink 1.2s ease-in-out infinite;
```

---

## Step Items (numbered list)

Step circles use 3 gradient colors:
- Step 1: `linear-gradient(135deg, #059669, #4ADE80)` — glow `rgba(74,222,128,0.4)`
- Step 2: `linear-gradient(135deg, #B45309, #FDE047)` — glow `rgba(253,224,71,0.4)`
- Step 3: `linear-gradient(135deg, #9D174D, #F472B6)` — glow `rgba(244,114,182,0.4)`

---

## Animations

```css
@keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes shimmer{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
```

---

## Game Rules (displayed in app)

**Session**: 5 consecutive days, 3–4 hours/day  
**Rate**: 1,000 💎 per hour  
**Target**: 15,000 💎 total  
**Penalty**: missing diamonds ÷ 1,000 × 5 MAD  

**BONUS**:
- Play **2 extra hours** beyond the daily minimum → **next delivery FREE** 🚴
- **+2,000 💎** bonus awarded for those 2 extra hours

---

## Layout

- Max content width: `380px`, centered
- All sections padded: `0 16px`
- Gap between sections: `12–14px`
- Mobile-first: `min-height: 100dvh`
- Safe-area: top padding `52px` (status bar)

---

## Player ID Format

```
BR-XXXXXXX   (7 uppercase alphanumeric chars, derived from Clerk user ID)
```
Color: `#4ADE80`, font-size: 15px, font-weight: 900, letter-spacing: 0.1em

---

*Last updated: Bridge Safi v1 — coordinate with main app agent before changing.*
