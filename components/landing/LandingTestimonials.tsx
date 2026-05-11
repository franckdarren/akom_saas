import { IconStar } from './LandingIcons'

const testimonials = [
  {
    quote: "On a divisé par trois le temps d'attente entre la commande et la préparation. Mon équipe se concentre enfin sur le service, pas sur la prise de commande.",
    name: 'Marielle Ndong',
    role: 'Gérante · Restaurant Le Mandara, Libreville',
    initials: 'MN',
  },
  {
    quote: "Mes clients parcourent le catalogue depuis leur téléphone et règlent en Airtel Money sans que j'aie besoin d'une caisse physique. Simple, rapide, et ça change tout pour une boutique comme la mienne.",
    name: 'Patrick Obame',
    role: 'Propriétaire · Boutique Mode & Style, Port-Gentil',
    initials: 'PO',
  },
  {
    quote: "On gère trois établissements depuis un seul tableau de bord. Les rapports quotidiens automatiques me font gagner plusieurs heures par semaine.",
    name: 'Sandrine Mboumba',
    role: 'Directrice · Hôtel Savana, Franceville',
    initials: 'SM',
  },
]

export default function LandingTestimonials() {
  return (
    <section className="lp-s" style={{ background: 'color-mix(in srgb, var(--muted) 35%, var(--background))' }}>
      <div className="lp-container">
        <div className="lp-s-head">
          <span className="lp-label-meta" style={{ color: 'var(--primary)' }}>Témoignages</span>
          <h2>Ce que disent nos clients</h2>
        </div>
        <div className="lp-testis">
          {testimonials.map((t, i) => (
            <div key={i} className="lp-testi">
              <div className="lp-stars">
                {[1, 2, 3, 4, 5].map((s) => <IconStar key={s} size={14} />)}
              </div>
              <p className="lp-testi-quote">« {t.quote} »</p>
              <div className="lp-testi-foot">
                <div className="lp-avatar">{t.initials}</div>
                <div className="lp-testi-meta">
                  <div className="lp-name">{t.name}</div>
                  <div className="lp-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
