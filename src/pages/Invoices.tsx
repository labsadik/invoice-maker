import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Send,
  Download,
  Loader2,
  FileText
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useInvoices, useDeleteInvoice, useUpdateInvoiceStatus, Invoice } from "@/hooks/useInvoices";

const statusStyles = {
  paid: { bg: "bg-success/10", text: "text-success", label: "Paid" },
  pending: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  sent: { bg: "bg-accent/10", text: "text-accent", label: "Sent" },
  overdue: { bg: "bg-destructive/10", text: "text-destructive", label: "Overdue" },
  draft: { bg: "bg-muted", text: "text-muted-foreground", label: "Draft" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground", label: "Cancelled" },
};

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  
  const { data: invoices = [], isLoading } = useInvoices();
  const deleteInvoice = useDeleteInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const { toast } = useToast();

  const filteredInvoices = invoices.filter((invoice) => {
    const customerName = invoice.customer_name || invoice.customers?.name || "";
    const matchesSearch = 
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async () => {
    if (!deletingInvoice) return;
    
    try {
      await deleteInvoice.mutateAsync(deletingInvoice.id);
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted.",
      });
      setDeletingInvoice(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: "paid" });
      toast({
        title: "Invoice updated",
        description: "Invoice marked as paid.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
            <p className="text-muted-foreground">Manage and track all your invoices</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/dashboard/invoices/new">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Invoices ({filteredInvoices.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-lg">No invoices yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Create your first invoice to get started
                </p>
                <Button variant="hero" asChild>
                  <Link to="/dashboard/invoices/new">
                    <Plus className="h-4 w-4" />
                    Create Invoice
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Invoice</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Customer</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground hidden md:table-cell">Date</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground hidden lg:table-cell">Due Date</th>
                      <th className="text-right p-4 font-medium text-sm text-muted-foreground">Amount</th>
                      <th className="text-left p-4 font-medium text-sm text-muted-foreground">Status</th>
                      <th className="text-right p-4 font-medium text-sm text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => {
                      const status = statusStyles[invoice.status as keyof typeof statusStyles] || statusStyles.draft;
                      return (
                        <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <span className="font-medium text-primary">{invoice.invoice_number}</span>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{invoice.customer_name || invoice.customers?.name || "Walk-in Customer"}</p>
                              <p className="text-sm text-muted-foreground">{invoice.customer_email || invoice.customers?.email || "—"}</p>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-muted-foreground">
                            {new Date(invoice.issue_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="p-4 hidden lg:table-cell text-muted-foreground">
                            {new Date(invoice.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                          <td className="p-4 text-right font-semibold">
                            {formatCurrency(invoice.total_amount)}
                          </td>
                          <td className="p-4">
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", status.bg, status.text)}>
                              {status.label}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/dashboard/invoices/${invoice.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/dashboard/invoices/${invoice.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                {invoice.status !== "paid" && (
                                  <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => setDeletingInvoice(invoice)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingInvoice} onOpenChange={() => setDeletingInvoice(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deletingInvoice?.invoice_number}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
