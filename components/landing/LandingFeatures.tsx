import { IconBook, IconQr, IconChef, IconCard, IconBox, IconChart, IconLock, IconUsers, IconWifi } from './LandingIcons'

const items = [
  { icon: <IconBook />, title: 'Catalogue digital', body: "Catégories, produits, options. Activation instantanée, pas d'application à installer pour vos clients." },
  { icon: <IconQr />, title: 'QR code par table', body: 'Un QR unique par table, généré et imprimable depuis votre tableau de bord. Lien direct à votre menu.' },
  { icon: <IconChef />, title: 'Écran cuisine (KDS)', body: 'Réception en temps réel avec notification sonore. Statuts : en attente → en préparation → prête → livrée.' },
  { icon: <IconCard />, title: 'Mobile money intégré', body: 'Encaissement Airtel Money et Moov Money à la commande. Espèces et carte également pris en charge.' },
  { icon: <IconBox />, title: 'Stock simplifié', body: 'Décrément automatique à chaque commande. Alertes de stock bas et historique des mouvements.' },
  { icon: <IconChart />, title: 'Statistiques claires', body: 'Volume de commandes, ventes journalières, top produits. Pas de tableurs, pas de complexité inutile.' },
  { icon: <IconLock />, title: 'Multi-établissement', body: 'Gérez plusieurs sites depuis un seul compte. Données strictement isolées et permissions par rôle.' },
  { icon: <IconUsers />, title: 'Rôles & permissions', body: 'Admin, caissier, cuisine. Chaque utilisateur voit uniquement ce qui le concerne.' },
  { icon: <IconWifi />, title: 'Conçu pour le terrain', body: 'Léger, rapide, fonctionne avec une connexion limitée. Pas de matériel coûteux à acheter.' },
]

export default function LandingFeatures() {
  return (
    <section className="lp-s" id="features" style={{ background: 'color-mix(in srgb, var(--muted) 35%, var(--background))' }}>
      <div className="lp-container">
        <div className="lp-s-head">
          <span className="lp-label-meta" style={{ color: 'var(--primary)' }}>Fonctionnalités</span>
          <h2>Tout ce dont vous avez besoin, rien de superflu</h2>
          <p>Akôm couvre l&apos;essentiel du quotidien d&apos;un commerce digitalisé — sans la complexité des gros ERP.</p>
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
