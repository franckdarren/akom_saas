import LandingNav from '@/components/landing/LandingNav'
import LandingHero from '@/components/landing/LandingHero'
import LandingFeatures from '@/components/landing/LandingFeatures'
import LandingUseCases from '@/components/landing/LandingUseCases'
import LandingHowItWorks from '@/components/landing/LandingHowItWorks'
import LandingWhyUs from '@/components/landing/LandingWhyUs'
import LandingTestimonials from '@/components/landing/LandingTestimonials'
import LandingPricing from '@/components/landing/LandingPricing'
import LandingBlog from '@/components/landing/LandingBlog'
import LandingFooter from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingUseCases />
        <LandingHowItWorks />
        <LandingWhyUs />
        <LandingTestimonials />
        <LandingPricing />
        <LandingBlog />
      </main>
      <LandingFooter />
    </>
  )
}
