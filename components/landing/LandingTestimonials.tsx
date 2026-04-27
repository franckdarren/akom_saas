import { IconStar } from './LandingIcons'

const testimonials = [
  {
    quote: "On a divisé par trois le temps d'attente entre la commande et la cuisine. Mes serveurs se concentrent enfin sur le service, pas sur la prise de commande.",
    name: 'Marielle Ndong',
    role: 'Gérante · Le Mandara, Libreville',
    initials: 'MN',
  },
  {
    quote: "L'intégration Airtel et Moov Money a été immédiate. Mes clients paient depuis leur téléphone, je n'ai plus de problème de monnaie en fin de service.",
    name: 'Patrick Obame',
    role: 'Propriétaire · Café Atlantique',
    initials: 'PO',
  },
  {
    quote: "Mise en place en une après-midi. Mon équipe a compris l'écran cuisine en cinq minutes. Le coût mensuel est honnête, à la portée d'un petit restaurant.",
    name: 'Sandrine Mboumba',
    role: 'Cheffe · Saveurs du Komo',
    initials: 'SM',
  },
]

export default function LandingTestimonials() {
  return (
    <section className="lp-s" style={{ background: 'color-mix(in srgb, var(--muted) 35%, var(--background))' }}>
      <div className="lp-container">
        <div className="lp-s-head">
          <span className="lp-label-meta" style={{ color: 'var(--primary)' }}>Témoignages</span>
          <h2>Ce que disent nos restaurateurs</h2>
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
