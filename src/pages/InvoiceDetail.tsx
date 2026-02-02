import { useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  Send, 
  Edit, 
  Loader2,
  Printer
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useInvoiceDetail, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { useOrganization } from "@/hooks/useOrganization";
import { InvoicePDF } from "@/components/invoice/InvoicePDF";
import { cn } from "@/lib/utils";

const statusStyles = {
  paid: { bg: "bg-success/10", text: "text-success", label: "Paid" },
  pending: { bg: "bg-warning/10", text: "text-warning", label: "Pending" },
  sent: { bg: "bg-accent/10", text: "text-accent", label: "Sent" },
  overdue: { bg: "bg-destructive/10", text: "text-destructive", label: "Overdue" },
  draft: { bg: "bg-muted", text: "text-muted-foreground", label: "Draft" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground", label: "Cancelled" },
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const { data: invoice, isLoading: invoiceLoading } = useInvoiceDetail(id || "");
  const { data: organization } = useOrganization();
  const updateStatus = useUpdateInvoiceStatus();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    toast({ title: "Generating PDF...", description: "Please wait." });
    
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    
    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Fit to single page
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    const xOffset = (pdfWidth - finalWidth) / 2;
    
    pdf.addImage(imgData, "PNG", xOffset, 0, finalWidth, finalHeight);
    pdf.save(`${invoice?.invoice_number || "invoice"}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Invoice has been downloaded successfully.",
    });
  };

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Print blocked",
        description: "Please allow pop-ups to print the invoice.",
      });
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${invoice?.invoice_number || "Invoice"} - Print</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                size: A4;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  }, [invoice?.invoice_number, toast]);

  const handleMarkAsSent = async () => {
    if (!invoice) return;
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: "sent" });
      toast({ title: "Invoice sent", description: "Invoice marked as sent." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: "paid" });
      toast({ title: "Invoice paid", description: "Invoice marked as paid." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  if (invoiceLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Invoice not found</h2>
          <Button asChild className="mt-4">
            <Link to="/dashboard/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusStyles[invoice.status as keyof typeof statusStyles] || statusStyles.draft;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{invoice.invoice_number}</h1>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", status.bg, status.text)}>
                  {status.label}
                </span>
              </div>
              <p className="text-muted-foreground">
                {invoice.customer_name || invoice.customers?.name || "Walk-in Customer"} • {formatCurrency(invoice.total_amount)}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to={`/dashboard/invoices/${invoice.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            {invoice.status === "draft" && (
              <Button variant="secondary" onClick={handleMarkAsSent} disabled={updateStatus.isPending}>
                {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4" />
                Mark as Sent
              </Button>
            )}
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <Button onClick={handleMarkAsPaid} disabled={updateStatus.isPending}>
                {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Mark as Paid
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Preview Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Preview</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto bg-muted/30 p-4 rounded-lg">
            {organization && (
              <div className="mx-auto shadow-lg">
                <InvoicePDF
                  ref={printRef}
                  invoice={invoice}
                  organization={organization}
                  customerName={invoice.customer_name || invoice.customers?.name}
                  customerPhone={invoice.customer_phone || undefined}
                  customerEmail={invoice.customer_email || invoice.customers?.email || undefined}
                  customerAddress={invoice.customer_address || undefined}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
