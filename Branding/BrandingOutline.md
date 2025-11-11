# TechServ Web Application Brand Guidelines

**Last Updated:** May 2023

---

## Table of Contents

1. [Logos](#logos)
2. [Typography](#typography)
3. [Color System](#color-system)
4. [UI Components](#ui-components)
5. [Layout & Spacing](#layout--spacing)
6. [Iconography](#iconography)
7. [Patterns & Backgrounds](#patterns--backgrounds)
8. [Accessibility](#accessibility)

---

## Logos

### Overview

TechServ has three main logo variations for web applications:

#### Primary Logo
Use the primary logo in the main navigation header and splash screens. This should be your default choice for most applications.

**Recommended Sizes:**
- Desktop Header: 180-220px width
- Mobile Header: 120-140px width
- Favicon: 32x32px (use logomark)

#### Secondary Logo
Use when space is limited or brand recognition is already established (e.g., internal dashboards, compact mobile views).

**Recommended Sizes:**
- Compact Navigation: 60-80px width
- Mobile Footer: 50-60px width

#### Logomark
Perfect for favicons, app icons, loading spinners, and decorative elements. Can be used as a standalone brand element.

**Recommended Sizes:**
- Favicon: 32x32px, 192x192px, 512x512px
- App Icon: 512x512px
- Loading Indicator: 48-64px

#### Reverse Colors
Use white logos on dark backgrounds (TechServ Blue, TechServ Black, Storm Blue). Ensure minimum contrast ratio of 4.5:1.

---

### Logo Spacing Guidelines

**Clearspace Rules:**
- Primary Logo: Use the height of the "E" as minimum clearspace on all sides
- Secondary Logo: Use the height of the "S" as minimum clearspace
- Logomark: Use half the bolt height as minimum clearspace

**Minimum Sizes:**
- Primary Logo: 100px width (web), 80px (mobile)
- Secondary Logo: 50px width
- Logomark: 24px width

---

### Logo Implementation

```css
/* Primary Logo Container */
.logo-primary {
  width: 200px;
  height: auto;
  padding: 16px;
}

/* Secondary Logo Container */
.logo-secondary {
  width: 60px;
  height: auto;
  padding: 12px;
}

/* Logomark Container */
.logo-mark {
  width: 32px;
  height: auto;
  padding: 8px;
}
```

---

## Typography

### Font Loading

```html
<!-- Google Fonts Import -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Saira:wght@700&family=Neuton:wght@400;700&display=swap" rel="stylesheet">
```

---

### Heading Styles: Saira

**Font:** Saira Bold  
**Style:** ALL CAPS  
**Letter Spacing:** 0.05em (50/1000)  

**Scale:**

| Element | Size | Line Height | Use Case |
|---------|------|-------------|----------|
| H1 | 48px / 3rem | 1.2 | Page titles, hero sections |
| H2 | 36px / 2.25rem | 1.3 | Section headers |
| H3 | 28px / 1.75rem | 1.3 | Subsection headers |
| H4 | 22px / 1.375rem | 1.4 | Card titles, modal headers |
| H5 | 18px / 1.125rem | 1.4 | Small headings, labels |
| H6 | 16px / 1rem | 1.4 | Micro headings |

**Responsive Scale (Mobile):**
- H1: 32px / 2rem
- H2: 28px / 1.75rem
- H3: 24px / 1.5rem
- H4: 20px / 1.25rem

```css
/* Heading Styles */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Saira', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

h1 { font-size: 3rem; line-height: 1.2; }
h2 { font-size: 2.25rem; line-height: 1.3; }
h3 { font-size: 1.75rem; line-height: 1.3; }
h4 { font-size: 1.375rem; line-height: 1.4; }

/* Responsive headings */
@media (max-width: 768px) {
  h1 { font-size: 2rem; }
  h2 { font-size: 1.75rem; }
}
```

---

### Body Text: Neuton

**Font:** Neuton Regular  
**Weights:** 400 (Regular), 700 (Bold)  

**Scale:**

| Element | Size | Line Height | Use Case |
|---------|------|-------------|----------|
| Large | 20px / 1.25rem | 1.6 | Lead paragraphs, introductions |
| Body | 16px / 1rem | 1.6 | Standard body text, descriptions |
| Small | 14px / 0.875rem | 1.5 | Helper text, captions |
| Tiny | 12px / 0.75rem | 1.5 | Footnotes, legal text |

```css
/* Body Text Styles */
body {
  font-family: 'Neuton', serif;
  font-size: 1rem;
  line-height: 1.6;
  color: #282A30;
}

.text-large {
  font-size: 1.25rem;
  line-height: 1.6;
}

.text-small {
  font-size: 0.875rem;
  line-height: 1.5;
}

.text-tiny {
  font-size: 0.75rem;
  line-height: 1.5;
}
```

---

## Color System

### Primary Colors

#### TechServ Blue
**Primary brand color - Use for primary actions, links, and key UI elements**

- **HEX:** `#04458D`
- **RGB:** `rgb(4, 69, 141)`
- **RGBA:** `rgba(4, 69, 141, 1)`
- **CSS Variable:** `--color-primary`

```css
:root {
  --color-primary: #04458D;
  --color-primary-rgb: 4, 69, 141;
}
```

#### TechServ Gray
**Neutral color for secondary text and borders**

- **HEX:** `#4E525B`
- **RGB:** `rgb(78, 82, 91)`
- **CSS Variable:** `--color-gray`

#### TechServ Black
**Primary text color and high-contrast elements**

- **HEX:** `#282A30`
- **RGB:** `rgb(40, 42, 48)`
- **CSS Variable:** `--color-text`

---

### Secondary Colors

#### Storm Blue
**Dark accent color for headers, footers, and dark mode**

- **HEX:** `#0A3251`
- **RGB:** `rgb(10, 50, 81)`
- **CSS Variable:** `--color-dark`

#### Sky Blue
**Light background color for sections and cards**

- **HEX:** `#D9E8F7`
- **RGB:** `rgb(217, 232, 247)`
- **CSS Variable:** `--color-light`

#### Safety Yellow
**Call-to-action color - Use sparingly for important actions**

- **HEX:** `#FFFF00`
- **RGB:** `rgb(255, 255, 0)`
- **CSS Variable:** `--color-cta`

⚠️ **Accessibility Note:** Safety Yellow fails WCAG AA contrast on white backgrounds. Use with dark text or backgrounds.

#### Conduit Gray
**Background color for disabled states and subtle sections**

- **HEX:** `#E6E7E8`
- **RGB:** `rgb(230, 231, 232)`
- **CSS Variable:** `--color-disabled`

---

### Semantic Colors

```css
:root {
  /* Feedback Colors */
  --color-success: #28A745;
  --color-warning: #FFC107;
  --color-error: #DC3545;
  --color-info: #04458D;
  
  /* Backgrounds */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #D9E8F7;
  --color-bg-dark: #0A3251;
  
  /* Borders */
  --color-border-light: #E6E7E8;
  --color-border-medium: #4E525B;
  --color-border-dark: #282A30;
}
```

---

### Color Usage Guide

| Color | Primary Use | Avoid Using For |
|-------|-------------|-----------------|
| TechServ Blue | Primary buttons, links, active states | Large backgrounds, body text |
| Safety Yellow | CTAs, important alerts, highlights | Body text, large areas |
| Storm Blue | Headers, footers, dark sections | Body text (contrast issues) |
| Sky Blue | Section backgrounds, card backgrounds | Text, small UI elements |
| TechServ Gray | Secondary text, icons, dividers | Primary text, backgrounds |
| TechServ Black | Body text, headings | Buttons (low engagement) |

---

## UI Components

### Buttons

#### Primary Button

```css
.btn-primary {
  font-family: 'Saira', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 24px;
  font-size: 16px;
  background-color: #04458D;
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #033562;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(4, 69, 141, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(4, 69, 141, 0.3);
}

.btn-primary:disabled {
  background-color: #E6E7E8;
  color: #4E525B;
  cursor: not-allowed;
  transform: none;
}
```

#### CTA Button (Safety Yellow)

```css
.btn-cta {
  font-family: 'Saira', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 28px;
  font-size: 18px;
  background-color: #FFFF00;
  color: #282A30;
  border: 2px solid #282A30;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cta:hover {
  background-color: #E6E600;
  transform: scale(1.02);
}
```

#### Secondary Button

```css
.btn-secondary {
  font-family: 'Saira', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 24px;
  font-size: 16px;
  background-color: transparent;
  color: #04458D;
  border: 2px solid #04458D;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #04458D;
  color: #FFFFFF;
}
```

**Button Sizes:**
- Large: `padding: 16px 32px; font-size: 18px;`
- Medium (default): `padding: 12px 24px; font-size: 16px;`
- Small: `padding: 8px 16px; font-size: 14px;`

---

### Form Inputs

```css
.form-input {
  font-family: 'Neuton', serif;
  font-size: 16px;
  padding: 12px 16px;
  border: 2px solid #E6E7E8;
  border-radius: 4px;
  background-color: #FFFFFF;
  color: #282A30;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #04458D;
  box-shadow: 0 0 0 3px rgba(4, 69, 141, 0.1);
}

.form-input:disabled {
  background-color: #E6E7E8;
  color: #4E525B;
  cursor: not-allowed;
}

.form-input.error {
  border-color: #DC3545;
}

.form-label {
  font-family: 'Saira', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 14px;
  color: #282A30;
  margin-bottom: 8px;
  display: block;
}
```

---

### Cards

```css
.card {
  background-color: #FFFFFF;
  border: 1px solid #E6E7E8;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(40, 42, 48, 0.08);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(40, 42, 48, 0.12);
  transform: translateY(-2px);
}

.card-header {
  font-family: 'Saira', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 1.375rem;
  color: #04458D;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #D9E8F7;
}
```

---

### Navigation

```css
.navbar {
  background-color: #0A3251;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(10, 50, 81, 0.2);
}

.nav-link {
  font-family: 'Saira', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 14px;
  color: #FFFFFF;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  background-color: #04458D;
}
```

---

### Alerts & Notifications

```css
.alert {
  padding: 16px 20px;
  border-radius: 4px;
  border-left: 4px solid;
  margin-bottom: 16px;
}

.alert-success {
  background-color: #D4EDDA;
  border-color: #28A745;
  color: #155724;
}

.alert-warning {
  background-color: #FFF3CD;
  border-color: #FFC107;
  color: #856404;
}

.alert-error {
  background-color: #F8D7DA;
  border-color: #DC3545;
  color: #721C24;
}

.alert-info {
  background-color: #D9E8F7;
  border-color: #04458D;
  color: #0A3251;
}
```

---

## Layout & Spacing

### Spacing System

Use a consistent 8px spacing scale:

```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
}
```

**Usage Guidelines:**
- Component padding: `--space-md` to `--space-lg`
- Section spacing: `--space-2xl` to `--space-3xl`
- Element spacing: `--space-sm` to `--space-md`
- Tight spacing: `--space-xs` to `--space-sm`

---

### Grid System

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.container-fluid {
  width: 100%;
  padding: 0 24px;
}

/* 12-column grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
}

.col-12 { grid-column: span 12; }
.col-6 { grid-column: span 6; }
.col-4 { grid-column: span 4; }
.col-3 { grid-column: span 3; }

@media (max-width: 768px) {
  .col-12, .col-6, .col-4, .col-3 {
    grid-column: span 12;
  }
}
```

---

### Breakpoints

```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
}

/* Usage */
@media (min-width: 768px) { /* Tablet */ }
@media (min-width: 992px) { /* Desktop */ }
@media (min-width: 1200px) { /* Large Desktop */ }
```

---

## Iconography

### Icon Guidelines

**Style:** Use outline/stroke icons for consistency  
**Size:** 16px, 24px, 32px, 48px  
**Stroke Width:** 2px  
**Color:** Match surrounding text or use TechServ Gray (#4E525B)

```css
.icon {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2px;
}

.icon-sm { width: 16px; height: 16px; }
.icon-lg { width: 32px; height: 32px; }
.icon-xl { width: 48px; height: 48px; }
```

**Recommended Icon Library:** Feather Icons, Heroicons, or Lucide

---

### Logomark as Icon

The lightning bolt logomark can be used as an icon for:
- Loading states (animated)
- Action indicators
- Success confirmations
- Decorative accents

```css
.loading-icon {
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## Patterns & Backgrounds

### Circuit Diagram Pattern

**Use Cases:**
- Page backgrounds
- Section dividers
- Card backgrounds (subtle)
- Hero sections

**Implementation:**

```css
.circuit-bg {
  background-image: url('/assets/circuit-pattern.svg');
  background-repeat: repeat;
  background-size: 200px;
  opacity: 0.1; /* 10-20% recommended */
}

/* Alternative: CSS Grid Pattern */
.circuit-bg-grid {
  background-image: 
    linear-gradient(rgba(4, 69, 141, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(4, 69, 141, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}
```

---

### Grid Pattern

**Use Cases:**
- Technical section backgrounds
- Dashboard cards
- Data visualization backgrounds

```css
.grid-pattern {
  background-image: 
    linear-gradient(#E6E7E8 1px, transparent 1px),
    linear-gradient(90deg, #E6E7E8 1px, transparent 1px);
  background-size: 24px 24px;
}

.grid-pattern-blue {
  background-image: 
    linear-gradient(rgba(4, 69, 141, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(4, 69, 141, 0.2) 1px, transparent 1px);
  background-size: 24px 24px;
}
```

---

### Gradient Overlays

```css
/* Blue Gradient */
.gradient-blue {
  background: linear-gradient(135deg, #0A3251 0%, #04458D 100%);
}

/* Blue to Yellow (CTA) */
.gradient-cta {
  background: linear-gradient(135deg, #04458D 0%, #FFFF00 100%);
}

/* Subtle light gradient */
.gradient-light {
  background: linear-gradient(180deg, #FFFFFF 0%, #D9E8F7 100%);
}
```

---

## Accessibility

### WCAG AA Compliance

**Minimum Contrast Ratios:**
- Normal text (< 18px): 4.5:1
- Large text (≥ 18px or 14px bold): 3:1
- UI components: 3:1

**Approved Color Combinations:**

| Background | Text Color | Contrast Ratio | Pass |
|------------|-----------|----------------|------|
| White (#FFFFFF) | TechServ Black (#282A30) | 14.3:1 | ✅ AAA |
| White (#FFFFFF) | TechServ Blue (#04458D) | 6.8:1 | ✅ AA |
| White (#FFFFFF) | TechServ Gray (#4E525B) | 7.2:1 | ✅ AA |
| TechServ Blue (#04458D) | White (#FFFFFF) | 6.8:1 | ✅ AA |
| Storm Blue (#0A3251) | White (#FFFFFF) | 11.7:1 | ✅ AAA |
| Sky Blue (#D9E8F7) | TechServ Black (#282A30) | 12.1:1 | ✅ AAA |

⚠️ **Warning:** Safety Yellow (#FFFF00) on white has only 1.1:1 contrast and fails WCAG. Use dark borders or backgrounds.

---

### Focus States

```css
/* Keyboard Focus Indicator */
*:focus-visible {
  outline: 3px solid #04458D;
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #04458D;
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 9999;
}

.skip-link:focus {
  top: 0;
}
```

---

### Screen Reader Support

```html
<!-- Image alt text -->
<img src="logo.svg" alt="TechServ Logo">

<!-- Icon with label -->
<button aria-label="Close menu">
  <svg class="icon" aria-hidden="true"><!-- icon --></svg>
</button>

<!-- Form labels -->
<label for="email">Email Address</label>
<input type="email" id="email" name="email" required>
```

---

### Motion & Animation

**Reduced Motion Support:**

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Complete CSS Variables Reference

```css
:root {
  /* Colors */
  --color-primary: #04458D;
  --color-primary-dark: #033562;
  --color-primary-light: #0558B3;
  
  --color-secondary: #4E525B;
  --color-dark: #0A3251;
  --color-text: #282A30;
  --color-light: #D9E8F7;
  --color-cta: #FFFF00;
  --color-disabled: #E6E7E8;
  
  /* Semantic Colors */
  --color-success: #28A745;
  --color-warning: #FFC107;
  --color-error: #DC3545;
  --color-info: #04458D;
  
  /* Backgrounds */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #D9E8F7;
  --color-bg-dark: #0A3251;
  
  /* Typography */
  --font-heading: 'Saira', sans-serif;
  --font-body: 'Neuton', serif;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  
  /* Breakpoints */
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(40, 42, 48, 0.08);
  --shadow-md: 0 4px 8px rgba(40, 42, 48, 0.12);
  --shadow-lg: 0 8px 16px rgba(40, 42, 48, 0.16);
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```

---

## Quick Start Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TechServ App</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Saira:wght@700&family=Neuton:wght@400;700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --color-primary: #04458D;
      --color-text: #282A30;
      --color-light: #D9E8F7;
      --font-heading: 'Saira', sans-serif;
      --font-body: 'Neuton', serif;
      --space-md: 16px;
      --space-lg: 24px;
    }
    
    body {
      font-family: var(--font-body);
      color: var(--color-text);
      margin: 0;
      padding: 0;
    }
    
    .navbar {
      background-color: #0A3251;
      padding: var(--space-md) var(--space-lg);
      color: white;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-lg);
    }
    
    h1 {
      font-family: var(--font-heading);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-primary);
    }
    
    .btn-primary {
      font-family: var(--font-heading);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 24px;
      background-color: var(--color-primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <img src="logo.svg" alt="TechServ Logo" style="height: 40px;">
  </nav>
  
  <div class="container">
    <h1>Welcome to TechServ</h1>
    <p>Scalability and reliability when and where you need it.</p>
    <button class="btn-primary">Get Started</button>
  </div>
</body>
</html>
```

---

*TechServ Web Application Brand Guidelines - May 2023*