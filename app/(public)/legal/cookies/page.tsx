import type { Metadata } from 'next'
import { CookiePreferencesButton, CookiePreferencesLink } from '@/components/gdpr/CookiePreferencesActions'

export const metadata: Metadata = {
    title: 'Politique de Cookies | Akôm',
    description: 'Comment Akôm utilise les cookies et technologies similaires',
}

export default function CookiesPage() {
    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <h1 className="type-page-title mb-4">Politique de Cookies</h1>
            <p className="type-body-muted mb-8">
                Dernière mise à jour :{' '}
                {new Date().toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                })}
            </p>

            <div className="space-y-8">
                {/* Introduction */}
                <section>
                    <h2 className="type-section-title mb-4">Qu'est-ce qu'un cookie ?</h2>
                    <p className="type-body mb-3">
                        Un cookie est un petit fichier texte déposé sur votre ordinateur ou appareil mobile
                        lors de votre visite sur notre site web. Les cookies nous permettent de reconnaître
                        votre navigateur et de mémoriser certaines informations sur vos préférences.
                    </p>
                    <p className="type-body">
                        Akôm utilise des cookies pour améliorer votre expérience, analyser l'utilisation
                        de nos services et personnaliser le contenu que nous vous proposons.
                    </p>
                </section>

                {/* Types de cookies */}
                <section>
                    <h2 className="type-section-title mb-4">Types de cookies que nous utilisons</h2>

                    <div className="space-y-6">
                        {/* Cookies nécessaires */}
                        <div>
                            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                <span className="bg-success-subtle text-success type-badge px-2.5 py-0.5 rounded">
                                    NÉCESSAIRES
                                </span>
                                Cookies strictement nécessaires
                            </h3>
                            <p className="type-body mb-3">
                                Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être
                                désactivés. Ils sont généralement définis en réponse à des actions que vous
                                effectuez, comme la connexion à votre compte ou le remplissage de formulaires.
                            </p>
                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="type-label mb-2">Exemples de cookies nécessaires :</h4>
                                <ul className="list-disc list-inside space-y-1 type-body">
                                    <li><code className="type-code bg-muted px-2 py-0.5 rounded">supabase-auth-token</code> — Authentification de session (durée : 7 jours)</li>
                                    <li><code className="type-code bg-muted px-2 py-0.5 rounded">akom_current_restaurant_id</code> — Structure active (durée : permanente)</li>
                                    <li><code className="type-code bg-muted px-2 py-0.5 rounded">cookie-consent</code> — Préférences de consentement (durée : 1 an)</li>
                                </ul>
                            </div>
                        </div>

                        {/* Cookies analytiques */}
                        <div>
                            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                <span className="bg-info-subtle text-info type-badge px-2.5 py-0.5 rounded">
                                    ANALYTIQUES
                                </span>
                                Cookies de mesure d'audience
                            </h3>
                            <p className="type-body mb-3">
                                Ces cookies nous aident à comprendre comment les visiteurs interagissent avec
                                notre site. Toutes les informations collectées sont anonymes et nous permettent
                                d'améliorer le fonctionnement de notre plateforme.
                            </p>
                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="type-label mb-2">Outils utilisés :</h4>
                                <ul className="list-disc list-inside space-y-2 type-body">
                                    <li>
                                        <strong>Google Analytics</strong> — Analyse du trafic et du comportement utilisateur
                                        <br />
                                        <span className="type-caption">Cookies : _ga, _gid, _gat (durée : 2 ans)</span>
                                    </li>
                                    <li>
                                        <strong>Plausible Analytics</strong> — Analyse respectueuse de la vie privée (sans cookies)
                                        <br />
                                        <span className="type-caption">Conforme RGPD, ne collecte aucune donnée personnelle</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Cookies marketing */}
                        <div>
                            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                                <span className="bg-warning-subtle text-warning type-badge px-2.5 py-0.5 rounded">
                                    MARKETING
                                </span>
                                Cookies publicitaires et réseaux sociaux
                            </h3>
                            <p className="type-body mb-3">
                                Ces cookies sont utilisés pour afficher des publicités pertinentes et mesurer
                                l'efficacité de nos campagnes marketing. Ils peuvent être définis par nos
                                partenaires publicitaires via notre site.
                            </p>
                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="type-label mb-2">Outils utilisés :</h4>
                                <ul className="list-disc list-inside space-y-2 type-body">
                                    <li>
                                        <strong>Facebook Pixel</strong> — Suivi des conversions et publicités ciblées
                                        <br />
                                        <span className="type-caption">Cookies : _fbp, fr (durée : 90 jours)</span>
                                    </li>
                                    <li>
                                        <strong>Google Ads</strong> — Remarketing et mesure de performance
                                        <br />
                                        <span className="type-caption">Cookies : _gcl_au, IDE (durée : 1 an)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Gestion des cookies */}
                <section>
                    <h2 className="type-section-title mb-4">Comment gérer vos préférences de cookies ?</h2>

                    <div className="space-y-4">
                        <div className="bg-info-subtle border-l-4 border-info p-4 rounded">
                            <h3 className="text-base font-semibold mb-2">
                                Via notre outil de gestion des cookies
                            </h3>
                            <p className="type-body mb-3">
                                Vous pouvez à tout moment modifier vos préférences en cliquant sur le bouton
                                "Paramètres des cookies" situé en bas à droite de votre écran, ou en utilisant
                                le lien suivant :
                            </p>
                            <CookiePreferencesButton variant="primary" size="md" />
                        </div>

                        <div>
                            <h3 className="text-base font-semibold mb-2">Via les paramètres de votre navigateur</h3>
                            <p className="type-body mb-3">
                                Vous pouvez également configurer votre navigateur pour bloquer ou supprimer
                                les cookies. Voici les liens vers les guides de vos navigateurs les plus courants :
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4 type-body">
                                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                                <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                                <li><a href="https://support.apple.com/fr-fr/HT201265" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                                <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
                            </ul>
                        </div>

                        <div className="bg-warning-subtle border-l-4 border-warning p-4 rounded">
                            <h3 className="text-base font-semibold mb-2">Attention</h3>
                            <p className="type-body">
                                Si vous désactivez tous les cookies via votre navigateur, certaines
                                fonctionnalités de notre site peuvent ne plus fonctionner correctement
                                (connexion, préférences, etc.).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Durée de conservation */}
                <section>
                    <h2 className="type-section-title mb-4">Durée de conservation des cookies</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border border rounded-lg">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-3 text-left type-table-head">Type de cookie</th>
                                    <th className="px-6 py-3 text-left type-table-head">Durée maximale</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap type-body">Cookies nécessaires</td>
                                    <td className="px-6 py-4 whitespace-nowrap type-body">Session à 1 an</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap type-body">Cookies analytiques</td>
                                    <td className="px-6 py-4 whitespace-nowrap type-body">2 ans maximum</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap type-body">Cookies marketing</td>
                                    <td className="px-6 py-4 whitespace-nowrap type-body">90 jours à 1 an</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="type-caption mt-3">
                        Votre consentement est valable pour une durée de 13 mois à compter de votre premier
                        choix. Au-delà, nous vous demanderons de nouveau votre consentement.
                    </p>
                </section>

                {/* Transferts internationaux */}
                <section>
                    <h2 className="type-section-title mb-4">Transferts de données en dehors du Gabon</h2>
                    <p className="type-body mb-3">
                        Certains de nos partenaires (Google Analytics, Facebook) peuvent stocker des
                        données en dehors du Gabon et de l'Union Européenne, notamment aux États-Unis.
                    </p>
                    <p className="type-body">
                        Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles
                        types approuvées par la Commission Européenne) pour assurer la protection de vos
                        données personnelles.
                    </p>
                </section>

                {/* Vos droits */}
                <section>
                    <h2 className="type-section-title mb-4">Vos droits concernant vos données</h2>
                    <p className="type-body mb-3">
                        Conformément au RGPD et aux lois gabonaises sur la protection des données,
                        vous disposez des droits suivants :
                    </p>
                    <ul className="list-disc list-inside space-y-2 type-body ml-4">
                        <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                        <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
                        <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
                        <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
                        <li><strong>Droit à la limitation</strong> : limiter l'utilisation de vos données</li>
                        <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré</li>
                    </ul>
                    <div className="bg-muted/50 rounded-lg p-4 mt-4">
                        <p className="type-body">
                            Pour exercer ces droits, contactez-nous à l'adresse :{' '}
                            <a href="mailto:privacy@akom.app" className="text-primary hover:underline font-medium">
                                privacy@akom.app
                            </a>
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section>
                    <h2 className="type-section-title mb-4">Questions sur notre politique de cookies ?</h2>
                    <p className="type-body mb-4">
                        Si vous avez des questions concernant notre utilisation des cookies ou cette
                        politique, n'hésitez pas à nous contacter :
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <p className="type-body">
                            <strong>Email :</strong>{' '}
                            <a href="mailto:privacy@akom.app" className="text-primary hover:underline">
                                privacy@akom.app
                            </a>
                        </p>
                        <p className="type-body"><strong>Adresse :</strong> [Votre adresse au Gabon]</p>
                        <p className="type-body"><strong>Téléphone :</strong> [Votre numéro de téléphone]</p>
                    </div>
                </section>

                {/* Modifications */}
                <section>
                    <h2 className="type-section-title mb-4">Modifications de cette politique</h2>
                    <p className="type-body">
                        Nous nous réservons le droit de modifier cette politique de cookies à tout moment
                        pour refléter les changements dans nos pratiques ou pour d'autres raisons
                        opérationnelles, légales ou réglementaires. Nous vous encourageons à consulter
                        régulièrement cette page pour rester informé de nos pratiques en matière de cookies.
                    </p>
                </section>

                {/* Liens croisés */}
                <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-4 type-body">
                        <a href="/legal/privacy" className="text-primary hover:underline">
                            Politique de confidentialité
                        </a>
                        <a href="/legal/terms" className="text-primary hover:underline">
                            Conditions d'utilisation
                        </a>
                    </div>
                    <CookiePreferencesLink />
                </div>
            </div>
        </div>
    )
}
