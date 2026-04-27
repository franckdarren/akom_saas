'use client'

import Link from 'next/link'
import { IconArrowRight } from './LandingIcons'
import { Logo } from '../ui/logo'

export default function LandingNav() {
  return (
    <nav className="lp-nav">
      <div className="lp-container lp-nav-inner">
        <Link href="#top" className="lp-brand">
          <Logo size="lg" variant="color" />
        </Link>
        <div className="lp-nav-links">
          <a href="#how">Comment ça marche</a>
          <a href="#features">Fonctionnalités</a>
          <a href="#demo">Démo</a>
          <a href="#pricing">Tarifs</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="lp-nav-cta">
          <Link href="/login" className="lp-btn lp-btn-ghost" style={{ padding: '8px 14px' }}>
            Se connecter
          </Link>
          <Link href="#pricing" className="lp-btn lp-btn-primary">
            Essayer Akôm <IconArrowRight />
          </Link>
        </div>
      </div>
    </nav>
  )
}
