# Project Name :- CarbonCalc

**CarbonCalc** is a personal carbon footprint tracker and eco-challenge community web application. Users can log daily activities, track their carbon emissions, set reduction goals, earn eco-badges, and compete with friends on leaderboards.

---

## 1. Pages/Screens Developed

### 1.1 Landing Page (Hero)

- **Purpose:** Brand introduction and user onboarding
- **Features:**
  - Animated eco-themed background with floating elements
  - Feature highlights (Track Progress, Earn Rewards, Join Community)
  - Primary CTA to start tracking
  - Trust indicators (10K+ users, 500K+ kg CO₂ saved)

### 1.2 Login Page

- **Purpose:** User authentication
- **Features:**
  - Email and password fields with validation
  - "Forgot Password" link
  - Link to Sign Up page
  - Loading state during authentication

### 1.3 Sign Up Page

- **Purpose:** New user registration
- **Features:**
  - Full Name, Email, Password, Confirm Password fields
  - Password strength requirements display
  - Client-side validation
  - Link to Login page

### 1.4 Dashboard

- **Purpose:** Main user hub after login
- **Features:**
  - Welcome banner with user name
  - Profile card with avatar and membership info
  - Carbon Footprint Log with weekly chart
  - Category breakdown (Transport, Food, Energy)
  - Goals progress card
  - Leaderboard teaser
  - Eco Badges preview

### 1.5 Carbon Log Detail Page

- **Purpose:** Detailed emission tracking
- **Features:**
  - Filter chips (All, Last Week, Last Month)
  - Weekly total with trend indicator
  - Interactive bar chart
  - Category breakdown with progress bars
  - Recent entries list with category icons

### 1.6 Leaderboard Page

- **Purpose:** Social competition and motivation
- **Features:**
  - Tabs (Weekly, Monthly, All Time)
  - Top 3 podium visualization
  - Team rankings with member counts
  - Trend indicators (↑, ↓, −)
  - "Invite Friends" CTA

### 1.7 Eco Badges Page

- **Purpose:** Achievement showcase
- **Features:**
  - Progress overview (badges earned / total)
  - Badge grid with earned/locked states
  - Progress bars for incomplete badges
  - Badge descriptions and requirements

### 1.8 Goals Page

- **Purpose:** Personal commitment tracking
- **Features:**
  - Current goal with progress bar
  - Stats (completed %, current value, money saved)
  - Milestones checklist
  - Past goals history
  - "Set New Goal" CTA

---

## 2. UI Components

### 2.1 Form Components

| Component       | Usage           | Validation                         |
| --------------- | --------------- | ---------------------------------- |
| `eco-input`   | All text inputs | Required, email format, min length |
| Password toggle | Login/Signup    | Show/hide password                 |
| Form buttons    | Submit actions  | Loading state, disabled on invalid |

### 2.2 Card Components

| Component    | Usage                   |
| ------------ | ----------------------- |
| `eco-card` | Main content containers |
| Profile card | User info display       |
| Chart card   | Data visualization      |
| Badge card   | Achievement display     |

### 2.3 Button Components

| Component              | Usage               |
| ---------------------- | ------------------- |
| `eco-button`         | Primary CTAs        |
| `eco-button-outline` | Secondary actions   |
| Icon buttons           | Navigation, actions |

### 2.4 Layout Components

| Component             | Usage                                |
| --------------------- | ------------------------------------ |
| Navigation            | Fixed header with logo, user actions |
| Grid layouts          | Dashboard, Badges                    |
| Responsive containers | All pages                            |

---

## 3. Client-Side Validations

### 3.1 Login Form

```typescript
// Email validation
- Required: "Email is required"
- Format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Error: "Please enter a valid email address"

// Password validation
- Required: "Password is required"
- Min length: 6 characters
- Error: "Password must be at least 6 characters"
```

### 3.2 Sign Up Form

