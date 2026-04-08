import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AppCard,
  CardHeader,
  CardContent,
  CardTitle,
} from '@/components/ui/app-card'

const plans = [
  {
    name: 'STARTER',
    price: '3 000',
    desc: 'Idéal pour les petits établissements qui débutent la digitalisation',
    extra: '+ 5 000 FCFA pour chaque profil supplémentaire',
    featured: false,
    features: [
      '1 profil administrateur',
      '3 comptes au maximum',
      '10 tables au maximum',
      '5 catégories',
      '30 produits',
      'Gestion des stocks',
      'Statistiques',
      'Personnalisation limitée',
      'Menu digital accessible par QR code',
    ],
  },
  {
    name: 'BUSINESS',
    price: '5 000',
    desc: 'Conçu pour les établissements en croissance',
    extra: '+ 7 500 FCFA pour chaque profil supplémentaire',
    featured: true,
    features: [
      'Toutes les fonctionnalités STARTER',
      '5 comptes au maximum',
      '50 tables au maximum',
      '15 catégories',
      'Alertes stocks',
      'Historique des mouvements de stocks',
      'Statistiques avancées',
      'Paiements en ligne (Airtel Money, Moov Money)',
      'Magasin de stockage',
      'Données comptables',
      'Support prioritaire',
      'Multi-établissement',
      'Caisse intégrée',
    ],
  },
  {
    name: 'PREMIUM',
    price: '8 000',
    desc: 'Pour les structures multi-sites exigeantes',
    extra: '+ 10 000 FCFA pour chaque profil supplémentaire',
    featured: false,
    features: [
      'Comptes illimités',
      'Tables illimitées',
      'Catégories illimitées',
      'Produits illimités',
      'Gestion des stocks avancée',
      'Statistiques complètes',
      'Personnalisation avancée',
      'Données comptables',
      'Alertes stocks et rapports périodiques',
      'Historique des mouvements de stocks',
      'Magasin de stockage',
      'Support prioritaire',
      'Caisse intégrée',
      'Multi-établissement illimité',
    ],
  },
]

export default function LandingPricing() {
  return (
    <section id="pricing" className="py-20 bg-muted/30 scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4">

        {/* En-tête */}
        <div className="text-center flex flex-col items-center gap-3 mb-12">
          <h2 className="type-hero-title text-foreground">Nos offres d'abonnement</h2>
          <p className="type-description max-w-2xl">
            Choisissez l'offre adaptée à la taille et aux besoins de votre établissement.
          </p>
        </div>

        {/* Grille des plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <AppCard
              key={plan.name}
              variant="pricing"
              className={`relative ${plan.featured ? 'border-primary shadow-lg md:-mt-4' : ''}`}
            >
              {plan.featured && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground type-badge px-4 py-1.5 rounded-full whitespace-nowrap">
                    Le plus vendu
                  </span>
                </div>
              )}

              <CardHeader className={plan.featured ? 'pt-8' : ''}>
                <CardTitle className="type-card-title">Pack {plan.name}</CardTitle>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="type-body-muted"> FCFA / mois</span>
                </div>
                <p className="type-description text-muted-foreground mt-1">{plan.desc}</p>
                <p className="type-caption mt-1">{plan.extra}</p>
              </CardHeader>

              <CardContent>
                <div className="layout-card-body">
                  <ul className="flex flex-col gap-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 type-body text-foreground">
                        <Check className="size-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.featured ? 'default' : 'outline'}
                    className="w-full mt-2"
                    asChild
                  >
                    <Link href="/register">Créer un compte</Link>
                  </Button>
                </div>
              </CardContent>
            </AppCard>
          ))}
        </div>

      </div>
    </section>
  )
}
