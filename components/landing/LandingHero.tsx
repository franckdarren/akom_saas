import Image from 'next/image';


export default function LandingHero() {
  return (
    <section className="lp-hero" id="top">
      <div className="lp-container lp-hero-grid">
        <div>
          <span className="lp-eyebrow">
            <span className="lp-dot" />
            Plateforme de commerce digital · Gabon
          </span>
          <h1>
            Digitalisez vos commandes,<br />
            <em>encaissez en mobile money</em>.
          </h1>
          <p className="lp-lead">
            Akôm centralise vos catalogues, vos commandes par QR code et votre cuisine
            sur une seule plateforme — pensée pour les restaurants, boutiques et hôtels
            en Afrique.
          </p>
          <div className="lp-hero-ctas">
            <a href="#pricing" className="lp-btn lp-btn-primary lp-btn-lg">
              Choisir un plan
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </a>
            <a href="#demo" className="lp-btn lp-btn-outline lp-btn-lg">Voir la démo</a>
          </div>
          <div className="lp-hero-trust">
            <span className="lp-label-meta">Paiements&nbsp;:</span>
            <div className="flex gap-1">
            <span className="lp-pay-pill">
              {/* <span className="lp-swatch" style={{ background: '#E4002B' }} /> */}
              <Image
                src="/images/airtelmoney.webp"
                alt="logo airtelmoney"
                width={25}      
                height={25}      
                // className="lp-swatch"
              />
              Airtel Money
            </span>
            <span className="lp-pay-pill">
              {/* <span className="lp-swatch" style={{ background: '#005CA9' }} /> */}
              <Image
                src="/images/moovmoney.png"
                alt="logo airtelmoney"
                width={25}      
                height={25}      
                // className="lp-swatch"
              />
              Moov Money
            </span>
            <span className="lp-pay-pill">Espèces</span>
          </div>
          </div>
        </div>

        <div className="lp-hero-visual lp-hero-visual-v2 hidden md:block" aria-hidden="true">
          {/* Phone — client menu */}
          <div className="lp-hv-phone">
            <div className="lp-hv-phone-frame">
              <div className="lp-hv-phone-notch" />
              <div className="lp-hv-phone-screen">
                <div className="lp-hv-phone-status">
                  <span>9:41</span>
                  <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <svg width="11" height="8" viewBox="0 0 24 18" fill="currentColor"><path d="M12 3a14 14 0 0 0-9.7 4l1.4 1.4a12 12 0 0 1 16.6 0l1.4-1.4A14 14 0 0 0 12 3Z"/><path d="M12 8a9 9 0 0 0-6.4 2.6l1.4 1.4a7 7 0 0 1 9.9 0l1.4-1.4A9 9 0 0 0 12 8Z"/><path d="M12 13a4 4 0 0 0-2.8 1.2L12 17l2.8-2.8A4 4 0 0 0 12 13Z"/></svg>
                    <svg width="13" height="9" viewBox="0 0 24 12" fill="currentColor"><rect x="0" y="3" width="3" height="6" rx="0.5"/><rect x="5" y="1" width="3" height="8" rx="0.5"/><rect x="10" y="0" width="3" height="9" rx="0.5"/><rect x="15" y="0" width="3" height="9" rx="0.5"/></svg>
                    <svg width="16" height="8" viewBox="0 0 22 10" fill="none" stroke="currentColor" strokeWidth="1"><rect x="1" y="1" width="18" height="8" rx="1.5"/><rect x="2.5" y="2.5" width="14" height="5" rx="0.5" fill="currentColor"/><path d="M20 3.5v3" strokeLinecap="round"/></svg>
                  </span>
                </div>
                <div className="lp-hv-phone-app">
                  <div className="lp-hv-place-bar">
                    <div className="lp-hv-place-name">Le Mandara</div>
                    <div className="lp-hv-place-table">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="10" r="2.5"/><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z"/></svg>
                      Table 04
                    </div>
                  </div>
                  <div className="lp-hv-cats">
                    <span className="lp-hv-cat on">Plats</span>
                    <span className="lp-hv-cat">Boissons</span>
                    <span className="lp-hv-cat">Desserts</span>
                  </div>
                  <div className="lp-hv-products">
                    <div className="lp-hv-prod">
                      <div className="lp-hv-prod-thumb" style={{ background: 'linear-gradient(135deg, #fde6c5, #f4a261)' }}>🍗</div>
                      <div className="lp-hv-prod-info">
                        <div className="lp-hv-prod-name">Poulet braisé</div>
                        <div className="lp-hv-prod-desc">Sauce tomate, plantain</div>
                        <div className="lp-hv-prod-price">4 500 FCFA</div>
                      </div>
                      <span className="lp-hv-prod-add">+</span>
                    </div>
                    <div className="lp-hv-prod lp-hv-prod-active">
                      <div className="lp-hv-prod-thumb" style={{ background: 'linear-gradient(135deg, #cfe6cf, #6bb074)' }}>🐟</div>
                      <div className="lp-hv-prod-info">
                        <div className="lp-hv-prod-name">Capitaine grillé</div>
                        <div className="lp-hv-prod-desc">Manioc, légumes verts</div>
                        <div className="lp-hv-prod-price">6 000 FCFA</div>
                      </div>
                      <span className="lp-hv-prod-add lp-hv-prod-add-on">2</span>
                    </div>
                    <div className="lp-hv-prod">
                      <div className="lp-hv-prod-thumb" style={{ background: 'linear-gradient(135deg, #f6cccc, #d97a7a)' }}>🥘</div>
                      <div className="lp-hv-prod-info">
                        <div className="lp-hv-prod-name">Nyembwé poulet</div>
                        <div className="lp-hv-prod-desc">Sauce noix de palme</div>
                        <div className="lp-hv-prod-price">5 500 FCFA</div>
                      </div>
                      <span className="lp-hv-prod-add">+</span>
                    </div>
                  </div>
                  <div className="lp-hv-cart">
                    <div>
                      <div className="lp-hv-cart-q">2 articles</div>
                      <div className="lp-hv-cart-t">12 000 FCFA</div>
                    </div>
                    <div className="lp-hv-cart-btn">
                      Commander
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kitchen ticket */}
          <div className="lp-hv-ticket">
            <div className="lp-hv-ticket-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="lp-hv-ticket-tag">T04</span>
                <span className="lp-hv-ticket-id">#2841</span>
              </div>
              <span className="lp-hv-ticket-live">
                <span className="lp-hv-live-dot" />
                Cuisine
              </span>
            </div>
            <div className="lp-hv-ticket-status">
              <span className="lp-hv-status-dot" />
              Nouvelle commande
              <span className="lp-hv-ticket-timer">0:08</span>
            </div>
            <div className="lp-hv-ticket-items">
              <div className="lp-hv-ti">
                <span className="lp-hv-ti-q">2×</span>
                <span className="lp-hv-ti-n">Capitaine grillé</span>
                <span className="lp-hv-ti-p">12 000</span>
              </div>
              <div className="lp-hv-ti">
                <span className="lp-hv-ti-q">1×</span>
                <span className="lp-hv-ti-n">Régab fraîche 33cl</span>
                <span className="lp-hv-ti-p">1 200</span>
              </div>
              <div className="lp-hv-ti lp-hv-ti-total">
                <span className="lp-hv-ti-q" />
                <span className="lp-hv-ti-n">Total</span>
                <span className="lp-hv-ti-p lp-hv-ti-total-p">13 200 FCFA</span>
              </div>
            </div>
            <div className="lp-hv-ticket-pay">
              <div className="lp-hv-pay-method">
                <div className="lp-hv-pay-logo lp-hv-pay-airtel">A</div>
                <div>
                  <div className="lp-hv-pay-name">Airtel Money</div>
                  <div className="lp-hv-pay-num">+241 ••• 47 82</div>
                </div>
              </div>
              <div className="lp-hv-pay-status">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Payé
              </div>
            </div>
          </div>

          {/* KPI card */}
          <div className="lp-hv-kpi">
            <div className="lp-hv-kpi-label">Aujourd&apos;hui</div>
            <div className="lp-hv-kpi-row">
              <div>
                <div className="lp-hv-kpi-num">142</div>
                <div className="lp-hv-kpi-cap">commandes</div>
              </div>
              <div className="lp-hv-kpi-divider" />
              <div>
                <div className="lp-hv-kpi-num" style={{ color: 'var(--success)' }}>428k</div>
                <div className="lp-hv-kpi-cap">CA · FCFA</div>
              </div>
            </div>
            <div className="lp-hv-kpi-spark">
              <svg width="100%" height="32" viewBox="0 0 120 32" preserveAspectRatio="none">
                <path d="M0 24 L12 22 L24 18 L36 20 L48 14 L60 16 L72 10 L84 12 L96 6 L108 8 L120 4"
                      fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M0 24 L12 22 L24 18 L36 20 L48 14 L60 16 L72 10 L84 12 L96 6 L108 8 L120 4 L120 32 L0 32 Z"
                      fill="var(--primary)" opacity="0.12"/>
              </svg>
            </div>
          </div>

          {/* Live ping */}
          <div className="lp-hv-ping">
            <span className="lp-hv-ping-dot" />
            3 commandes en attente
          </div>
        </div>
      </div>
    </section>
  )
}
