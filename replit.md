# Kamgar Naka - On-Demand Labor Marketplace

## Overview

Kamgar Naka is an on-demand labor marketplace platform connecting customers with verified skilled workers (laborers) in India. The platform operates similarly to ride-hailing apps like Uber/Rapido but for blue-collar workers such as masons, carpenters, plumbers, painters, and helpers.

**Core Functionality:**
- Customers post job requests with required skills and worker quantities
- Real-time matching notifies available laborers with matching skills
- First-response-wins job acceptance model
- AI-powered sobriety/fitness verification before work begins
- Transparent government-based wage pricing
- Built-in payment processing with platform convenience fees

The platform emphasizes safety through AI verification, trust through transparency, and accessibility for users with varying technical literacy levels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18+ with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **UI Components:** Shadcn/ui component library with Radix UI primitives
- **Styling:** Tailwind CSS with custom Material Design-inspired theme
- **State Management:** TanStack Query (React Query) for server state
- **Forms:** React Hook Form with Zod validation

**Design System:**
- Material Design principles with mobile-first approach
- Custom color palette supporting light/dark modes
- Typography: Inter (primary), Poppins (display/headings)
- Trust-focused design with clear status indicators and verification badges

**Key Pages:**
- Landing page with hero section
- Authentication flow (role selection, sign up, sign in)
- Customer dashboard for job posting and management
- Laborer dashboard for job alerts and acceptance
- Profile setup pages (separate flows for customers and laborers)
- AI sobriety check interface with camera integration
- About and Contact informational pages

**Component Organization:**
- Reusable UI components in `/client/src/components/ui`
- Feature-specific components (Navbar, Footer, SkillBadge, StatusBadge)
- Protected route wrapper for role-based access control
- Custom hooks for authentication and WebSocket management

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js for HTTP server
- **Database ORM:** Drizzle ORM
- **Real-time:** WebSocket (ws library) for live notifications
- **Authentication:** Session-based with bcrypt password hashing
- **AI Integration:** Google Gemini AI for sobriety analysis

**API Structure:**
- RESTful endpoints for CRUD operations
- WebSocket server on `/ws` path for real-time job notifications
- Centralized error handling middleware
- Request/response logging for API calls

**Data Layer:**
- Storage abstraction interface (`IStorage`) for database operations
- Drizzle schema definitions with TypeScript types
- Migrations managed via Drizzle Kit
- PostgreSQL-compatible database operations

**Database Schema (Key Tables):**
- `users` - Core user accounts with role differentiation (customer/laborer)
- `laborer_profiles` - Extended profile for workers (skills, UPI ID, verification status)
- `jobs` - Job postings with status tracking and skill requirements
- `sobriety_checks` - AI verification results with detailed analysis
- `payments` - Transaction records with platform fee tracking

**Job Matching Flow:**
1. Customer creates job with required skills
2. Backend queries laborers with matching skills
3. WebSocket notification sent to all matching laborers
4. First laborer to accept triggers job assignment
5. Other laborers receive "job taken" notification
6. Assigned laborer must pass AI sobriety check
7. Upon completion, payment processing initiated

**Real-time Communication:**
- WebSocket connections registered per user ID
- Client-server message protocol with typed events
- Automatic reconnection handling on client side
- User-to-socket mapping for targeted notifications

### Authentication & Authorization

**Authentication Strategy:**
- Email/password-based authentication
- Bcrypt for password hashing (salt rounds: 10)
- Session storage in localStorage (client-side)
- Role-based access control (customer, laborer, admin)

**⚠️ CRITICAL SECURITY LIMITATION:**
- **Current auth is CLIENT-SIDE ONLY** - uses localStorage without server-side session management
- **Admin routes use x-user-id header** - can be spoofed by malicious clients
- **NOT PRODUCTION-READY** - requires implementing:
  - Server-side session management (express-session or JWT)
  - Secure session cookies with HttpOnly flag
  - CSRF protection
  - Proper authentication middleware tied to session tokens
- **Current implementation is for DEVELOPMENT/TESTING ONLY**

