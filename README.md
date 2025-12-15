# Lifting Plan App: Comprehensive Workout Planning & Progress Tracking Platform

A full-stack web application for creating, managing, and tracking personalized strength training programs with intelligent progression algorithms, interactive workout editors, and detailed analytics dashboards.

## Contributors

- **Will Sullivan** ([@wsulliv8](https://github.com/wsulliv8))

## Technologies & Stack

[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-336791.svg)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.6-2D3748.svg)](https://www.prisma.io/)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000.svg)](https://jwt.io/)
[![DnD Kit](https://img.shields.io/badge/DnD_Kit-6.3-FF6B6B.svg)](https://dndkit.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.15-FF6384.svg)](https://recharts.org/)

### Backend Architecture

- **Runtime & Framework:** Node.js with Express 5.x for high-performance RESTful API development
- **Database & ORM:**
  - PostgreSQL for robust relational data storage
  - Prisma ORM with declarative schema modeling and type-safe database access
  - Complex relational hierarchies (Users → Plans → Weeks → Days → Workouts → Lifts)
  - JSON fields for flexible progression rules and user lift data tracking
- **Authentication & Security:**
  - JWT-based stateless authentication with secure token signing
  - bcrypt password hashing with 12 salt rounds
  - Role-based access control (user/admin) with middleware protection
  - Helmet.js for comprehensive security headers (CSP, XSS protection)
  - Multi-tier rate limiting (general: 1000/15min, auth: 10/15min, login: 5/15min)
  - XSS sanitization middleware for all user inputs
  - Input validation using express-validator and validator.js
- **API Design:** RESTful architecture with controller/service separation pattern
- **Error Handling:** Centralized error middleware with structured error responses

### Frontend Architecture

- **Framework:** React 19 with modern hooks (useState, useEffect, useMemo, useCallback, useRef)
- **Build Tool:** Vite 6.3 for lightning-fast development and optimized production builds
- **Styling:**
  - Tailwind CSS 3.4 with custom design system and design tokens
  - CSS custom properties for theming (light/dark mode)
  - Responsive design with mobile-first approach
  - Custom Tailwind plugins for vertical text and animations
- **UI Components & Libraries:**
  - Radix UI primitives (@radix-ui/react-toggle, @radix-ui/react-toggle-group)
  - Heroicons and Lucide React for iconography
  - Framer Motion for smooth animations and transitions
  - React Window for virtualization of large lists
  - Custom reusable component library (Button, Input, Select, Modal, Toast, etc.)
- **Interactivity:**
  - @dnd-kit for drag-and-drop workout planning with multi-touch support
  - Custom sensors with activation constraints for precise control
  - Sortable context for reordering lifts within workouts
- **Data Visualization:**
  - Recharts for interactive charts and analytics
  - Line charts for progress tracking over time
  - Bar charts for volume analysis
  - Radial bar charts for completion metrics
- **State Management:**
  - React Context API for theme and user state
  - Custom hooks for complex state logic (usePlanDragAndDrop, usePlanActions, usePlanData, usePlanUIState)
  - Optimistic UI updates with error rollback
- **Routing:** React Router v7 with data loaders and programmatic navigation
- **Form Handling:** Controlled components with real-time validation and error display

## Core Features & Technical Implementation

### Intelligent Workout Progression System

**Adaptive Progression Algorithms:**

- Experience-level based progression rules (beginner/intermediate/advanced)
- Lift-type specific increments (primary vs. supplementary movements)
- Configurable progression frequency per experience level
- Automatic weight regression on workout failure
- Future workout weight adjustment based on completion status

**Progression Rule Engine:**

- JSON-based progression rule storage in database
- Session-indexed progression calculation
- User max weight capping (110% safety limit)
- Real-time progression application during workout editing
- Backward propagation of weight adjustments across plan timeline

### Interactive Drag-and-Drop Workout Editor

**Multi-Level Drag & Drop:**

- Workout-level drag-and-drop for moving workouts between days
- Lift-level drag-and-drop for reordering exercises within workouts
- Touch and pointer sensor support for mobile compatibility
- Activation constraints (5px distance) to prevent accidental drags
- Visual feedback with active state management

**Editor Features:**

- Real-time workout editing with optimistic updates
- Lift search with modal interface for exercise selection
- Dynamic set/rep/weight/RPE/rest time configuration
- Superset linking between exercises
- Inline lift addition and removal
- Session-aware progression calculation

### Advanced Data Modeling & Relationships

**Complex Schema Design:**

```
Users → Plans → Weeks → Days → WorkoutDay (junction) → Workouts → Lifts
                    ↓
              BaseLifts ← UserLiftsData (user progress tracking)
```

**Key Relationships:**

- Hierarchical plan structure with cascading deletions
- Many-to-many relationship between Days and Workouts via WorkoutDay junction table
- User-specific lift progress tracking with JSON rep_range_progress
- Plan duplication with source_plan_id foreign key relationships
- Group organization system with JSON-based dayGroups field

**JSON Field Utilization:**

- Progression rules stored as JSON for flexibility
- Rep range progress tracking with nested object structures
- Monthly volume aggregation in user lift data
- Plan group metadata with color and name associations

### Comprehensive Progress Tracking

**Analytics Dashboard:**

- Plan completion timeline with date-based visualization
- Workout success rate tracking (all sets/reps/weight achieved)
- Volume progression charts (monthly aggregates)
- Rep range progress visualization
- Estimated max calculation and tracking
- Calendar-based workout scheduling and missed day detection

**Data Aggregation:**

- User lift data aggregation across all workouts
- Rep-range specific progress tracking
- Monthly volume calculations (sets × reps × weight)
- Historical progress with date-stamped entries
- Current vs. historical comparison

### Security Architecture

**Multi-Layer Security Implementation:**

- **Authentication:** JWT tokens with secure signing, HTTP-only cookie consideration
- **Authorization:** Role-based middleware (authMiddleware, adminMiddleware)
- **Input Sanitization:** Recursive object sanitization using xss library
- **Rate Limiting:** Tiered rate limits (general API, auth endpoints, login-specific)
- **Security Headers:** Helmet.js with comprehensive CSP policies
- **Password Security:** bcrypt with 12 salt rounds, strong password validation
- **SQL Injection Prevention:** Prisma parameterized queries
- **XSS Protection:** Input sanitization + CSP headers

**Validation Pipeline:**

- Email format validation (RFC 5322 compliant)
- Username validation (3-30 chars, alphanumeric + hyphens/underscores)
- Password strength validation (min 8 chars, mixed case, numbers, special chars)
- Request body validation with express-validator

### Performance Optimizations

**Frontend Optimizations:**

- React.memo for component memoization
- useMemo for expensive computations (workout grouping, date calculations)
- useCallback for stable function references in drag handlers
- React Window for virtualizing long lists
- Lazy loading of workout details
- Optimistic UI updates with server sync

**Backend Optimizations:**

- Prisma query optimization with select/include patterns
- Batch database operations for bulk updates
- Indexed database queries for fast lookups
- Efficient JSON field queries
- Minimal data transfer with selective field projection

**State Management:**

- Custom hooks for state encapsulation
- Ref-based storage for frequently accessed data
- Context API for global state (avoiding prop drilling)
- LocalStorage caching for user preferences and theme

### Responsive Design System

**Breakpoint Strategy:**

- Mobile-first design with Tailwind breakpoints
- Screen size detection via custom ThemeContext hook
- Adaptive layouts (mobile grid vs. desktop grid)
- Touch-optimized drag interactions
- Responsive typography and spacing

**Theme System:**

- CSS custom properties for theme variables
- Light/dark mode with localStorage persistence
- Smooth theme transitions
- Chart color theming integration
- Design token system for consistent styling

### User Experience Features

**Plan Management:**

- Visual grid-based plan editor (weeks × days)
- Day grouping with custom colors and names
- Plan duplication with customizable settings
- Workout copying between days
- Context menu for quick actions
- Undo/redo considerations in state management

**Workout Execution:**

- Active workout interface with lift tracking
- Real-time completion status updates
- Set/rep/weight achievement tracking
- Notes and RPE logging
- Completion timestamp recording
- Success calculation (all targets met)

**Search & Discovery:**

- Lift search with filtering (muscle groups, equipment, lift type)
- Modal-based search interface
- Exercise details (how-to instructions, video URLs)
- Primary/secondary muscle group display

## Key Design Decisions

### Why Prisma ORM?

Prisma provides type-safe database access, automatic migration generation, and excellent developer experience. The declarative schema makes complex relationships manageable while maintaining data integrity with foreign key constraints and cascading deletions.

### Why @dnd-kit over react-beautiful-dnd?

@dnd-kit offers better performance, smaller bundle size, better accessibility, and more flexible sensor configuration. It supports both touch and pointer events natively, making it ideal for mobile-responsive applications.

### Why JSON Fields for Progression Rules?

Progression rules vary significantly between lift types and experience levels. Using JSON fields allows flexible rule definition without schema migrations while maintaining queryability through Prisma's JSON field support.

### Why Custom Hooks for State Management?

Complex state logic (drag-and-drop, plan actions, UI state) benefits from encapsulation in custom hooks. This improves code reusability, testability, and maintains clean component code.

### Why Hierarchical Plan Structure?

Weeks → Days → Workouts hierarchy mirrors how users think about training programs. This structure enables natural plan organization, easy duplication, and efficient querying of related data.

## Architecture Patterns

- **Service-Oriented Design:** Separation of concerns with dedicated controllers and services
- **Middleware Pattern:** Authentication, authorization, error handling, and security as composable middleware
- **Repository Pattern:** Prisma Client abstraction for database operations
- **Custom Hooks Pattern:** Encapsulated stateful logic for complex features
- **Component Composition:** Reusable UI components with variant support
- **Context Pattern:** Global state management for theme and user data

## Challenges & Solutions

### Challenge: Managing Complex State in Workout Editor

**Solution:** Created custom hooks (usePlanDragAndDrop, usePlanActions, usePlanUIState) to encapsulate stateful logic. Used refs for frequently accessed data and memoization for expensive computations.

### Challenge: Ensuring Data Consistency in Progression Updates

**Solution:** Implemented transaction-based updates when completing workouts. Progression rules are applied atomically, and future workout weights are updated in batch operations within transactions.

### Challenge: Performance with Large Plan Structures

**Solution:** Implemented React Window for virtualizing workout lists, useMemo for grouping operations, and selective data loading. Backend uses Prisma's select/include to fetch only required fields.

### Challenge: Mobile Drag-and-Drop Experience

**Solution:** Configured @dnd-kit sensors with appropriate activation constraints (5px distance, 50ms delay for touch). Added scroll synchronization for mobile grid views and touch-optimized hit areas.

### Challenge: Real-Time UI Updates with Server Sync

**Solution:** Implemented optimistic updates with server synchronization. On error, state is rolled back to previous valid state. Used loading states and error boundaries for graceful failure handling.

## Accomplishments

- Designed and implemented a scalable full-stack architecture with clear separation of concerns
- Built an intuitive drag-and-drop workout editor with multi-level interactivity
- Developed intelligent progression algorithms that adapt to user experience level
- Created comprehensive security measures protecting against common web vulnerabilities
- Implemented responsive design supporting mobile, tablet, and desktop experiences
- Designed complex relational database schema supporting flexible workout plans
- Built analytics dashboard with interactive charts for progress visualization
- Achieved type-safe database access with Prisma ORM
- Implemented role-based access control with JWT authentication
- Created reusable component library with consistent design system

## Future Enhancements

- **Social Features:** Share plans, follow other users, community plan marketplace
- **Advanced Analytics:** Strength curves, plateaus detection, program recommendations
- **Mobile App:** Native iOS/Android apps with offline workout tracking
- **Integration:** Apple Health, Google Fit, MyFitnessPal API integration
- **AI Recommendations:** ML-based plan suggestions based on user progress and goals
- **Video Analysis:** Form check video uploads with AI-powered feedback
- **Nutrition Tracking:** Meal planning and macro tracking integration
- **Workout Templates:** Pre-built programs from professional coaches
