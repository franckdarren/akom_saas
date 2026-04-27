'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  IconChef, IconWifi, IconPlay, IconPause, IconReset,
  IconVolume, IconCheckCircle, IconBell, IconArrowRight,
} from './LandingIcons'

type OrderStatus = 'pending' | 'preparing' | 'ready'

interface Product {
  id: number
  cat: string
  emoji: string
  name: string
  desc: string
  price: string
}

interface CartItem extends Product {
  qty: number
}

const products: Product[] = [
  { id: 1, cat: 'Plats',    emoji: '🍗', name: 'Poulet braisé',    desc: 'Sauce tomate, plantain', price: '4 500' },
  { id: 2, cat: 'Plats',    emoji: '🐟', name: 'Capitaine grillé', desc: 'Manioc, légumes verts',  price: '6 000' },
  { id: 3, cat: 'Plats',    emoji: '🥘', name: 'Nyembwé poulet',   desc: 'Sauce noix de palme',    price: '5 500' },
  { id: 4, cat: 'Boissons', emoji: '🥤', name: 'Régab fraîche',    desc: '33cl',                   price: '1 200' },
  { id: 5, cat: 'Boissons', emoji: '🧃', name: 'Jus de bissap',    desc: 'Maison, 25cl',           price: '1 500' },
  { id: 6, cat: 'Desserts', emoji: '🍰', name: 'Salade de fruits', desc: 'Fruits de saison',       price: '2 000' },
]

function formatPrice(p: number) {
  return p.toLocaleString('fr-FR').replace(/,/g, ' ')
}

