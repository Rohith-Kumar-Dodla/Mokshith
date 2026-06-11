# B2B Enterprise Platform - Frontend

> Enterprise-grade B2B platform for streamlined business operations, inventory management, and order processing.

[![Tests](https://img.shields.io/badge/tests-831%20passing-brightgreen)](./TESTING.md)
[![Coverage](https://img.shields.io/badge/coverage-80%25%2B-brightgreen)](./coverage)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](./DEPLOYMENT.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

## 🚀 Quick Start

```bash
# Clone repository
git clone <repository-url>
cd b2b-frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

Visit http://localhost:5173

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## ✨ Features

### Core Functionality
- ✅ **Authentication & Authorization** - Secure login, registration, role-based access
- ✅ **Product Management** - Browse products, search, filter, product details
- ✅ **Shopping Cart** - Add to cart, update quantities, checkout flow
- ✅ **Order Management** - Create orders, track status, order history
- ✅ **Payment Integration** - Razorpay payment gateway integration
- ✅ **Credit Management** - Credit limits, ledger tracking, credit requests
- ✅ **Admin Dashboard** - User management, product management, order tracking
- ✅ **Super Admin Panel** - System configuration, analytics, vendor management
- ✅ **Delivery Management** - Order fulfillment, delivery tracking
- ✅ **Real-time Notifications** - WebSocket-based live updates
- ✅ **Wishlist** - Save favorite products for later

### Enterprise Features
- ✅ **Performance Optimized** - Lazy loading, code splitting, ~165KB main bundle
- ✅ **Accessibility** - WCAG 2.1 compliant, keyboard navigation, screen reader support
- ✅ **SEO Optimized** - Meta tags, Open Graph, sitemap, robots.txt
- ✅ **Error Tracking** - Sentry integration for production monitoring
- ✅ **Security Hardened** - CSP headers, XSS protection, secure token handling
- ✅ **Responsive Design** - Mobile, tablet, desktop optimized
- ✅ **Cross-Browser** - Chrome, Firefox, Safari, Edge compatible
- ✅ **PWA Ready** - Manifest, service worker support
- ✅ **E2E Tested** - Playwright cross-browser testing
- ✅ **831 Unit Tests** - 80%+ code coverage

---

## 🛠️ Tech Stack

### Core
- **React** 19.2.5 - UI library
- **Vite** 8.0.8 - Build tool & dev server
- **React Router** 7.14.1 - Client-side routing

### State Management
- **Redux Toolkit** 2.11.2 - Global state management
- **React Redux** 9.2.0 - React bindings for Redux

### API & Real-time
- **Axios** 1.15.1 - HTTP client
- **Socket.io Client** 4.8.3 - WebSocket communication

### UI & Styling
- **Tailwind CSS** 4.2.4 - Utility-first CSS
- **Lucide React** 1.8.0 - Icon library

### Testing
- **Vitest** 1.6.1 - Unit test runner
- **React Testing Library** 14.1.2 - Component testing
- **Playwright** Latest - E2E testing
- **MSW** 2.0.11 - API mocking

### Monitoring & Error Tracking
- **Sentry** Latest - Error tracking and performance monitoring

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v24.14.0 (specified in package.json)
- **npm**: >=10.0.0
- **Git**: Latest version

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd b2b-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```
   
   > **Note**: `--legacy-peer-deps` flag is required due to React 19 peer dependency conflicts.

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   VITE_RAZORPAY_KEY_ID=your-razorpay-key
   VITE_SENTRY_DSN=your-sentry-dsn (optional)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Application will be available at http://localhost:5173

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run unit tests (watch mode)
npm test -- --run        # Run unit tests (single run)
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:headed  # Run E2E tests in headed mode

# Code Quality
npm run lint             # Run ESLint (if configured)
npm run format           # Run Prettier (if configured)
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and test**
   ```bash
   npm test              # Run unit tests
   npm run test:e2e      # Run E2E tests (optional)
   ```

3. **Build and verify**
   ```bash
   npm run build
   npm run preview
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

### Hot Module Replacement (HMR)

Vite provides fast HMR. Changes to:
- React components - instant refresh
- CSS/Tailwind - instant update
- State management - requires page reload

---

## 🧪 Testing

### Unit Tests (831 tests)

```bash
# Run all unit tests
npm test

# Run specific test file
npm test Button.test.jsx

# Run with coverage
npm run test:coverage
```

Coverage thresholds: 80% (lines, branches, functions, statements)

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run in specific browser
npm run test:e2e:chromium

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### Test Structure

```
src/
├── components/
│   └── ui/
│       ├── Button.jsx
│       └── __tests__/
│           ├── Button.test.jsx
│           └── Button.accessibility.test.jsx
└── services/
    └── __tests__/
        └── apiClient.test.js

e2e/
├── auth.spec.js
├── product-workflow.spec.js
└── accessibility.spec.js
```

See [TESTING.md](./TESTING.md) for comprehensive testing guide.

---

## 🚀 Deployment

### Production Build

```bash
# Build optimized production bundle
npm run build

# Output: dist/ directory
```

Build output (~1s build time):
- Main bundle: ~165KB (40KB gzipped)
- Vendor chunks: React (227KB), Redux (19KB), Axios (48KB)
- Lazy-loaded routes: 40+ optimized chunks
- Source maps: Included for error tracking

### Deployment Platforms

- **Vercel** - Recommended for zero-config deployment
- **Netlify** - Easy static site hosting
- **AWS S3 + CloudFront** - Scalable CDN solution
- **Docker** - Containerized deployment
- **Traditional Server** - Nginx/Apache configuration

See [DEPLOYMENT.md](./DEPLOYMENT.md) for platform-specific guides, security configuration, and deployment checklist.

### Environment Variables

Set these in your deployment platform:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API base URL | Yes |
| `VITE_SOCKET_URL` | WebSocket server URL | Yes |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key for payments | Yes |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | No |
| `VITE_ENVIRONMENT` | Environment (production, staging) | No |

---

## 📁 Project Structure

```
b2b-frontend/
├── public/                  # Static assets
│   ├── robots.txt          # Search engine directives
│   ├── sitemap.xml         # Sitemap for SEO
│   └── manifest.json       # PWA manifest
├── src/
│   ├── app/                # App-level setup
│   │   └── AppProvider.jsx # Context providers
│   ├── assets/             # Images, fonts, styles
│   ├── components/         # Reusable components
│   │   ├── common/        # Common components
│   │   ├── layout/        # Layout components
│   │   ├── ui/            # UI components
│   │   └── feedback/      # Feedback components
│   ├── config/            # Configuration
│   │   ├── sentry.js     # Sentry configuration
│   │   └── securityHeaders.js # CSP headers
│   ├── constants/         # Constants
│   ├── context/           # React contexts
│   │   ├── SocketContext.jsx
│   │   └── NotificationContext.jsx
│   ├── hooks/             # Custom hooks
│   ├── modules/           # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── product/      # Product management
│   │   ├── order/        # Order management
│   │   ├── admin/        # Admin features
│   │   ├── credit/       # Credit management
│   │   └── payment/      # Payment processing
│   ├── routes/           # Route configuration
│   │   └── AppRoutes.jsx # Main routing
│   ├── services/         # API services
│   │   └── apiClient.js  # Axios instance
│   ├── utils/            # Utility functions
│   ├── App.jsx           # Root component
│   └── main.jsx          # Entry point
├── e2e/                   # E2E tests (Playwright)
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── index.html            # HTML template
├── package.json          # Dependencies & scripts
├── playwright.config.js  # Playwright configuration
├── vite.config.js        # Vite configuration
├── vitest.config.js      # Vitest configuration
├── DEPLOYMENT.md         # Deployment guide
├── TESTING.md            # Testing guide
└── README.md             # This file
```

---

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [TESTING.md](./TESTING.md) - Testing guide (unit, E2E, accessibility)
- [.env.example](./.env.example) - Environment variables template
- [code-guide/](../code-guide/) - Backend architecture documentation

### Key Modules

#### Authentication (`src/modules/auth/`)
- Login, registration, password reset
- Token management (localStorage)
- CSRF protection
- Role-based access control

#### Product Management (`src/modules/product/`)
- Product listing with search & filters
- Product details with image gallery
- Wishlist functionality
- MOQ (Minimum Order Quantity) validation

#### Order Management (`src/modules/order/`)
- Order creation and checkout
- Order tracking and history
- Order status updates (real-time)
- Delivery management

#### Admin & Super Admin (`src/modules/admin/`, `src/modules/superAdmin/`)
- User management (CRUD)
- Product management (CRUD)
- Order tracking dashboard
- Analytics and reporting
- System configuration

#### Credit Management (`src/modules/credit/`)
- Credit limit tracking
- Credit ledger
- Credit request approval flow

#### Payment (`src/modules/payment/`)
- Razorpay integration
- Payment status tracking
- Transaction history

---

## 🔒 Security

### Implemented Security Measures

- ✅ **Authentication**: JWT tokens with refresh mechanism
- ✅ **Authorization**: Role-based access control (RBAC)
- ✅ **CSRF Protection**: CSRF tokens for state-changing operations
- ✅ **XSS Protection**: React's built-in XSS protection + CSP headers
- ✅ **Secure Storage**: Tokens in localStorage (HttpOnly consideration for future)
- ✅ **HTTPS Enforcement**: Configured in deployment
- ✅ **Content Security Policy**: Defined in `src/config/securityHeaders.js`
- ✅ **Error Handling**: Sanitized error messages, no sensitive data exposure
- ✅ **Dependency Scanning**: Regular `npm audit` checks

### Security Headers

Configured in deployment (see [DEPLOYMENT.md](./DEPLOYMENT.md)):
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HTTPS only)

---

## 🎨 UI/UX

### Design System
- **Colors**: Primary (blue), secondary (gray), accent (green, red, yellow)
- **Typography**: System fonts (Inter, Segoe UI, Roboto)
- **Spacing**: 4px base unit (Tailwind spacing scale)
- **Breakpoints**: Mobile (375px), Tablet (768px), Desktop (1024px+)

### Accessibility
- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader compatible
- ARIA attributes for interactive elements
- Focus indicators on all interactive elements
- Semantic HTML structure

### Responsive Design
- Mobile-first approach
- Tested on iOS, Android, tablets, desktops
- Touch-friendly tap targets (44x44px minimum)
- Responsive images with lazy loading

---

## 🐛 Debugging

### Browser DevTools
- React DevTools - Component inspection
- Redux DevTools - State debugging
- Network tab - API request inspection

### Logging
- Development: `console.log` enabled
- Production: Sentry error tracking only
- No sensitive data logged

### Common Issues

1. **Blank page after build**
   - Check console for errors
   - Verify environment variables
   - Check API base URL

2. **CORS errors**
   - Ensure backend CORS allows frontend domain
   - Check API_BASE_URL in .env

3. **WebSocket connection failed**
   - Verify SOCKET_URL in .env
   - Check backend WebSocket server

---

## 🤝 Contributing

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Ensure all tests pass (`npm test -- --run`)
6. Build successfully (`npm run build`)
7. Commit your changes (`git commit -m 'feat: add amazing feature'`)
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Build process or tooling changes

---

## 📊 Performance

### Lighthouse Scores (Target)
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90

### Key Metrics
- First Contentful Paint (FCP): <1.8s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.8s
- Cumulative Layout Shift (CLS): <0.1
- Total Bundle Size: ~165KB (gzipped: ~41KB)

### Optimizations
- Code splitting (40+ lazy-loaded chunks)
- Tree shaking (unused code removed)
- Image optimization (WebP support)
- Font optimization (woff2 format)
- Gzip/Brotli compression
- CDN for static assets (in production)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite team for the blazing fast build tool
- Open source community for the incredible tools

---

## 📞 Support

- **Issues**: Report bugs via [GitHub Issues](your-repo-url/issues)
- **Discussions**: Join discussions on [GitHub Discussions](your-repo-url/discussions)
- **Email**: support@yourdomain.com

---

## 📈 Project Status

- **Version**: 1.0.0
- **Status**: Production Ready ✅
- **Last Updated**: May 24, 2026
- **Maintained**: Yes ✅

---

**Built with ❤️ by Mokshith Enterprises**
