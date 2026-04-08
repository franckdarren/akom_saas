import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface BlogPost {
  id: number
  image: string
  alt: string
  title: string
  excerpt: string
  href: string
}

const posts: BlogPost[] = [
  {
    id: 1,
    image: '/images/4.png',
    alt: 'Export PDF et CSV',
    title: 'Nouvelle fonctionnalité : Export PDF & CSV',
    excerpt:
      'Les utilisateurs Business et Premium peuvent désormais exporter leurs statistiques de ventes en PDF et CSV pour une meilleure gestion comptable.',
    href: '/blog/export-pdf-csv',
  },
  {
    id: 2,
    image: '/images/4.png',
    alt: 'Amélioration des alertes de stock',
    title: 'Amélioration des alertes de stock',
    excerpt:
      "Les alertes de stock bas sont maintenant personnalisables selon vos seuils minimaux. Définissez votre propre niveau d'alerte par produit.",
    href: '/blog/alertes-stock',
  },
  {
    id: 3,
    image: '/images/4.png',
    alt: 'Akôm récompensé pour l\'innovation digitale',
    title: 'Akôm récompensé pour l\'innovation digitale',
    excerpt:
      "Akôm a été distingué parmi les solutions digitales innovantes contribuant à la modernisation des entreprises locales.",
    href: '/blog/akom-innovation-digitale',
  },
]

export default function LandingBlog() {
  return (
    <section id="blog" className="py-20 bg-background scroll-mt-20">
      <div className="max-w-5xl mx-auto px-4">

        {/* En-tête */}
        <div className="text-center flex flex-col items-center gap-3 mb-12">
          <h2 className="type-hero-title text-foreground">
            Les dernières nouveautés
          </h2>
          <p className="type-description max-w-2xl">
            Découvrez les mises à jour et évolutions de la plateforme Akôm.
            Nous améliorons continuellement notre solution pour répondre aux besoins
            des entreprises.
          </p>
        </div>

        {/* Grille d'articles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col gap-4 group">

              {/* Image */}
              <div className="aspect-video relative overflow-hidden rounded-lg bg-muted">
                <Image
                  src={post.image}
                  alt={post.alt}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>

              {/* Contenu */}
              <div className="flex flex-col gap-2 flex-1">
                <h3 className="type-card-title text-foreground leading-snug">
                  {post.title}
                </h3>
                <p className="type-body-muted line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <Link
                  href={post.href}
                  className="flex items-center gap-1 type-label text-primary hover:underline mt-1 w-fit"
                  aria-label={`Lire l'article : ${post.title}`}
                >
                  Lire plus
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  )
}
