# Kamgar Naka - Design Guidelines

## Design Approach

**System Selected:** Material Design with mobile-first principles
**Rationale:** Utility-focused labor marketplace requiring clear information hierarchy, strong visual feedback for real-time status updates, and accessibility for users with varying tech literacy levels.

**Key Design Principles:**
1. **Trust Through Transparency** - Clear status indicators, visible verification badges, upfront pricing
2. **Mobile-First Simplicity** - Large touch targets, readable text, streamlined flows
3. **Real-Time Clarity** - Immediate visual feedback for job status, matching, and notifications
4. **Inclusive Design** - Support for Hindi/regional languages, icon-heavy navigation for clarity

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 220 85% 45% (Deep Blue - trust, reliability)
- Primary Variant: 220 70% 35% (Darker blue for depth)
- Secondary: 25 95% 50% (Warm Orange - action, urgency)
- Success: 145 60% 45% (Green - verification, approved)
- Warning: 45 95% 55% (Amber - review, pending)
- Error: 0 75% 50% (Red - failed, rejected)
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Text Primary: 220 15% 20%
- Text Secondary: 220 10% 45%

**Dark Mode:**
- Primary: 220 80% 65%
- Primary Variant: 220 70% 55%
- Secondary: 25 90% 60%
- Success: 145 55% 55%
- Warning: 45 90% 65%
- Error: 0 70% 60%
- Background: 220 15% 12%
- Surface: 220 15% 16%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

### B. Typography

**Font Families:**
- Primary: 'Inter' (clean, highly readable for data/forms)
- Display: 'Poppins' (friendly, approachable for headings)

**Scale:**
- Hero/Display: 2.5rem (40px) - bold, Poppins
- H1: 2rem (32px) - semibold, Poppins
- H2: 1.5rem (24px) - semibold, Poppins
- H3: 1.25rem (20px) - medium, Poppins
- Body Large: 1.125rem (18px) - regular, Inter
- Body: 1rem (16px) - regular, Inter
- Small: 0.875rem (14px) - regular, Inter
- Caption: 0.75rem (12px) - medium, Inter

### C. Layout System

**Spacing Scale:** Use Tailwind units 2, 4, 6, 8, 12, 16, 24 for consistent rhythm
- Card padding: p-6 (24px)
- Section spacing: py-12 md:py-16 lg:py-24
- Element gaps: gap-4 (standard), gap-6 (generous)
- Container: max-w-7xl mx-auto px-4 md:px-6

**Grid System:**
- Mobile: Single column, full-width cards
- Tablet: 2-column for job cards, worker profiles
- Desktop: 3-column for browsing, 2-column for dashboards

### D. Component Library

**Navigation:**
- Sticky header with logo, main nav links, profile/notification icons
- Bottom navigation for mobile (Home, Jobs, Profile, Notifications)
- Hamburger menu for secondary links on mobile
- Floating action button (FAB) for primary action (Post Job for customers, View Requests for laborers)

**Cards:**
- Elevated cards with subtle shadow (shadow-md hover:shadow-lg transition)
- Job cards: Skill badges, location, price, urgency indicator, CTA button
- Worker cards: Profile photo, skills tags, rating stars, verification badge, availability status
- Rounded corners: rounded-xl for cards, rounded-lg for smaller elements

**Status Indicators:**
- Pills/Badges with icons: "Verified" (green check), "Pending Review" (amber clock), "Available" (green dot)
- Color-coded background with semibold text
- Real-time pulse animation for "Incoming Request" notifications

**Forms & Inputs:**
- Outlined text fields with floating labels
- Large touch targets (min-height: 48px)
- Multi-select chips for skills selection
- Stepper component for profile completion progress
- Upload zones with drag-and-drop and preview

**Buttons:**
- Primary: Filled with primary color, white text, rounded-lg, py-3 px-6
- Secondary: Outlined with primary color, rounded-lg
- Text buttons for tertiary actions
- FAB for primary mobile actions (rounded-full, shadow-lg)

**Job Matching Flow:**
- Real-time notification banner: Slide-in from top, orange accent, pulsing animation
- Accept button: Large, full-width on mobile, primary color
- Timer countdown visual for acceptance window
- Progress stepper for sobriety check stages

**Payment Display:**
- Breakdown table: Labor wage + convenience fee with clear math
- UPI integration: QR code display, direct payment link button
- Earnings dashboard: Bar chart for weekly earnings, total balance card
- Withdrawal CTA: Prominent button with UPI icon

**AI Sobriety Check Interface:**
- Camera preview: Large square viewfinder with alignment guide
- Status indicators: Analyzing (spinner), Passed (green check), Failed (red X)
- Guidance text: "Look at the camera" with icon cues
- Results screen: Pass/fail with clear next steps

### E. Animations

**Use Sparingly:**
- Notification slide-in: 300ms ease-out from top
- Status change pulse: 2-second subtle pulse on status badges
- Button press: Scale down 0.95 on active
- Card hover: Lift shadow transition 200ms
- Loading states: Skeleton screens, not spinners where possible

---

## Page-Specific Layouts

**Landing Page:**
- Hero: Full-width banner image (workers on construction site), gradient overlay (primary color 60% opacity), centered headline "Connect with Skilled Workers Instantly", dual CTA buttons (For Customers/For Workers)
- Features grid: 3-column on desktop showing key benefits (AI Safety Check, Fair Pricing, Quick Matching) with icons
- How It Works: 3-step visual timeline with illustrations
- Social proof: Trust badges, worker testimonials in cards
- Footer: Quick links, contact info, language selector

**Authentication:**
- Split screen on desktop: Left side brand imagery/value prop, right side form
- Mobile: Stacked with minimal branding at top
- Role selection: Large card-style buttons with icons (Customer/Laborer)
- Progress indicator for multi-step signup

**Customer Dashboard:**
- Top stats cards: Active Jobs, Total Spent, Saved Workers
- Primary action: "Post New Job" prominent button
- Job list: Status-filtered tabs (Active, Completed, Cancelled)
- Quick filters: Skill type, date range

**Laborer Dashboard:**
- Earnings summary card: Total balance, this week, withdrawal button
- Job requests: Real-time list with accept/decline actions
- Profile completion meter: Circular progress with percentage
- Quick stats: Jobs completed, rating score, verification status

**Job Posting Flow (Customer):**
- Step 1: Skill selection with quantity counters
- Step 2: Location and timing inputs
- Step 3: Price preview and confirmation
- Visual: Left side form, right side running summary card

**Sobriety Check Screen:**
- Fullscreen camera view with corner guides
- Top: Instructions banner with countdown
- Bottom: Capture/Cancel buttons
- Results overlay: Immediate feedback with next action

---

## Images

**Hero Image:** Wide-angle photo of diverse construction workers collaborating on a site (authentic, aspirational), 1920x800px minimum, positioned as background with 60% dark gradient overlay

**Feature Icons:** Line-style illustrations for AI check, payment, matching - consistent stroke weight

**Worker Profiles:** Square thumbnail images (200x200px) with subtle border-radius

**Empty States:** Custom illustrations for "No jobs available", "Complete your profile" - friendly, encouraging tone

---

## Accessibility & Responsiveness

- Minimum tap target: 44x44px
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- Focus indicators: 2px solid primary color outline
- Dark mode: Consistent implementation across all screens including forms
- Language toggle: Prominent in header, persisted preference
- Offline indicators: Banner notification when connection lost
- Screen reader labels: All interactive elements properly labeled

This design system creates a trustworthy, efficient platform optimized for mobile users while maintaining clarity for complex workflows like AI verification and payment processing.