import { Quote } from 'lucide-react'
import {
  AppCard,
  CardContent,
} from '@/components/ui/app-card'

const testimonials = [
  {
    name: 'Andréa Bekale',
    role: 'Restaurant Le Palmier – Libreville',
    quote:
      'Depuis que nous utilisons Akôm, les erreurs de commande ont diminué et le service est beaucoup plus fluide. Nos clients adorent le QR code.',
    initials: 'AB',
  },
  {
    name: 'Jean-Pierre Moussavou',
    role: 'Boutique Mode & Style – Port-Gentil',
    quote:
      "La gestion des stocks est devenue beaucoup plus simple. Je reçois les alertes de rupture avant même que ça se vide, c'est un vrai gain de temps.",
    initials: 'JM',
  },
  {
    name: 'Christelle Nzamba',
    role: 'Salon de beauté Élégance – Libreville',
    quote:
      "Mes clientes peuvent consulter mes tarifs depuis leur téléphone. Plus besoin d'imprimer des menus à chaque changement de prix.",
    initials: 'CN',
  },
]

export default function LandingTestimonials() {
  return (
    <section className="py-20 bg-primary">
      <div className="max-w-6xl mx-auto px-4">

        {/* En-tête */}
        <div className="text-center flex flex-col items-center gap-3 mb-12">
          <h2 className="type-hero-title text-primary-foreground">
            Ils font confiance à Akôm
          </h2>
          <p className="type-description text-primary-foreground/90 max-w-2xl">
            Chaque jour, des établissements à travers le Gabon utilisent Akôm pour
            digitaliser leurs catalogues et suivre leurs ventes en temps réel.
          </p>
        </div>

        {/* Grille de témoignages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <AppCard key={t.name} variant="default">
              <CardContent>
                <div className="layout-card-body">
                  {/* Icône quote */}
                  <Quote className="size-6 text-primary" aria-hidden="true" />

                  {/* Citation */}
                  <p className="type-body text-foreground italic flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* Auteur */}
                  <div className="flex items-center gap-3 pt-3 border-t border-border">
                    <div className="w-9 h-9 rounded-full bg-primary-subtle flex items-center justify-center type-badge text-primary font-semibold shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="type-label text-foreground">{t.name}</p>
                      <p className="type-caption">{t.role}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </AppCard>
          ))}
        </div>

      </div>
    </section>
  )
}
