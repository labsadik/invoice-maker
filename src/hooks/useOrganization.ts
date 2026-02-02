import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  gst_number: string | null;
  pan_number: string | null;
  logo_url: string | null;
  invoice_additional_info: string | null;
  invoice_terms: string | null;
  invoice_counter: number | null;
  created_at: string;
  updated_at: string;
}

export function useOrganization() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["organization", profile?.current_organization_id],
    queryFn: async () => {
      if (!profile?.current_organization_id) return null;

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.current_organization_id)
        .single();

      if (error) throw error;
      return data as unknown as Organization;
    },
    enabled: !!profile?.current_organization_id,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["organization", data.id] });
    },
  });
}
