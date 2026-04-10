// lib/utils/stats-labels.ts
// Labels français centralisés pour tous les enums liés aux statistiques

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
    stock_purchase: 'Achats marchandises',
    salary: 'Salaires',
    utilities: 'Charges fixes',
    transport: 'Transport',
    maintenance: 'Maintenance',
    marketing: 'Marketing',
    rent: 'Loyer',
    other: 'Autres',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: 'Espèces',
    mobile_money: 'Mobile Money',
    airtel_money: 'Airtel Money',
    moov_money: 'Moov Money',
    card: 'Carte bancaire',
}

export const ORDER_SOURCE_LABELS: Record<string, string> = {
    qr_table: 'QR Table',
    public_link: 'Lien public',
    dashboard: 'Dashboard',
    counter: 'Comptoir',
}

export const FULFILLMENT_TYPE_LABELS: Record<string, string> = {
    table: 'Sur place',
    takeway: 'À emporter', // note: typo conservé pour correspondre à l'enum Prisma
    delivery: 'Livraison',
    reservation: 'Réservation',
}

export const STOCK_MOVEMENT_TYPE_LABELS: Record<string, string> = {
    manual_in: 'Entrée manuelle',
    manual_out: 'Sortie manuelle',
    adjustment: 'Ajustement',
    order_out: 'Vente (commande)',
    sale_manual: 'Vente manuelle',
    purchase: 'Achat',
}

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
    0: 'Dim',
    1: 'Lun',
    2: 'Mar',
    3: 'Mer',
    4: 'Jeu',
    5: 'Ven',
    6: 'Sam',
}
