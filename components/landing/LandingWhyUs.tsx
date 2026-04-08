import { Zap, BarChart3, Leaf, Smartphone } from 'lucide-react'
import {
  AppCard,
  CardContent,
} from '@/components/ui/app-card'

const advantages = [
  {
    icon: Zap,
    title: 'Mise à jour éclair',
    desc: 'Un changement de prix ? Un produit épuisé ? Modifiez-le en 10 secondes — le QR code ne change jamais.',
  },
  {
    icon: BarChart3,
    title: 'Data & Insights',
    desc: 'Sachez exactement quels produits sont les plus consultés et à quelle heure vos clients scannent.',
  },
  {
    icon: Leaf,
    title: 'Zéro impression',
    desc: 'Réduisez vos coûts de papeterie et faites un geste concret pour la planète. Plus aucune carte à imprimer.',
  },
  {
    icon: Smartphone,
    title: 'Instantané',
    desc: "Vos clients n'ont rien à télécharger. Le catalogue s'ouvre instantanément dans leur navigateur.",
  },
]

export default function LandingWhyUs() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">

        {/* En-tête */}
        <div className="text-center flex flex-col items-center gap-3 mb-12">
          <h2 className="type-hero-title text-foreground">Pourquoi nous ?</h2>
          <p className="type-description max-w-2xl">
            Plus qu'un simple QR code : une solution pensée pour accompagner la croissance
            de votre établissement.
          </p>
        </div>

        {/* Grille d'avantages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.map(({ icon: Icon, title, desc }) => (
            <AppCard key={title} variant="flat" className="bg-primary-subtle border-0">
              <CardContent>
                <div className="layout-card-body">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shadow-sm">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="type-card-title text-foreground">{title}</h3>
                    <p className="type-body-muted">{desc}</p>
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
