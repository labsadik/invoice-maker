import { ReactNode } from "react";
import { FileText } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/20" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-accent rounded-xl">
              <FileText className="h-8 w-8 text-accent-foreground" />
            </div>
            <span className="text-3xl font-bold text-primary-foreground">InvoiceFlow</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            Professional invoicing made simple
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Create, send, and track invoices with ease. Accept payments directly to your bank account with integrated Razorpay support.
          </p>
          <div className="mt-12 flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold text-accent">10K+</div>
              <div className="text-sm text-primary-foreground/70">Active Users</div>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div>
              <div className="text-3xl font-bold text-accent">₹50Cr+</div>
              <div className="text-sm text-primary-foreground/70">Invoices Processed</div>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div>
              <div className="text-3xl font-bold text-accent">99.9%</div>
              <div className="text-sm text-primary-foreground/70">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 xl:px-20">
        <div className="lg:hidden flex items-center gap-2 mb-12">
          <div className="p-2 bg-primary rounded-lg">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary">InvoiceFlow</span>
        </div>
        
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
