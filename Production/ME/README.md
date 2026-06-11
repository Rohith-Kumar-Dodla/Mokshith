# Mokshith B2B Platform

A modern B2B E-Commerce Web Application connecting Super Admins, Admins, Vendors, and Delivery Partners.

## Tech Stack

- **React.js** - UI Framework
- **Vite** - Build Tool
- **React Router DOM** - Routing
- **Tailwind CSS** - Styling
- **React Icons** - Icons
- **Axios** - HTTP Client (prepared for backend integration)
- **Context API** - State Management

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   ├── Card.jsx
│   └── Button.jsx
├── layouts/            # Layout components
│   └── DashboardLayout.jsx
├── pages/              # Page components
│   ├── Home/
│   ├── Auth/
│   ├── SuperAdmin/
│   ├── Admin/
│   ├── Vendor/
│   └── DeliveryPartner/
├── routes/             # Route components
│   └── ProtectedRoute.jsx
├── context/            # Context providers
│   └── AuthContext.jsx
├── services/           # API service layer
│   ├── api.js
│   ├── authService.js
│   ├── userService.js
│   ├── productService.js
│   ├── orderService.js
│   ├── deliveryService.js
│   └── index.js
├── hooks/              # Custom hooks (prepared)
├── utils/              # Utility functions (prepared)
└── assets/             # Static assets (prepared)
```

## Features

### Phase 1 (Current)
- ✅ Professional landing page with all sections
- ✅ Role-based authentication (Super Admin, Admin, Vendor, Delivery Partner)
- ✅ Protected routes with role-based access control
- ✅ Dashboard placeholders for all roles
- ✅ Service layer prepared for backend integration
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ Modern SaaS/Enterprise B2B design

### Phase 2 (Planned)
- Complete Super Admin Dashboard
- Complete Admin Dashboard
- Complete Vendor Dashboard
- Complete Delivery Partner Dashboard
- Backend API integration
- Real-time features

## Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Start development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Design System

### Colors
- **Primary:** #0F172A
- **Secondary:** #2563EB
- **Accent:** #38BDF8
- **Background:** #F8FAFC
- **Text:** #111827
- **Success:** #10B981
- **Warning:** #F59E0B
- **Danger:** #EF4444

### Design Style
- Modern SaaS
- Enterprise B2B
- Clean UI
- Large spacing
- Soft shadows
- Rounded corners
- Professional dashboard feel

## Routing

### Public Routes
- `/` - Homepage
- `/login` - Login page
- `/register` - Registration page

### Protected Routes
- `/super-admin/dashboard` - Super Admin Dashboard
- `/admin/dashboard` - Admin Dashboard
- `/vendor/dashboard` - Vendor Dashboard
- `/delivery/dashboard` - Delivery Partner Dashboard

## Authentication

Currently using mock authentication with localStorage. Backend integration is prepared in the service layer.

### Demo Login
Use the demo login buttons on the login page to quickly access different role dashboards:
- Admin Demo
- Vendor Demo
- Delivery Demo
- Super Admin Demo

## Service Layer

The service layer is prepared for backend API integration:
- `api.js` - Axios instance with interceptors
- `authService.js` - Authentication endpoints
- `userService.js` - User management endpoints
- `productService.js` - Product management endpoints
- `orderService.js` - Order management endpoints
- `deliveryService.js` - Delivery management endpoints

## License

This project is proprietary and confidential.

## Contact

For support or questions, please contact the development team.
