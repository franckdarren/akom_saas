// scripts/seed-demo.ts
// Seeder de données de démo pour le restaurant ae177e91-e64d-410f-8673-e1b632d021a5
// Génère 90 jours d'historique réaliste (commandes, sessions caisse, stocks, paiements)
//
// Exécution : npx tsx scripts/seed-demo.ts

import 'dotenv/config'
import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  OrderSource,
  FulfillmentType,
  ExpenseCategory,
  StockMovementType,
} from '@prisma/client'

const RESTAURANT_ID = 'ae177e91-e64d-410f-8673-e1b632d021a5'
const USER_ID = '37f580f7-a299-4c85-b52f-d7c1d0b491c4'
const SEED_START = new Date('2026-01-09T00:00:00.000Z') // J-90
const DAYS = 90

// ============================================================
// PRNG déterministe (LCG) — même seed → mêmes données
// ============================================================
class RNG {
  private s: number
  constructor(seed: number) { this.s = seed >>> 0 }

  next(): number {
    this.s = (Math.imul(this.s, 1664525) + 1013904223) >>> 0
    return this.s / 0x100000000
  }
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)] }
}

const rng = new RNG(42_000)

// ============================================================
// CATALOGUE — données statiques
// ============================================================
const CATS = [
  { name: 'Plats principaux',     description: 'Nos spécialités maison',   position: 1 },
  { name: 'Entrées',              description: 'Pour bien commencer',       position: 2 },
  { name: 'Boissons',             description: 'Fraîches et locales',       position: 3 },
  { name: 'Desserts',             description: 'Pour finir en douceur',     position: 4 },
  { name: 'Snacks & Street food', description: 'Rapide et savoureux',       position: 5 },
]

const PRODS = [
  // catIdx 0 — Plats principaux
  { catIdx: 0, name: 'Poulet DG',                    price: 5000, initStock: 200, alert: 10 },
  { catIdx: 0, name: 'Ndolé au poisson',             price: 4500, initStock: 200, alert: 10 },
  { catIdx: 0, name: 'Saka-saka au poulet',          price: 4000, initStock: 200, alert: 10 },
  { catIdx: 0, name: 'Poisson braisé aux plantains', price: 6000, initStock: 150, alert: 10 },
  { catIdx: 0, name: 'Okok sauce arachide',          price: 3500, initStock: 180, alert: 10 },
  { catIdx: 0, name: 'Riz cantonnais maison',        price: 3000, initStock: 200, alert: 10 },
  { catIdx: 0, name: 'Bœuf en sauce tomate',         price: 5500, initStock: 150, alert: 10 },
  { catIdx: 0, name: 'Capitaine frit entier',        price: 7500, initStock: 120, alert: 10 },
  // catIdx 1 — Entrées
  { catIdx: 1, name: 'Brochettes de bœuf (3 pics)', price: 2000, initStock: 200, alert: 10 },
  { catIdx: 1, name: 'Salade de crudités',           price: 1500, initStock: 150, alert: 10 },
  { catIdx: 1, name: 'Soupe de poisson locale',      price: 2500, initStock: 150, alert: 10 },
  { catIdx: 1, name: 'Nems frits (4 pièces)',        price: 2000, initStock: 200, alert: 10 },
  // catIdx 2 — Boissons
  { catIdx: 2, name: 'Régab 65cl',                  price: 1000, initStock: 500, alert: 20 },
  { catIdx: 2, name: 'Castel 65cl',                 price: 1000, initStock: 500, alert: 20 },
  { catIdx: 2, name: 'Coca-Cola 33cl',              price:  500, initStock: 500, alert: 30 },
  { catIdx: 2, name: 'Jus de bissap maison',        price:  750, initStock: 300, alert: 20 },
  { catIdx: 2, name: 'Eau minérale 1,5L',           price:  500, initStock: 600, alert: 50 },
  { catIdx: 2, name: 'Jus de fruit frais pressé',   price: 1000, initStock: 250, alert: 20 },
  // catIdx 3 — Desserts
  { catIdx: 3, name: 'Tarte aux fruits tropicaux',  price: 2000, initStock: 150, alert: 10 },
  { catIdx: 3, name: 'Gâteau au chocolat',          price: 2500, initStock: 150, alert: 10 },
  { catIdx: 3, name: 'Salade de fruits frais',      price: 1500, initStock: 150, alert: 10 },
  // catIdx 4 — Snacks
  { catIdx: 4, name: 'Sandwich poulet-mayo',        price: 2000, initStock: 150, alert: 10 },
  { catIdx: 4, name: 'Alloco sauce piment',         price: 1000, initStock: 200, alert: 10 },
  { catIdx: 4, name: 'Beignets haricot (6 pièces)', price:  500, initStock: 250, alert: 10 },
  { catIdx: 4, name: 'Omelette au fromage',         price: 1500, initStock: 150, alert: 10 },
]

