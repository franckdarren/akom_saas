import Link from 'next/link'
import { Mail, Phone, Facebook, Instagram, Linkedin } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

const navLinks = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Comment ça marche', href: '#how-it-works' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Blog', href: '#blog' },
]

const legalLinks = [
  { label: 'Mentions légales', href: '/legal/terms' },
  { label: 'Confidentialité', href: '/legal/privacy' },
  { label: 'Cookies', href: '/legal/cookies' },
]

const socialLinks = [
  { label: 'Akôm sur Facebook', href: '#', icon: Facebook },
  { label: 'Akôm sur Instagram', href: '#', icon: Instagram },
  { label: 'Akôm sur LinkedIn', href: '#', icon: Linkedin },
]

export default function LandingFooter() {
  return (
    <footer className="bg-foreground text-background">
      {/* Corps principal */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

          {/* Colonne 1 — Logo + tagline + réseaux */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="w-fit">
              <Logo size="md" variant="white" />
            </Link>
            <p className="type-caption text-background/75 leading-relaxed max-w-xs">
              La plateforme de commerce digitale pensée pour les marchés africains.
              Gérez votre catalogue, vos ventes et vos stocks en un seul endroit.
            </p>
            <div className="flex items-center gap-2 mt-1">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-full border border-background/20 flex items-center justify-center text-background/50 hover:border-primary hover:text-primary transition-colors"
                >
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 2 — Navigation */}
          <div className="flex flex-col gap-4">
            <p className="type-label text-background uppercase tracking-wider">Navigation</p>
            <nav className="flex flex-col gap-2.5" aria-label="Liens footer">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="type-body text-background/75 hover:text-background transition-colors w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Colonne 3 — Contact */}
          <div className="flex flex-col gap-4">
            <p className="type-label text-background uppercase tracking-wider">Contact</p>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:contact@akomapp.ga"
                className="flex items-center gap-3 type-body text-background/75 hover:text-background transition-colors w-fit"
              >
                <Mail className="size-4 shrink-0" />
                contact@akomapp.ga
              </a>
              <a
                href="tel:+24176802040"
                className="flex items-center gap-3 type-body text-background/75 hover:text-background transition-colors w-fit"
              >
                <Phone className="size-4 shrink-0" />
                +241 076 80 20 40
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Barre inférieure */}
      <div className="border-t border-background/10">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="type-caption text-background/50">
            © {new Date().getFullYear()} Akôm. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="type-caption text-background/50 hover:text-background/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
