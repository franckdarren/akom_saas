import { IconBook, IconQr, IconChef, IconCard, IconBox, IconChart, IconLock, IconUsers, IconWifi } from './LandingIcons'

const items = [
  { icon: <IconBook />, title: 'Catalogue digital', body: "Catégories, produits, services, options. Activation instantanée, pas d'application à installer pour vos clients." },
  { icon: <IconQr />, title: 'QR code par espace', body: 'Un QR unique par table, comptoir, chambre ou poste. Généré et imprimable depuis votre tableau de bord.' },
  { icon: <IconChef />, title: 'Suivi des commandes en direct', body: 'Réception en temps réel avec notification sonore. Statuts configurables : en attente → en traitement → prêt → livré.' },
  { icon: <IconCard />, title: 'Mobile money intégré', body: 'Encaissement Airtel Money et Moov Money à la commande. Espèces et carte également pris en charge.' },
  { icon: <IconBox />, title: 'Stock simplifié', body: 'Décrément automatique à chaque commande. Alertes de stock bas et historique des mouvements.' },
  { icon: <IconChart />, title: 'Statistiques claires', body: 'Volume de commandes, ventes journalières, top articles. Pas de tableurs, pas de complexité inutile.' },
  { icon: <IconLock />, title: 'Multi-établissement', body: 'Gérez plusieurs sites depuis un seul compte. Données strictement isolées et permissions par rôle.' },
  { icon: <IconUsers />, title: 'Rôles & permissions', body: 'Admin, caissier, opérationnel. Chaque collaborateur voit uniquement ce qui le concerne.' },
  { icon: <IconWifi />, title: 'Conçu pour le terrain', body: 'Léger, rapide, fonctionne avec une connexion limitée. Aucun matériel coûteux à acheter.' },
]

export default function LandingFeatures() {
  return (
    <section className="lp-s" id="features" style={{ background: 'color-mix(in srgb, var(--muted) 35%, var(--background))' }}>
      <div className="lp-container">
        <div className="lp-s-head">
          <span className="lp-label-meta" style={{ color: 'var(--primary)' }}>Fonctionnalités</span>
          <h2>Tout ce dont vous avez besoin, rien de superflu</h2>
          <p>Restaurant, boutique, hôtel, salon ou prestataire — Akôm couvre l&apos;essentiel du quotidien de votre commerce sans la complexité des gros ERP.</p>
        </div>
        <div className="lp-features">
          {items.map((it, i) => (
            <div key={i} className="lp-feat">
              <div className="lp-feat-ico">{it.icon}</div>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
