import { 
  TrendingUp, 
  Receipt, 
  Clock,
  Plus,
  ArrowRight,
  Loader2,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization } from "@/hooks/useOrganization";
import { useInvoices } from "@/hooks/useInvoices";

const statusStyles = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  sent: "bg-accent/10 text-accent",
  overdue: "bg-destructive/10 text-destructive",
  draft: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: organization, isLoading: orgLoading } = useOrganization();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();

  const isLoading = profileLoading || orgLoading || invoicesLoading;

  // Calculate stats
  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const outstanding = invoices
    .filter((inv) => ["sent", "pending", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

  const invoiceCount = invoices.length;
  const paidCount = invoices.filter((inv) => inv.status === "paid").length;

  const recentInvoices = invoices.slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      name: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      description: "from paid invoices",
    },
    {
      name: "Outstanding",
      value: formatCurrency(outstanding),
      icon: Clock,
      description: "pending invoices",
    },
    {
      name: "Invoices",
      value: invoiceCount.toString(),
      icon: Receipt,
      description: "total created",
    },
    {
      name: "Paid",
      value: paidCount.toString(),
      icon: FileText,
      description: "completed invoices",
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.full_name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-muted-foreground">
              Here's your business overview for {organization?.name || "your organization"}.
            </p>
          </div>
          <Button asChild>
            <Link to="/dashboard/invoices/new">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name} className="hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest invoice activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard/invoices">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No invoices yet</p>
                <Button className="mt-4" asChild>
                  <Link to="/dashboard/invoices/new">
                    <Plus className="h-4 w-4" />
                    Create Your First Invoice
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <Link
                    key={invoice.id}
                    to={`/dashboard/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors block"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Receipt className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {invoice.customer_name || invoice.customers?.name || "Walk-in Customer"}
                        </p>
                        <p className="text-xs text-muted-foreground">{invoice.invoice_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                          statusStyles[invoice.status as keyof typeof statusStyles]
                        )}
                      >
                        {invoice.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link to="/dashboard/invoices/new">
            <Card className="hover-lift cursor-pointer group h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent transition-colors">
                  <Plus className="h-6 w-6 text-accent group-hover:text-accent-foreground" />
                </div>
                <div>
                  <p className="font-semibold">New Invoice</p>
                  <p className="text-sm text-muted-foreground">Create a new invoice</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/dashboard/organization">
            <Card className="hover-lift cursor-pointer group h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10 group-hover:bg-success transition-colors">
                  <Receipt className="h-6 w-6 text-success group-hover:text-success-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Settings</p>
                  <p className="text-sm text-muted-foreground">Manage your business</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
