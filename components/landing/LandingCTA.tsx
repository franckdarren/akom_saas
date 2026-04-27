import { IconArrowRight } from './LandingIcons'

export default function LandingCTA() {
  return (
    <div className="lp-container">
      <div className="lp-cta-final">
        <div className="lp-cta-final-inner">
          <span className="lp-cta-eyebrow">
            <span style={{ width: 6, height: 6, borderRadius: '999px', background: 'var(--background)', display: 'inline-block' }} />
            Disponible dès aujourd&apos;hui
          </span>
          <h2>Lancez votre commerce digital cette semaine</h2>
          <p>Sans matériel, sans formation longue, sans engagement. Choisissez votre plan et configurez votre premier menu en moins d&apos;une heure.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
            <a href="#pricing" className="lp-btn lp-btn-primary lp-btn-lg">
              Choisir un plan <IconArrowRight />
            </a>
            <a href="#demo" className="lp-btn lp-btn-outline lp-btn-lg">
              Revoir la démo
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
