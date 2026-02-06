import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Politique de confidentialité | Akôm',
    description:
        'Découvrez comment Akôm collecte, utilise et protège vos données personnelles.',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold mb-8">Politique de confidentialité</h1>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
                <p className="text-muted-foreground text-lg mb-8">
                    Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                </p>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                    <p>
                        Bienvenue sur Akôm. Nous prenons très au sérieux la protection de vos
                        données personnelles et nous nous engageons à respecter votre vie
                        privée. Cette politique de confidentialité explique comment nous
                        collectons, utilisons, stockons et protégeons vos informations
                        lorsque vous utilisez notre plateforme SaaS de gestion de
                        restaurants.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        2. Responsable du traitement
                    </h2>
                    <p>
                        Le responsable du traitement de vos données personnelles est :
                    </p>
                    <ul>
                        <li>Nom : Akôm</li>
                        <li>Adresse : [Votre adresse]</li>
                        <li>Email : contact@akom.app</li>
                        <li>Téléphone : [Votre numéro]</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        3. Données que nous collectons
                    </h2>
                    
                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        3.1 Données d'inscription et de compte
                    </h3>
                    <p>Lorsque vous créez un compte, nous collectons :</p>
                    <ul>
                        <li>Votre adresse email</li>
                        <li>Votre mot de passe (chiffré)</li>
                        <li>Votre nom et prénom (si fournis)</li>
                        <li>Les informations de votre restaurant (nom, adresse, téléphone)</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        3.2 Données d'utilisation
                    </h3>
                    <p>
                        Lors de votre utilisation de la plateforme, nous collectons
                        automatiquement :
                    </p>
                    <ul>
                        <li>
                            Les informations de connexion (adresse IP, type de navigateur,
                            système d'exploitation)
                        </li>
                        <li>Les pages visitées et les actions effectuées</li>
                        <li>Les données de performance et d'erreurs</li>
                        <li>La date et l'heure de vos connexions</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6">
                        3.3 Données des commandes et transactions
                    </h3>
                    <p>Dans le cadre de la gestion de votre restaurant, nous stockons :</p>
                    <ul>
                        <li>Les commandes passées par vos clients</li>
                        <li>Les informations de paiement (uniquement les identifiants de transaction, pas les coordonnées bancaires)</li>
                        <li>L'historique des ventes et des stocks</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6">3.4 Cookies</h3>
                    <p>Nous utilisons différents types de cookies :</p>
                    <ul>
                        <li>
                            <strong>Cookies nécessaires :</strong> Essentiels au
                            fonctionnement du site (authentification, sécurité)
                        </li>
                        <li>
                            <strong>Cookies analytiques :</strong> Pour comprendre comment
                            vous utilisez notre service et l'améliorer
                        </li>
                        <li>
                            <strong>Cookies marketing :</strong> Pour personnaliser les
                            publicités (uniquement avec votre consentement)
                        </li>
                    </ul>
                    <p>
                        Vous pouvez gérer vos préférences de cookies à tout moment via
                        notre gestionnaire de cookies.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        4. Comment nous utilisons vos données
                    </h2>
                    <p>Nous utilisons vos données personnelles pour :</p>
                    <ul>
                        <li>Créer et gérer votre compte utilisateur</li>
                        <li>Fournir nos services de gestion de restaurant</li>
                        <li>Traiter les commandes et les paiements</li>
                        <li>
                            Vous envoyer des notifications importantes concernant votre
                            compte
                        </li>
                        <li>Améliorer notre plateforme et développer de nouvelles fonctionnalités</li>
                        <li>Assurer la sécurité de nos services et prévenir les fraudes</li>
                        <li>Respecter nos obligations légales</li>
                        <li>
                            Vous envoyer des communications marketing (uniquement avec votre
                            consentement)
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        5. Base légale du traitement
                    </h2>
                    <p>
                        Nous traitons vos données personnelles sur la base des fondements
                        juridiques suivants :
                    </p>
                    <ul>
                        <li>
                            <strong>Exécution d'un contrat :</strong> Pour fournir nos
                            services conformément à nos conditions d'utilisation
                        </li>
                        <li>
                            <strong>Intérêt légitime :</strong> Pour améliorer nos services,
                            assurer la sécurité et prévenir les fraudes
                        </li>
                        <li>
                            <strong>Consentement :</strong> Pour les cookies non essentiels
                            et les communications marketing
                        </li>
                        <li>
                            <strong>Obligation légale :</strong> Pour respecter les lois
                            applicables (facturation, comptabilité)
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        6. Partage de vos données
                    </h2>
                    <p>
                        Nous ne vendons jamais vos données personnelles. Nous pouvons
                        partager vos informations avec :
                    </p>
                    <ul>
                        <li>
                            <strong>Prestataires de services :</strong> Hébergement
                            (Supabase), paiement, analytics, support client
                        </li>
                        <li>
                            <strong>Autorités légales :</strong> Si requis par la loi ou pour
                            protéger nos droits
                        </li>
                    </ul>
                    <p>
                        Tous nos prestataires sont contractuellement tenus de protéger vos
                        données et de les utiliser uniquement pour les fins que nous avons
                        spécifiées.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        7. Transferts internationaux de données
                    </h2>
                    <p>
                        Vos données peuvent être transférées et stockées sur des serveurs
                        situés en dehors de votre pays de résidence. Dans ce cas, nous
                        nous assurons que des garanties appropriées sont en place
                        conformément au RGPD (clauses contractuelles types, bouclier de
                        protection des données).
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        8. Durée de conservation
                    </h2>
                    <p>Nous conservons vos données personnelles :</p>
                    <ul>
                        <li>
                            <strong>Données de compte :</strong> Pendant la durée de votre
                            abonnement et 3 ans après la clôture
                        </li>
                        <li>
                            <strong>Données de facturation :</strong> 10 ans (obligation
                            légale)
                        </li>
                        <li>
                            <strong>Données de navigation :</strong> 13 mois maximum
                        </li>
                        <li>
                            <strong>Cookies :</strong> 13 mois maximum
                        </li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">9. Vos droits</h2>
                    <p>
                        Conformément au RGPD, vous disposez des droits suivants concernant
                        vos données personnelles :
                    </p>
                    <ul>
                        <li>
                            <strong>Droit d'accès :</strong> Obtenir une copie de vos données
                        </li>
                        <li>
                            <strong>Droit de rectification :</strong> Corriger des données
                            inexactes
                        </li>
                        <li>
                            <strong>Droit à l'effacement :</strong> Demander la suppression
                            de vos données
                        </li>
                        <li>
                            <strong>Droit à la limitation :</strong> Restreindre le
                            traitement de vos données
                        </li>
                        <li>
                            <strong>Droit à la portabilité :</strong> Recevoir vos données
                            dans un format structuré
                        </li>
                        <li>
                            <strong>Droit d'opposition :</strong> Vous opposer au traitement
                            de vos données
                        </li>
                        <li>
                            <strong>Droit de retirer votre consentement :</strong> À tout
                            moment pour les traitements basés sur le consentement
                        </li>
                    </ul>
                    <p>
                        Pour exercer ces droits, contactez-nous à :{' '}
                        <a
                            href="mailto:privacy@akom.app"
                            className="text-primary hover:underline"
                        >
                            privacy@akom.app
                        </a>
                    </p>
                    <p>
                        Vous avez également le droit de déposer une plainte auprès de la
                        CNIL (Commission Nationale de l'Informatique et des Libertés) si
                        vous estimez que vos droits ne sont pas respectés.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">10. Sécurité</h2>
                    <p>
                        Nous mettons en œuvre des mesures de sécurité techniques et
                        organisationnelles appropriées pour protéger vos données contre :
                    </p>
                    <ul>
                        <li>L'accès non autorisé</li>
                        <li>La divulgation</li>
                        <li>La modification</li>
                        <li>La destruction</li>
                    </ul>
                    <p>Ces mesures incluent :</p>
                    <ul>
                        <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                        <li>Chiffrement des mots de passe</li>
                        <li>Authentification sécurisée</li>
                        <li>Contrôles d'accès stricts</li>
                        <li>Sauvegardes régulières</li>
                        <li>Surveillance et détection des incidents</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">
                        11. Modifications de cette politique
                    </h2>
                    <p>
                        Nous pouvons mettre à jour cette politique de confidentialité pour
                        refléter les changements dans nos pratiques ou pour d'autres
                        raisons opérationnelles, légales ou réglementaires. Nous vous
                        informerons de tout changement significatif par email ou via une
                        notification sur notre plateforme.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
                    <p>
                        Pour toute question concernant cette politique de confidentialité
                        ou le traitement de vos données personnelles, vous pouvez nous
                        contacter :
                    </p>
                    <ul>
                        <li>
                            Email :{' '}
                            <a
                                href="mailto:privacy@akom.app"
                                className="text-primary hover:underline"
                            >
                                privacy@akom.app
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