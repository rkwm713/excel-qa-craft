# TechServ Complete Brand Guide & Design System

## Table of Contents
- [Overview](#overview)
- [Logo System](#logo-system)
- [Color System](#color-system)
- [Typography](#typography)
- [UI Components](#ui-components)
- [Background Patterns](#background-patterns)
- [Lightning Bolt Patterns](#lightning-bolt-patterns)
- [CSS Variables & Code](#css-variables--code)
- [Design Resources](#design-resources)

---

## Overview

Welcome to the TechServ Design System - a comprehensive brand guide and component library for building consistent, professional, and accessible user interfaces. This system includes typography, color palettes, UI components, background patterns, and code snippets ready for implementation in your web applications.

### What's Included

- **Logo Guidelines:** Primary, secondary, and logomark usage rules
- **Color System:** Primary, secondary, and semantic color palettes
- **Typography:** Saira (headings) and Neuton (body) font specifications
- **UI Components:** Buttons, forms, cards, alerts, and navigation
- **Background Patterns:** 12 general patterns + 12 bolt-focused designs
- **CSS Variables:** Complete design token system
- **Accessibility:** WCAG AA compliance guidelines
- **Code Examples:** Ready-to-use HTML and CSS snippets

---

## Logo System

### Three Logo Variations

**Primary Logo**
- Use for main branding, headers, and primary applications
- Includes "TECH" and "SERV" text with lightning bolt
- File naming: `TechServ_PrimaryLogo_[Color/White/Black/ColorWhite].png`

**Secondary Logo**
- Use when space is limited or brand recognition exists
- Shows "T" and "S" with lightning bolt
- File naming: `TechServ_SecondaryLogo_[Color/White/Black/ColorWhite].png`

**Logomark**
- The lightning bolt symbol alone
- Perfect for favicons, app icons, and design elements
- File naming: `TechServ_Logomark_[Color/White/Black/ColorWhite].png`

### Logo Usage Rules

- **Spacing:** Use letter height ("E" or "S") as minimum clearspace
- **Minimum Size:** 100px width (web), 80px (mobile) for primary logo
- **Do Not:** Stretch, add effects, or use insufficient contrast
- **Reverse Logos:** Use white logos on dark backgrounds only

---

## Color System

### Primary Colors

**TechServ Blue**
- Hex: `#04458D`
- RGB: `4, 69, 141`
- Usage: Primary Brand Color
- CSS Variable: `--color-primary`

**Storm Blue**
- Hex: `#0A3251`
- RGB: `10, 50, 81`
- Usage: Headers & Dark Sections
- CSS Variable: `--color-dark`

**TechServ Gray**
- Hex: `#4E525B`
- RGB: `78, 82, 91`
- Usage: Secondary Text
- CSS Variable: `--color-secondary`

**Charcoal Text**
- Hex: `#282A30`
- RGB: `40, 42, 48`
- Usage: Body Text
- CSS Variable: `--color-text`

### Secondary Colors

**Sky Blue**
- Hex: `#D9E8F7`
- RGB: `217, 232, 247`
- Usage: Light Backgrounds
- CSS Variable: `--color-light`

**Safety Yellow**
- Hex: `#FFFF00`
- RGB: `255, 255, 0`
- Usage: Call to Action
- CSS Variable: `--color-cta`
- **Accessibility Note:** Safety Yellow fails WCAG AA contrast on white backgrounds. Always use with dark text or dark backgrounds.

**Conduit Gray**
- Hex: `#E6E7E8`
- RGB: `230, 231, 232`
- Usage: Disabled States
- CSS Variable: `--color-disabled`

### Semantic Colors

- **Success:** `#28A745` - Green for success states
- **Warning:** `#FFC107` - Yellow/amber for warnings
- **Error:** `#DC3545` - Red for error states
- **Info:** `#04458D` - Primary blue for information

---

## Typography

### Font Families

**Saira (Headings)**
- Weight: 700 (Bold)
- Style: Sans-serif
- Transform: ALL CAPS
- Letter Spacing: 0.05em (50pt)
- Usage: All headings, buttons, navigation
- Google Fonts: `https://fonts.googleapis.com/css2?family=Saira:wght@700&display=swap`
- CSS Variable: `--font-heading: 'Saira', sans-serif;`

**Neuton (Body Text)**
- Weight: 400 (Regular), 700 (Bold)
- Style: Serif
- Line Height: 1.6
- Usage: Body copy, paragraphs, descriptions
- Google Fonts: `https://fonts.googleapis.com/css2?family=Neuton:wght@400;700&display=swap`
- CSS Variable: `--font-body: 'Neuton', serif;`

### Heading Sizes

- **H1:** 48px / 3rem - Line Height: 1.2 - Color: Primary Blue
- **H2:** 36px / 2.25rem - Line Height: 1.3 - Color: Primary Blue
- **H3:** 28px / 1.75rem - Line Height: 1.3 - Color: Storm Blue
- **H4:** 22px / 1.375rem - Line Height: 1.4
- **H5:** 18px / 1.125rem - Line Height: 1.4

### Body Text

- **Body:** 16px / 1rem - Line Height: 1.6
- **Small:** 14px / 0.875rem
- **Large:** 18px / 1.125rem

### Typography Guidelines

- **Headings:** Always use Saira Bold, ALL CAPS, with 50pt letter spacing
- **Body Text:** Use Neuton Regular at 16px with 1.6 line height
- **Buttons:** Use Saira Bold, ALL CAPS for all button labels
- **Font Loading:** Import from Google Fonts for optimal performance

---

## UI Components

### Buttons

**Button Types**

1. **Primary Button**
   - Background: TechServ Blue (`#04458D`)
   - Text: White
   - Hover: Storm Blue (`#033562`)
   - Class: `.btn-primary`

2. **Secondary Button**
   - Background: Transparent
   - Text: TechServ Blue
   - Border: 2px solid TechServ Blue
   - Hover: TechServ Blue background, White text
   - Class: `.btn-secondary`

3. **CTA Button**
   - Background: Safety Yellow (`#FFFF00`)
   - Text: Charcoal Text
   - Border: 2px solid Charcoal Text
   - Hover: Darker yellow, slight scale
   - Class: `.btn-cta`

**Button Sizes**
- **Small:** 8px 16px padding, 14px font
- **Medium (Default):** 12px 24px padding, 16px font
- **Large:** 16px 32px padding, 18px font

**Button States**
- **Default:** Full opacity, interactive
- **Hover:** Transform translateY(-2px), shadow increase
- **Disabled:** Conduit Gray background, secondary gray text, no interaction

### Cards

- Background: White
- Border: 1px solid Conduit Gray
- Border Radius: 8px
- Padding: 24px
- Shadow: Small (0 2px 4px rgba(40, 42, 48, 0.08))
- Hover: Shadow increase, translateY(-4px)

**Card Header**
- Font: Saira Bold
- Text Transform: UPPERCASE
- Letter Spacing: 0.05em
- Font Size: 22px
- Color: TechServ Blue
- Border Bottom: 2px solid Sky Blue

### Alerts & Notifications

**Alert Types**

1. **Success Alert**
   - Background: `#D4EDDA`
   - Border: 4px left solid `#28A745`
   - Text: `#155724`

2. **Warning Alert**
   - Background: `#FFF3CD`
   - Border: 4px left solid `#FFC107`
   - Text: `#856404`

3. **Error Alert**
   - Background: `#F8D7DA`
   - Border: 4px left solid `#DC3545`
   - Text: `#721C24`

4. **Info Alert**
   - Background: Sky Blue
   - Border: 4px left solid TechServ Blue
   - Text: Storm Blue

### Form Elements

**Inputs, Selects, Textareas**
- Font: Neuton
- Font Size: 16px
- Padding: 12px 16px
- Border: 2px solid Conduit Gray
- Border Radius: 4px
- Focus Border: TechServ Blue
- Focus Shadow: 0 0 0 3px rgba(4, 69, 141, 0.1)

**Form Labels**
- Font: Saira Bold
- Text Transform: UPPERCASE
- Letter Spacing: 0.05em
- Font Size: 14px
- Color: Charcoal Text

---

## Background Patterns

### General Patterns

Keep opacity at 10-20% to ensure readability.

1. **Technical Grid**
   - Grid pattern on primary blue
   - Perfect for dashboards and technical sections
   - CSS: Linear gradients creating grid lines

2. **Blue Gradient**
   - Smooth gradient from Storm Blue to TechServ Blue
   - Great for hero sections
   - CSS: `linear-gradient(135deg, #0A3251 0%, #04458D 100%)`

3. **Light Background**
   - Subtle light blue for section backgrounds and cards
   - Background: Sky Blue (`#D9E8F7`)

### Pattern Library

View complete pattern library with all 24 patterns (12 general + 12 bolt-focused) in the full pattern showcase files.

---

## Lightning Bolt Patterns

Creative patterns featuring the iconic TechServ lightning bolt logomark. These designs emphasize energy and power.

### 12 Bolt-Focused Designs Include:

1. **Corner Power:** Rotated bolts in opposite corners
2. **Electric Trail:** Animated horizontal flowing bolts
3. **Power Surge:** Pulsing animated bolt with radial gradient
4. **Lightning Strike:** Vertical repeating bolts
5. **Energized Grid:** Technical grid with scattered bolt accents
6. **Yellow Charge:** Glowing animated bolt with safety yellow aura
7. ...and 6 more creative bolt patterns!

**Animation Note:** Always respect `prefers-reduced-motion` for users sensitive to animation.

---

## CSS Variables & Code

### Complete CSS Variable System

```css
/* TechServ Design System Variables */
:root {
  /* Primary Colors */
  --color-primary: #04458D;
  --color-primary-dark: #033562;
  --color-dark: #0A3251;
  --color-text: #282A30;
  --color-secondary: #4E525B;
  --color-light: #D9E8F7;
  --color-cta: #FFFF00;
  --color-disabled: #E6E7E8;
  
  /* Semantic Colors */
  --color-success: #28A745;
  --color-warning: #FFC107;
  --color-error: #DC3545;
  --color-info: #04458D;
  
  /* Typography */
  --font-heading: 'Saira', sans-serif;
  --font-body: 'Neuton', serif;
  
  /* Spacing (8px scale) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(40, 42, 48, 0.08);
  --shadow-md: 0 4px 8px rgba(40, 42, 48, 0.12);
  --shadow-lg: 0 8px 16px rgba(40, 42, 48, 0.16);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Quick Start HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <link href="https://fonts.googleapis.com/css2?family=Saira:wght@700&family=Neuton:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: #04458D;
      --font-heading: 'Saira', sans-serif;
      --font-body: 'Neuton', serif;
    }
    
    body {
      font-family: var(--font-body);
      color: #282A30;
    }
    
    h1 {
      font-family: var(--font-heading);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>
  <h1>Welcome to TechServ</h1>
  <p>Scalability and reliability when and where you need it.</p>
</body>
</html>
```

### Accessibility Implementation

```css
/* Respect User Motion Preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Focus Indicators for Keyboard Navigation */
*:focus-visible {
  outline: 3px solid #04458D;
  outline-offset: 2px;
}
```

### Accessibility Checklist

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Color Contrast | Minimum 4.5:1 for normal text, 3:1 for large text | AA Compliant |
| Focus Indicators | Visible outline on all interactive elements | Implemented |
| Keyboard Navigation | All functionality accessible via keyboard | Supported |
| Screen Readers | Proper ARIA labels and alt text | Included |
| Motion Preferences | Respects prefers-reduced-motion | Implemented |

---

## Design Resources

### Available Files

**Logo Files**
- Primary, secondary, and logomark in multiple formats
- Variations: Color, White, Black, ColorWhite

**Pattern Library**
- 24 ready-to-use background patterns with CSS code snippets

**Component Kit**
- Complete UI component library with HTML and CSS examples

### Additional Documentation

- **Web App Guidelines:** TechServ_WebApp_Brand_Guidelines.md
- **Style Guide Demo:** techserv-styleguide.html
- **Pattern Showcase:** techserv-patterns.html
- **Bolt Patterns:** techserv-bolt-patterns.html

---

## Brand Tagline

**"Scalability and reliability when and where you need it"**

---

## Quick Reference

### Brand Colors (Hex Codes)
- Primary Blue: `#04458D`
- Storm Blue: `#0A3251`
- TechServ Gray: `#4E525B`
- Charcoal Text: `#282A30`
- Sky Blue: `#D9E8F7`
- Safety Yellow: `#FFFF00`
- Conduit Gray: `#E6E7E8`

### Font Stack
```css
/* Headings */
font-family: 'Saira', sans-serif;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.05em;

/* Body Text */
font-family: 'Neuton', serif;
font-weight: 400;
line-height: 1.6;
```

### Standard Spacing Scale (8px)
- XS: 4px
- SM: 8px
- MD: 16px
- LG: 24px
- XL: 32px
- 2XL: 48px
- 3XL: 64px

---

*Last Updated: May 2023 | TechServ Engineering Consulting*