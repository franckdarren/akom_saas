-- Migration : Index manquants (IDX-01 à IDX-07)
-- À appliquer via le dashboard Supabase ou psql
-- Ces index correspondent aux @@index ajoutés dans schema.prisma

-- IDX-01 : Category
CREATE INDEX IF NOT EXISTS "categories_restaurant_id_idx"
    ON categories (restaurant_id);

CREATE INDEX IF NOT EXISTS "categories_restaurant_id_is_active_idx"
    ON categories (restaurant_id, is_active);

CREATE INDEX IF NOT EXISTS "categories_restaurant_id_position_idx"
    ON categories (restaurant_id, position);

-- IDX-02 : RestaurantUser — restaurantId
CREATE INDEX IF NOT EXISTS "restaurant_users_restaurant_id_idx"
    ON restaurant_users (restaurant_id);

-- IDX-03 : OrderItem — productId
CREATE INDEX IF NOT EXISTS "order_items_product_id_idx"
    ON order_items (product_id);

-- IDX-04 : Payment — index composites
CREATE INDEX IF NOT EXISTS "payments_restaurant_id_status_idx"
    ON payments (restaurant_id, status);

CREATE INDEX IF NOT EXISTS "payments_restaurant_id_created_at_idx"
    ON payments (restaurant_id, created_at DESC);

-- IDX-05 : ManualRevenue — revenueDate
CREATE INDEX IF NOT EXISTS "manual_revenues_restaurant_id_revenue_date_idx"
    ON manual_revenues (restaurant_id, revenue_date);

-- IDX-05 : Expense — expenseDate
CREATE INDEX IF NOT EXISTS "expenses_restaurant_id_expense_date_idx"
    ON expenses (restaurant_id, expense_date);

-- IDX-06 : WarehouseMovement — remplacer l'index seul sur created_at
DROP INDEX IF EXISTS "warehouse_movements_created_at_idx";
CREATE INDEX IF NOT EXISTS "warehouse_movements_restaurant_id_created_at_idx"
    ON warehouse_movements (restaurant_id, created_at DESC);

-- IDX-07 : CashSession — status
CREATE INDEX IF NOT EXISTS "cash_sessions_restaurant_id_status_idx"
    ON cash_sessions (restaurant_id, status);
