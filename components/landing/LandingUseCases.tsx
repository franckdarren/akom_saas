import Image from 'next/image'
import {
  AppCard,
  CardContent,
  CardTitle,
} from '@/components/ui/app-card'

const sectors = [
  {
    title: 'Commerce & Boutiques',
    image: '/images/4.png',
    desc: 'Vitrines connectées pour vos boutiques. Commandes en ligne depuis un simple scan, catalogue toujours à jour.',
  },
  {
    title: 'Restauration',
    image: '/images/4.png',
    desc: 'Menus digitaux, prises de commande tablette ou QR code, suivi en temps réel en cuisine.',
  },
  {
    title: 'Hôtellerie',
    image: '/images/4.png',
    desc: 'Services de chambre digitalisés, menus de restaurant intégrés, check-in simplifié.',
  },
  {
    title: 'Beauté & Services',
    image: '/images/4.png',
    desc: 'Catalogues de prestations, tarifs consultables en ligne, gestion des rendez-vous simplifiée.',
  },
]

export default function LandingUseCases() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">

        {/* En-tête */}
        <div className="text-center flex flex-col items-center gap-3 mb-12">
          <h2 className="type-hero-title text-foreground">
            Une solution, des possibilités infinies
          </h2>
          <p className="type-description max-w-2xl">
            Akôm s'adapte à votre métier pour digitaliser vos services et booster
            votre engagement client en un scan.
          </p>
        </div>

        {/* Grille de secteurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectors.map((sector) => (
            <AppCard
              key={sector.title}
              variant="default"
              className="overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="aspect-video relative overflow-hidden">
                <Image
                  src={sector.image}
                  alt={sector.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <CardContent>
                <div className="layout-card-body">
                  <CardTitle className="type-card-title">{sector.title}</CardTitle>
                  <p className="type-body-muted">{sector.desc}</p>
                </div>
              </CardContent>
            </AppCard>
          ))}
        </div>

      </div>
    </section>
  )
}
