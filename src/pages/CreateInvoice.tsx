import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Trash2, 
  ArrowLeft,
  Save,
  Send,
  FileText,
  Loader2,
  User
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCreateInvoice, useUpdateInvoiceStatus } from "@/hooks/useInvoices";
import { useOrganization } from "@/hooks/useOrganization";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price must be positive"),
  taxRate: z.number().min(0).max(100),
});

const invoiceSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerAddress: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: organization } = useOrganization();
  const createInvoice = useCreateInvoice();
  const updateInvoiceStatus = useUpdateInvoiceStatus();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAddress: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 18 }],
      notes: "",
      terms: "",
    },
  });

  // Set default notes and terms from organization settings
  useEffect(() => {
    if (organization) {
      if (organization.invoice_additional_info) {
        setValue("notes", organization.invoice_additional_info);
      }
      if (organization.invoice_terms) {
        setValue("terms", organization.invoice_terms);
      }
    }
  }, [organization, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  const calculateItemAmount = (item: { quantity: number; unitPrice: number; taxRate: number }) => {
    const subtotal = item.quantity * item.unitPrice;
    const tax = subtotal * (item.taxRate / 100);
    return subtotal + tax;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let tax = 0;
    
    watchItems?.forEach((item) => {
      const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
      subtotal += itemSubtotal;
      tax += itemSubtotal * ((item.taxRate || 0) / 100);
    });

    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const onSubmit = async (data: InvoiceForm, action: "save" | "send") => {
    try {
      const invoice = await createInvoice.mutateAsync({
        invoice: {
          customer_name: data.customerName,
          customer_phone: data.customerPhone || null,
          customer_email: data.customerEmail || null,
          customer_address: data.customerAddress || null,
          issue_date: data.issueDate,
          due_date: data.dueDate,
          notes: data.notes,
          terms: data.terms,
        },
        items: data.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
        })),
      });

      if (action === "send" && invoice) {
        await updateInvoiceStatus.mutateAsync({
          id: invoice.id,
          status: "sent",
        });
        
        toast({
          title: "Invoice sent!",
          description: "The invoice has been created and marked as sent.",
        });
      } else {
        toast({
          title: "Invoice saved!",
          description: "The invoice has been saved as a draft.",
        });
      }
      navigate("/dashboard/invoices");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save the invoice. Please try again.",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Invoice</h1>
            <p className="text-muted-foreground">Fill in the details to create a new invoice</p>
          </div>
        </div>

        <form className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Details
              </CardTitle>
              <CardDescription>Enter the customer information for this invoice</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input 
                  {...register("customerName")} 
                  placeholder="Enter customer name"
                />
                {errors.customerName && (
                  <p className="text-xs text-destructive">{errors.customerName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input 
                  {...register("customerPhone")} 
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input 
                  type="email"
                  {...register("customerEmail")} 
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Input 
                  {...register("customerAddress")} 
                  placeholder="Enter address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input type="date" {...register("issueDate")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input type="date" {...register("dueDate")} />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxRate: 18 })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-4 p-4 rounded-lg border bg-muted/30"
                >
                  <div className="grid gap-4 sm:grid-cols-12">
                    <div className="sm:col-span-5 space-y-2">
                      <Label>Description</Label>
                      <Input
                        {...register(`items.${index}.description`)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        min={1}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                        min={0}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Tax (%)</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    Amount: {formatCurrency(calculateItemAmount({ 
                      quantity: watchItems?.[index]?.quantity ?? 0, 
                      unitPrice: watchItems?.[index]?.unitPrice ?? 0, 
                      taxRate: watchItems?.[index]?.taxRate ?? 0 
                    }))}
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes & Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Default notes are loaded from Organization Settings
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Add any notes for the customer..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  {...register("terms")}
                  placeholder="Payment terms, late fees, etc..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={createInvoice.isPending}
              onClick={handleSubmit((data) => onSubmit(data, "save"))}
            >
              {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save as Draft
            </Button>
            <Button
              type="button"
              disabled={createInvoice.isPending}
              onClick={handleSubmit((data) => onSubmit(data, "send"))}
            >
              {createInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4" />
              Create & Send
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
