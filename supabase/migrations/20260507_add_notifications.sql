-- Migration : système de notifications (in-app + email)
-- Crée 3 tables : notifications, notification_deliveries, notification_preferences
-- + RLS pour que chaque utilisateur ne voie que ses notifications
-- + Activation Realtime sur notifications

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'support_reply',
    'support_ticket_resolved',
    'verification_approved',
    'verification_rejected',
    'circuit_sheet_deadline',
    'payment_received',
    'payment_failed',
    'subscription_paid',
    'subscription_expiring',
    'subscription_suspended',
    'low_stock_alert',
    'slow_order_alert',
    'new_invitation_accepted',
    'new_support_ticket',
    'new_verification_submitted',
    'new_subscription_payment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationPriority" AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- TABLE : notifications
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  type          "NotificationType" NOT NULL,
  priority      "NotificationPriority" NOT NULL DEFAULT 'normal',
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  action_url    TEXT,
  metadata      JSONB,
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications (user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_restaurant_idx
  ON notifications (restaurant_id);

CREATE INDEX IF NOT EXISTS notifications_type_idx
  ON notifications (type);

-- ============================================================
-- TABLE : notification_deliveries (suivi par canal)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel         "NotificationChannel" NOT NULL,
  status          TEXT NOT NULL,
  recipient       TEXT NOT NULL,
  error_message   TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notification_deliveries_notif_idx
  ON notification_deliveries (notification_id);

CREATE INDEX IF NOT EXISTS notification_deliveries_status_idx
  ON notification_deliveries (status);

-- ============================================================
-- TABLE : notification_preferences (par user × type)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  type       "NotificationType" NOT NULL,
  in_app     BOOLEAN NOT NULL DEFAULT TRUE,
  email      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS notification_preferences_user_idx
  ON notification_preferences (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences   ENABLE ROW LEVEL SECURITY;

-- notifications : un user lit/maj uniquement les siennes
DROP POLICY IF EXISTS notifications_select_own ON notifications;
CREATE POLICY notifications_select_own ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_update_own ON notifications;
CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- INSERT/DELETE réservés au service_role (server-side via Prisma admin)

-- notification_deliveries : lecture si on possède la notification associée
DROP POLICY IF EXISTS notification_deliveries_select_own ON notification_deliveries;
CREATE POLICY notification_deliveries_select_own ON notification_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = notification_deliveries.notification_id
        AND n.user_id = auth.uid()
    )
  );

-- notification_preferences : un user gère ses propres préférences
DROP POLICY IF EXISTS notification_preferences_select_own ON notification_preferences;
CREATE POLICY notification_preferences_select_own ON notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_insert_own ON notification_preferences;
CREATE POLICY notification_preferences_insert_own ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_update_own ON notification_preferences;
CREATE POLICY notification_preferences_update_own ON notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_delete_own ON notification_preferences;
CREATE POLICY notification_preferences_delete_own ON notification_preferences
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- REALTIME : activer le streaming des changements sur notifications
-- ============================================================

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
