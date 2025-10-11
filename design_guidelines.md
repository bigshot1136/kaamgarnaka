# Kamgar Naka - Design Guidelines

## Design Approach

**System Selected:** Material Design adapted with warm earth tones and human-centric principles

**Rationale:** Labor marketplace requiring trust-building through warm, approachable aesthetics while maintaining clarity for real-time job matching and verification workflows. The brown worker logo establishes brand identity rooted in craftsmanship and reliability.

**Key Design Principles:**
1. **Trust Through Warmth** - Earth-toned palette evokes reliability and human connection
2. **Mobile-First Clarity** - Large touch targets, multilingual support, icon-heavy navigation
3. **Accessible Professionalism** - High contrast, readable typography, clear status indicators
4. **Real-Time Feedback** - Immediate visual confirmation for job status and matching

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 28 45% 25% (Warm brown from logo - trust, craftsmanship)
- Primary Hover: 28 50% 20% (Deeper brown for interaction)
- Secondary: 18 70% 55% (Terracotta clay - action, warmth)
- Success: 140 40% 45% (Sage green - verification, natural)
- Warning: 42 85% 55% (Warm amber - review, caution)
- Error: 8 70% 50% (Clay red - failed, urgent)
- Background: 35 25% 96% (Warm off-white)
- Surface: 0 0% 100%
- Text Primary: 28 25% 15%
- Text Secondary: 28 15% 40%
- Border: 28 20% 85%

**Dark Mode:**
- Primary: 28 40% 65% (Lifted warm brown)
- Primary Hover: 28 45% 70%
- Secondary: 18 65% 65% (Lighter terracotta)
- Success: 140 35% 60%
- Warning: 42 80% 65%
- Error: 8 65% 60%
- Background: 28 15% 10%
- Surface: 28 12% 14%
- Text Primary: 35 15% 92%
- Text Secondary: 35 10% 70%
- Border: 28 10% 25%

### B. Typography

**Font Families:**
- Primary: 'Inter' (clean, multilingual support for Hindi/Marathi/English)
- Display: 'Poppins' (friendly, warm for headings)

**Scale:**
- Display: 2.5rem, bold, Poppins
- H1: 2rem, semibold, Poppins
- H2: 1.5rem, semibold, Poppins
- H3: 1.25rem, medium, Poppins
- Body Large: 1.125rem, regular, Inter
- Body: 1rem, regular, Inter
- Small: 0.875rem, regular, Inter
- Caption: 0.75rem, medium, Inter

### C. Layout System

**Spacing Scale:** Tailwind units 2, 4, 6, 8, 12, 16, 24 for consistent rhythm
- Card padding: p-6
- Section spacing: py-12 md:py-20 lg:py-24
- Container: max-w-7xl mx-auto px-4 md:px-6
- Element gaps: gap-4 (standard), gap-6 (generous)

**Grid System:**
- Mobile: Single column, full-width cards
- Tablet: 2-column for job/worker cards
- Desktop: 3-column for browsing, 2-column split for dashboards

### D. Component Library

**Navigation:**
- Sticky header: Logo left, main links center, profile/notifications right, warm brown background with subtle shadow
- Mobile bottom nav: Home, Jobs, Profile, Notifications with terracotta active state
- Floating action button: Terracotta circular button with white icon for primary actions

**Cards:**
- Elevated with shadow-md hover:shadow-lg transition, rounded-xl corners
- Job cards: Skill badges (warm neutral backgrounds), location pin icon, price in bold terracotta, urgency indicator (amber pill), CTA button
- Worker cards: Profile photo with subtle brown border, skill tags (earth tone pills), gold star ratings, green verification badge, availability dot indicator
- Background: White in light mode, warm dark surface in dark mode

**Status Indicators:**
- Verified: Sage green pill with check icon, semibold text
- Pending: Amber pill with clock icon
- Available: Green dot pulse animation
- Busy: Gray dot, static
- Real-time requests: Terracotta banner with pulsing border, slide-in animation

