-- ============================================================
-- MIGRATION : Ajouter le système d'invitations
-- Date : 2025-02-02
-- Description : Système d'invitation d'utilisateurs avec rôles personnalisés
-- ============================================================
-- Créer l'enum pour les statuts d'invitation
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
-- Créer la table invitations
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL,
    -- Référence au rôle personnalisé
    token VARCHAR(255) UNIQUE NOT NULL,
    status invitation_status NOT NULL DEFAULT 'pending',
    invited_by UUID NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    -- Contraintes de clé étrangère
    CONSTRAINT fk_invitations_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
    CONSTRAINT fk_invitations_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
-- Créer les index pour optimiser les requêtes
CREATE INDEX idx_invitations_restaurant_status ON invitations(restaurant_id, status);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_role ON invitations(role_id);
-- Activer RLS sur la table invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
-- ============================================================
-- POLICIES RLS
-- ============================================================
-- Policy : Les utilisateurs peuvent voir les invitations de leurs restaurants
CREATE POLICY "Users can view restaurant invitations" ON invitations FOR
SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id
            FROM restaurant_users
            WHERE user_id = auth.uid()
        )
    );
-- Policy : Seuls les utilisateurs avec permission peuvent créer des invitations
CREATE POLICY "Users with permission can create invitations" ON invitations FOR
INSERT WITH CHECK (
        restaurant_id IN (
            SELECT ru.restaurant_id
            FROM restaurant_users ru
                INNER JOIN role_permissions rp ON ru.role_id = rp.role_id
                INNER JOIN permissions p ON rp.permission_id = p.id
            WHERE ru.user_id = auth.uid()
                AND p.resource = 'users'
                AND p.action = 'create'
        )
    );
-- Policy : Seuls les utilisateurs avec permission peuvent mettre à jour les invitations
CREATE POLICY "Users with permission can update invitations" ON invitations FOR
UPDATE USING (
        restaurant_id IN (
            SELECT ru.restaurant_id
            FROM restaurant_users ru
                INNER JOIN role_permissions rp ON ru.role_id = rp.role_id
                INNER JOIN permissions p ON rp.permission_id = p.id
            WHERE ru.user_id = auth.uid()
                AND p.resource = 'users'
                AND p.action = 'update'
        )
    );
-- Policy : Seuls les utilisateurs avec permission peuvent supprimer les invitations
CREATE POLICY "Users with permission can delete invitations" ON invitations FOR DELETE USING (
    restaurant_id IN (
        SELECT ru.restaurant_id
        FROM restaurant_users ru
            INNER JOIN role_permissions rp ON ru.role_id = rp.role_id
            INNER JOIN permissions p ON rp.permission_id = p.id
        WHERE ru.user_id = auth.uid()
            AND p.resource = 'users'
            AND p.action = 'delete'
    )
);
-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_invitations_updated_at BEFORE
UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Fonction pour marquer automatiquement les invitations expirées
-- (peut être appelée par un cron job ou manuellement)
CREATE OR REPLACE FUNCTION mark_expired_invitations() RETURNS INTEGER AS $$
DECLARE updated_count INTEGER;
BEGIN
UPDATE invitations
SET status = 'expired',
    updated_at = NOW()
WHERE status = 'pending'
    AND expires_at < NOW();
GET DIAGNOSTICS updated_count = ROW_COUNT;
RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
-- Commentaires pour documentation
COMMENT ON TABLE invitations IS 'Stocke les invitations envoyées aux utilisateurs pour rejoindre un restaurant avec un rôle spécifique';
COMMENT ON COLUMN invitations.token IS 'Token unique utilisé dans le lien d''invitation (64 caractères hexadécimaux)';
COMMENT ON COLUMN invitations.role_id IS 'Référence au rôle personnalisé qui sera attribué à l''utilisateur';
COMMENT ON COLUMN invitations.expires_at IS 'Date d''expiration de l''invitation (7 jours après création)';
COMMENT ON COLUMN invitations.invited_by IS 'ID de l''utilisateur qui a envoyé l''invitation';
-- Vérification que la migration s'est bien passée
DO $$ BEGIN RAISE NOTICE '✅ Table invitations créée avec succès';
RAISE NOTICE '✅ 4 index créés';
RAISE NOTICE '✅ 4 policies RLS activées';
RAISE NOTICE '✅ 1 trigger configuré';
RAISE NOTICE '✅ Migration terminée !';
END $$;