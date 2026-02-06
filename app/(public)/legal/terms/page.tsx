import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Conditions Générales d\'Utilisation | Akôm',
    description:
        'Consultez les conditions générales d\'utilisation de la plateforme Akôm.',
}

export default function TermsPage() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold mb-8">
                Conditions Générales d'Utilisation
            </h1>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
                <p className="text-muted-foreground text-lg mb-8">
                    Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                </p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
                    <p>
                        Les présentes Conditions Générales d'Utilisation (ci-après "CGU")
                        ont pour objet de définir les modalités et conditions d'utilisation
                        de la plateforme Akôm (ci-après "la Plateforme"), ainsi que les
                        droits et obligations des parties dans ce cadre.
                    </p>
                    <p>
                        La Plateforme est accessible à l'adresse{' '}
                        <a href="https://akom.app" className="text-primary hover:underline">
                            https://akom.app
                        </a>
                        .
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">2. Mentions légales</h2>
                    <p>La Plateforme est éditée par :</p>
                    <ul>
                        <li>Raison sociale : Akôm</li>
                        <li>Siège social : [Votre adresse]</li>
                        <li>Email : contact@akom.app</li>
                        <li>Numéro de téléphone : [Votre numéro]</li>
                        <li>Directeur de publication : [Nom du directeur]</li>
                    </ul>
                    <p>Hébergement :</p>
                    <ul>
                        <li>Nom : Supabase Inc.</li>
                        <li>Adresse : [Adresse de Supabase]</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">3. Acceptation des CGU</h2>
                    <p>
                        L'accès et l'utilisation de la Plateforme impliquent l'acceptation
                        pleine et entière des présentes CGU. En créant un compte ou en
                        utilisant nos services, vous reconnaissez avoir lu, compris et
                        accepté ces conditions.
                    </p>
                    <p>
                        Si vous n'acceptez pas ces CGU, vous ne devez pas utiliser la
                        Plateforme.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        4. Description du service
                    </h2>
                    <p>
                        Akôm est une plateforme SaaS (Software as a Service) de gestion de
                        restaurants qui permet aux professionnels de la restauration de :
                    </p>
                    <ul>
                        <li>Gérer leur menu digital et leurs produits</li>
                        <li>Recevoir et traiter les commandes clients via QR code</li>
                        <li>Gérer les stocks et les approvisionnements</li>
                        <li>Suivre les paiements et la trésorerie</li>
                        <li>Consulter des statistiques et rapports de vente</li>
                        <li>Gérer les tables et l'organisation du service</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">5. Inscription</h2>
                    
                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        5.1 Création de compte
                    </h3>
                    <p>
                        Pour utiliser la Plateforme, vous devez créer un compte en
                        fournissant :
                    </p>
                    <ul>
                        <li>Une adresse email valide</li>
                        <li>Un mot de passe sécurisé</li>
                        <li>Les informations relatives à votre restaurant</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        5.2 Exactitude des informations
                    </h3>
                    <p>
                        Vous vous engagez à fournir des informations exactes, complètes et
                        à jour. Vous êtes responsable de maintenir la confidentialité de vos
                        identifiants de connexion et de toutes les activités effectuées sous
                        votre compte.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        5.3 Âge minimum
                    </h3>
                    <p>
                        Vous devez avoir au moins 18 ans pour créer un compte et utiliser
                        nos services.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        6. Utilisation de la Plateforme
                    </h2>
                    
                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        6.1 Utilisation autorisée
                    </h3>
                    <p>Vous vous engagez à utiliser la Plateforme uniquement :</p>
                    <ul>
                        <li>De manière légale et conforme aux présentes CGU</li>
                        <li>
                            Pour la gestion de votre activité de restauration professionnelle
                        </li>
                        <li>Dans le respect des droits de propriété intellectuelle</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        6.2 Interdictions
                    </h3>
                    <p>Il est strictement interdit de :</p>
                    <ul>
                        <li>
                            Utiliser la Plateforme à des fins illégales ou frauduleuses
                        </li>
                        <li>
                            Tenter d'accéder de manière non autorisée aux données d'autres
                            utilisateurs
                        </li>
                        <li>Introduire des virus ou codes malveillants</li>
                        <li>
                            Effectuer du reverse engineering ou décompiler le logiciel
                        </li>
                        <li>Revendre ou sous-licencier l'accès à la Plateforme</li>
                        <li>
                            Utiliser des robots, scrapers ou outils automatisés sans
                            autorisation
                        </li>
                        <li>Surcharger intentionnellement nos serveurs</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        7. Tarifs et paiement
                    </h2>
                    
                    <h3 className="text-xl font-semibold mb-3 mt-6">7.1 Abonnement</h3>
                    <p>
                        L'accès à la Plateforme est soumis à un abonnement mensuel ou annuel
                        selon la formule choisie. Les tarifs sont indiqués sur notre site
                        web et peuvent être modifiés moyennant un préavis de 30 jours.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        7.2 Modalités de paiement
                    </h3>
                    <p>
                        Le paiement s'effectue par carte bancaire ou Mobile Money. Les
                        abonnements sont renouvelés automatiquement sauf résiliation de
                        votre part.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">7.3 Facturation</h3>
                    <p>
                        Une facture est émise pour chaque paiement et vous est envoyée par
                        email. En cas d'échec de paiement, l'accès à votre compte pourra
                        être suspendu après un délai de grâce de 7 jours.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        8. Résiliation et suspension
                    </h2>
                    
                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        8.1 Résiliation par l'utilisateur
                    </h3>
                    <p>
                        Vous pouvez résilier votre abonnement à tout moment depuis les
                        paramètres de votre compte. La résiliation prend effet à la fin de
                        la période de facturation en cours. Aucun remboursement n'est
                        effectué pour les périodes déjà payées.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        8.2 Suspension ou résiliation par Akôm
                    </h3>
                    <p>
                        Nous nous réservons le droit de suspendre ou résilier votre compte
                        en cas de :
                    </p>
                    <ul>
                        <li>Non-paiement de l'abonnement</li>
                        <li>Violation des présentes CGU</li>
                        <li>Activité frauduleuse ou illégale</li>
                        <li>Abus ou utilisation excessive des ressources</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Propriété intellectuelle</h2>
                    
                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        9.1 Droits d'Akôm
                    </h3>
                    <p>
                        Tous les éléments de la Plateforme (logiciels, textes, images,
                        logos, design, etc.) sont la propriété exclusive d'Akôm ou de ses
                        partenaires et sont protégés par les lois relatives à la propriété
                        intellectuelle.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        9.2 Licence d'utilisation
                    </h3>
                    <p>
                        Akôm vous accorde une licence limitée, non exclusive, non
                        transférable pour utiliser la Plateforme conformément aux présentes
                        CGU.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        9.3 Contenu utilisateur
                    </h3>
                    <p>
                        Vous conservez tous les droits sur le contenu que vous publiez sur
                        la Plateforme (menus, produits, images). Vous nous accordez
                        toutefois une licence pour héberger, stocker et afficher ce contenu
                        dans le cadre de la fourniture du service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        10. Protection des données personnelles
                    </h2>
                    <p>
                        Le traitement de vos données personnelles est régi par notre{' '}
                        <a
                            href="/legal/privacy"
                            className="text-primary hover:underline"
                        >
                            Politique de Confidentialité
                        </a>
                        , que vous acceptez en utilisant la Plateforme.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        11. Responsabilité et garanties
                    </h2>
                    
                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        11.1 Disponibilité du service
                    </h3>
                    <p>
                        Nous nous efforçons de maintenir la Plateforme accessible 24h/24 et
                        7j/7. Toutefois, nous ne pouvons garantir une disponibilité absolue
                        et nous nous réservons le droit d'interrompre temporairement l'accès
                        pour maintenance ou mise à jour.
                    </p>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        11.2 Limitation de responsabilité
                    </h3>
                    <p>
                        Akôm ne pourra être tenu responsable des dommages indirects,
                        accessoires ou consécutifs résultant de l'utilisation ou de
                        l'impossibilité d'utiliser la Plateforme, incluant notamment :
                    </p>
                    <ul>
                        <li>La perte de données</li>
                        <li>La perte de revenus ou de bénéfices</li>
                        <li>L'interruption d'activité</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        11.3 Sauvegardes
                    </h3>
                    <p>
                        Bien que nous effectuions des sauvegardes régulières de vos données,
                        il vous appartient de maintenir vos propres sauvegardes des
                        informations critiques.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        12. Modification des CGU
                    </h2>
                    <p>
                        Nous nous réservons le droit de modifier les présentes CGU à tout
                        moment. Les modifications prendront effet dès leur publication sur
                        la Plateforme. Nous vous informerons des changements significatifs
                        par email ou via une notification sur votre compte.
                    </p>
                    <p>
                        Votre utilisation continue de la Plateforme après la publication des
                        modifications vaut acceptation des nouvelles CGU.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        13. Droit applicable et juridiction
                    </h2>
                    <p>
                        Les présentes CGU sont régies par le droit gabonais. En cas de
                        litige, et après tentative de résolution amiable, les tribunaux
                        gabonais seront seuls compétents.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">14. Contact</h2>
                    <p>
                        Pour toute question concernant ces CGU, vous pouvez nous contacter :
                    </p>
                    <ul>
                        <li>
                            Email :{' '}
                            <a
                                href="mailto:contact@akom.app"
                                className="text-primary hover:underline"
                            >
                                contact@akom.app
                            </a>
                        </li>
                        <li>Adresse : [Votre adresse postale]</li>
                        <li>Téléphone : [Votre numéro de téléphone]</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}