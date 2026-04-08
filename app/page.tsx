import Image from "next/image";
import Link from "next/link";

export default function Home() {

  const steps = [
  {
    title: "Créez votre compte",
    desc: "Inscrivez votre établissement et accédez à votre tableau de bord sécurisé.",
  },
  {
    title: "Configurez vos catalogues",
    desc: "Ajoutez vos produits ou services en quelques clics.",
  },
  {
    title: "Générez vos QR Codes",
    desc: "Créez et téléchargez des QR codes sécurisés.",
  },
  {
    title: "Suivez vos ventes",
    desc: "Consultez les commandes et les statistiques en temps réel.",
  },
];

interface BlogPost {
  id: number;
  image: string;
  alt: string;
  title: string;
  excerpt: string;
  href: string;
}
 
const posts: BlogPost[] = [
  {
    id: 1,
    image: "/images/4.png",
    alt: "Export PDF et CSV",
    title: "Nouvelle fonctionnalité : Export PDF & CSV",
    excerpt:
      "Les utilisateurs Business et Premium peuvent désormais exporter leurs statistiques de ventes en PDF et CSV pour une meilleure gestion comptable.",
    href: "/blog/export-pdf-csv",
  },
  {
    id: 2,
    image: "/images/4.png",
    alt: "Amélioration des alertes de stock",
    title: "Amélioration des alertes de stock",
    excerpt:
      "Les alertes de stock bas sont maintenant personnalisables selon vos seuils minimaux.",
    href: "/blog/alertes-stock",
  },
  {
    id: 3,
    image: "/images/4.png",
    alt: "Akôm récompensé pour l'innovation digitale",
    title: "Akôm récompensé pour l'innovation digitale",
    excerpt:
      "Akôm a été distingué parmi les solutions digitales innovantes contribuant à la modernisation des entreprises locales. Cette reconnaissance confirme...",
    href: "/blog/akom-innovation-digitale",
  },
];

  return (
    <div className="">
      <main className="">
        <nav className="bg-white fixed w-full z-20 top-0 start-0 border-b border-default">
          <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
            <a href="https://flowbite.com/" className="flex items-center space-x-3 rtl:space-x-reverse">
                <img src="https://flowbite.com/docs/images/logo.svg" className="h-7" alt="Flowbite Logo"/>
                <span className="self-center text-xl text-heading font-semibold whitespace-nowrap">Akôm</span>
            </a>
            <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                <button type="button" className="text-heading bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none">S'inscrire</button>
                <button data-collapse-toggle="navbar-sticky" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body rounded-base md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary" aria-controls="navbar-sticky" aria-expanded="false">
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-strokelinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14"/></svg>
                </button>
            </div>
            <div className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-sticky">
              <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-default rounded-base bg-neutral-secondary-soft md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-neutral-primary">
                <li>
                  <a href="#" className="block py-2 px-3 text-heading bg-brand rounded-sm md:bg-transparent md:text-fg-brand md:p-0" aria-current="page">Accueil</a>
                </li>
                <li>
                  <a href="#" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0 md:dark:hover:bg-transparent">A propos</a>
                </li>
                <li>
                  <a href="#" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0 md:dark:hover:bg-transparent">Fonctionnalités</a>
                </li>
                <li>
                  <a href="#" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0 md:dark:hover:bg-transparent">Offres</a>
                </li>
                <li>
                  <a href="#" className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0 md:dark:hover:bg-transparent">Blog</a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        <section className="bg-white dark:bg-gray-900 mt-10">
          <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
              <div className="mr-auto place-self-center lg:col-span-7">
                  <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">Digitaliser votre structure commerciale</h1>
                  <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">Centralisez vos menus, catalogues et commandes depuis une interfaces sécurisée et évolutives.</p>
                  <a href="#" className="inline-flex items-center justify-center px-5 py-3 mr-3 text-base font-medium text-center text-white rounded-lg bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-900">
                      Demander une demo
                      <svg className="w-5 h-5 ml-2 -mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  </a>
                  <a href="#" className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
                      En savoir plus
                  </a> 
              </div>
              <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
                  <img src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/hero/phone-mockup.png" alt="mockup"/>
              </div>                
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 mt-10 flex flex-col items-center justify-center">
          <span className="bg-fuchsia-200 text-fg-danger-strong text-sm font-medium px-5 py-1 rounded-xl mb-4">
            Fonctonnalités avancées
          </span>
          <h1 className="max-w-2xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Tout ce dont vous avez besoin à un seul endroit
          </h1>
          <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">Une plateforme complète pour gérer et piloter votre activité.</p>
          {/* Fonctionnalité 1 */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full py-10">
              <div className="space-y-6">
                <img src="/images/1.png" alt="image" />
              </div>
              <div className="flex flex-col justify-center space-y-4">

                <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm w-fit">
                  Catalogue intelligent
                </span>

                <h1 className="text-2xl font-bold text-gray-800">
                  Gestion complète de vos catalogues
                </h1>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Création des catégories et familles personnalisées
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Ajout de produits ou services en quelques clics
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Activation / désactivation instantanée des articles
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Mise à jour en temps réel sur tous les appareils
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Génération de QR codes publics ou privés en un clic
                  </li>
                </ul>

                <p className="text-sm text-gray-400 italic mt-4">
                  "Adaptez vos catalogues à chaque établissement ou secteur d’activité."
                </p>

              </div>

            </div>
          </div>
          {/* Fonctionnalité 2 */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full py-10">
              <div className="flex flex-col justify-center space-y-4">

                <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm w-fit">
                  Sécurité & Organisation
                </span>

                <h1 className="text-2xl font-bold text-gray-800">
                  Une plateforme sécurisée et structurée
                </h1>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Authentification sécurisée pour chaque utilisateur
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Gestion multi-établissement centralisée
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Isolation stricte des données par structure
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Profils utilisateurs différents : Admin, Caissier...                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Controle précis des accès et permissions
                  </li>
                </ul>

                <p className="text-sm text-gray-400 italic mt-4">
                  "Chaque structure conserve ses données de manière indépendante et sécurisée."
                </p>

              </div>
              <div className="space-y-6">
                <img src="/images/2.png" alt="image" />
              </div>

            </div>
          </div>
          {/* Fonctionnalité 3 */}
          <div className="flex items-center justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full py-10">
              <div className="space-y-6">
                <img src="/images/3.png" alt="image" />
              </div>
              <div className="flex flex-col justify-center space-y-4">

                <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm w-fit">
                  Performance & Analytics
                </span>

                <h1 className="text-2xl font-bold text-gray-800">
                  Pilotez votre activité en temps réel
                </h1>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Nombre de commandes en direct
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Montant total des ventes jornalières
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Historique journalier détaillé
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Statistiques simples et lisibles
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Gestion de stock simplifiée
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                    Alertes de stock bas automatiques
                  </li>
                </ul>

                <p className="text-sm text-gray-400 italic mt-4">
                  "Prenez des décisions éclairées grâce à des indicateurs clairs et accessibles."
                </p>

              </div>

            </div>
          </div>
        </section>

        <section className="bg-gray-100 dark:bg-gray-900 mt-10 py-15 flex flex-col items-center justify-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Une solution, des possibilités infinies
          </h1>
          <p className="max-w-3xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400 text-center">Akôm s’adapte à votre métier pour digitaliser vos services et booster votre engagement client en un scan.</p>
          <div className="py-10 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                <img src="/images/4.png" alt="Commerce" className="w-full h-40 object-cover"/>

                <div className="p-5 text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Commerce</h3>
                  <p className="text-sm text-gray-500">
                    Créez des vitrines connectées. Permettez à vos clients de commander un produit en rupture de stock directement depuis leur mobile.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                <img src="/images/4.png" alt="Transport" className="w-full h-40 object-cover"/>

                <div className="p-5 text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Transport</h3>
                  <p className="text-sm text-gray-500">
                    Créez des vitrines connectées. Permettez à vos clients de commander un produit en rupture de stock directement depuis leur mobile.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                <img src="/images/4.png" alt="Hôtellerie" className="w-full h-40 object-cover"/>

                <div className="p-5 text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Hôtellerie</h3>
                  <p className="text-sm text-gray-500">
                    Créez des vitrines connectées. Permettez à vos clients de commander un produit en rupture de stock directement depuis leur mobile.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
                <img src="/images/4.png" alt="Hôtellerie" className="w-full h-40 object-cover"/>

                <div className="p-5 text-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Hôtellerie</h3>
                  <p className="text-sm text-gray-500">
                    Créez des vitrines connectées. Permettez à vos clients de commander un produit en rupture de stock directement depuis leur mobile.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 mt-10 flex flex-col items-center justify-center">
          <h1 className=" mb-4 text-4xl font-bold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Comment fonctionne Akôm ?
          </h1>
          <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">Mise en place et gestion intuitive.</p>
          <div className="bg-white py-10 px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* LEFT */}
              <div className="space-y-8">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-500 text-white font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT */}
              <div className="w-full h-80 lg:h-[400px] bg-purple-300 rounded-xl"></div>

            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 mt-10 flex flex-col items-center justify-center">
          <h1 className="max-w-2xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Pourquoi nous ?
          </h1>
          <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400 text-center">Bien qu’un simple QR Code : c’est la solution pensée pour accompagner la croissance de votre entreprise.</p>
          <div className="bg-white p-6 rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="bg-purple-50 rounded-2xl p-5 flex flex-col gap-3">
                <div className="w-12 h-12 bg-purple-200 rounded-xl"></div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Mise à jour éclair</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Un changement de prix ? Un produit épuisé ? Modifiez-le en 10 secondes,
                    le QR code ne change jamais.
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-5 flex flex-col gap-3">
                <div className="w-12 h-12 bg-purple-200 rounded-xl"></div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Data & Insights</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Sachez exactement quels produits sont les plus consultés et à quelle
                    heure vos clients scannent.
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-5 flex flex-col gap-3">
                <div className="w-12 h-12 bg-purple-200 rounded-xl"></div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Zéro impression</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Réduisez vos coûts de papeterie de 100% et faites un geste concret
                    pour la planète.
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-5 flex flex-col gap-3">
                <div className="w-12 h-12 bg-purple-200 rounded-xl"></div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Instantané</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Vos clients n'ont rien à télécharger. Le catalogue s'ouvre
                    instantanément dans leur navigateur.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 mt-10 flex flex-col items-center justify-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Ils font confiance à Akôm
          </h1>
          <p className="max-w-4xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400 text-center">Chaque jour, des restaurants, snacks et établissements divers utilise Akôm pour digitaliser leurs catalogues, optimiser leur gestion et suivre leurs ventes en temps réel.</p>
          <div className="bg-purple-600 py-12 px-4 rounded-2xl overflow-hidden">
            <div className="relative flex items-center justify-center gap-4">

              <div className="hidden sm:block w-48 bg-white rounded-2xl p-5 opacity-70 shrink-0 self-stretch">
                <p className="text-xs text-gray-400 leading-relaxed">Lorem ipsum dolor sit...</p>
              </div>

              <div className="bg-white rounded-2xl p-8 w-full max-w-md flex flex-col items-center text-center shadow-xl shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 mb-4">
                  <img src="/avatar.jpg" alt="Andréa Bekale" className="w-full h-full object-cover" />
                </div>

                <h3 className="text-sm font-bold tracking-widest text-gray-900 uppercase mb-1">
                  Andréa Bekale
                </h3>

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Restaurant Le Palmier – Libreville
                </p>

                <p className="text-xs text-gray-500 leading-relaxed italic">
                  "Depuis que nous utilisons Akôm, les erreurs de commande ont diminué
                  et le service est beaucoup plus fluide. Nos clients adorent le QR code."
                </p>
              </div>

              <div className="hidden sm:block w-48 bg-white rounded-2xl p-5 opacity-70 shrink-0 self-stretch">
                <p className="text-xs text-gray-400 leading-relaxed">scing elit. Viverra nunc...</p>
              </div>

            </div>
            <div className="flex justify-center gap-2 mt-8">
              <button className="w-2.5 h-2.5 rounded-full bg-white"></button>
              <button className="w-2.5 h-2.5 rounded-full bg-white/40"></button>
              <button className="w-2.5 h-2.5 rounded-full bg-white/40"></button>
              <button className="w-2.5 h-2.5 rounded-full bg-white/40"></button>
              <button className="w-2.5 h-2.5 rounded-full bg-white/40"></button>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 mt-10 flex flex-col items-center justify-center">
          <h1 className=" mb-4 text-4xl font-bold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Nos offres d’abonnement
          </h1>
          <p className="max-w-5xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">Choisissez l’offre adaptée à la taille et aux besoins de votre organisation.</p>
          <section className="bg-white py-12 px-4">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
              <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Pack STARTER</h2>
                  <div className="mt-1">
                    <span className="text-3xl font-bold text-gray-900">3000 FCFA</span>
                    <span className="text-sm text-gray-500"> / mois</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Idéal pour les petits établissements qui débutent la digitalisation</p>
                  <p className="text-xs text-gray-400 mt-2">+ 5000 FCFA pour chaque profil supplémentaire</p>
                </div>
                <ul className="flex flex-col gap-2 text-xs text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>1 profil administrateur</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>3 comptes au maximum</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>10 tables au maximum</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>5 catégories</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>30 produits</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Gestion des stocks</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Statistiques</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Personnalisation limitée</li>
                  <li className="flex items-start gap-2"><span className="text-gray-400 mt-0.5">✓</span><span className="text-gray-400">*Données comptables optionnelles</span></li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Menu digital accessible par QR code</li>
                </ul>
                <button className="mt-auto border border-purple-600 text-purple-600 rounded-xl py-2.5 text-sm font-medium hover:bg-purple-50 transition-colors cursor-pointer">
                  Créer un compte
                </button>
              </div>
        
              <div className="bg-gray-900 rounded-2xl p-6 flex flex-col gap-4 relative mt-4 md:mt-0">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap">Le plus vendu</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Pack BUSINESS</h2>
                  <div className="mt-1">
                    <span className="text-3xl font-bold text-white">5000 FCFA</span>
                    <span className="text-sm text-gray-400"> / mois</span>
                  </div>
                  <p className="text-xs text-purple-400 mt-1">Conçu pour les établissements en croissance</p>
                  <p className="text-xs text-gray-400 mt-2">+ 7500 FCFA pour chaque profil supplémentaire</p>
                </div>
                <ul className="flex flex-col gap-2 text-xs text-gray-300">
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Toutes les fonctionnalités STARTER</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>5 comptes au maximum</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>50 tables au maximum</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>15 catégories</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Alertes stocks</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Historiques mouvements des stocks</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Statistiques avancées</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Paiements en ligne</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Magasin de stockage</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Données comptables</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Support prioritaire</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Multistructure</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 mt-0.5">✓</span>Caisse</li>
                </ul>
                <button className="mt-auto bg-purple-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-purple-700 transition-colors cursor-pointer">
                  Créer un compte
                </button>
              </div>
        
              <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Pack PREMIUM</h2>
                  <div className="mt-1">
                    <span className="text-3xl font-bold text-gray-900">8000 FCFA</span>
                    <span className="text-sm text-gray-500"> / mois</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-1">Conçu pour les établissements en croissance</p>
                  <p className="text-xs text-gray-400 mt-2">+ 10000 FCFA pour chaque profil supplémentaire</p>
                </div>
                <ul className="flex flex-col gap-2 text-xs text-gray-700">
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span><strong>Comptes illimités</strong></li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span><strong>Tables illimitées</strong></li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span><strong>Catégories illimitées</strong></li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span><strong>Produits illimités</strong></li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Gestion des stocks</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Statistiques</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Personnalisation avancée</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Données comptables</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Alertes stocks et périodiques</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Historiques mouvements des stocks</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Statistiques avancées</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Magasin de stockage</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Support prioritaire</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Caisse</li>
                  <li className="flex items-start gap-2"><span className="text-purple-600 mt-0.5">✓</span>Multirestauration</li>
                </ul>
                <button className="mt-auto border border-purple-600 text-purple-600 rounded-xl py-2.5 text-sm font-medium hover:bg-purple-50 transition-colors cursor-pointer">
                  Créer un compte
                </button>
              </div>
        
            </div>
          </section>
        </section>

        <section className="bg-white py-16 px-4 flex flex-col items-center text-center gap-8">

            <p className="text-gray-900 font-semibold text-lg leading-snug max-w-sm">
              Scannez cette QR pour voir le menu <br />
              exactement comme les clients <br />
              le feraient dans votre restaurant.
            </p>

            <div className="relative flex flex-col items-center">

              <div className="absolute -top-7 right-2 flex items-center gap-1 z-10">
                <span>
                  Scannez le QR
                </span>
                <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                  <path d="M2 2 C8 4, 14 10, 20 18" stroke="#e11d48" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <path d="M17 20 L20 18 L18 15" stroke="#e11d48" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-5 w-52 h-52 flex items-center justify-center">
                <div id="qrcode"></div>
              </div>
            </div>

            <a href="#" className="bg-purple-600 hover:bg-purple-700 transition-colors text-white text-sm font-medium px-8 py-3 rounded-full">
              Ou ouvrez ce lien
            </a>

        </section>

        <section className="bg-white dark:bg-gray-900 mt-10 flex flex-col items-center justify-center">
          <h1 className="max-w-5xl mb-4 text-4xl font-bold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            Les dernières nouveautés
          </h1>
          <p className="max-w-5xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400 text-center">Découvrez les nouveautés, mises à jour et évolutions de la platforme Akôm.
            Nous améliorons continuellement notre solution pour répondre aux besoins des entreprises et structures multi-sites</p>
          <section className="bg-white py-12 px-4">
            <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article key={post.id} className="flex flex-col gap-3">
      
                  {/* Image */}
                  <div className="w-full aspect-video relative overflow-hidden rounded-sm bg-gray-100">
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
      
                  {/* Contenu */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wide text-gray-900 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <Link
                      href={post.href}
                      className="text-xs font-bold uppercase tracking-widest text-gray-900 hover:text-purple-600 transition-colors mt-1"
                    >
                      Lire plus
                    </Link>
                  </div>
      
                </article>
              ))}
            </div>
          </section>
        </section>
          
        <footer className="bg-[#1a1a2e] relative pt-16 pb-8 px-6">
          {/* Carte contact flottante */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <div className="bg-white rounded-2xl shadow-lg px-8 py-5 flex flex-col sm:flex-row items-center justify-center gap-6">
    
              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <a
                  href="mailto:contact@akomapp.ga"
                  className="text-sm font-medium text-gray-800 hover:text-purple-600 transition-colors"
                >
                  contact@akomapp.ga
                </a>
              </div>
    
              {/* Séparateur */}
              <div className="hidden sm:block w-px h-8 bg-gray-200" />
    
              {/* Téléphone */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <a
                  href="tel:+24176802040"
                  className="text-sm font-medium text-gray-800 hover:text-purple-600 transition-colors"
                >
                  076 80 20 40
                </a>
              </div>
    
            </div>
          </div>
    
          {/* Contenu footer */}
          <div className="max-w-5xl mx-auto pt-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
    
              {/* Logo */}
              <Link href="/" className="text-white font-black text-xl tracking-widest uppercase">
                AKOM
              </Link>
    
              {/* Réseaux sociaux */}
              <div className="flex items-center gap-3">
    
                {/* Facebook */}
                <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center hover:border-purple-500 transition-colors">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
    
                {/* Instagram */}
                <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center hover:border-purple-500 transition-colors">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
                  </svg>
                </a>
    
                {/* LinkedIn */}
                <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center hover:border-purple-500 transition-colors">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
    
              </div>
            </div>
    
            {/* Bas de page */}
            <div className="border-t border-gray-700 mt-6 pt-6">
              <p className="text-xs text-gray-500 text-center">
                © {new Date().getFullYear()} Akôm. Tous droits réservés.
              </p>
            </div>
    
          </div>
        </footer>  
      </main>
    </div>
  );
}
