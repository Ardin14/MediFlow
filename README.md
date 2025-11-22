# 🏥 MediFlow - Clinical Management System

A modern, full-featured clinical management system built with React, TypeScript, and Supabase. MediFlow streamlines clinic operations with comprehensive patient management, appointment scheduling, billing, and staff coordination.

[![Discord](https://img.shields.io/discord/YOUR_DISCORD_ID?label=Discord&logo=discord)](https://discord.gg/shDEGBSe2d)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## ✨ Features

### 🩺 Patient Management
- Complete patient records with medical history
- Patient registration and profile management
- Search and filter capabilities
- Clinic-specific patient isolation with RLS

### 📅 Appointment Scheduling
- Real-time appointment booking
- Doctor and patient availability tracking
- Appointment status management (booked, completed, cancelled)
- Clinic-scoped appointments with role-based access

### 💰 Billing & Invoicing
- Invoice generation and management
- Payment tracking and history
- Multiple payment methods support
- Financial reporting

### 👥 Staff Management
- Multi-role support (Admin, Doctor, Nurse, Receptionist)
- Secure staff onboarding with email invitations
- Role-based permissions and access control
- Clinic-specific staff isolation

### 🔐 Security & Authentication
- Supabase Authentication (Email/Password)
- Row Level Security (RLS) policies for data isolation
- JWT-based clinic scoping
- Secure credential management

### 📊 Reporting & Analytics
- Patient visit history
- Appointment analytics
- Billing reports
- Custom date range filtering

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Deployment**: Vercel (Frontend), Supabase (Backend)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

## 🛠️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Ardin14/MediFlow.git
cd MediFlow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ **Never commit `.env.local` to version control!** It's already included in `.gitignore`.

### 4. Database Setup

Run the migrations in your Supabase SQL Editor:

```bash
# Run migrations in order
migrations/1.sql  # Initial schema
migrations/2.sql  # Additional tables
```

### 5. Configure RLS Policies

Apply the Row Level Security policies:

```sql
-- See docs/RLS_POLICIES.md for complete policy setup
```

Key policies include:
- Clinic-scoped data access using JWT claims
- Role-based permissions for staff
- Automatic clinic_id synchronization via triggers

### 6. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📖 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) - Backend API endpoints and usage
- [Database Schema](docs/DATABASE_SCHEMA.md) - Complete database structure
- [Local Development](docs/LOCAL_DEVELOPMENT.md) - Development setup guide
- [RLS Policies](docs/RLS_POLICIES.md) - Security policies and configuration
- [Production Checklist](docs/PRODUCTION_CHECKLIST.md) - Pre-deployment guide

## 🏗️ Project Structure

```
MediFlow/
├── src/
│   ├── react-app/
│   │   ├── components/        # React components
│   │   ├── contexts/          # Auth and global state
│   │   ├── lib/               # Supabase client & utilities
│   │   └── pages/             # Route pages
│   ├── shared/                # Shared types
│   └── worker/                # Cloudflare Worker (optional)
├── supabase/
│   └── functions/             # Edge Functions
├── migrations/                # Database migrations
├── docs/                      # Documentation
└── public/                    # Static assets
```

## 🎯 Key Features Deep Dive

### Multi-Clinic Support
MediFlow supports multiple clinics with complete data isolation:
- Each clinic's data is automatically scoped via RLS
- Staff can only access data from their assigned clinic
- JWT-based clinic_id ensures secure, performant access control

### Role-Based Access Control

| Role | Permissions |
|------|------------|
| **Admin** | Full clinic management, staff management, all CRUD operations |
| **Doctor** | View/update patients, manage appointments, prescriptions |
| **Nurse** | View patients, assist with appointments, vital signs |
| **Receptionist** | Schedule appointments, patient registration, billing |

### Appointment Workflow
1. Staff schedules appointment with available doctor
2. System validates doctor availability
3. Patient receives notification (via Edge Function)
4. Doctor completes consultation
5. Billing automatically generated

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run check` - Type check and build verification

## 🌐 Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy!

### Database (Supabase)

1. Ensure all migrations are applied
2. Configure RLS policies
3. Set up Edge Functions for email notifications
4. Enable appropriate Supabase Auth providers

See [Production Checklist](docs/PRODUCTION_CHECKLIST.md) for complete deployment guide.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Ardin14**
- GitHub: [@Ardin14](https://github.com/Ardin14)
- Discord: [Join our community](https://discord.gg/shDEGBSe2d)

## 🙏 Acknowledgments

- Built with [Supabase](https://supabase.com)
- UI components styled with [TailwindCSS](https://tailwindcss.com)
- Icons by [Lucide](https://lucide.dev)

## 📞 Support

Need help or have questions?
- Join our [Discord community](https://discord.gg/shDEGBSe2d)
- Open an [issue](https://github.com/Ardin14/MediFlow/issues)
- Check the [documentation](docs/)

---

Made with ❤️ by Ardin14
