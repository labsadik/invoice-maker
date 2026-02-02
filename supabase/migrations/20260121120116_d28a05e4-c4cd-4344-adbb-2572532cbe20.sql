-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true);

-- Storage policies for org logos
CREATE POLICY "Anyone can view org logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

CREATE POLICY "Org members can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'org-logos' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Org members can update logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Org members can delete logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'org-logos' AND auth.uid() IS NOT NULL);