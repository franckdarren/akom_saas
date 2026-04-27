const logos = [
  { name: 'Le Madara', glyph: 'L' },
  { name: 'Café Libreville', glyph: 'CL' },
  { name: 'Saveurs du Komo', glyph: 'SK' },
  { name: 'Bistrot 241', glyph: 'B2' },
  { name: 'Hôtel Atlantique', glyph: 'HA' },
  { name: 'Boutique N\'tum', glyph: 'BN' },
]

export default function LandingLogos() {
  return (
    <section className="lp-logos">
      <div className="lp-container">
        <div className="lp-logos-inner">
          <div className="lp-label-meta" style={{ width: '100%', textAlign: 'center', marginBottom: 4 }}>
            Déjà adopté par des dizaines d&apos;établissements au Gabon
          </div>
          {logos.map((l, i) => (
            <div key={i} className="lp-logo-mark">
              <span className="lp-glyph">{l.glyph}</span>
              <span>{l.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
