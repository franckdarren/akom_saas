import Image from 'next/image'

const features = [
  {
    tag: 'Catalogue intelligent',
    title: 'Gestion complète de vos catalogues',
    image: '/images/1.png',
    imageAlt: 'Interface de gestion du catalogue Akôm',
    items: [
      'Création de catégories et familles personnalisées',
      'Ajout de produits ou services en quelques clics',
      'Activation / désactivation instantanée des articles',
      'Mise à jour en temps réel sur tous les appareils',
      'Génération de QR codes publics ou privés en un clic',
    ],
    quote: "Adaptez vos catalogues à chaque établissement ou secteur d'activité.",
    imageLeft: true,
  },
  {
    tag: 'Sécurité & Organisation',
    title: 'Une plateforme sécurisée et structurée',
    image: '/images/2.png',
    imageAlt: 'Gestion des utilisateurs et permissions Akôm',
    items: [
      'Authentification sécurisée pour chaque utilisateur',
      'Gestion multi-établissement centralisée',
      'Isolation stricte des données par structure',
      'Profils différenciés : Admin, Caissier, Cuisine…',
      'Contrôle précis des accès et permissions',
    ],
    quote: 'Chaque structure conserve ses données de manière indépendante et sécurisée.',
    imageLeft: false,
  },
  {
    tag: 'Performance & Analytics',
    title: 'Pilotez votre activité en temps réel',
    image: '/images/3.png',
    imageAlt: 'Tableau de bord statistiques Akôm',
    items: [
      'Nombre de commandes en direct',
      'Montant total des ventes journalières',
      'Historique journalier détaillé',
      'Statistiques simples et lisibles',
      'Gestion de stock simplifiée',
      'Alertes de stock bas automatiques',
    ],
    quote: 'Prenez des décisions éclairées grâce à des indicateurs clairs et accessibles.',
    imageLeft: true,
  },
]

export default function LandingFeatures() {
  return (
    <section id="features" className="py-20 bg-muted/30 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">

        {/* En-tête */}
        <div className="text-center flex flex-col items-center gap-3 mb-16">
          <span className="type-label-meta text-primary">Fonctionnalités avancées</span>
          <h2 className="type-hero-title max-w-2xl text-foreground">
            Tout ce dont vous avez besoin à un seul endroit
          </h2>
          <p className="type-description max-w-xl">
            Une plateforme complète pour gérer et piloter votre activité.
          </p>
        </div>

        {/* Blocs alternés */}
        <div className="flex flex-col gap-24">
          {features.map((feature, i) => (
            <div
              key={i}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              {/* Image */}
              <div className={feature.imageLeft ? '' : 'lg:order-2'}>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted shadow-md ring-1 ring-border">
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Texte */}
              <div className={`flex flex-col gap-5 ${feature.imageLeft ? '' : 'lg:order-1'}`}>
                <span className="bg-primary-subtle text-primary type-badge px-3 py-1 rounded-full w-fit">
                  {feature.tag}
                </span>
                <h3 className="type-section-title text-foreground">{feature.title}</h3>
                <ul className="flex flex-col gap-2.5">
                  {feature.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 type-body text-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="type-body-muted italic border-l-2 border-primary pl-4">
                  &ldquo;{feature.quote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