**Forms & Inputs:**
- Outlined fields with floating labels, brown focus border
- Touch targets: min-height 48px, generous padding
- Multi-select chips: Rounded-full pills with brown border, terracotta when selected
- Upload zones: Dashed brown border, drag-drop with preview thumbnails
- Progress stepper: Horizontal dots, filled terracotta for completed steps

**Buttons:**
- Primary: Filled terracotta, white text, rounded-lg, py-3 px-6, shadow-sm
- Secondary: Outlined brown, rounded-lg, transparent background
- On images: Outlined with backdrop-blur-md, white text/border
- Icon buttons: Circular, subtle brown background on hover
- Disabled: Reduced opacity, grayscale

**Payment Display:**
- Breakdown table: Labor wage row, convenience fee row, total in bold terracotta
- UPI integration: QR code with brown frame, payment link button with UPI icon
- Earnings dashboard: Bar chart (terracotta bars), total balance card (sage green accent), withdrawal button prominent
- Transaction history: Timeline view with status icons

**AI Sobriety Check:**
- Camera preview: Large viewfinder, brown corner guides
- Status: Analyzing spinner (terracotta), Passed (green check), Failed (red X)
- Instruction banner: Top of screen, brown background, white text with icon cues
- Results overlay: Full-screen card with clear pass/fail messaging and next action button

### E. Animations

**Minimal & Purposeful:**
- Notification slide: 300ms ease-out from top
- Status pulse: 2s subtle pulse on new status badges
- Button active: Scale 0.95
- Card hover: Shadow transition 200ms
- Loading: Skeleton screens in warm neutral colors

---

## Page Layouts

**Landing Page:**
- Hero: Full-width image (diverse workers on construction site, warm sunlight), brown gradient overlay (28 45% 15% at 70% opacity), centered headline "Connect with Skilled Workers Instantly" in white Poppins bold, dual CTA buttons (terracotta filled "For Customers", outlined "For Workers")
- Trust section: 3-column grid with icons (AI safety, fair pricing, instant matching) on warm backgrounds
- How it works: 3-step horizontal timeline with worker illustrations
- Social proof: Worker testimonial cards with photos, ratings, 2-column on desktop
- CTA footer banner: Terracotta background, white text, prominent signup buttons

**Dashboards:**
- Customer: Top stats cards (active jobs, spent, saved workers) with terracotta accents, "Post Job" FAB, filterable job list with status tabs
- Laborer: Earnings summary card (sage green total balance, terracotta withdrawal button), real-time job requests with accept/decline, circular profile completion meter, quick stats grid

**Job Posting Flow:**
- Multi-step with left form, right sticky summary card
- Step 1: Skill selection with quantity steppers
- Step 2: Location autocomplete, date/time pickers
- Step 3: Price breakdown preview, confirmation with terms checkbox

**Authentication:**
- Split screen desktop: Left brand imagery (workers with tools), right form on white
- Mobile: Stacked, logo at top
- Role selection: Large card buttons with worker/customer icons, brown borders, terracotta on selection

---

## Images

**Hero Image:** Wide-angle authentic photo of diverse skilled workers (mason, carpenter, plumber) collaborating on construction site during golden hour, warm sunlight creating approachable atmosphere, 1920x800px minimum, positioned as full-width background with 70% brown gradient overlay (28 45% 15%) for text legibility

**Feature Icons:** Custom line illustrations in terracotta color with consistent stroke weight for AI verification, payment security, instant matching

**Worker Profiles:** Square photos (200x200px) with subtle rounded corners, brown 2px border

**Empty States:** Warm illustrated graphics (friendly workers holding tools, completion checkmarks) for "No jobs yet", "Complete profile", encouraging tone

---

## Accessibility

- Tap targets: 44x44px minimum
- Contrast: 4.5:1 for normal text, 3:1 for large (validated against warm backgrounds)
- Focus indicators: 2px terracotta outline on interactive elements
- Dark mode: Consistent warm brown surface with high contrast text
- Language toggle: Header dropdown (Hindi/Marathi/English), persisted preference
- Offline banner: Amber notification when connection lost
- Screen readers: Semantic HTML, ARIA labels on all controls