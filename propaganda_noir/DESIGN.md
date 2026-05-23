---
name: Propaganda Noir
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#554336'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#887364'
  outline-variant: '#dbc2b0'
  surface-tint: '#8f4e00'
  primary: '#8f4e00'
  on-primary: '#ffffff'
  primary-container: '#ff9933'
  on-primary-container: '#693800'
  inverse-primary: '#ffb77a'
  secondary: '#056e00'
  on-secondary: '#ffffff'
  secondary-container: '#8dfc75'
  on-secondary-container: '#067500'
  tertiary: '#5e5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#b2b2b2'
  on-tertiary-container: '#444444'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc2'
  primary-fixed-dim: '#ffb77a'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#6d3a00'
  secondary-fixed: '#8dfc75'
  secondary-fixed-dim: '#72de5c'
  on-secondary-fixed: '#012200'
  on-secondary-fixed-variant: '#035300'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 96px
    fontWeight: '400'
    lineHeight: 100%
    letterSpacing: 0.02em
  headline-xl:
    fontFamily: Anton
    fontSize: 64px
    fontWeight: '400'
    lineHeight: 110%
  headline-lg:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 110%
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 110%
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 160%
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 150%
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 120%
    letterSpacing: 0.05em
  mono-style:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 120%
    letterSpacing: 0.1em
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style

This design system establishes a visual language of "Bureaucratic Maximalism." It blends the sterile, authoritative aesthetic of high-stakes government documentation with the high-octane energy of cinematic political thrillers and Gen Z digital satire. The interface is designed to feel like a "Top Secret" file leaked onto a social media feed—part serious institution, part viral movement.

The style utilizes high-contrast layouts, heavy ink-trap aesthetics, and digital artifacts like scanlines and film grain to evoke a sense of urgency and "leaked" information. It is unapologetically aggressive, utilizing the visual weight of political campaigning to capture student attention through irony and bold authority.

## Colors

The palette is rooted in nationalistic symbolism but dialed to a cinematic intensity. 

- **Primary (Saffron Orange):** Used for calls to action, urgent headlines, and key branding moments. It represents energy and the heat of the political arena.
- **Secondary (Campaign Green):** Used for "Approved" states, secondary actions, and growth-related data.
- **Deep Black & White:** These provide the "Bureaucratic Document" foundation. Black is used for heavy borders and "Redacted" styles, while White serves as the clean paper-like canvas.

Gradients should be used sparingly but impactfully—specifically for hero sections and background overlays to create a "cinematic poster" effect.

## Typography

Typography functions as the primary vehicle for the "Propaganda" aesthetic. 

- **Headlines (Anton):** Always uppercase. These should feel shouted, not spoken. Use tight line heights to create dense, impactful blocks of text reminiscent of news headlines or protest posters.
- **Body & Labels (Inter):** Provides the functional balance. It mimics the clarity of official reports. For a "bureaucratic" feel, use the `mono-style` (system-fallback if necessary) for meta-data, dates, and "Document ID" numbers.

## Layout & Spacing

The layout follows a **Fixed Grid** model to maintain the structural integrity of a printed document. 

- **Desktop:** 12-column grid with wide 64px margins to focus the "manifesto" in the center.
- **Mobile:** 4-column grid with 16px margins.
- **Rhythm:** All spacing must be multiples of 8px. Use generous vertical padding between sections to allow the heavy typography to breathe, but keep internal component spacing tight and utilitarian.
- **Reflow:** On mobile, complex "dossier" tables should transform into stacked cards with "File" tabs.

## Elevation & Depth

Depth in this design system is not achieved through soft light, but through hard shadows and physical layers.

- **Hard Shadows:** Use 100% opacity black shadows with 0 blur. Offset shadows (e.g., 4px 4px or 8px 8px) to give elements a "lifted paper" or "sticker" look.
- **Bureaucratic Layering:** Components should look like they are stacked on top of each other. Use sharp, 2px black borders to define boundaries.
- **Texture Overlays:** Apply a global noise texture (approx. 5% opacity) and subtle horizontal scanlines over the entire UI to simulate a broadcast or a photocopied document.
- **Redaction:** Use solid black bars to "redact" secondary information that reveals on hover, leaning into the satirical "classified" theme.

## Shapes

The design system uses a **Sharp (0)** roundedness philosophy. Every element—buttons, inputs, cards, and containers—must have 90-degree corners. This reinforces the rigid, authoritative, and "unrefined" nature of bureaucratic forms and street-level propaganda posters.

## Components

- **Buttons:** Rectangular with a 2px black border. The "Primary" state uses Saffron Orange with a hard black shadow that disappears (translates) when clicked, simulating a physical press.
- **Cards (Dossiers):** White backgrounds with a subtle "File Folder" tab at the top. Must include a "Serial Number" in the top-right corner using the mono typography.
- **Input Fields:** Styled like government forms. Labels sit above the field in bold, uppercase Inter. The input area is a simple white box with a 2px border that turns Green on focus.
- **Chips (Status Tags):** High-contrast blocks (e.g., Black background with White text). No rounded corners. Used for categorizing "Priority" or "Classified" content.
- **Progress Bars:** Blocky, non-rounded bars. Use the Campaign Green for progress and Deep Black for the container background.
- **Checkboxes:** Square, 2px border. When checked, they should be filled with a solid "X" mark rather than a checkmark to maintain the "hand-marked document" feel.
- **Special Component: The "Stamp":** A decorative element that can be programmatically placed over images or cards (e.g., "APPROVED BY IJP" or "REJECTED") in a slanted, distressed texture font.