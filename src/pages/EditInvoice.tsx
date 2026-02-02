import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Plus, 
  Trash2, 
  ArrowLeft,
  Save,
  Loader2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useInvoiceDetail, useUpdateInvoice } from "@/hooks/useInvoices";

const invoiceItemSchema = z.object({
  id: z.string().optional(),
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
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

export default function EditInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: invoice, isLoading } = useInvoiceDetail(id || "");
  const updateInvoice = useUpdateInvoice();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [{ description: "", quantity: 1, unitPrice: 0, taxRate: 18 }],
    },
  });

  // Populate form when invoice data loads
  useEffect(() => {
    if (invoice) {
      reset({
        customerName: invoice.customer_name || invoice.customers?.name || "",
        customerPhone: invoice.customer_phone || "",
        customerEmail: invoice.customer_email || invoice.customers?.email || "",
        customerAddress: invoice.customer_address || "",
        invoiceNumber: invoice.invoice_number,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        items: invoice.invoice_items?.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          taxRate: item.tax_rate || 0,
        })) || [{ description: "", quantity: 1, unitPrice: 0, taxRate: 18 }],
        notes: invoice.notes || "",
        terms: invoice.terms || "",
      });
    }
  }, [invoice, reset]);

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

    return { subtotal, tax, total: subtotal + tax };
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const onSubmit = async (data: InvoiceForm) => {
    if (!invoice) return;

    try {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        invoice: {
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          customer_email: data.customerEmail,
          customer_address: data.customerAddress,
          issue_date: data.issueDate,
          due_date: data.dueDate,
          notes: data.notes,
          terms: data.terms,
        },
        items: data.items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.taxRate,
        })),
      });

      toast({
        title: "Invoice updated",
        description: "The invoice has been updated successfully.",
      });

      navigate(`/dashboard/invoices/${invoice.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update the invoice.",
      });
    }
  };

  if (isLoading) {
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
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Invoice not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Invoice</h1>
            <p className="text-muted-foreground">Update invoice {invoice.invoice_number}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input {...register("customerName")} placeholder="Enter customer name" />
                {errors.customerName && (
                  <p className="text-xs text-destructive">{errors.customerName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input {...register("customerPhone")} placeholder="+91 9876543210" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" {...register("customerEmail")} placeholder="customer@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...register("customerAddress")} placeholder="Customer address" />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
                <Input {...register("invoiceNumber")} />
              </div>
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input type="date" {...register("issueDate")} />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
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
                <div key={field.id} className="grid gap-4 p-4 rounded-lg border bg-muted/30">
                  <div className="grid gap-4 sm:grid-cols-12">
                    <div className="sm:col-span-5 space-y-2">
                      <Label>Description</Label>
                      <Input {...register(`items.${index}.description`)} placeholder="Item description" />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Qty</Label>
                      <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} min={1} />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Price (₹)</Label>
                      <Input type="number" {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} min={0} />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label>Tax (%)</Label>
                      <Input type="number" {...register(`items.${index}.taxRate`, { valueAsNumber: true })} min={0} max={100} />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    Amount: {formatCurrency(calculateItemAmount({
                      quantity: watchItems?.[index]?.quantity ?? 0,
                      unitPrice: watchItems?.[index]?.unitPrice ?? 0,
                      taxRate: watchItems?.[index]?.taxRate ?? 0,
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
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea {...register("notes")} placeholder="Add any notes for the customer..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea {...register("terms")} placeholder="Payment terms, late fees, etc..." rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={updateInvoice.isPending}>
              {updateInvoice.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
