# Design System

## Color Palette

### Backgrounds

| Token      | Color     | Usage             |
| ---------- | --------- | ----------------- |
| `obsidian` | `#0F1115` | App background    |
| `midnight` | `#151922` | Main surfaces     |
| `charcoal` | `#1C212B` | Cards and panels  |
| `graphite` | `#252B36` | Elevated surfaces |

### Primary

| Token            | Color     | Usage           |
| ---------------- | --------- | --------------- |
| `antique-gold`   | `#C9A86A` | Primary actions |
| `burnished-gold` | `#A8894F` | Hover states    |

### Secondary

| Token          | Color     | Usage             |
| -------------- | --------- | ----------------- |
| `dusty-violet` | `#7A6F9B` | Secondary accents |
| `faded-plum`   | `#5E567A` | Muted emphasis    |

### Accent

| Token         | Color     | Usage                |
| ------------- | --------- | -------------------- |
| `cosmic-blue` | `#5D7FA3` | Links and highlights |
| `deep-cyan`   | `#3E6670` | Informational states |

### Text

| Token       | Color     | Usage          |
| ----------- | --------- | -------------- |
| `parchment` | `#F3EBDD` | Primary text   |
| `fog`       | `#C9C2B8` | Secondary text |
| `ash`       | `#9A948A` | Muted text     |

### Semantic

| State   | Color     |
| ------- | --------- |
| Success | `#5F8A6B` |
| Warning | `#B88A4A` |
| Error   | `#A35A5A` |

---

## Typography

### Heading Font

**Cormorant Garamond**

Used for:

- page titles,
- section headings,
- book titles,
- important headings.

### Body Font

**Inter**

Used for:

- body text,
- tables,
- forms,
- navigation,
- UI elements.

### Typography Scale

| Element | Size |
| ------- | ---- |
| Display | 48px |
| H1      | 36px |
| H2      | 30px |
| H3      | 24px |
| H4      | 20px |
| Body    | 16px |
| Small   | 14px |
| Caption | 12px |

---

## Spacing

Base unit: **4px**

| Token | Value |
| ----- | ----- |
| xs    | 4px   |
| sm    | 8px   |
| md    | 16px  |
| lg    | 24px  |
| xl    | 32px  |
| 2xl   | 48px  |
| 3xl   | 64px  |

Layouts should prioritize generous whitespace.

---

## Border Radius

| Component | Radius |
| --------- | ------ |
| Buttons   | 10px   |
| Inputs    | 10px   |
| Cards     | 12px   |
| Tables    | 12px   |
| Modals    | 16px   |

---

## Shadows

Use soft layered shadows.

### Card

- subtle elevation,
- low opacity,
- wide blur radius.

### Modal

- stronger separation,
- soft edges,
- atmospheric depth.

Avoid harsh black shadows.

---

## Borders

Border color:

`rgba(243, 235, 221, 0.08)`

Borders should be subtle and primarily used to separate surfaces.

---

## Icons

Style:

- minimal,
- outlined,
- consistent stroke width.

Preferred libraries:

- Lucide React
- Heroicons

---

## Motion

Duration:

- 150ms
- 200ms
- 300ms

Easing:

- ease-out
- ease-in-out

Use animation for:

- hover,
- focus,
- modal transitions,
- loading states.

Avoid dramatic animations.

---

## Surface Hierarchy

Level 0:

- obsidian background.

Level 1:

- midnight containers.

Level 2:

- charcoal cards.

Level 3:

- graphite elevated panels.

This layered system creates depth without relying on gradients.
