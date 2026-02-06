'use client'

import Script from 'next/script'
import { useCookieConsent } from '@/lib/hooks/use-cookie-consent'

/**
 * Composant pour charger Google Analytics uniquement si l'utilisateur a accepté
 * 
 * Usage dans app/layout.tsx :
 * <GoogleAnalytics measurementId="G-XXXXXXXXXX" />
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
    const { hasConsent } = useCookieConsent()

    // Ne charger GA que si l'utilisateur a accepté les cookies analytiques
    if (!hasConsent('analytics')) {
        return null
    }

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${measurementId}', {
                            page_path: window.location.pathname,
                        });
                    `,
                }}
            />
        </>
    )
}

/**
 * Composant pour charger Facebook Pixel uniquement si accepté
 * 
 * Usage dans app/layout.tsx :
 * <FacebookPixel pixelId="123456789" />
 */
export function FacebookPixel({ pixelId }: { pixelId: string }) {
    const { hasConsent } = useCookieConsent()

    // Ne charger le Pixel que si l'utilisateur a accepté le marketing
    if (!hasConsent('marketing')) {
        return null
    }

    return (
        <Script
            id="facebook-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: `
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${pixelId}');
                    fbq('track', 'PageView');
                `,
            }}
        />
    )
}

/**
 * Composant pour Plausible Analytics (respectueux de la vie privée)
 * Plausible ne nécessite pas de consentement RGPD mais on peut quand même
 * le conditionner aux préférences de l'utilisateur
 * 
 * Usage dans app/layout.tsx :
 * <PlausibleAnalytics domain="akom.app" />
 */
export function PlausibleAnalytics({ domain }: { domain: string }) {
    const { hasConsent } = useCookieConsent()

    // Optionnel : on peut charger Plausible même sans consentement
    // car il est RGPD-compliant par défaut, mais pour être cohérent...
    if (!hasConsent('analytics')) {
        return null
    }

    return (
        <Script
            defer
            data-domain={domain}
            src="https://plausible.io/js/script.js"
        />
    )
}