```typescript
// Full Name validation
- Required: "Full name is required"
- Min length: 2 characters

// Email validation
- Same as login

// Password validation
- Required: "Password is required"
- Min length: 6 characters
- Pattern: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/
- Error: "Password must contain uppercase, lowercase, and number"

// Confirm Password validation
- Required: "Please confirm your password"
- Match: Must match password field
- Error: "Passwords do not match"
```

### 3.3 Validation UX

- Real-time error clearing on input change
- Toast notifications for form errors
- Disabled submit button during API calls
- Loading spinners on async operations

---

## 4. Routing and Navigation

### 4.1 View States (Single Page Application)

```typescript
type View = 'hero' | 'login' | 'signup' | 'dashboard' | 
            'carbonlog' | 'leaderboard' | 'badges' | 'goals';
```

### 4.2 Navigation Flow

```
Hero → Login → Dashboard
        ↓         ↓
      Signup    Carbon Log
                  ↓
                Leaderboard
                  ↓
                Eco Badges
                  ↓
                Goals
```

### 4.3 Navigation Components

- **Logo:** Returns to Dashboard (if logged in) or Hero
- **Back Button:** Returns to Dashboard from sub-pages
- **Logout:** Clears session, returns to Hero
- **User Profile:** Shows current user info

### 4.4 Protected Routes

- Dashboard and sub-pages require authentication
- Unauthenticated users redirected to Login

---

## 5. API Integration Expectations

### 5.1 Authentication Endpoints

```typescript
// POST /api/auth/login
Request: { email: string, password: string }
Response: { user: User, token: string }

// POST /api/auth/signup
Request: { name: string, email: string, password: string }
Response: { user: User, token: string }

// POST /api/auth/logout
Request: { token: string }
Response: { success: boolean }
```

### 5.2 Carbon Data Endpoints

```typescript
// GET /api/carbon/weekly
Response: { total: number, data: DayData[], change: number }

// GET /api/carbon/categories
Response: { categories: CategoryData[] }

// GET /api/carbon/entries
Response: { entries: Entry[] }

// POST /api/carbon/entry
Request: { activity: string, category: string, emission: number }
Response: { entry: Entry }
```

### 5.3 Leaderboard Endpoints

```typescript
// GET /api/leaderboard?period=weekly|monthly|alltime
Response: { teams: Team[], userRank: number }
```

### 5.4 Goals Endpoints

```typescript
// GET /api/goals
Response: { current: Goal, past: Goal[] }

// POST /api/goals
Request: { title: string, target: number, deadline: string }
Response: { goal: Goal }
```

### 5.5 Badges Endpoints

```typescript
// GET /api/badges
Response: { badges: Badge[], earnedCount: number }
```

---

## 6. Authentication Handling

### 6.1 Session Management

```typescript
// LocalStorage keys
- 'carboncalc_user': Stores user object

// Session flow
1. Check localStorage on app load
2. If user exists, set authenticated state
3. If not, show public pages only
```

### 6.2 Authentication State

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### 6.3 Protected Route Logic

```typescript
// Before rendering protected page
if (!user) {
  navigateTo('login');
  return;
}
```

### 6.4 Logout Flow

1. Clear localStorage
2. Reset auth state
3. Navigate to Hero page
4. Show logout success toast

---

## 7. Error and Success Message Handling

### 7.1 Toast Notifications (Sonner)

```typescript
// Success messages
toast.success('Welcome back, John!');
toast.success('Account created successfully!');

// Error messages
toast.error('Please fix the errors in the form');
toast.error('Invalid email or password');

// Info messages
toast.info('Feature coming soon!');
```

### 7.2 Form Error Display

- Inline error messages below fields
- Red border on invalid inputs
- Error clearing on input change

### 7.3 Loading States

- Spinner on submit buttons during API calls
- Disabled form during submission
- Skeleton screens for data loading

---

## 8. UI/UX Expectations

### 8.1 Responsive Design

