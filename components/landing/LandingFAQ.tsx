'use client'

import { useState } from 'react'
import { IconChevDown } from './LandingIcons'

const items = [
  { q: 'Faut-il acheter du matériel pour utiliser Akôm ?', a: "Non. Akôm fonctionne sur les téléphones, tablettes ou ordinateurs que vous possédez déjà. Aucun terminal spécifique, aucune installation. Une simple connexion internet suffit." },
  { q: 'Mes clients doivent-ils télécharger une application ?', a: "Non. Vos clients scannent le QR code avec l'appareil photo de leur téléphone, et le menu s'ouvre dans leur navigateur. C'est instantané et ne nécessite aucun compte." },
  { q: 'Comment fonctionne le paiement mobile money ?', a: "Akôm est intégré à SINGPAY, l'agrégateur local Airtel Money et Moov Money. Le client paie en quelques secondes, le montant est crédité sur votre compte marchand." },
  { q: 'Puis-je gérer plusieurs établissements ?', a: "Oui, à partir du plan Business. Chaque établissement conserve ses propres données, son personnel et ses statistiques, mais vous pilotez l'ensemble depuis un seul compte." },
  { q: "Que se passe-t-il si la connexion internet est lente ?", a: "Akôm est conçu pour fonctionner sur des connexions limitées. Les pages sont légères et l'interface reste fluide même en 3G." },
  { q: "Y a-t-il un engagement de durée ?", a: "Non. L'abonnement est mensuel et vous pouvez l'arrêter ou changer de plan à tout moment depuis votre tableau de bord." },
]

export default function LandingFAQ() {
  const [open, setOpen] = useState<number>(0)

  return (
    <section className="lp-s" id="faq">
      <div className="lp-container-narrow">
        <div className="lp-s-head">
          <span className="lp-label-meta" style={{ color: 'var(--primary)' }}>FAQ</span>
          <h2>Questions fréquentes</h2>
        </div>
        <div className="lp-faq-list">
          {items.map((it, i) => (
            <div key={i} className={`lp-faq-item${open === i ? ' open' : ''}`}>
              <button className="lp-faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{it.q}</span>
                <span className="lp-chev"><IconChevDown /></span>
              </button>
              <div className="lp-faq-a">
                <div className="lp-faq-a-inner">{it.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
