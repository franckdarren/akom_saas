import Image from 'next/image'

const steps = [
  {
    title: 'Créez votre compte',
    desc: 'Inscrivez votre établissement et accédez à votre tableau de bord sécurisé en quelques minutes.',
  },
  {
    title: 'Configurez vos catalogues',
    desc: 'Ajoutez vos produits ou services, organisez vos catégories et définissez vos tarifs.',
  },
  {
    title: 'Générez vos QR Codes',
    desc: 'Créez et téléchargez des QR codes sécurisés à afficher dans votre établissement.',
  },
  {
    title: 'Suivez vos ventes',
    desc: 'Consultez les commandes, encaissements et statistiques en temps réel depuis le dashboard.',
  },
]

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">

        {/* En-tête */}
        <div className="text-center flex flex-col items-center gap-3 mb-16">
          <h2 className="type-hero-title text-foreground">
            Comment fonctionne Akôm ?
          </h2>
          <p className="type-description">
            Mise en place et gestion intuitive en 4 étapes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Étapes */}
          <ol className="flex flex-col gap-8">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center type-card-title shrink-0"
                  aria-hidden="true"
                >
                  {i + 1}
                </div>
                <div className="flex flex-col gap-1 pt-1">
                  <h3 className="type-card-title text-foreground">{step.title}</h3>
                  <p className="type-body-muted">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* Illustration */}
          <div className="hidden lg:block">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-primary-subtle shadow-md ring-1 ring-border">
              <Image
                src="/images/3.png"
                alt="Interface Akôm — suivi des ventes en temps réel"
                fill
                className="object-cover"
                sizes="50vw"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
