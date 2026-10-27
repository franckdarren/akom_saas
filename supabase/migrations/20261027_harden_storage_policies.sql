-- ============================================================
-- Durcissement des policies Storage
-- ============================================================
-- Problèmes corrigés (état décrit par scripts/deploy-fresh-database.sql) :
--   * verification-documents : bucket PUBLIC + SELECT sans rôle → pièces d'identité
--     et photos des gérants lisibles et listables sans être connecté.
--   * identity-documents / circuit-sheets : tout utilisateur connecté lisait
--     les fichiers de toutes les structures.
--   * restaurant-covers / restaurant-logos : UPDATE/DELETE ouverts à tous, y compris anon.
--   * products / payment-proofs : DELETE ouvert à tout utilisateur connecté.
--   * SELECT public sur les buckets publics → listage anonyme de tous les fichiers.
--   * Aucun type MIME imposé → upload possible de HTML/SVG servi depuis le domaine Supabase.
--
-- Comportement applicatif conservé :
--   * Les buckets publics restent publics : les URLs getPublicUrl() déjà stockées
--     continuent de fonctionner (le service public ne passe pas par les policies).
--   * Les uploads de l'app utilisent upsert: false → seul INSERT est nécessaire.
--   * verification-documents utilise upsert: true → SELECT + INSERT + UPDATE,
--     restreints aux membres de la structure (chemin "<restaurantId>/...").
--   * Le superadmin lit verification-documents via service_role (URLs signées),
--     qui contourne les policies.
--   * identity-documents et circuit-sheets ne sont utilisés par aucun code :
--     accès service_role uniquement.
--
-- À exécuter manuellement dans l'éditeur SQL Supabase.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Helper : l'utilisateur est-il membre de la structure du 1er dossier du chemin ?
-- Vérifie le format UUID avant le cast (l'ordre d'évaluation d'un AND SQL
-- n'est pas garanti, d'où la fonction plpgsql).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_member_of_storage_folder(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    folder TEXT := (storage.foldername(object_name))[1];
BEGIN
    IF folder IS NULL OR folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RETURN FALSE;
    END IF;
    RETURN public.is_restaurant_member(folder::UUID);
END;
$$;

REVOKE ALL ON FUNCTION public.is_member_of_storage_folder(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_storage_folder(TEXT) TO authenticated;

-- ------------------------------------------------------------
-- Buckets : visibilité, taille, types MIME
-- ------------------------------------------------------------
UPDATE storage.buckets
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'verification-documents';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id IN ('products', 'restaurant-covers', 'restaurant-logos', 'restaurant-profiles');

UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
WHERE id = 'payment-proofs';

-- ------------------------------------------------------------
-- Suppression des policies permissives
-- ------------------------------------------------------------
-- restaurant-covers
DROP POLICY IF EXISTS "Public read access"                    ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view covers"                ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete covers" ON storage.objects;
-- restaurant-logos
DROP POLICY IF EXISTS "Anyone can view logos"                 ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos"  ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos"  ON storage.objects;
-- products
DROP POLICY IF EXISTS "Public access to product images"       ON storage.objects;
DROP POLICY IF EXISTS "Public read access for products"       ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own products"   ON storage.objects;
-- payment-proofs
DROP POLICY IF EXISTS "Public read access for payment-proofs"             ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own payment proofs" ON storage.objects;
-- restaurant-profiles
DROP POLICY IF EXISTS "Public can view restaurant profiles"   ON storage.objects;
-- verification-documents
DROP POLICY IF EXISTS "Authenticated users can read verification docs"   ON storage.objects;
DROP POLICY IF EXISTS "Read verification docs"                           ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Upload verification docs"                         ON storage.objects;
DROP POLICY IF EXISTS "Update verification docs"                         ON storage.objects;
-- circuit-sheets / identity-documents (non utilisés par le code)
DROP POLICY IF EXISTS "Only restaurant admin can upload circuit sheets"     ON storage.objects;
DROP POLICY IF EXISTS "Only restaurant admin can view their circuit sheets" ON storage.objects;
DROP POLICY IF EXISTS "Only restaurant admin can upload identity docs"      ON storage.objects;
DROP POLICY IF EXISTS "Only restaurant admin can view their identity docs"  ON storage.objects;

-- Les policies INSERT "Authenticated users can upload ..." des buckets publics
-- (covers, logos, products, payment-proofs, profiles) sont conservées.

-- ------------------------------------------------------------
-- verification-documents : membres de la structure uniquement
-- ------------------------------------------------------------
CREATE POLICY "Members read own verification docs" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'verification-documents' AND public.is_member_of_storage_folder(name));

CREATE POLICY "Members upload own verification docs" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'verification-documents' AND public.is_member_of_storage_folder(name));

CREATE POLICY "Members update own verification docs" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'verification-documents' AND public.is_member_of_storage_folder(name))
    WITH CHECK (bucket_id = 'verification-documents' AND public.is_member_of_storage_folder(name));

COMMIT;

-- ------------------------------------------------------------
-- Vérification après exécution : les policies encore présentes.
-- Toute policy listée ici et absente de ce script vient d'ailleurs
-- (nom différent en base) et doit être examinée.
-- ------------------------------------------------------------
-- SELECT policyname, cmd, roles, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- ORDER BY policyname;