```css
/* Breakpoints */
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

/* Responsive patterns */
- Single column on mobile
- Two columns on tablet
- Three columns on desktop
- Cards stack vertically on small screens
```

### 8.2 Visual Consistency

```css
/* Color Palette */
--eco-green: #3D8B5D;        /* Primary accent */
--eco-forest: #1F3A2D;       /* Text primary */
--eco-sage: #6B8A76;         /* Text secondary */
--eco-bg: #F6FBF6;           /* Background primary */
--eco-bg-alt: #E9F3EB;       /* Background secondary */

/* Typography */
--font-heading: 'Nunito', sans-serif;
--font-body: 'Inter', sans-serif;

/* Spacing */
--card-radius: 28px (desktop), 18px (mobile);
--card-shadow: 0 18px 45px rgba(31, 58, 45, 0.10);
```

### 8.3 Animation & Interactions

```css
/* Scroll reveal animations */
- Fade in up on scroll
- Stagger delays for lists
- Smooth transitions (200-300ms)

/* Hover effects */
- Card lift on hover
- Button color transitions
- Link underline animations

/* Loading animations */
- Spinner rotation
- Pulse effects on progress bars
```

### 8.4 Accessibility

```html
<!-- Semantic HTML -->
- Proper heading hierarchy (h1 > h2 > h3)
- Button elements for clickable actions
- Form labels for all inputs
- Alt text for images

<!-- Keyboard Navigation -->
- Tab order follows visual order
- Enter/Space activates buttons
- Escape closes modals/dropdowns

<!-- Focus States -->
- Visible focus rings
- Focus trap in modals
```

### 8.5 Performance

```
- Lazy load images
- Code splitting for routes
- Minimize re-renders with React.memo
- Optimize bundle size
```

---

## 9. Tech Stack

| Category      | Technology              |
| ------------- | ----------------------- |
| Framework     | React 19.2.0            |
| Language      | TypeScript 5.9.3        |
| Build Tool    | Vite 7.2.4              |
| Styling       | Tailwind CSS 3.4.19     |
| UI Components | shadcn/ui               |
| Icons         | Lucide React            |
| Notifications | Sonner                  |
| Forms         | React Hook Form (ready) |
| Validation    | Zod (ready)             |

---

## 10. File Structure

```
src/
├── App.tsx                 # Main app component with routing
├── main.tsx               # Entry point
├── index.css              # Global styles
├── components/
│   └── Navigation.tsx     # Header navigation
├── sections/
│   ├── Hero.tsx           # Landing page
│   ├── Login.tsx          # Login form
│   ├── SignUp.tsx         # Registration form
│   ├── Dashboard.tsx      # Main dashboard
│   ├── CarbonLog.tsx      # Detailed carbon tracking
│   ├── Leaderboard.tsx    # Competition rankings
│   ├── EcoBadges.tsx      # Achievement badges
│   ├── Goals.tsx          # Goal tracking
│   └── ClosingCTA.tsx     # Footer CTA
└── types/                 # TypeScript definitions
```

---

## 11. Future Enhancements

### 11.1 Planned Features

- [ ] Real API integration
- [ ] Password reset flow
- [ ] Email verification
- [ ] Social login (Google, Apple)
- [ ] Push notifications
- [ ] Offline mode
- [ ] Data export (CSV, PDF)
- [ ] Multi-language support

### 11.2 Performance Improvements

- [ ] Virtual scrolling for long lists
- [ ] Image optimization
- [ ] Service worker for caching
- [ ] Bundle analysis and optimization

---

## 12. Testing Checklist

### 12.1 Functional Testing

- [ ] User registration flow
- [ ] Login/logout flow
- [ ] Form validations
- [ ] Navigation between pages
- [ ] Data persistence (localStorage)

### 12.3 Cross-Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### 12.4 Accessibility Testing

- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Color contrast ratios
- [ ] Focus management

---

**Document Version:** 1.0
**Last Updated:** February 15, 2026
**Author:** Frontend Developer(Srushti Bandi)
