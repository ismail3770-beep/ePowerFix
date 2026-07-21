'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, ArrowRight, CalendarClock, CheckCircle2, Clock3, FileCheck2, LocateFixed,
  MapPin, RefreshCw, ShieldCheck, Sparkles, Star, UserCheck, Wrench, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  marketplaceCatalogApi,
  marketplaceJobsApi,
  marketplaceRequestsApi,
} from '@epowerfix/api-client'
import type {
  MarketplaceCustomerJob,
  MarketplaceCustomerRequest,
  MarketplaceServiceZone,
  MarketplaceSkill,
} from '@epowerfix/types'
import { useAuthStore } from '@/store/auth-store'
import Header from '@/components/epf/Header'
import Footer from '@/components/epf/Footer'
import CartDrawer from '@/components/epf/CartDrawer'
import CheckoutDialog from '@/components/epf/CheckoutDialog'
import ChatWidget from '@/components/epf/ChatWidget'
import BackToTopButton from '@/components/epf/BackToTopButton'
import styles from './marketplace.module.css'

const initialForm = {
  skillId: '', serviceZoneId: '', problemSummary: '', description: '',
  serviceAddress: '', areaName: '', scheduledFor: '', isEmergency: false,
  emergencySurchargeAccepted: false,
}

function formatDate(value?: string | null) {
  if (!value) return 'As soon as possible'
  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value))
}

function labelStatus(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase()
}

