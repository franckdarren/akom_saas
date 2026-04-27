import Link from 'next/link'
import { Logo } from '../ui/logo'

export default function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-foot-grid">
          <div className="lp-foot-about">
            <Link href="#top" className="lp-brand">
              <Logo size="lg" variant="color" />
            </Link>
            <p>Plateforme SaaS de digitalisation pour les restaurants, boutiques et hôtels en Afrique. Conçue au Gabon.</p>
          </div>
          <div className="lp-foot-col">
            <h4>Produit</h4>
            <ul>
              <li><a href="#features">Fonctionnalités</a></li>
              <li><a href="#pricing">Tarifs</a></li>
              <li><a href="#demo">Démo</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="lp-foot-col">
            <h4>Société</h4>
            <ul>
              <li><a href="#">À propos</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="lp-foot-col">
            <h4>Légal</h4>
            <ul>
              <li><Link href="/legal/terms">Mentions légales</Link></li>
              <li><Link href="/legal/terms">Conditions d&apos;utilisation</Link></li>
              <li><Link href="/legal/privacy">Politique de confidentialité</Link></li>
              <li><Link href="/legal/cookies">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="lp-foot-bottom">
          <span>© 2026 Akôm — Tous droits réservés.</span>
          <span>SANTEGAB</span>
        </div>
      </div>
    </footer>
  )
}