**Protected Routes:**
- Role-specific dashboards enforce user type requirements (client-side only)
- Profile setup pages accessible only to appropriate user types
- Automatic redirection based on authentication state and role
- Admin dashboard (/dashboard/admin) requires admin role (⚠️ not secure without proper auth)

### AI Integration

**Sobriety Verification System:**
- Integration with Google Gemini 2.5 Pro AI vision model (WorkSafeVision approach)
- Camera capture interface for selfie/video submission
- Structured JSON response schema for reliable analysis
- Analysis of impairment indicators with scoring:
  - Eye movement and focus (bloodshot, dilated pupils, glazed appearance)
  - Facial expressions (confusion, disorientation, altered state)
  - Head position and stability (swaying, poor posture control)
  - Skin color changes (flushing, pallor)
- Detailed response includes:
  - Overall status: passed/failed
  - Confidence score (0-100)
  - Individual criteria scores and status
  - List of detected issues
  - Risk level assessment (low/medium/high)
  - Detailed analysis text
- Failed checks trigger 5.5-hour cooldown period
- Manual review option for edge cases

**AI Implementation:**
- Based on WorkSafeVision repository (https://github.com/Bigshot95/worksafevision)
- Uses Gemini 2.5 Pro model for higher reliability
- Structured JSON schema ensures consistent responses
- Base64 image encoding for analysis
- Comprehensive error handling and validation
- Detailed analysis stored in database for transparency

### Payment Integration

**Payment Options:**
- **UPI Direct:** Simple payment via laborer's UPI ID (QR code/deep link generation)
- **Razorpay (Planned):** Split payment processing for commission handling
- Platform convenience fee: ₹10 per transaction
- Government-based transparent wage rates (e.g., ₹700/day mason, ₹400/day helper)

**Payment Flow:**
- Rates pre-filled from government guidelines
- Total calculation includes labor cost + platform fee
- Payment triggered upon job completion
- Transaction records stored with status tracking

## External Dependencies

### Third-Party Services

**Database:**
- Neon Database (PostgreSQL serverless)
- Connection pooling via `@neondatabase/serverless`
- WebSocket constructor override for serverless compatibility

**AI Service:**
- Google Gemini AI via `@google/genai` package
- Vision model for image/video analysis
- Requires API key configuration

**UI Component Library:**
- Shadcn/ui with Radix UI primitives
- Comprehensive component set (dialogs, forms, cards, badges, etc.)
- Accessible, customizable components

**Payment Gateway (Planned):**
- Razorpay for marketplace/split payments
- Routes API for commission handling
- UPI payment deep linking

**Identity Verification (Future):**
- DigiLocker integration for Aadhaar verification
- Requires government API partnership
- Currently manual/uploaded address proof

### Key NPM Packages

**Core Framework:**
- `react`, `react-dom` - Frontend framework
- `express` - Backend HTTP server
- `vite` - Build tool and dev server
- `typescript` - Type safety

**Database & ORM:**
- `drizzle-orm` - Database ORM
- `drizzle-kit` - Migration management
- `@neondatabase/serverless` - Neon DB client

**Real-time & Networking:**
- `ws` - WebSocket server
- `@tanstack/react-query` - Data fetching and caching

**Authentication & Security:**
- `bcrypt` - Password hashing
- `connect-pg-simple` - Session store

**UI & Styling:**
- `tailwindcss` - Utility-first CSS
- `@radix-ui/*` - Accessible component primitives
- `lucide-react` - Icon library
- `class-variance-authority` - Component variant handling

**Forms & Validation:**
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Form validation integration

**Development Tools:**
- `tsx` - TypeScript execution
- `esbuild` - Production bundling
- Replit-specific plugins for development environment

### Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (Neon Database)
- `GOOGLE_AI_API_KEY` - Google Gemini AI API key (implied)
- `NODE_ENV` - Environment flag (development/production)

### Deployment Platform

- **Replit.com** - Primary hosting and development environment
- Built-in database provisioning support
- WebSocket support for real-time features
- Node.js runtime with automatic scaling