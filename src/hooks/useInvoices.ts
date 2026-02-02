import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useAuth } from "./useAuth";

export interface Invoice {
  id: string;
  organization_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  qr_code_data: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    email: string | null;
  } | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
  created_at: string;
}

export function useInvoices() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["invoices", profile?.current_organization_id],
    queryFn: async () => {
      if (!profile?.current_organization_id) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customers (
            name,
            email
          )
        `)
        .eq("organization_id", profile.current_organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invoice[];
    },
    enabled: !!profile?.current_organization_id,
  });
}

export function useInvoiceDetail(id: string) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(`
          *,
          customers (
            name,
            email
          )
        `)
        .eq("id", id)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", id)
        .order("created_at", { ascending: true });

      if (itemsError) throw itemsError;

      return {
        ...invoice,
        invoice_items: items,
      } as Invoice & { invoice_items: InvoiceItem[] };
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      invoice,
      items,
    }: {
      invoice: {
        customer_id?: string | null;
        customer_name?: string | null;
        customer_phone?: string | null;
        customer_email?: string | null;
        customer_address?: string | null;
        issue_date: string;
        due_date: string;
        notes?: string | null;
        terms?: string | null;
      };
      items: {
        description: string;
        quantity: number;
        unit_price: number;
        tax_rate: number;
      }[];
    }) => {
      if (!profile?.current_organization_id) throw new Error("No organization");
      if (!user?.id) throw new Error("Not authenticated");

      // Get next invoice number using database function
      const { data: invoiceNumber, error: numError } = await supabase
        .rpc("get_next_invoice_number", { org_id: profile.current_organization_id });

      if (numError) throw numError;

      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;
      
      const itemsWithAmounts = items.map((item) => {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemTax = itemSubtotal * (item.tax_rate / 100);
        subtotal += itemSubtotal;
        taxAmount += itemTax;
        return {
          ...item,
          amount: itemSubtotal + itemTax,
        };
      });

      const totalAmount = subtotal + taxAmount;

      // Create invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          organization_id: profile.current_organization_id,
          customer_id: invoice.customer_id || null,
          customer_name: invoice.customer_name || null,
          customer_phone: invoice.customer_phone || null,
          customer_email: invoice.customer_email || null,
          customer_address: invoice.customer_address || null,
          invoice_number: invoiceNumber,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          notes: invoice.notes || null,
          terms: invoice.terms || null,
          created_by: user.id,
          status: "draft",
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(
          itemsWithAmounts.map((item) => ({
            invoice_id: invoiceData.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            amount: item.amount,
          }))
        );

      if (itemsError) throw itemsError;

      return invoiceData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      invoice,
      items,
    }: {
      id: string;
      invoice: {
        customer_name?: string | null;
        customer_phone?: string | null;
        customer_email?: string | null;
        customer_address?: string | null;
        issue_date?: string;
        due_date?: string;
        notes?: string | null;
        terms?: string | null;
      };
      items: {
        id?: string;
        description: string;
        quantity: number;
        unit_price: number;
        tax_rate: number;
      }[];
    }) => {
      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;
      
      const itemsWithAmounts = items.map((item) => {
        const itemSubtotal = item.quantity * item.unit_price;
        const itemTax = itemSubtotal * (item.tax_rate / 100);
        subtotal += itemSubtotal;
        taxAmount += itemTax;
        return {
          ...item,
          amount: itemSubtotal + itemTax,
        };
      });

      const totalAmount = subtotal + taxAmount;

      // Update invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .update({
          ...invoice,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
        })
        .eq("id", id)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Delete existing items and re-insert
      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", id);

      if (deleteError) throw deleteError;

      // Create new invoice items
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(
          itemsWithAmounts.map((item) => ({
            invoice_id: id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            amount: item.amount,
          }))
        );

      if (itemsError) throw itemsError;

      return invoiceData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.id] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Invoice["status"];
    }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", variables.id] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