export default function MarketplaceHome() {
  const router = useRouter()
  const formRef = useRef<HTMLElement>(null)
  const { isAuthenticated, isRestoring } = useAuthStore()
  const [skills, setSkills] = useState<MarketplaceSkill[]>([])
  const [zones, setZones] = useState<MarketplaceServiceZone[]>([])
  const [requests, setRequests] = useState<MarketplaceCustomerRequest[]>([])
  const [jobs, setJobs] = useState<MarketplaceCustomerJob[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(initialForm)

  const groupedZones = useMemo(() => {
    return zones.reduce<Record<string, MarketplaceServiceZone[]>>((groups, zone) => {
      const key = `${zone.district.division.name} · ${zone.district.name}`
      groups[key] = [...(groups[key] || []), zone]
      return groups
    }, {})
  }, [zones])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)
    try {
      const [skillResponse, zoneResponse] = await Promise.all([
        marketplaceCatalogApi.skills(), marketplaceCatalogApi.serviceZones(),
      ])
      setSkills(skillResponse.data)
      setZones(zoneResponse.data)
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : 'Marketplace service options are unavailable')
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  const loadDashboard = useCallback(async () => {
    if (!isAuthenticated) return
    setDashboardLoading(true)
    try {
      const [requestResponse, jobResponse] = await Promise.all([
        marketplaceRequestsApi.list(), marketplaceJobsApi.list(),
      ])
      setRequests(requestResponse.data)
      setJobs(jobResponse.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load your service activity')
    } finally {
      setDashboardLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => { void loadCatalog() }, [loadCatalog])

  useEffect(() => { void loadDashboard() }, [loadDashboard])

  const scrollToRequest = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAuthenticated) {
      router.push('/login?redirect=/electrician')
      return
    }
    if (!form.skillId || !form.serviceZoneId) {
      toast.error('Choose a service type and service area')
      return
    }
    if (!form.isEmergency && !form.scheduledFor) {
      toast.error('Choose a preferred date and time for a standard request')
      return
    }
    if (form.isEmergency && !form.emergencySurchargeAccepted) {
      toast.error('Please confirm the emergency surcharge policy')
      return
    }

    setSubmitting(true)
    try {
      const created = await marketplaceRequestsApi.create({
        skillId: form.skillId,
        serviceZoneId: form.serviceZoneId,
        idempotencyKey: crypto.randomUUID(),
        problemSummary: form.problemSummary,
        description: form.description || null,
        serviceAddress: form.serviceAddress,
        areaName: form.areaName || null,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
        isEmergency: form.isEmergency,
        emergencySurchargeAccepted: form.emergencySurchargeAccepted,
        attachments: [],
      })
      await marketplaceRequestsApi.submit(created.data.id)
      setForm(initialForm)
      toast.success('Request submitted', {
        description: 'Our dispatch team will review it and assign a verified electrician.',
      })
      await loadDashboard()
      document.getElementById('electrician-dashboard')?.scrollIntoView({ behavior: 'smooth' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit your request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <Header />
      <CartDrawer />
      <CheckoutDialog />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="electrician-hero-title">
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div>
              <span className={styles.eyebrow}><Sparkles size={15} /> Trusted electrical help</span>
              <h1 id="electrician-hero-title">A verified electrician, right when you need one.</h1>
              <p className={styles.heroLead}>
                Tell us what is wrong. We coordinate a qualified local professional, keep the quote transparent,
                and protect the job from arrival to warranty.
              </p>
              <div className={styles.heroActions}>
                <button id="hero-request-electrician" type="button" className={styles.primaryButton} onClick={scrollToRequest}>
                  Request an electrician <ArrowRight size={17} />
                </button>
                {isAuthenticated && (
                  <button id="hero-view-jobs" type="button" className={styles.secondaryButton}
                    onClick={() => document.getElementById('electrician-dashboard')?.scrollIntoView({ behavior: 'smooth' })}>
                    View my jobs
                  </button>
                )}
              </div>
            </div>
            <div className={styles.heroPanel} aria-label="How marketplace service works">
              <div className={styles.pulseRow}><span className={styles.pulse} /><div><strong>Dispatch support is active</strong><br /><small>Human-reviewed matching for safer pilot operations</small></div></div>
              <div className={styles.heroSteps}>
                <div className={styles.heroStep}><span>01</span><div><strong>Describe the problem</strong><small>Choose the skill, location and preferred time.</small></div></div>
                <div className={styles.heroStep}><span>02</span><div><strong>Meet a verified professional</strong><small>Confirm arrival using your private one-time code.</small></div></div>
                <div className={styles.heroStep}><span>03</span><div><strong>Approve before work begins</strong><small>Review the itemized quote and pay securely.</small></div></div>
              </div>
            </div>
          </div>
          <div className={`${styles.container} ${styles.trustBar}`}>
            {[
              [ShieldCheck, 'Identity verified', 'NID and skills reviewed'],
              [FileCheck2, 'Quote protection', 'Approve the price first'],
              [LocateFixed, 'Local dispatch', 'Matched by service zone'],
              [CheckCircle2, '7-day warranty', 'Pilot warranty included'],
            ].map(([Icon, title, text]) => {
              const TrustIcon = Icon as typeof ShieldCheck
              return <div className={styles.trustItem} key={String(title)}><span className={styles.trustIcon}><TrustIcon size={20} /></span><div><strong>{String(title)}</strong><small>{String(text)}</small></div></div>
            })}
          </div>
        </section>

        <section ref={formRef} className={styles.section} aria-labelledby="request-heading">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div><span className={styles.kicker}>Book with confidence</span><h2 id="request-heading">What needs fixing?</h2></div>
              <p>Share enough detail for our dispatch team to select the right electrician. Your phone stays private until assignment.</p>
            </div>
            <div className={styles.requestGrid}>
              <aside className={styles.infoCard}>
                <span className={styles.kicker}>ePowerFix care</span>
                <h3 className={styles.panelTitle}>Safe service, without the guesswork.</h3>
                <div className={styles.infoList}>
                  <div className={styles.infoRow}><span><UserCheck size={20} /></span><div><strong>Independent, verified electricians</strong><p>Profiles, identity and practical experience are reviewed before activation.</p></div></div>
                  <div className={styles.infoRow}><span><Zap size={20} /></span><div><strong>Emergency-ready workflow</strong><p>Mark urgent electrical hazards so dispatch can prioritize safely.</p></div></div>
                  <div className={styles.infoRow}><span><Star size={20} /></span><div><strong>Transparent completion</strong><p>You approve the quote and confirm the work before the job closes.</p></div></div>
                </div>
              </aside>

              {isRestoring ? <div className={styles.loadingState}>Checking your account…</div> : !isAuthenticated ? (
                <div className={styles.authCard}><ShieldCheck size={38} /><h3>Sign in to request safely</h3><p>Your account keeps requests, quotes, OTPs and warranty history protected.</p><Link id="marketplace-login-link" href="/login?redirect=/electrician" className={styles.primaryButton}>Sign in to continue <ArrowRight size={16} /></Link></div>
              ) : (
                <form className={styles.formCard} onSubmit={handleSubmit}>
                  {catalogError ? (
                    <div className={styles.catalogNotice} role="alert" aria-live="polite">
                      <span><AlertCircle size={20} /></span>
                      <div><strong>Service options could not be loaded</strong><p>{catalogError}</p></div>
                      <button id="retry-marketplace-catalog" type="button" className={styles.refreshButton} onClick={() => void loadCatalog()}><RefreshCw size={15} /> Retry</button>
                    </div>
                  ) : !catalogLoading && (!skills.length || !zones.length) ? (
                    <div className={styles.catalogNotice} role="status">
                      <span><Wrench size={20} /></span>
                      <div><strong>Call Electrician is being prepared</strong><p>Service types and coverage areas will appear here as soon as the Dhaka pilot catalog is activated.</p></div>
                    </div>
                  ) : null}
                  <div className={styles.formGrid}>
                    <div className={styles.field}><label htmlFor="marketplace-skill">Electrical service *</label><select id="marketplace-skill" required value={form.skillId} onChange={(e) => setForm({ ...form, skillId: e.target.value })} disabled={catalogLoading || skills.length === 0}><option value="">{catalogLoading ? 'Loading services…' : skills.length ? 'Choose a service' : 'Services are being configured'}</option>{skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}{skill.nameBn ? ` · ${skill.nameBn}` : ''}</option>)}</select></div>
                    <div className={styles.field}><label htmlFor="marketplace-zone">Service area *</label><select id="marketplace-zone" required value={form.serviceZoneId} onChange={(e) => setForm({ ...form, serviceZoneId: e.target.value })} disabled={catalogLoading || zones.length === 0}><option value="">{catalogLoading ? 'Loading areas…' : zones.length ? 'Choose your area' : 'Coverage areas are being configured'}</option>{Object.entries(groupedZones).map(([group, items]) => <optgroup key={group} label={group}>{items.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}{zone.upazila ? ` · ${zone.upazila.name}` : ''}</option>)}</optgroup>)}</select></div>
                    <div className={`${styles.field} ${styles.full}`}><label htmlFor="marketplace-summary">Problem summary *</label><input id="marketplace-summary" required minLength={5} maxLength={200} placeholder="Example: Main circuit breaker keeps tripping" value={form.problemSummary} onChange={(e) => setForm({ ...form, problemSummary: e.target.value })} /></div>
                    <div className={`${styles.field} ${styles.full}`}><label htmlFor="marketplace-description">More details</label><textarea id="marketplace-description" maxLength={3000} placeholder="When did it start? Is there heat, smoke, noise or a complete outage?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                    <div className={styles.field}><label htmlFor="marketplace-address">Full service address *</label><input id="marketplace-address" required minLength={5} maxLength={500} placeholder="House, road and landmark" value={form.serviceAddress} onChange={(e) => setForm({ ...form, serviceAddress: e.target.value })} /></div>
                    <div className={styles.field}><label htmlFor="marketplace-area">Area / neighbourhood</label><input id="marketplace-area" maxLength={150} placeholder="Example: Dhanmondi 15" value={form.areaName} onChange={(e) => setForm({ ...form, areaName: e.target.value })} /></div>
                    <div className={`${styles.field} ${styles.full}`}><label htmlFor="marketplace-schedule">Preferred date and time {!form.isEmergency && '*'}</label><input id="marketplace-schedule" type="datetime-local" required={!form.isEmergency} value={form.scheduledFor} min={new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16)} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} /></div>
                    <label className={`${styles.checkRow} ${styles.full}`} htmlFor="marketplace-emergency"><input id="marketplace-emergency" type="checkbox" checked={form.isEmergency} onChange={(e) => setForm({ ...form, isEmergency: e.target.checked, emergencySurchargeAccepted: e.target.checked ? form.emergencySurchargeAccepted : false })} /><span><strong>This is an electrical emergency</strong><small>Use for sparks, burning smell, exposed live wiring or a dangerous outage.</small></span></label>
                    {form.isEmergency && <label className={`${styles.checkRow} ${styles.full}`} htmlFor="marketplace-surcharge"><input id="marketplace-surcharge" type="checkbox" required checked={form.emergencySurchargeAccepted} onChange={(e) => setForm({ ...form, emergencySurchargeAccepted: e.target.checked })} /><span><strong>I accept the displayed emergency dispatch surcharge</strong><small>The exact surcharge is recorded with your request; the repair quote remains separate.</small></span></label>}
                  </div>
                  <div className={styles.formFooter}><p>Submitting creates a dispatch request, not an automatic charge.</p><button id="submit-electrician-request" className={`${styles.primaryButton} ${styles.formSubmit}`} type="submit" disabled={submitting || catalogLoading || !skills.length || !zones.length}>{submitting ? 'Submitting…' : 'Send request'} <ArrowRight size={16} /></button></div>
                </form>
              )}
            </div>
          </div>
        </section>

        {isAuthenticated && (
          <section id="electrician-dashboard" className={styles.dashboard} aria-labelledby="dashboard-heading">
            <div className={styles.container}>
              <div className={styles.sectionHeader}><div><span className={styles.kicker}>Customer dashboard</span><h2 id="dashboard-heading">Your service activity</h2></div><p>Track dispatch, open assigned jobs and respond when a quote or confirmation needs you.</p></div>
              {dashboardLoading ? <div className={styles.loadingState}>Loading your service activity…</div> : (
                <div className={styles.dashboardGrid}>
                  <div className={styles.listCard}>
                    <div className={styles.cardHeader}><h3>Requests</h3><span className={styles.countBadge}>{requests.length}</span></div>
                    {requests.length === 0 ? <div className={styles.emptyState}><Wrench size={34} /><h3>No requests yet</h3><p>Your submitted electrician requests will appear here.</p></div> : <div className={styles.requestList}>{requests.map((request) => <article className={styles.requestItem} key={request.id}><div className={styles.requestTop}><div><h4>{request.problemSummary}</h4><span className={styles.requestMeta}>Request #{shortId(request.id)}</span></div><span className={styles.statusBadge}>{labelStatus(request.status)}</span></div><div className={styles.requestMeta}><span><MapPin size={13} />{request.serviceZone?.name || request.areaName || 'Service area'}</span><span><CalendarClock size={13} />{formatDate(request.scheduledFor)}</span></div>{request.job ? <div className={styles.inlineActions}><Link className={styles.linkButton} href={`/marketplace/jobs/${request.job.id}`}>Open assigned job <ArrowRight size={13} /></Link></div> : <div className={styles.inlineActions}><span className={styles.linkButton}><Clock3 size={13} /> Awaiting dispatch</span></div>}</article>)}</div>}
                  </div>
                  <div className={styles.listCard}>
                    <div className={styles.cardHeader}><h3>Assigned jobs</h3><span className={styles.countBadge}>{jobs.length}</span></div>
                    {jobs.length === 0 ? <div className={styles.emptyState}><UserCheck size={34} /><h3>No assigned jobs</h3><p>Once dispatch assigns a professional, your live job card will appear here.</p></div> : <div className={styles.requestList}>{jobs.map((job) => <Link className={styles.requestItem} href={`/marketplace/jobs/${job.id}`} key={job.id}><div className={styles.requestTop}><div><h4>{job.request.problemSummary}</h4><span className={styles.requestMeta}>Job #{shortId(job.id)}</span></div><span className={styles.statusBadge}>{labelStatus(job.status)}</span></div><div className={styles.requestMeta}><span><UserCheck size={13} />{job.provider?.displayName || 'Provider assignment in progress'}</span><span><ArrowRight size={13} /> View job</span></div></Link>)}</div>}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <ChatWidget />
      <BackToTopButton />
    </div>
  )
}
