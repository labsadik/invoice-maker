# InvoiceFlow - Professional Invoice Management

A modern, enterprise-grade invoice management application built with React, TypeScript, and Supabase.

## Features

### ✅ Core Features
- **Authentication** - Secure email/password authentication with email verification
- **Organization Management** - Multi-tenant support with organization-level data isolation
- **Invoice Creation** - Create professional invoices with line items, taxes, and discounts
- **Invoice Management** - View, edit, and track invoice status (draft, sent, paid, overdue, cancelled)
- **PDF Export** - Download invoices as professional PDF documents
- **Dashboard** - Overview of revenue, outstanding amounts, and recent activity
- **User Settings** - Profile management and password updates
- **Organization Settings** - Business details, logo, GST/PAN, and default invoice terms

### 🔒 Security
- Row-Level Security (RLS) policies for all data
- Organization-scoped data access
- Secure authentication via Supabase Auth

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PDF Generation**: html2canvas, jsPDF
- **Forms**: React Hook Form, Zod validation
- **Routing**: React Router v6

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── invoice/        # Invoice-related components
│   ├── layout/         # Layout components
│   └── ui/             # shadcn/ui components
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication state
│   ├── useProfile.ts   # User profile management
│   ├── useOrganization.ts # Organization management
│   └── useInvoices.ts  # Invoice CRUD operations
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Invoices.tsx    # Invoice list
│   ├── CreateInvoice.tsx # Create new invoice
│   ├── InvoiceDetail.tsx # View invoice details
│   ├── EditInvoice.tsx # Edit existing invoice
│   ├── OrganizationSettings.tsx # Organization settings
│   └── Settings.tsx    # User settings
├── integrations/
│   └── supabase/       # Supabase client & types
└── lib/                # Utility functions
```

## Database Schema

See `docs/schema.sql` for complete database schema documentation.

### Key Tables
- `organizations` - Business/company information
- `profiles` - User profiles linked to auth users
- `user_roles` - User-organization role mappings
- `invoices` - Invoice headers with customer info
- `invoice_items` - Line items for each invoice
- `customers` - Customer database
- `audit_logs` - Activity logging

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

The following environment variables are automatically configured:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## License