export default function LandingDemo() {
  const [stage, setStage] = useState(0)
  const [auto, setAuto] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending')
  const [adding, setAdding] = useState<number | null>(null)
  const [activeCat, setActiveCat] = useState('Plats')

  const total = cart.reduce((s, c) => s + c.qty * parseInt(c.price.replace(/\s/g, '')), 0)
  const qty = cart.reduce((s, c) => s + c.qty, 0)

  const addItem = useCallback((id: number) => {
    setAdding(id)
    setTimeout(() => setAdding(null), 400)
    setCart((prev) => {
      const f = prev.find((p) => p.id === id)
      if (f) return prev.map((p) => p.id === id ? { ...p, qty: p.qty + 1 } : p)
      const prod = products.find((p) => p.id === id)!
      return [...prev, { ...prod, qty: 1 }]
    })
  }, [])

  const reset = () => {
    setAuto(false)
    setStage(0)
    setCart([])
    setOrderStatus('pending')
    setTimeout(() => setAuto(true), 50)
  }

  useEffect(() => {
    if (!auto) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const seq = () => {
      setStage(0); setCart([]); setOrderStatus('pending')
      timers.push(setTimeout(() => setStage(1), 2200))
      timers.push(setTimeout(() => addItem(1), 3500))
      timers.push(setTimeout(() => addItem(4), 4400))
      timers.push(setTimeout(() => addItem(1), 5200))
      timers.push(setTimeout(() => setStage(2), 6200))
      timers.push(setTimeout(() => setStage(3), 7400))
      timers.push(setTimeout(() => setOrderStatus('preparing'), 9500))
      timers.push(setTimeout(() => setOrderStatus('ready'), 12000))
      timers.push(setTimeout(() => seq(), 15000))
    }
    seq()
    return () => timers.forEach(clearTimeout)
  }, [auto, addItem])

  const renderPhone = () => {
    if (stage === 0) return (
      <div className="lp-scan-view">
        <div className="lp-scan-label">CAMÉRA · TABLE 04</div>
        <div className="lp-scan-frame" style={{ position: 'relative' }}>
          <div className="lp-scan-corners"><i /></div>
          <svg className="lp-qr-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#fff"/>
            <rect x="6" y="6" width="22" height="22" fill="#0a0f1a"/>
            <rect x="10" y="10" width="14" height="14" fill="#fff"/>
            <rect x="13" y="13" width="8" height="8" fill="#0a0f1a"/>
            <rect x="72" y="6" width="22" height="22" fill="#0a0f1a"/>
            <rect x="76" y="10" width="14" height="14" fill="#fff"/>
            <rect x="79" y="13" width="8" height="8" fill="#0a0f1a"/>
            <rect x="6" y="72" width="22" height="22" fill="#0a0f1a"/>
            <rect x="10" y="76" width="14" height="14" fill="#fff"/>
            <rect x="13" y="79" width="8" height="8" fill="#0a0f1a"/>
            {Array.from({ length: 110 }).map((_, i) => {
              const x = 32 + (i * 7) % 38
              const y = 32 + Math.floor((i * 13) % 38)
              const on = (i * 31) % 7 < 4
              if (!on) return null
              return <rect key={i} x={x} y={y} width="3" height="3" fill="#0a0f1a"/>
            })}
          </svg>
          <div className="lp-scan-line" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="lp-scan-table" style={{ fontWeight: 600, marginBottom: 4 }}>Le Mandara</div>
          <div className="lp-scan-label">Scan en cours…</div>
        </div>
      </div>
    )

    if (stage === 1) return (
      <div className="lp-menu-view">
        <div className="lp-menu-header">
          <div className="lp-place">Le Mandara</div>
          <div className="lp-table">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/></svg>
            Table 04
          </div>
        </div>
        <div className="lp-menu-cats">
          {['Plats', 'Boissons', 'Desserts', 'Entrées'].map((c) => (
            <span key={c} className={`lp-menu-cat${c === activeCat ? ' on' : ''}`} onClick={() => setActiveCat(c)}>{c}</span>
          ))}
        </div>
        <div className="lp-menu-list">
          {products.filter((p) => p.cat === activeCat).map((p) => (
            <div key={p.id} className={`lp-menu-item${adding === p.id ? ' adding' : ''}`}>
              <div className="lp-thumb">{p.emoji}</div>
              <div className="lp-info">
                <div className="lp-name">{p.name}</div>
                <div className="lp-desc">{p.desc}</div>
                <div className="lp-price-row">
                  <div className="lp-price">{p.price} F</div>
                  <button className="lp-add-btn" onClick={() => { setAuto(false); addItem(p.id) }}>+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {qty > 0 && (
          <div className="lp-menu-cart">
            <div className="lp-summary">
              <span className="lp-qty">{qty} article{qty > 1 ? 's' : ''}</span>
              <span className="lp-total">{formatPrice(total)} FCFA</span>
            </div>
            <button className="lp-send" onClick={() => {
              setAuto(false)
              setStage(2)
              setTimeout(() => setStage(3), 1100)
              setTimeout(() => setOrderStatus('preparing'), 3500)
              setTimeout(() => setOrderStatus('ready'), 6500)
            }}>
              Commander <IconArrowRight size={11} />
            </button>
          </div>
        )}
      </div>
    )

    return (
      <div className="lp-order-sent hidden md:block">
        <div className="lp-check"><IconCheckCircle size={36} /></div>
        <h4>Commande envoyée !</h4>
        <p>Votre commande est en route vers la cuisine. Vous serez prévenu dès qu&apos;elle est prête.</p>
        <div className="lp-order-num">CMD #2841 · TABLE 04</div>
        <div className="lp-order-status-pill">
          {orderStatus === 'pending' && 'En attente'}
          {orderStatus === 'preparing' && 'En préparation'}
          {orderStatus === 'ready' && '✓ Prête à servir'}
        </div>
      </div>
    )
  }

  return (
    <section className="lp-s lp-demo-wrap" id="demo">
      <div className="lp-container">
        <div className="lp-demo-grid">
          <div className="lp-demo-copy">
            <span className="lp-label-meta" style={{ color: 'var(--primary)' }}>Démo en direct</span>
            <h2>Du QR code à la cuisine en quelques secondes</h2>
            <p>Voici exactement ce que vivent vos clients et votre équipe — scannez, commandez, recevez. Sans serveur, sans erreur, sans attente.</p>

            <div className="lp-demo-stages">
              <div className={`lp-demo-stage${stage === 0 ? ' active' : stage > 0 ? ' done' : ''}`}>
                <span className="lp-num">1</span>
                <div>
                  <div className="lp-stage-label">Scan du QR</div>
                  <div className="lp-stage-sub">Le client ouvre le menu sur son téléphone</div>
                </div>
              </div>
              <div className={`lp-demo-stage${stage === 1 ? ' active' : stage > 1 ? ' done' : ''}`}>
                <span className="lp-num">2</span>
                <div>
                  <div className="lp-stage-label">Commande au panier</div>
                  <div className="lp-stage-sub">Sélection libre, validation en un tap</div>
                </div>
              </div>
              <div className={`lp-demo-stage${stage >= 2 ? (orderStatus === 'ready' ? ' done' : ' active') : ''}`}>
                <span className="lp-num">3</span>
                <div>
                  <div className="lp-stage-label">Réception en cuisine</div>
                  <div className="lp-stage-sub">Notification sonore, statut en direct</div>
                </div>
              </div>
            </div>

            <div className="lp-demo-controls">
              <button className={`lp-btn-demo${auto ? ' primary' : ''}`} onClick={() => setAuto(!auto)}>
                {auto ? <><IconPause size={11} /> Pause</> : <><IconPlay size={11} /> Lecture auto</>}
              </button>
              <button className="lp-btn-demo" onClick={reset}>
                <IconReset size={11} /> Recommencer
              </button>
            </div>
          </div>

          <div className="lp-demo-canvas">
            <div className="lp-phone">
              <div className="lp-phone-notch" />
              <div className="lp-phone-screen">
                <div className="lp-phone-status">
                  <span>9:41</span>
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <IconWifi size={11} />
                    <svg width="14" height="10" viewBox="0 0 24 12" fill="currentColor"><rect x="0" y="2" width="3" height="8"/><rect x="5" y="0" width="3" height="10"/><rect x="10" y="3" width="3" height="7" opacity="0.6"/><rect x="15" y="5" width="3" height="5" opacity="0.4"/></svg>
                  </span>
                </div>
                <div className="lp-phone-content">
                  {renderPhone()}
                </div>
              </div>
            </div>

            <div className="lp-kitchen">
              <div className="lp-kitchen-bar">
                <div className="lp-title">
                  <IconChef size={16} />
                  Cuisine — Le Mandara
                </div>
                <span className="lp-live"><span className="lp-dot" /> Live</span>
              </div>
              <div className="lp-kitchen-list">
                {stage >= 3 && (
                  <div className={`lp-ticket${orderStatus === 'pending' ? ' new' : ''}`}>
                    <div className="lp-ticket-head">
                      <div className="lp-who">
                        <span className="lp-table-tag">T04</span>
                        <span className="lp-order-id">#2841</span>
                      </div>
                      <span className="lp-timer">
                        {orderStatus === 'pending' && '⏱ 0:12'}
                        {orderStatus === 'preparing' && '⏱ 2:34'}
                        {orderStatus === 'ready' && '✓ 5:18'}
                      </span>
                    </div>
                    <div className={`lp-ticket-status-bar ${orderStatus}`}>
                      {orderStatus === 'pending' && '● Nouvelle commande'}
                      {orderStatus === 'preparing' && '● En préparation'}
                      {orderStatus === 'ready' && '✓ Prête à servir'}
                    </div>
                    <div className="lp-ticket-items">
                      {cart.length === 0 ? (
                        <>
                          <div className="lp-ticket-item"><span className="lp-qty">2×</span><span className="lp-name">Poulet braisé</span></div>
                          <div className="lp-ticket-item"><span className="lp-qty">1×</span><span className="lp-name">Régab fraîche 33cl</span></div>
                        </>
                      ) : cart.map((c) => (
                        <div key={c.id} className="lp-ticket-item">
                          <span className="lp-qty">{c.qty}×</span>
                          <span className="lp-name">{c.name}</span>
                        </div>
                      ))}
                    </div>
                    <div className="lp-ticket-actions">
                      {orderStatus === 'pending' && (
                        <button className="primary" onClick={() => { setAuto(false); setOrderStatus('preparing') }}>Accepter</button>
                      )}
                      {orderStatus === 'preparing' && (
                        <button className="primary" onClick={() => { setAuto(false); setOrderStatus('ready') }}>Marquer prête</button>
                      )}
                      {orderStatus === 'ready' && (
                        <button className="primary">Servie ✓</button>
                      )}
                      <button>Détails</button>
                    </div>
                  </div>
                )}

                {stage >= 3 && orderStatus === 'pending' && (
                  <div className="lp-sound-pop">
                    <IconVolume size={14} />
                    Nouvelle commande
                  </div>
                )}

                {stage < 3 && (
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted-foreground)', fontSize: 13 }}>
                    <IconBell size={28} />
                    <div style={{ marginTop: 12, fontWeight: 500 }}>En attente de commandes…</div>
                    <div style={{ marginTop: 4, fontSize: 11 }}>Le ticket apparaîtra ici dès qu&apos;un client validera son panier.</div>
                  </div>
                )}

                <div className="lp-ticket" style={{ opacity: 0.6 }}>
                  <div className="lp-ticket-head">
                    <div className="lp-who">
                      <span className="lp-table-tag" style={{ background: 'var(--muted-foreground)' }}>T07</span>
                      <span className="lp-order-id">#2839</span>
                    </div>
                    <span className="lp-timer">✓ 8:42</span>
                  </div>
                  <div className="lp-ticket-status-bar ready">✓ Servie</div>
                  <div className="lp-ticket-items">
                    <div className="lp-ticket-item"><span className="lp-qty">1×</span><span className="lp-name">Capitaine grillé</span></div>
                    <div className="lp-ticket-item"><span className="lp-qty">2×</span><span className="lp-name">Jus de bissap</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
