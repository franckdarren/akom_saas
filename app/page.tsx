import LandingNav from '@/components/landing/LandingNav'
import LandingHero from '@/components/landing/LandingHero'
import LandingLogos from '@/components/landing/LandingLogos'
import LandingHowItWorks from '@/components/landing/LandingHowItWorks'
import LandingFeatures from '@/components/landing/LandingFeatures'
import LandingDemo from '@/components/landing/LandingDemo'
import LandingPricing from '@/components/landing/LandingPricing'
import LandingTestimonials from '@/components/landing/LandingTestimonials'
import LandingFAQ from '@/components/landing/LandingFAQ'
import LandingCTA from '@/components/landing/LandingCTA'
import LandingFooter from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingLogos />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingDemo />
        <LandingPricing />
        <LandingTestimonials />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </>
  )
}
