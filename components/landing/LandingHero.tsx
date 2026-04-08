import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingHero() {
  return (
    <section className="pt-28 pb-20 md:pt-36 md:pb-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Texte gauche */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 bg-primary-subtle text-primary type-badge px-3 py-1.5 rounded-full w-fit">
              Plateforme de commerce digitale
            </span>

            <h1 className="type-hero-title lg:text-5xl text-foreground">
              Digitalisez votre structure commerciale
            </h1>

            <p className="type-body-muted max-w-lg">
              Centralisez vos catalogues, commandes et encaissements depuis une interface
              sécurisée et évolutive — pensée pour les marchés africains.
            </p>
          </div>

          {/* Logos paiements locaux */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="type-caption">Paiements acceptés :</span>
            <div className="flex items-center gap-3">
              <Image
                src="/images/airtelmoney.webp"
                alt="Airtel Money"
                width={72}
                height={28}
                className="object-contain h-7 w-auto"
              />
              <Image
                src="/images/moovmoney.png"
                alt="Moov Money"
                width={72}
                height={28}
                className="object-contain h-7 w-auto"
              />
            </div>
            <span className="type-caption">· Espèces · Carte</span>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button size="lg" asChild>
              <Link href="/register">
                Commencer gratuitement
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#how-it-works">Voir comment ça marche</Link>
            </Button>
          </div>

          {/* Social proof minimaliste */}
          <p className="type-caption">
            Déjà utilisé par des dizaines d'établissements au Gabon
          </p>
        </div>

        {/* Image droite */}
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative w-full max-w-md aspect-[4/3] rounded-xl overflow-hidden shadow-2xl ring-1 ring-border">
            <Image
              src="/images/1.png"
              alt="Dashboard Akôm — gestion des commandes et catalogues"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 0vw, 448px"
            />
          </div>
        </div>

      </div>
    </section>
  )
}
