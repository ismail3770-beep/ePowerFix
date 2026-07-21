'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarDays, CheckCircle2,
  Clock3, Loader2, MapPin, MessageSquareQuote, RefreshCw, ShieldCheck, Sparkles,
  Star, UserCheck, Wrench, Zap,
} from 'lucide-react'
import { marketplacePublicProvidersApi } from '@epowerfix/api-client'
import type { MarketplacePublicProvider } from '@epowerfix/types'
import Header from '@/components/epf/Header'
import Footer from '@/components/epf/Footer'
import CartDrawer from '@/components/epf/CartDrawer'
import CheckoutDialog from '@/components/epf/CheckoutDialog'
import ChatWidget from '@/components/epf/ChatWidget'
import BackToTopButton from '@/components/epf/BackToTopButton'
import styles from './electrician-profile.module.css'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'EP'
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-BD', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

function Stars({ value }: { value: number }) {
  return <span className={styles.stars} aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={star <= Math.round(value) ? styles.starFilled : ''} />)}</span>
}

export default function ElectricianPublicProfile({ providerId }: { providerId: string }) {
  const [provider, setProvider] = useState<MarketplacePublicProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await marketplacePublicProvidersApi.get(providerId)
      setProvider(response.data)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'This verified electrician profile is unavailable')
    } finally {
      setLoading(false)
    }
  }, [providerId])

  useEffect(() => { void load() }, [load])

  if (loading) return <main className={styles.state}><Loader2 className={styles.spinner} /><p>Loading verified electrician…</p></main>

  if (error || !provider) {
    return <div className={styles.shell}><Header /><main className={styles.state}><div className={styles.errorIcon}><UserCheck /></div><h1>Profile unavailable</h1><p>{error || 'This electrician profile is not publicly available.'}</p><div className={styles.stateActions}><button id="retry-electrician-profile" onClick={() => void load()}><RefreshCw /> Try again</button><Link href="/electrician"><ArrowLeft /> Call an electrician</Link></div></main><Footer /><CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton /></div>
  }

  const rating = Number(provider.rating)
  const availableDays = [...provider.availability].sort((a, b) => a.dayOfWeek - b.dayOfWeek)

  return (
    <div className={styles.shell}>
      <Header />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroPattern} />
          <div className={styles.container}>
            <Link className={styles.backLink} href="/electrician"><ArrowLeft /> Back to Call Electrician</Link>
            <div className={styles.heroCard}>
              <div className={styles.avatarWrap}>
                {provider.avatar ? <img src={provider.avatar} alt={`${provider.displayName}, verified electrician`} /> : <span>{initials(provider.displayName)}</span>}
                <i title="ePowerFix verified"><BadgeCheck /></i>
              </div>
              <div className={styles.identity}>
                <span className={styles.verified}><ShieldCheck /> ePowerFix verified professional</span>
                <h1>{provider.displayName}</h1>
                {provider.displayNameBn && <p className={styles.bengaliName}>{provider.displayNameBn}</p>}
                <div className={styles.ratingLine}><Stars value={rating} /><strong>{rating.toFixed(1)}</strong><span>({provider.reviewCount} reviews)</span></div>
                <div className={styles.chips}>
                  <span><BriefcaseBusiness /> {provider.yearsExperience}+ years experience</span>
                  <span><CheckCircle2 /> {provider.jobsCompleted} jobs completed</span>
                  {provider.emergencyAvailable && <span className={styles.emergency}><Zap /> Emergency available</span>}
                </div>
              </div>
              <div className={styles.heroCta}>
                <small>Need a trusted electrician?</small>
                <Link id="request-electrician-from-profile" href="/electrician#request-service">Call an electrician <ArrowRight /></Link>
                <p><ShieldCheck /> Secure booking through ePowerFix</p>
              </div>
            </div>
          </div>
        </section>

        <div className={`${styles.container} ${styles.content}`}>
          <div className={styles.mainColumn}>
            <section className={styles.panel}>
              <div className={styles.heading}><span><Sparkles /></span><div><small>Professional overview</small><h2>About {provider.displayName.split(' ')[0]}</h2></div></div>
              <p className={styles.bio}>{provider.bio || 'A verified ePowerFix electrician committed to safe, transparent, and dependable electrical service.'}</p>
              <div className={styles.trustStrip}><div><ShieldCheck /><span><strong>Identity checked</strong><small>Private documents reviewed</small></span></div><div><Wrench /><span><strong>Skills reviewed</strong><small>Expertise verified by admin</small></span></div><div><UserCheck /><span><strong>Marketplace monitored</strong><small>Jobs and reviews tracked</small></span></div></div>
            </section>

            <section className={styles.panel}>
              <div className={styles.heading}><span><Wrench /></span><div><small>Verified expertise</small><h2>Electrical skills</h2></div></div>
              <div className={styles.skillGrid}>{provider.skills.map((item) => <article key={item.id}><span><CheckCircle2 /></span><div><h3>{item.skill.name}</h3>{item.skill.nameBn && <p>{item.skill.nameBn}</p>}<small>{item.yearsExperience} years experience · Verified</small></div></article>)}</div>
            </section>

            <section className={styles.panel}>
              <div className={styles.heading}><span><MessageSquareQuote /></span><div><small>Customer feedback</small><h2>Published reviews</h2></div></div>
              {provider.reviews.length ? <div className={styles.reviews}>{provider.reviews.map((review) => <article key={review.id}><div className={styles.reviewTop}><div className={styles.customerAvatar}>{initials(review.customerLabel)}</div><div><strong>{review.customerLabel}</strong><small>Verified customer · {dateLabel(review.createdAt)}</small></div><Stars value={review.rating} /></div><p>{review.comment || 'The customer rated this completed ePowerFix job.'}</p></article>)}</div> : <div className={styles.emptyReviews}><Star /><h3>Newly verified professional</h3><p>Published customer reviews will appear here after completed jobs.</p></div>}
            </section>
          </div>

          <aside className={styles.sideColumn}>
            <section className={styles.panel}>
              <div className={styles.heading}><span><MapPin /></span><div><small>Coverage</small><h2>Service areas</h2></div></div>
              <div className={styles.zoneList}>{provider.serviceZones.map((item) => <div key={item.id}><span className={styles.pin}><MapPin /></span><div><strong>{item.serviceZone.name}</strong><small>{item.serviceZone.nameBn || 'Dhaka service area'} · up to {item.travelRadiusKm} km</small></div>{item.emergencyAvailable && <Zap />}</div>)}</div>
            </section>
            <section className={styles.panel}>
              <div className={styles.heading}><span><CalendarDays /></span><div><small>Working hours</small><h2>Availability</h2></div></div>
              <div className={styles.schedule}>{availableDays.map((slot) => <div key={slot.id}><span>{DAYS[slot.dayOfWeek]}</span><strong><Clock3 /> {slot.startTime} – {slot.endTime}</strong></div>)}</div>
            </section>
            <section className={styles.bookingCard}><span><ShieldCheck /></span><h2>Book with confidence</h2><p>Quotes, arrival confirmation, secure payment, reviews, and warranty support stay inside ePowerFix.</p><Link id="book-verified-electrician" href="/electrician#request-service">Request electrical service <ArrowRight /></Link></section>
          </aside>
        </div>
      </main>
      <Footer /><CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton />
    </div>
  )
}
