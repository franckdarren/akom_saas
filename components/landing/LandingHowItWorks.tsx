import { IconBook, IconQr, IconChef } from './LandingIcons'

const items = [
  {
    n: '01',
    title: 'Configurez votre catalogue',
    body: "Créez vos catégories, ajoutez vos produits ou services en quelques minutes. Activez ou désactivez un article en un clic, sans aucun outil technique.",
    icon: <IconBook size={22} />,
  },
  {
    n: '02',
    title: 'Imprimez vos QR codes',
    body: "Akôm génère un QR code unique par table ou par espace. Vos clients scannent, parcourent le menu et commandent depuis leur téléphone — sans application.",
    icon: <IconQr size={22} />,
  },
  {
    n: '03',
    title: 'Cuisine et caisse synchronisées',
    body: "Chaque commande arrive en temps réel dans l'écran cuisine, avec notification sonore. Le paiement Airtel/Moov est encaissé directement depuis l'application.",
    icon: <IconChef size={22} />,
  },
]

export default function LandingHowItWorks() {
  return (
    <section className="lp-s" id="how">
      <div className="lp-container">
        <div className="lp-s-head">
          <span className="lp-label-meta" style={{ color: 'var(--primary)' }}>Comment ça marche</span>
          <h2>Trois étapes pour digitaliser votre établissement</h2>
          <p>De la configuration du menu à la première commande encaissée, comptez moins d&apos;une heure.</p>
        </div>
        <div className="lp-steps">
          {items.map((it, i) => (
            <div key={i} className="lp-step">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="lp-step-num">{it.n}</span>
                <span style={{ color: 'var(--primary)' }}>{it.icon}</span>
              </div>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
