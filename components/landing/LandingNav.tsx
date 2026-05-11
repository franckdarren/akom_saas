'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '../ui/logo'

const NAV_LINKS = [
  { href: '#how', label: 'Comment ça marche' },
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#demo', label: 'Démo' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#faq', label: 'FAQ' },
]

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="lp-nav">
      <div className="lp-container lp-nav-inner">
        <Link href="#top" className="lp-brand">
          <Logo size="md" variant="color" />
        </Link>
        <nav className="lp-nav-links">
          {NAV_LINKS.map(n => (
            <a key={n.href} href={n.href}>{n.label}</a>
          ))}
        </nav>
        <div className="lp-nav-actions">
          <Link href="/login" className="lp-nav-login">Connexion</Link>
          <Link href="/register" className="lp-btn lp-btn-primary">Essai gratuit</Link>
        </div>
        <div className="lp-mobile-right">
          <Link href="/register" className="lp-btn lp-btn-primary">Essai gratuit</Link>
          <button
            className="lp-mobile-menu-btn"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <div className={`lp-mobile-menu${menuOpen ? ' lp-open' : ''}`}>
        <div className="lp-container">
          {NAV_LINKS.map(n => (
            <a
              key={n.href}
              href={n.href}
              className="lp-mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              {n.label}
            </a>
          ))}
          <div className="lp-mobile-actions">
            <Link href="/login" className="lp-mobile-login">Connexion</Link>
          </div>
        </div>
      </div>
    </header>
  )
}