// ============================================================
// HELPERS
// ============================================================
function dayDate(offset: number): Date {
  const d = new Date(SEED_START)
  d.setUTCDate(d.getUTCDate() + offset)
  return d
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function atHour(d: Date, h: number, m = 0): Date {
  return new Date(`${isoDate(d)}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`)
}

function dailyVolume(dayIdx: number, dow: number): number {
  const base = [5, 2, 3, 4, 4, 7, 8][dow]
  const trend = 1 + 0.25 * (dayIdx / 89)
  const event = dayIdx === 14 ? 2.0 : dayIdx === 44 ? 2.0 : dayIdx === 74 ? 1.8 : 1.0
  const noise = 0.8 + rng.next() * 0.4
  return Math.max(1, Math.round(base * trend * event * noise))
}

function orderTimestamp(d: Date): Date {
  if (rng.next() < 0.6) {
    return new Date(atHour(d, 11, 30).getTime() + rng.int(0, 150) * 60_000)
  }
  return new Date(atHour(d, 18, 30).getTime() + rng.int(0, 180) * 60_000)
}

// ============================================================
// NETTOYAGE (ordre inverse des FK)
// ============================================================
async function cleanup() {
  console.log('🧹 Nettoyage des données existantes...')
  await prisma.expense.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  await prisma.manualRevenue.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  await prisma.stockMovement.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  await prisma.payment.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  // orderItems cascadent depuis order (onDelete: Cascade)
  await prisma.order.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  await prisma.cashSession.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  await prisma.stock.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  await prisma.product.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  await prisma.category.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  await prisma.table.deleteMany({ where: { restaurantId: RESTAURANT_ID } })
  console.log('   ✅ Nettoyage terminé\n')
}

// ============================================================
// SEED PRINCIPAL — toutes les données générées en mémoire
// puis insérées en lots (createMany)
// ============================================================
async function seed() {
  console.log('🌱 Seed démo')
  console.log(`   Restaurant : ${RESTAURANT_ID}`)
  console.log(`   Période    : 2026-01-09 → 2026-04-08 (90 jours)\n`)

  await cleanup()

  // ----------------------------------------------------------
  // 1. Catégories
  // ----------------------------------------------------------
  console.log('📂 Catégories...')
  const categories = await Promise.all(
    CATS.map(c => prisma.category.create({
      data: { restaurantId: RESTAURANT_ID, ...c, isActive: true },
    }))
  )
  console.log(`   ✅ ${categories.length} catégories`)

  // ----------------------------------------------------------
  // 2. Produits
  // ----------------------------------------------------------
  console.log('🍽️  Produits...')
  const products = await Promise.all(
    PRODS.map(p => prisma.product.create({
      data: {
        restaurantId: RESTAURANT_ID,
        categoryId: categories[p.catIdx].id,
        name: p.name,
        price: p.price,
        productType: 'good',
        hasStock: true,
        isAvailable: true,
      },
    }))
  )
  console.log(`   ✅ ${products.length} produits`)

  const priceMap = new Map<string, number>(products.map((p, i) => [p.id, PRODS[i].price]))
  const stockMap = new Map<string, number>(products.map((p, i) => [p.id, PRODS[i].initStock]))

  // ----------------------------------------------------------
  // 3. Stocks initiaux
  // ----------------------------------------------------------
  console.log('📦 Stocks initiaux...')
  await prisma.stock.createMany({
    data: products.map((p, i) => ({
      restaurantId: RESTAURANT_ID,
      productId: p.id,
      quantity: PRODS[i].initStock,
      alertThreshold: PRODS[i].alert,
    })),
  })
  console.log(`   ✅ ${products.length} entrées stock`)

  // ----------------------------------------------------------
  // 4. Tables
  // ----------------------------------------------------------
  console.log('🪑 Tables...')
  const tables = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.table.create({
        data: { restaurantId: RESTAURANT_ID, number: i + 1, isActive: true },
      })
    )
  )
  console.log(`   ✅ ${tables.length} tables`)

  // Produits par catégorie
  const bycat = [0, 1, 2, 3, 4].map(ci =>
    products.filter((_, i) => PRODS[i].catIdx === ci)
  )

  // ----------------------------------------------------------
  // 5. Génération en mémoire — 90 jours
  // ----------------------------------------------------------
  console.log('\n📅 Génération des données en mémoire...')

  // Pré-calcul des jours avec dépenses / recettes (déterministe)
  const expenseDays = new Set(
    Array.from({ length: DAYS }, (_, i) => i).filter(() => rng.next() < 0.20)
  )
  const revenueDays = new Set(
    Array.from({ length: DAYS }, (_, i) => i).filter(() => rng.next() < 0.35)
  )

  // Buffers d'insertion
  type OrderRow = Parameters<typeof prisma.order.createMany>['0']['data'][number]
  type OrderItemRow = Parameters<typeof prisma.orderItem.createMany>['0']['data'][number]
  type PaymentRow = Parameters<typeof prisma.payment.createMany>['0']['data'][number]
  type StockMovRow = Parameters<typeof prisma.stockMovement.createMany>['0']['data'][number]
  type SessionRow = { id: string; sessionDate: Date; openingBalance: number; openedAt: Date; closedAt: Date; theoreticalBalance: number; closingBalance: number; balanceDifference: number }
  type RevenueRow = Parameters<typeof prisma.manualRevenue.createMany>['0']['data'][number]
  type ExpenseRow = Parameters<typeof prisma.expense.createMany>['0']['data'][number]

  const allOrders: OrderRow[] = []
  const allItems: OrderItemRow[] = []
  const allPayments: PaymentRow[] = []
  const allMovements: StockMovRow[] = []
  const allSessions: SessionRow[] = []
  const allRevenues: RevenueRow[] = []
  const allExpenses: ExpenseRow[] = []

  // Pour les dépenses stock_purchase qui référencent un stockMovement,
  // on doit créer les StockMovements avant les Expenses → on les sépare
  type StockExpense = {
    movement: StockMovRow & { id: string }
    expense: Omit<ExpenseRow, 'stockMovementId'> & { stockMovementId: string }
  }
  const allStockExpenses: StockExpense[] = []

  let orderN = 1
  let singpayN = 1
  let prevBalance = 50_000

  for (let di = 0; di < DAYS; di++) {
    const date = dayDate(di)
    const dow = date.getUTCDay()
    const dateStr = isoDate(date)
    const sessionDate = new Date(`${dateStr}T00:00:00.000Z`)
    const vol = dailyVolume(di, dow)
    const sessionId = randomUUID()

    let cashIn = 0
    let cashOut = 0

    // ---- Commandes du jour ----
    for (let oi = 0; oi < vol; oi++) {
      const ts = orderTimestamp(date)
      const orderId = randomUUID()

      const sr = rng.next()
      const status: OrderStatus =
        sr < 0.85 ? 'delivered' : sr < 0.95 ? 'pending' : 'cancelled'
      const delivered = status === 'delivered'
      const cancelled = status === 'cancelled'

      const sourceR = rng.next()
      let source: OrderSource
      let fulfillmentType: FulfillmentType | null = null
      let tableId: string | null = null

      if (sourceR < 0.4) {
        source = 'counter'
        fulfillmentType = 'takeway'
      } else if (sourceR < 0.7) {
        source = 'dashboard'
        fulfillmentType = rng.next() < 0.5 ? 'table' : 'takeway'
        if (fulfillmentType === 'table') tableId = rng.pick(tables).id
      } else {
        source = 'qr_table'
        fulfillmentType = 'table'
        tableId = rng.pick(tables).id
      }

      // Composition des items
      type Item = { pid: string; name: string; qty: number; price: number }
      const items: Item[] = []
      const addItem = (pool: typeof products, qty: number) => {
        const p = rng.pick(pool)
        items.push({ pid: p.id, name: p.name, qty, price: priceMap.get(p.id) ?? 0 })
      }

      addItem(bycat[0], rng.int(1, 2))
      if (rng.next() < 0.8) addItem(bycat[2], rng.int(1, 3))
      if (rng.next() < 0.4) addItem(bycat[1], 1)
      if (rng.next() < 0.3) addItem(bycat[3], 1)
      if (rng.next() < 0.2) addItem(bycat[4], rng.int(1, 2))

      const total = items.reduce((s, it) => s + it.price * it.qty, 0)
      const orderNumber = `CMD-${String(orderN++).padStart(4, '0')}`

      allOrders.push({
        id: orderId,
        restaurantId: RESTAURANT_ID,
        tableId,
        orderNumber,
        status,
        totalAmount: total,
        source,
        fulfillmentType: fulfillmentType ?? undefined,
        stockDeducted: delivered,
        isArchived: false,
        createdAt: ts,
        updatedAt: ts,
      })

      allItems.push(
        ...items.map(it => ({
          id: randomUUID(),
          orderId,
          productId: it.pid,
          productName: it.name,
          quantity: it.qty,
          unitPrice: it.price,
          createdAt: ts,
          updatedAt: ts,
        }))
      )

      // Paiement
      if (!cancelled) {
        const pr = rng.next()
        const method: PaymentMethod =
          pr < 0.6 ? 'cash' : pr < 0.85 ? 'airtel_money' : 'moov_money'
        const isMM = method !== 'cash'
        const payStatus: PaymentStatus = delivered ? 'paid' : 'pending'
        const paidAt = delivered
          ? new Date(ts.getTime() + rng.int(600_000, 1_800_000))
          : null
        const singpayRef =
          isMM && delivered
            ? `SINGPAY-DEMO-${String(singpayN++).padStart(6, '0')}`
            : null

        allPayments.push({
          id: randomUUID(),
          restaurantId: RESTAURANT_ID,
          orderId,
          amount: total,
          method,
          status: payStatus,
          timing: 'after_meal',
          paidAt: paidAt ?? undefined,
          singpayReference: singpayRef ?? undefined,
          singpayStatus: singpayRef ? 'terminate' : undefined,
          singpayResult: singpayRef ? 'success' : undefined,
          callbackReceived: singpayRef ? true : false,
          callbackAt: singpayRef ? paidAt ?? undefined : undefined,
          createdAt: ts,
          updatedAt: ts,
        })

        if (delivered && method === 'cash') cashIn += total
      }

      // Mouvements de stock (commandes livrées)
      if (delivered) {
        for (const it of items) {
          let cur = stockMap.get(it.pid) ?? 0

          // Réapprovisionnement si stock trop bas
          if (cur < it.qty + 10) {
            const replenish = 100
            allMovements.push({
              id: randomUUID(),
              restaurantId: RESTAURANT_ID,
              productId: it.pid,
              userId: USER_ID,
              type: 'manual_in' as StockMovementType,
              quantity: replenish,
              previousQty: cur,
              newQty: cur + replenish,
              reason: 'Réapprovisionnement automatique',
              createdAt: ts,
            })
            cur += replenish
            stockMap.set(it.pid, cur)
          }

          allMovements.push({
            id: randomUUID(),
            restaurantId: RESTAURANT_ID,
            productId: it.pid,
            userId: USER_ID,
            type: 'order_out' as StockMovementType,
            quantity: it.qty,
            previousQty: cur,
            newQty: cur - it.qty,
            reason: `Vente ${orderNumber}`,
            orderId,
            createdAt: ts,
          })
          stockMap.set(it.pid, cur - it.qty)
        }
      }
    } // fin commandes

    // ---- Recette manuelle ----
    if (revenueDays.has(di)) {
      const revOpts = [
        { desc: 'Location salle événement',   min: 25_000, max:  80_000 },
        { desc: 'Service traiteur privatisé',  min: 30_000, max: 100_000 },
        { desc: 'Vente boissons événement',    min: 10_000, max:  40_000 },
        { desc: 'Recette bar soirée',          min: 15_000, max:  50_000 },
        { desc: 'Pourboires collectifs staff', min:  3_000, max:  15_000 },
      ]
      const opt = rng.pick(revOpts)
      const amount = rng.int(opt.min, opt.max)
      const method: PaymentMethod = rng.next() < 0.7 ? 'cash' : 'mobile_money'
      const t = atHour(date, 10)

      allRevenues.push({
        id: randomUUID(),
        restaurantId: RESTAURANT_ID,
        sessionId,
        description: opt.desc,
        quantity: 1,
        unitAmount: amount,
        totalAmount: amount,
        paymentMethod: method,
        revenueType: 'service',
        revenueDate: sessionDate,
        createdAt: t,
        updatedAt: t,
      })

      if (method === 'cash') cashIn += amount
    }

    // ---- Dépense ----
    if (expenseDays.has(di)) {
      type ExpOpt = {
        desc: string
        category: ExpenseCategory
        min: number
        max: number
        isStock?: boolean
      }
      const expOpts: ExpOpt[] = [
        { desc: 'Achat boissons fournisseur',   category: 'stock_purchase', min: 30_000, max:  80_000, isStock: true },
        { desc: 'Achat marchandises marché',    category: 'stock_purchase', min: 20_000, max:  60_000, isStock: true },
        { desc: 'Avance sur salaire staff',     category: 'salary',         min: 20_000, max:  50_000 },
        { desc: 'Facture électricité SEEG',     category: 'utilities',      min: 15_000, max:  40_000 },
        { desc: 'Livraison marchandises',       category: 'transport',      min:  5_000, max:  15_000 },
        { desc: 'Réparation matériel cuisine',  category: 'maintenance',    min: 10_000, max:  35_000 },
        { desc: 'Impression menus et affiches', category: 'marketing',      min:  5_000, max:  20_000 },
        { desc: 'Loyer mensuel local',          category: 'rent',           min: 80_000, max: 150_000 },
      ]
      const opt = rng.pick(expOpts)
      const amount = rng.int(opt.min, opt.max)
      const method: PaymentMethod = rng.next() < 0.7 ? 'cash' : 'mobile_money'
      const expTime = atHour(date, 8)

      if (opt.isStock) {
        const refillProd = rng.next() < 0.5 ? rng.pick(bycat[2]) : rng.pick(bycat[0])
        const qtyAdded = rng.int(50, 150)
        const prevQ = stockMap.get(refillProd.id) ?? 0
        const newQ = prevQ + qtyAdded
        const mvId = randomUUID()

        const movement: StockMovRow & { id: string } = {
          id: mvId,
          restaurantId: RESTAURANT_ID,
          productId: refillProd.id,
          userId: USER_ID,
          type: 'purchase' as StockMovementType,
          quantity: qtyAdded,
          previousQty: prevQ,
          newQty: newQ,
          reason: opt.desc,
          createdAt: expTime,
        }
        const expense = {
          id: randomUUID(),
          restaurantId: RESTAURANT_ID,
          sessionId,
          description: opt.desc,
          amount,
          category: 'stock_purchase' as ExpenseCategory,
          paymentMethod: method,
          productId: refillProd.id,
          quantityAdded: qtyAdded,
          expenseDate: sessionDate,
          stockMovementId: mvId,
          createdAt: expTime,
          updatedAt: expTime,
        }
        allStockExpenses.push({ movement, expense })
        stockMap.set(refillProd.id, newQ)
      } else {
        allExpenses.push({
          id: randomUUID(),
          restaurantId: RESTAURANT_ID,
          sessionId,
          description: opt.desc,
          amount,
          category: opt.category,
          paymentMethod: method,
          expenseDate: sessionDate,
          createdAt: expTime,
          updatedAt: expTime,
        })
      }

      if (method === 'cash') cashOut += amount
    }

    // ---- Session de caisse ----
    const theoretical = prevBalance + cashIn - cashOut
    const diff = rng.int(-1_000, 1_000)
    const closing = Math.max(0, theoretical + diff)

    allSessions.push({
      id: sessionId,
      sessionDate,
      openingBalance: prevBalance,
      openedAt: atHour(date, 9),
      closedAt: atHour(date, 22),
      theoreticalBalance: theoretical,
      closingBalance: closing,
      balanceDifference: diff,
    })

    prevBalance = closing
  } // fin boucle 90 jours

  console.log(`   ✅ ${allOrders.length} commandes, ${allItems.length} items, ${allPayments.length} paiements`)
  console.log(`   ✅ ${allMovements.length} mvts stock, ${allSessions.length} sessions`)

  // ----------------------------------------------------------
  // 6. Insertions en base — lots (createMany)
  // ----------------------------------------------------------
  console.log('\n💾 Insertion en base...')

  // Sessions de caisse (createMany ne supporte pas tous les champs → on batchise avec Promise.all)
  process.stdout.write('   Sessions de caisse... ')
  await prisma.cashSession.createMany({
    data: allSessions.map(s => ({
      id: s.id,
      restaurantId: RESTAURANT_ID,
      sessionDate: s.sessionDate,
      status: 'closed' as const,
      openingBalance: s.openingBalance,
      closingBalance: s.closingBalance,
      theoreticalBalance: s.theoreticalBalance,
      balanceDifference: s.balanceDifference,
      isHistorical: true,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      openedBy: USER_ID,
      closedBy: USER_ID,
    })),
  })
  console.log('✅')

  // Commandes
  process.stdout.write('   Commandes... ')
  await prisma.order.createMany({ data: allOrders })
  console.log('✅')

  // OrderItems (en lots de 1000 pour éviter les limites Postgres)
  process.stdout.write('   Items de commandes... ')
  for (let i = 0; i < allItems.length; i += 1000) {
    await prisma.orderItem.createMany({ data: allItems.slice(i, i + 1000) })
  }
  console.log('✅')

  // Paiements
  process.stdout.write('   Paiements... ')
  await prisma.payment.createMany({ data: allPayments })
  console.log('✅')

  // Mouvements de stock (en lots de 1000)
  process.stdout.write('   Mouvements de stock... ')
  for (let i = 0; i < allMovements.length; i += 1000) {
    await prisma.stockMovement.createMany({ data: allMovements.slice(i, i + 1000) })
  }
  console.log('✅')

  // Dépenses stock_purchase (mouvement d'abord, puis dépense liée)
  if (allStockExpenses.length > 0) {
    process.stdout.write('   Achats fournisseurs + mouvements... ')
    await prisma.stockMovement.createMany({
      data: allStockExpenses.map(se => se.movement),
    })
    await prisma.expense.createMany({
      data: allStockExpenses.map(se => se.expense),
    })
    console.log('✅')
  }

  // Autres dépenses
  if (allExpenses.length > 0) {
    process.stdout.write('   Dépenses... ')
    await prisma.expense.createMany({ data: allExpenses })
    console.log('✅')
  }

  // Recettes manuelles
  if (allRevenues.length > 0) {
    process.stdout.write('   Recettes manuelles... ')
    await prisma.manualRevenue.createMany({ data: allRevenues })
    console.log('✅')
  }

  // ----------------------------------------------------------
  // 7. Mise à jour des stocks finaux
  // ----------------------------------------------------------
  process.stdout.write('📦 Mise à jour stocks finaux... ')
  await Promise.all(
    Array.from(stockMap).map(([productId, quantity]) =>
      prisma.stock.update({ where: { productId }, data: { quantity } })
    )
  )
  console.log('✅')

  // ----------------------------------------------------------
  // 8. Résumé
  // ----------------------------------------------------------
  const [orders, payments, movements, sessions, expenses, revenues] = await Promise.all([
    prisma.order.count({ where: { restaurantId: RESTAURANT_ID } }),
    prisma.payment.count({ where: { restaurantId: RESTAURANT_ID } }),
    prisma.stockMovement.count({ where: { restaurantId: RESTAURANT_ID } }),
    prisma.cashSession.count({ where: { restaurantId: RESTAURANT_ID } }),
    prisma.expense.count({ where: { restaurantId: RESTAURANT_ID } }),
    prisma.manualRevenue.count({ where: { restaurantId: RESTAURANT_ID } }),
  ])

  console.log('\n✅ Seed terminé avec succès !')
  console.log(`   Commandes          : ${orders}`)
  console.log(`   Paiements          : ${payments}`)
  console.log(`   Mouvements stock   : ${movements}`)
  console.log(`   Sessions caisse    : ${sessions}`)
  console.log(`   Dépenses           : ${expenses}`)
  console.log(`   Recettes manuelles : ${revenues}`)
}

seed()
  .catch(e => {
    console.error('\n❌ Erreur lors du seed :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
