import Link from 'next/link'
import { IconCheck } from './LandingIcons'

const plans = [
  {
    name: 'STARTER',
    price: '3 000',
    desc: 'Pour les petits établissements qui démarrent.',
    featured: false,
    extra: '+ 5 000 FCFA / profil supplémentaire',
    features: [
      '1 profil administrateur',
      '3 comptes utilisateurs',
      '10 tables maximum',
      '5 catégories · 30 produits',
      'Menu digital + QR codes',
      'Gestion de stock simplifiée',
      'Statistiques de base',
    ],
  },
  {
    name: 'BUSINESS',
    price: '5 000',
    desc: 'Pour les structures en croissance — le plus choisi.',
    featured: true,
    extra: '+ 7 500 FCFA / profil supplémentaire',
    features: [
      'Tout du plan Starter',
      '5 comptes utilisateurs',
      '50 tables maximum',
      '15 catégories illimitées',
      'Paiements Airtel & Moov Money',
      'Caisse intégrée',
      'Multi-établissement',
      'Statistiques avancées + alertes',
      'Support prioritaire',
    ],
  },
  {
    name: 'PREMIUM',
    price: '8 000',
    desc: 'Pour les structures multi-sites exigeantes.',
    featured: false,
    extra: '+ 10 000 FCFA / profil supplémentaire',
    features: [
      'Tout du plan Business',
      'Comptes & tables illimités',
      'Catégories & produits illimités',
      'Multi-établissement illimité',
      'Données comptables exportables',
      'Personnalisation avancée',
      'Rapports périodiques automatiques',
      'Historique stock complet',
    ],
  },
]

export default function LandingPricing() {
  return (
    <section className="lp-s" id="pricing">
      <div className="lp-container">
        <div className="lp-s-head">
          <span className="lp-label-meta" style={{ color: 'var(--primary)' }}>Tarifs</span>
          <h2>Un plan adapté à chaque taille d&apos;établissement</h2>
          <p>Tarification mensuelle en FCFA. Aucun matériel requis, aucun frais caché. Annulable à tout moment.</p>
        </div>
        <div className="lp-pricing">
          {plans.map((p) => (
            <div key={p.name} className={`lp-plan${p.featured ? ' featured' : ''}`}>
              {p.featured && <span className="lp-plan-tag">Le plus choisi</span>}
              <div>
                <div className="lp-plan-name">Pack {p.name}</div>
                <div className="lp-plan-price">
                  <span className="lp-num">{p.price}</span>
                  <span className="lp-unit">FCFA / mois</span>
                </div>
                <p className="lp-plan-desc">{p.desc}</p>
              </div>
              <ul>
                {p.features.map((f, i) => (
                  <li key={i}>
                    <IconCheck size={14} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`lp-btn${p.featured ? ' lp-btn-primary' : ' lp-btn-outline'}`}
                style={{ justifyContent: 'center', width: '100%' }}
              >
                Choisir {p.name}
              </Link>
              <div className="lp-plan-extra">{p.extra}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
