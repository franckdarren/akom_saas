// app/cookies/page.tsx (VERSION CORRIGÉE - Sans event handlers)
import type { Metadata } from 'next'
import { CookiePreferencesButton, CookiePreferencesLink } from '@/components/gdpr/CookiePreferencesActions'

export const metadata: Metadata = {
    title: 'Politique de Cookies - Akôm',
    description: 'Comment Akôm utilise les cookies et technologies similaires',
}

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
                {/* En-tête */}
                <div className="border-b pb-6 mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Politique de Cookies
                    </h1>
                    <p className="text-sm text-gray-600">
                        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>

                {/* Introduction */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Qu'est-ce qu'un cookie ?
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Un cookie est un petit fichier texte déposé sur votre ordinateur ou appareil mobile
                        lors de votre visite sur notre site web. Les cookies nous permettent de reconnaître
                        votre navigateur et de mémoriser certaines informations sur vos préférences.
                    </p>
                    <p className="text-gray-700">
                        Akôm utilise des cookies pour améliorer votre expérience, analyser l'utilisation
                        de nos services et personnaliser le contenu que nous vous proposons.
                    </p>
                </section>

                {/* Types de cookies */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Types de cookies que nous utilisons
                    </h2>

                    {/* Cookies nécessaires */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                                NÉCESSAIRES
                            </span>
                            Cookies strictement nécessaires
                        </h3>
                        <p className="text-gray-700 mb-3">
                            Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être
                            désactivés. Ils sont généralement définis en réponse à des actions que vous
                            effectuez, comme la connexion à votre compte ou le remplissage de formulaires.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Exemples de cookies nécessaires :</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-700">
                                <li><code className="bg-gray-200 px-2 py-0.5 rounded text-sm">supabase-auth-token</code> - Authentification de session (durée : 7 jours)</li>
                                <li><code className="bg-gray-200 px-2 py-0.5 rounded text-sm">currentRestaurantId</code> - Restaurant actif (durée : permanente)</li>
                                <li><code className="bg-gray-200 px-2 py-0.5 rounded text-sm">cookie-consent</code> - Préférences de consentement (durée : 1 an)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Cookies analytiques */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                                ANALYTIQUES
                            </span>
                            Cookies de mesure d'audience
                        </h3>
                        <p className="text-gray-700 mb-3">
                            Ces cookies nous aident à comprendre comment les visiteurs interagissent avec
                            notre site. Toutes les informations collectées sont anonymes et nous permettent
                            d'améliorer le fonctionnement de notre plateforme.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Outils utilisés :</h4>
                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                <li>
                                    <strong>Google Analytics</strong> - Analyse du trafic et du comportement utilisateur
                                    <br />
                                    <span className="text-sm text-gray-600">Cookies : _ga, _gid, _gat (durée : 2 ans)</span>
                                </li>
                                <li>
                                    <strong>Plausible Analytics</strong> - Analyse respectueuse de la vie privée (sans cookies)
                                    <br />
                                    <span className="text-sm text-gray-600">Conforme RGPD, ne collecte aucune donnée personnelle</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Cookies marketing */}
                    <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                                MARKETING
                            </span>
                            Cookies publicitaires et réseaux sociaux
                        </h3>
                        <p className="text-gray-700 mb-3">
                            Ces cookies sont utilisés pour afficher des publicités pertinentes et mesurer
                            l'efficacité de nos campagnes marketing. Ils peuvent être définis par nos
                            partenaires publicitaires via notre site.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Outils utilisés :</h4>
                            <ul className="list-disc list-inside space-y-2 text-gray-700">
                                <li>
                                    <strong>Facebook Pixel</strong> - Suivi des conversions et publicités ciblées
                                    <br />
                                    <span className="text-sm text-gray-600">Cookies : _fbp, fr (durée : 90 jours)</span>
                                </li>
                                <li>
                                    <strong>Google Ads</strong> - Remarketing et mesure de performance
                                    <br />
                                    <span className="text-sm text-gray-600">Cookies : _gcl_au, IDE (durée : 1 an)</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Gestion des cookies */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Comment gérer vos préférences de cookies ?
                    </h2>

                    <div className="space-y-4 text-gray-700">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Via notre outil de gestion des cookies
                            </h3>
                            <p className="mb-3">
                                Vous pouvez à tout moment modifier vos préférences en cliquant sur le bouton
                                "Paramètres des cookies" situé en bas à droite de votre écran, ou en utilisant
                                le lien suivant :
                            </p>
                            {/* ✅ Utilisation du Client Component au lieu d'un onClick direct */}
                            <CookiePreferencesButton variant="primary" size="md" />
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Via les paramètres de votre navigateur
                            </h3>
                            <p className="mb-3">
                                Vous pouvez également configurer votre navigateur pour bloquer ou supprimer
                                les cookies. Voici les liens vers les guides de vos navigateurs les plus courants :
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Chrome</a></li>
                                <li><a href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Mozilla Firefox</a></li>
                                <li><a href="https://support.apple.com/fr-fr/HT201265" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Safari</a></li>
                                <li><a href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Microsoft Edge</a></li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                ⚠️ Attention
                            </h3>
                            <p>
                                Si vous désactivez tous les cookies via votre navigateur, certaines
                                fonctionnalités de notre site peuvent ne plus fonctionner correctement
                                (connexion, préférences, etc.).
                            </p>
                        </div>
                    </div>
                </section>

                {/* Durée de conservation */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Durée de conservation des cookies
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type de cookie
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Durée maximale
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        Cookies nécessaires
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        Session à 1 an
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        Cookies analytiques
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        2 ans maximum
                                    </td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        Cookies marketing
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        90 jours à 1 an
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        Votre consentement est valable pour une durée de 13 mois à compter de votre premier
                        choix. Au-delà, nous vous demanderons de nouveau votre consentement.
                    </p>
                </section>

                {/* Transferts internationaux */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Transferts de données en dehors du Gabon
                    </h2>
                    <p className="text-gray-700 mb-3">
                        Certains de nos partenaires (Google Analytics, Facebook) peuvent stocker des
                        données en dehors du Gabon et de l'Union Européenne, notamment aux États-Unis.
                    </p>
                    <p className="text-gray-700">
                        Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles
                        types approuvées par la Commission Européenne) pour assurer la protection de vos
                        données personnelles.
                    </p>
                </section>

                {/* Vos droits */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Vos droits concernant vos données
                    </h2>
                    <p className="text-gray-700 mb-3">
                        Conformément au RGPD et aux lois gabonaises sur la protection des données,
                        vous disposez des droits suivants :
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                        <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
                        <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
                        <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
                        <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
                        <li><strong>Droit à la limitation</strong> : limiter l'utilisation de vos données</li>
                        <li><strong>Droit à la portabilité</strong> : récupérer vos données dans un format structuré</li>
                    </ul>
                    <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <p className="text-gray-700">
                            Pour exercer ces droits, contactez-nous à l'adresse :{' '}
                            <a href="mailto:privacy@akom.ga" className="text-blue-600 hover:underline font-medium">
                                privacy@akom.ga
                            </a>
                        </p>
                    </div>
                </section>

                {/* Contact */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Questions sur notre politique de cookies ?
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Si vous avez des questions concernant notre utilisation des cookies ou cette
                        politique, n'hésitez pas à nous contacter :
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p className="text-gray-700">
                            <strong>Email :</strong>{' '}
                            <a href="mailto:privacy@akom.ga" className="text-blue-600 hover:underline">
                                privacy@akom.ga
                            </a>
                        </p>
                        <p className="text-gray-700">
                            <strong>Adresse :</strong> [Votre adresse au Gabon]
                        </p>
                        <p className="text-gray-700">
                            <strong>Téléphone :</strong> [Votre numéro de téléphone]
                        </p>
                    </div>
                </section>

                {/* Modifications */}
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Modifications de cette politique
                    </h2>
                    <p className="text-gray-700">
                        Nous nous réservons le droit de modifier cette politique de cookies à tout moment
                        pour refléter les changements dans nos pratiques ou pour d'autres raisons
                        opérationnelles, légales ou réglementaires. Nous vous encourageons à consulter
                        régulièrement cette page pour rester informé de nos pratiques en matière de cookies.
                    </p>
                </section>

                {/* Footer */}
                <div className="border-t pt-6 mt-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-4 text-sm">
                            <a href="/privacy" className="text-blue-600 hover:underline">
                                Politique de confidentialité
                            </a>
                            <a href="/terms" className="text-blue-600 hover:underline">
                                Conditions d'utilisation
                            </a>
                        </div>
                        {/* ✅ Utilisation du Client Component link au lieu d'un onClick direct */}
                        <CookiePreferencesLink />
                    </div>
                </div>
            </div>
        </div>
    )
}