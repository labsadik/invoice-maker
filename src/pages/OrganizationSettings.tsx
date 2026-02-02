import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, Building2, FileText, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

const orgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  gst_number: z.string().optional(),
  pan_number: z.string().optional(),
  invoice_additional_info: z.string().optional(),
  invoice_terms: z.string().optional(),
});

type OrgForm = z.infer<typeof orgSchema>;

export default function OrganizationSettings() {
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orgForm = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    values: organization ? {
      name: organization.name,
      email: organization.email || "",
      phone: organization.phone || "",
      address: organization.address || "",
      city: organization.city || "",
      state: organization.state || "",
      country: organization.country || "India",
      pincode: organization.pincode || "",
      gst_number: organization.gst_number || "",
      pan_number: organization.pan_number || "",
      invoice_additional_info: organization.invoice_additional_info || "",
      invoice_terms: organization.invoice_terms || "",
    } : undefined,
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${organization.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("org-logos")
        .getPublicUrl(fileName);

      await updateOrganization.mutateAsync({
        id: organization.id,
        updates: { logo_url: publicUrl },
      });

      toast({
        title: "Logo updated",
        description: "Your organization logo has been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onOrgSubmit = async (data: OrgForm) => {
    if (!organization) return;

    try {
      await updateOrganization.mutateAsync({
        id: organization.id,
        updates: data,
      });

      toast({
        title: "Settings saved",
        description: "Your organization details have been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: error.message,
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

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organization Settings</h1>
          <p className="text-muted-foreground">Manage your business details</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <FileText className="h-4 w-4" />
              Billing Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <form onSubmit={orgForm.handleSubmit(onOrgSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>
                    This information will appear on your invoices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={organization?.logo_url || ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {organization?.name?.charAt(0) || "O"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Upload Logo
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Business Name *</Label>
                      <Input {...orgForm.register("name")} />
                      {orgForm.formState.errors.name && (
                        <p className="text-xs text-destructive">
                          {orgForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input type="email" {...orgForm.register("email")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input {...orgForm.register("phone")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input {...orgForm.register("country")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea {...orgForm.register("address")} rows={2} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input {...orgForm.register("city")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input {...orgForm.register("state")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode">PIN Code</Label>
                      <Input {...orgForm.register("pincode")} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateOrganization.isPending}>
                      {updateOrganization.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="billing">
            <form onSubmit={orgForm.handleSubmit(onOrgSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>Tax & Billing Information</CardTitle>
                  <CardDescription>
                    GST and PAN details for tax compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gst_number">GST Number</Label>
                      <Input
                        {...orgForm.register("gst_number")}
                        placeholder="22AAAAA0000A1Z5"
                      />
                      <p className="text-xs text-muted-foreground">
                        15-digit GST Identification Number
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pan_number">PAN Number</Label>
                      <Input
                        {...orgForm.register("pan_number")}
                        placeholder="AAAAA0000A"
                      />
                      <p className="text-xs text-muted-foreground">
                        10-digit Permanent Account Number
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoice_additional_info">Default Invoice Notes</Label>
                    <Textarea
                      {...orgForm.register("invoice_additional_info")}
                      placeholder="Enter default notes that will appear on all invoices..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      This text will be pre-filled in the notes section when creating new invoices
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoice_terms">Default Terms & Conditions</Label>
                    <Textarea
                      {...orgForm.register("invoice_terms")}
                      placeholder="Enter default terms & conditions that will appear on all invoices..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      This text will be pre-filled in the terms section when creating new invoices
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateOrganization.isPending}>
                      {updateOrganization.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
