# MediFlow - Clinical Management System

**Complete clinic management platform for appointments, consultations, and patient care**

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [User Roles](#user-roles)
4. [Getting Started](#getting-started)
5. [System Architecture](#system-architecture)
6. [Tech Stack](#tech-stack)
7. [Project Structure](#project-structure)
8. [How It Works](#how-it-works)
9. [Staff Onboarding & Approval](#staff-onboarding--approval)
10. [Roles & Permissions Matrix](#roles--permissions-matrix)
11. [Data Flow End-to-End](#data-flow-end-to-end)
12. [Configuration & Environment](#configuration--environment)
13. [FAQ](#faq)

---

## Overview

MediFlow is a comprehensive web-based clinic management system designed to streamline healthcare operations. The platform supports multiple user roles with secure authentication and provides tools for patient management, appointment scheduling, digital consultations, and billing.

**Live Application**: https://zwmj2s4bh5w5c.mocha.app

---

## Features

### 🏥 Multi-Clinic Support
- Complete clinic isolation for data privacy
- Separate patient databases per clinic
- Clinic-specific user registration
- HIPAA-compliant data separation

### 👥 Patient Management
- Complete patient registration with demographics
- Medical history tracking
- Contact information management
- Patient search and filtering
- Clinic-specific patient records

### 📅 Appointment Scheduling
- Easy booking system for patient-doctor appointments
- Real-time status tracking (Booked → Checked In → Completed → Cancelled)
- Calendar view of appointments
- Appointment filtering by date, doctor, and status

### 🩺 Digital Consultations
- Record visit notes and diagnoses
- Create digital prescriptions
- Track follow-up appointments
- Complete medical record keeping

### 💰 Billing & Invoicing
- Automated invoice generation
- Payment status tracking (Pending/Paid)
- Invoice history and reporting
- Patient billing overview

### 📊 Analytics Dashboard
- Role-specific statistics and insights
- Today's appointment count
- Total patient count
- Pending invoice tracking
- Quick access to common tasks

### 🔐 Security & Access Control
- Secure Google OAuth authentication
- Role-based permissions with clinic isolation
- Multi-tenant architecture for data privacy
- Protected routes and API endpoints
- Complete clinic data separation
- Session management

---

## User Roles

### 1. Admin
**Full system access with administrative capabilities**

**Permissions:**
- Manage all patients, appointments, and invoices
- View all system data and analytics
- Access complete dashboard with system-wide statistics
- Perform all receptionist and doctor functions

**Key Features:**
- System-wide visibility
- User management
- Complete data access

---

### 2. Receptionist
**Front desk operations and administrative support**

**Permissions:**
- Register and manage patients
- Schedule and manage appointments
- Create and manage invoices
- View billing information

**Key Features:**
- Patient check-in/check-out
- Appointment scheduling
- Billing operations
- Front desk dashboard

---

### 3. Doctor
**Clinical operations and patient care**

**Permissions:**
- View assigned appointments
- Record visit notes and diagnoses
- Create prescriptions
- Complete consultations

**Key Features:**
- Appointment management
- Clinical documentation
- Prescription writing
- Patient consultation records

**Restrictions:**
- Can only view own appointments
- Cannot schedule new appointments
- Cannot access billing information

---

### 4. Nurse
**Clinical support and patient care assistance**

**Permissions:**
- Register and manage patients
- View patients in their clinic
- Update vitals and basic medical information
- View clinic appointments
- Schedule appointments

**Restrictions:**
- Cannot create prescriptions
- Cannot access billing

---

### 5. Patient
**Limited view for patient portal access**

**Permissions:**
- View own medical records
- View appointment history
- View prescriptions

**Key Features:**
- Personal health overview
- Appointment tracking
- Medical history access

**Restrictions:**
- Cannot create appointments (must be created by receptionist)
- Cannot access other patients' data
- Read-only access to own records

---

## Getting Started

### For Administrators

1. **Initial Setup**
   - Sign in with Google OAuth
   - Select or create your clinic during registration
   - First user is automatically registered as Admin for that clinic
   - Configure clinic information

2. **Add Staff Members**
   - Invite receptionists and doctors to your specific clinic
   - They'll sign in with Google and register with their role for your clinic
   - Staff can only access data from their assigned clinic

3. **Register Patients**
   - Add patient demographics
   - Record medical history
   - Set up contact information

4. **Schedule Appointments**
   - Select patient and doctor
   - Choose date and time
   - Add appointment reason

### For Receptionists

1. **Daily Operations**
   - Check today's appointments on dashboard
   - Register new patients
   - Schedule appointments
   - Check patients in when they arrive

2. **Billing Tasks**
   - Create invoices for services
   - Track payment status
   - Generate billing reports

### For Doctors

1. **View Schedule**
   - Check appointments on dashboard
   - Review patient information before visits

2. **Conduct Consultations**
   - Update appointment status to "Checked In"
   - Record visit notes and diagnosis
   - Create prescriptions
   - Mark as completed
   - Schedule follow-ups if needed

### For Patients

1. **Access Portal**
   - Sign in with Google account
   - View personal health dashboard

2. **Track Health**
   - Review appointment history
   - Access medical records
   - View prescriptions

---

## System Architecture

### Frontend
- **React 18** with TypeScript
- **React Router 6** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Hono** web framework
- **Cloudflare Workers** serverless platform
- **Cloudflare D1** SQLite database
- **@getmocha/users-service** for authentication

### Authentication Flow
1. User clicks "Sign In with Google"
2. Redirected to Google OAuth
3. Authorization code exchanged for session token
4. Session token stored in HTTP-only cookie
5. Subsequent requests authenticated via cookie

### Data Flow
1. React components make API calls to Hono backend
2. Backend validates authentication and role permissions
3. Database queries executed via D1 SQL interface
4. Results returned to frontend and rendered

---

## Tech Stack

### Frontend Technologies
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **React Router 6.28** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first CSS
- **Lucide React** - Icon library
- **Vite 6.0** - Build tool and dev server

### Backend Technologies
- **Hono 4.6** - Web framework for Cloudflare Workers
- **Cloudflare Workers** - Serverless compute platform
- **Cloudflare D1** - Serverless SQLite database
- **Zod 3.24** - Schema validation

### Authentication
- **@getmocha/users-service** - Authentication SDK
- **Google OAuth 2.0** - Identity provider
- **HTTP-only cookies** - Session management

### Development Tools
- **ESLint** - Code linting
- **TypeScript 5.6** - Type checking
- **PostCSS** - CSS processing

---

## Project Structure

```
mediflow/
├── docs/                          # Documentation files
│   ├── README.md                  # This file - general documentation
│   ├── DATABASE_SCHEMA.md         # Database schema reference
│   └── API_DOCUMENTATION.md       # API endpoints and usage
│
├── src/
│   ├── react-app/                 # Frontend React application
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Layout.tsx         # Main layout wrapper
│   │   │   └── ProtectedRoute.tsx # Route authentication guard
│   │   │
│   │   ├── pages/                 # Page components (routes)
│   │   │   ├── Home.tsx           # Landing/login page
│   │   │   ├── Dashboard.tsx      # Role-based dashboard
│   │   │   ├── Patients.tsx       # Patient management
│   │   │   ├── Appointments.tsx   # Appointment scheduling
│   │   │   ├── Consultation.tsx   # Clinical consultations
│   │   │   ├── Billing.tsx        # Invoice management
│   │   │   ├── Reports.tsx        # Reports and analytics
│   │   │   └── AuthCallback.tsx   # OAuth callback handler
│   │   │
│   │   ├── App.tsx                # Main app component with routes
│   │   ├── main.tsx               # React entry point
│   │   └── index.css              # Global styles
│   │
│   ├── worker/                    # Backend Cloudflare Worker
│   │   └── index.ts               # API endpoints and middleware
│   │
│   └── shared/                    # Shared code between frontend/backend
│       └── types.ts               # TypeScript types and Zod schemas
│
├── index.html                     # HTML entry point
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── wrangler.json                  # Cloudflare Workers configuration
```

### Key Files

- **src/worker/index.ts** - Contains all API endpoints, authentication middleware, and role-based access control
- **src/shared/types.ts** - Shared TypeScript types and Zod validation schemas used by both frontend and backend
- **src/react-app/App.tsx** - Main application routes and navigation structure
- **src/react-app/components/Layout.tsx** - Common layout with navigation sidebar
- **docs/DATABASE_SCHEMA.md** - Complete database table definitions and relationships
- **docs/API_DOCUMENTATION.md** - API endpoint documentation

---

## Design Philosophy

### User Interface
- **Modern & Clean** - Professional design inspired by Linear and Notion
- **Mobile-First** - Responsive design that works on all devices
- **Accessibility** - Color contrast and keyboard navigation support
- **Beautiful Gradients** - Carefully chosen color schemes and effects

### Code Quality
- **Type Safety** - Full TypeScript coverage
- **Validation** - Zod schemas for data validation
- **DRY Principles** - Reusable components and utilities
- **Clean Code** - Well-organized, maintainable codebase

### Security
- **Secure by Default** - Authentication required for all protected routes
- **Role-Based Access** - Enforced at API level with clinic isolation
- **Multi-Tenant Architecture** - Complete data separation between clinics
- **HIPAA-Style Privacy** - No cross-clinic data access
- **HTTP-Only Cookies** - Session tokens not accessible to JavaScript
- **Input Validation** - All user input validated with Zod

### Performance
- **Serverless** - Auto-scaling with Cloudflare Workers
- **Edge Computing** - Low latency worldwide
- **Efficient Queries** - Optimized database access
- **Code Splitting** - React Router lazy loading

---

## How It Works

MediFlow is a multi-tenant clinic system. Each user belongs to exactly one clinic and only sees data for that clinic.

High-level flow:
- Authentication (Google via Mocha Users Service) creates an app user session.
- First admin sets up a clinic (name, address, phone) and becomes that clinic’s admin.
- Staff (receptionists, nurses, doctors) self-register by choosing from an existing clinic list. The list shows clinic name, address, and phone.
- New staff accounts are created with status='pending'. They cannot access protected data until approved by the clinic admin.
- Once approved (status='active'), role-based permissions unlock: patient operations, appointment scheduling/updates, billing, etc.

Key guarantees:
- Clinic isolation: all queries are filtered by clinic_id at the API level. Supabase RLS can also be applied to Supabase-resident tables.
- Role-based access: the worker middleware enforces role checks per endpoint.
- Pending approval: middleware blocks users whose status != 'active'.

---

## Staff Onboarding & Approval

1) Admin creates a clinic
- Go through Setup to create clinic details (name, address, phone). The creator becomes admin for that clinic.

2) Staff self-register
- Sign in and complete registration: choose a clinic from a list that shows name, address, and phone.
- Pick role (Receptionist / Nurse / Doctor / Patient).
- The system writes clinic_users with status='pending'.

3) Approval
- Admin visits Staff Management and sees pending staff.
- Click Approve to set status to active.
- Pending users are shown a Pending Approval screen and cannot use data endpoints.

4) After approval
- Receptionists: manage patients, appointments, billing.
- Nurses: view/register patients; schedule/update appointments.
- Doctors: view their appointments; record consultations; create prescriptions.
- Patients: view their own records (when enabled).

---

## Roles & Permissions Matrix

- Admin
  - Full read/write for clinic, staff, patients, appointments, invoices, reports
- Receptionist
  - Patients: create/update
  - Appointments: create/update
  - Billing: create/update invoices
- Nurse
  - Patients: view/create/update
  - Appointments: create/update (e.g., schedule, check-in, cancel)
- Doctor
  - Appointments: view (own only)
  - Consultations/Visits: create
  - Prescriptions: create
- Patient
  - Own health data: view (read-only)

Notes:
- Exact permissions are enforced by API middleware and can be extended with RLS on Supabase tables.

---

## Data Flow End-to-End

- Frontend (React) → API (/api/* on Cloudflare Worker using Hono)
- Auth middleware validates session and loads clinic user (including status and role)
- Role guards (requireRole) and clinicUser checks enforce access
- Database operations
  - Cloudflare D1 (SQLite) for app data (patients, appointments, invoices, etc.)
  - Supabase (Postgres) for authentication and authoritative staff status (clinic_users)
- Responses returned to the frontend

---

## Configuration & Environment

Required bindings/vars:
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: used by the worker to read/write clinic_users and verify tokens
- ALLOWED_ORIGIN (optional): CORS allowlist (comma-separated)
- DB: Cloudflare D1 binding (SQLite)
- RATE_LIMIT_KV (optional): KV namespace for rate-limiting

Local development:
- Node 20.19+ (or 22.12+) is required by Vite 7
- npm install; npm run dev → http://localhost:5173

Deployment:
- npm run build → builds frontend and worker
- npm run deploy (if configured) → deploys worker

---

## FAQ

Q: Why do I see a Pending Approval screen after registering?
- Your clinic admin must approve you. Ask the admin to open Staff Management and click Approve next to your name.

Q: How does the clinic chooser work?
- The app fetches /api/clinics and shows name, address, and phone so staff can pick the correct clinic.

Q: Can nurses register patients and schedule appointments?
- Yes. Nurses can create patients and create/update appointments (including status changes).

Q: Why can’t I access any patient data after signing up?
- Your status is likely 'pending'. Once the admin approves you (status='active'), data access will be enabled.

Q: Where are permissions enforced?
- At the worker API via middleware (requireRole/clinicUser checks). Supabase RLS can further protect Supabase tables.

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

### Database Migrations
```bash
# Create migration
# Edit migration file with up_sql and down_sql

# Apply migration
npm run migrate
```

### Deployment
```bash
# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

---

## Best Practices

### Frontend
- Keep components under 100 lines
- Extract repeated UI patterns into components
- Use React hooks for state management
- Implement loading and error states
- Add proper TypeScript types

### Backend
- Validate all inputs with Zod schemas
- Enforce role-based permissions
- Use parameterized SQL queries
- Return meaningful error messages
- Log important operations

### Database
- Keep schemas simple
- Use nullable fields by default
- Avoid foreign key constraints
- Handle relationships in application code
- Follow naming conventions

---

## Support & Resources

- **Live App**: https://zwmj2s4bh5w5c.mocha.app
- **Database Schema**: See `docs/DATABASE_SCHEMA.md`
- **API Documentation**: See `docs/API_DOCUMENTATION.md`

---

## Future Enhancements

Potential features for future development:
- Email/SMS notifications for appointments
- Telemedicine video consultations
- Lab results integration
- Insurance claim processing
- Advanced reporting and analytics
- Automated appointment reminders
- Patient self-scheduling portal
- Inter-clinic referral system
- Clinic network management

---

## License

© 2025 MediFlow. All rights reserved.
