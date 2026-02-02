import { forwardRef } from "react";
import { Invoice, InvoiceItem } from "@/hooks/useInvoices";

interface Organization {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  logo_url?: string | null;
  invoice_additional_info?: string | null;
  invoice_terms?: string | null;
}

interface InvoicePDFProps {
  invoice: Invoice & { invoice_items?: InvoiceItem[] };
  organization: Organization;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
}

export const InvoicePDF = forwardRef<HTMLDivElement, InvoicePDFProps>(
  ({ invoice, organization, customerName, customerPhone, customerEmail, customerAddress }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const displayCustomerName = customerName || invoice.customer_name || invoice.customers?.name || "Walk-in Customer";
    const displayCustomerPhone = customerPhone || invoice.customer_phone;
    const displayCustomerEmail = customerEmail || invoice.customer_email || invoice.customers?.email;
    const displayCustomerAddress = customerAddress || invoice.customer_address;
    const displayNotes = invoice.notes || organization.invoice_additional_info;
    const displayTerms = invoice.terms || organization.invoice_terms;

    const items = invoice.invoice_items || [];
    const orgAddress = [organization.address, organization.city, organization.state, organization.pincode]
      .filter(Boolean)
      .join(", ");

    return (
      <div
        ref={ref}
        id="invoice-print-area"
        style={{ 
          fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          width: "210mm",
          minHeight: "297mm",
          backgroundColor: "#ffffff",
          color: "#1a1a1a",
          padding: "12mm 15mm",
          boxSizing: "border-box",
        }}
      >
        {/* Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", paddingBottom: "15px", borderBottom: "2px solid #2563eb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                style={{ height: "50px", width: "50px", objectFit: "contain", borderRadius: "6px" }}
              />
            ) : (
              <div style={{ 
                height: "50px", 
                width: "50px", 
                backgroundColor: "#2563eb", 
                borderRadius: "6px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                color: "#ffffff", 
                fontSize: "24px", 
                fontWeight: "bold" 
              }}>
                {organization.name?.charAt(0) || "O"}
              </div>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#1a1a1a" }}>
                {organization.name}
              </h1>
              {orgAddress && (
                <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#6b7280" }}>{orgAddress}</p>
              )}
              <div style={{ display: "flex", gap: "12px", marginTop: "2px", fontSize: "10px", color: "#6b7280" }}>
                {organization.phone && <span>📞 {organization.phone}</span>}
                {organization.email && <span>✉ {organization.email}</span>}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#2563eb", letterSpacing: "2px" }}>
              INVOICE
            </h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: "600", color: "#374151" }}>
              {invoice.invoice_number}
            </p>
          </div>
        </div>

        {/* Billing Info & Invoice Meta */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          {/* From */}
          <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", borderLeft: "3px solid #2563eb" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "10px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              From
            </h3>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#1a1a1a" }}>{organization.name}</p>
            {organization.gst_number && (
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>GSTIN: {organization.gst_number}</p>
            )}
            {organization.pan_number && (
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>PAN: {organization.pan_number}</p>
            )}
          </div>

          {/* Bill To */}
          <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", borderLeft: "3px solid #10b981" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "10px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Bill To
            </h3>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#1a1a1a" }}>{displayCustomerName}</p>
            {displayCustomerPhone && (
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>📞 {displayCustomerPhone}</p>
            )}
            {displayCustomerEmail && (
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>✉ {displayCustomerEmail}</p>
            )}
            {displayCustomerAddress && (
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>{displayCustomerAddress}</p>
            )}
          </div>

          {/* Invoice Details */}
          <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px" }}>
            <table style={{ width: "100%", fontSize: "10px", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "3px 0", color: "#6b7280" }}>Issue Date:</td>
                  <td style={{ padding: "3px 0", fontWeight: "600", textAlign: "right" }}>{formatDate(invoice.issue_date)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 0", color: "#6b7280" }}>Due Date:</td>
                  <td style={{ padding: "3px 0", fontWeight: "600", textAlign: "right" }}>{formatDate(invoice.due_date)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "3px 0", color: "#6b7280" }}>Status:</td>
                  <td style={{ padding: "3px 0", fontWeight: "600", textAlign: "right", textTransform: "capitalize" }}>
                    <span style={{ 
                      backgroundColor: invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'overdue' ? '#fee2e2' : '#fef3c7',
                      color: invoice.status === 'paid' ? '#166534' : invoice.status === 'overdue' ? '#991b1b' : '#92400e',
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "9px"
                    }}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Products Table */}
        <div style={{ marginBottom: "15px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#1e3a5f" }}>
                <th style={{ padding: "10px 8px", textAlign: "left", color: "#ffffff", fontWeight: "600", fontSize: "9px", width: "30px" }}>#</th>
                <th style={{ padding: "10px 8px", textAlign: "left", color: "#ffffff", fontWeight: "600", fontSize: "9px" }}>PRODUCT / SERVICE</th>
                <th style={{ padding: "10px 8px", textAlign: "center", color: "#ffffff", fontWeight: "600", fontSize: "9px", width: "50px" }}>QTY</th>
                <th style={{ padding: "10px 8px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "9px", width: "80px" }}>RATE</th>
                <th style={{ padding: "10px 8px", textAlign: "center", color: "#ffffff", fontWeight: "600", fontSize: "9px", width: "50px" }}>TAX %</th>
                <th style={{ padding: "10px 8px", textAlign: "right", color: "#ffffff", fontWeight: "600", fontSize: "9px", width: "90px" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id || index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "8px", color: "#6b7280", fontSize: "9px" }}>{index + 1}</td>
                  <td style={{ padding: "8px", fontWeight: "500", color: "#1a1a1a", fontSize: "10px" }}>{item.description}</td>
                  <td style={{ padding: "8px", textAlign: "center", color: "#374151", fontSize: "10px" }}>{item.quantity}</td>
                  <td style={{ padding: "8px", textAlign: "right", color: "#374151", fontSize: "10px" }}>{formatCurrency(item.unit_price)}</td>
                  <td style={{ padding: "8px", textAlign: "center", color: "#374151", fontSize: "10px" }}>{item.tax_rate || 0}%</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: "600", color: "#1a1a1a", fontSize: "10px" }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "15px" }}>
          <div style={{ width: "250px" }}>
            <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "6px 0", color: "#6b7280" }}>Subtotal</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "500" }}>{formatCurrency(invoice.subtotal)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "6px 0", color: "#6b7280" }}>Tax</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "500" }}>{formatCurrency(invoice.tax_amount)}</td>
                </tr>
                {invoice.discount_amount > 0 && (
                  <tr>
                    <td style={{ padding: "6px 0", color: "#6b7280" }}>Discount</td>
                    <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "500", color: "#dc2626" }}>-{formatCurrency(invoice.discount_amount)}</td>
                  </tr>
                )}
                <tr style={{ borderTop: "2px solid #1e3a5f" }}>
                  <td style={{ padding: "10px 0", fontSize: "14px", fontWeight: "700", color: "#1a1a1a" }}>TOTAL</td>
                  <td style={{ padding: "10px 0", textAlign: "right", fontSize: "16px", fontWeight: "800", color: "#2563eb" }}>
                    {formatCurrency(invoice.total_amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Terms */}
        {(displayNotes || displayTerms) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px", paddingTop: "10px", borderTop: "1px solid #e5e7eb" }}>
            {displayNotes && (
              <div>
                <h4 style={{ margin: "0 0 5px 0", fontSize: "10px", fontWeight: "600", color: "#374151", textTransform: "uppercase" }}>Notes</h4>
                <p style={{ margin: 0, fontSize: "9px", color: "#6b7280", whiteSpace: "pre-wrap", lineHeight: "1.4" }}>{displayNotes}</p>
              </div>
            )}
            {displayTerms && (
              <div>
                <h4 style={{ margin: "0 0 5px 0", fontSize: "10px", fontWeight: "600", color: "#374151", textTransform: "uppercase" }}>Terms & Conditions</h4>
                <p style={{ margin: 0, fontSize: "9px", color: "#6b7280", whiteSpace: "pre-wrap", lineHeight: "1.4" }}>{displayTerms}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ 
          marginTop: "auto", 
          paddingTop: "10px", 
          borderTop: "1px solid #e5e7eb", 
          textAlign: "center" 
        }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: "#374151" }}>
            Thank you for your business!
          </p>
          <p style={{ margin: "3px 0 0 0", fontSize: "9px", color: "#9ca3af" }}>
            This is a computer-generated invoice. No signature required.
          </p>
        </div>
      </div>
    );
  }
);

InvoicePDF.displayName = "InvoicePDF";
