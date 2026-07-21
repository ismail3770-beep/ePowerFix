'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CalendarClock, CheckCircle2, Clock3, CreditCard, KeyRound,
  MapPin, RefreshCw, ShieldCheck, Star, UserCheck, Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { marketplaceJobsApi, marketplacePaymentsApi } from '@epowerfix/api-client'
import type {
  MarketplaceArrivalOtp,
  MarketplaceCustomerJob,
  MarketplaceCustomerQuote,
  MarketplaceJobStatus,
} from '@epowerfix/types'
import { useAuthStore } from '@/store/auth-store'
import Header from '@/components/epf/Header'
import Footer from '@/components/epf/Footer'
import CartDrawer from '@/components/epf/CartDrawer'
import CheckoutDialog from '@/components/epf/CheckoutDialog'
import ChatWidget from '@/components/epf/ChatWidget'
import BackToTopButton from '@/components/epf/BackToTopButton'
import styles from './marketplace.module.css'

type Props = { jobId: string }
type PaymentMethod = 'sslcommerz' | 'bkash' | 'nagad'

const progressSteps = [
  { label: 'Assigned', statuses: ['ASSIGNED'] },
  { label: 'Accepted', statuses: ['ACCEPTED'] },
  { label: 'On the way', statuses: ['EN_ROUTE'] },
  { label: 'Inspection', statuses: ['ARRIVED', 'INSPECTION', 'QUOTE_PENDING'] },
  { label: 'Approved', statuses: ['QUOTE_APPROVED', 'IN_PROGRESS', 'COMPLETED_PENDING_CONFIRMATION'] },
  { label: 'Complete', statuses: ['COMPLETED', 'RESOLVED'] },
] satisfies Array<{ label: string; statuses: MarketplaceJobStatus[] }>

const statusRank: MarketplaceJobStatus[] = [
  'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'INSPECTION', 'QUOTE_PENDING',
  'QUOTE_APPROVED', 'IN_PROGRESS', 'COMPLETED_PENDING_CONFIRMATION', 'COMPLETED', 'RESOLVED',
]

function labelStatus(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded yet'
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatMoney(value: string, currency = 'BDT') {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value))
}

function latestActionableQuote(job: MarketplaceCustomerJob): MarketplaceCustomerQuote | undefined {
  return job.quotes.find((quote) => ['SUBMITTED', 'ADMIN_REVIEW'].includes(quote.status))
}

export default function MarketplaceJobDetails({ jobId }: Props) {
  const router = useRouter()
  const { isAuthenticated, isRestoring } = useAuthStore()
  const [job, setJob] = useState<MarketplaceCustomerJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [action, setAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [otp, setOtp] = useState<MarketplaceArrivalOtp | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('sslcommerz')
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null)

  const loadJob = useCallback(async (quiet = false) => {
    if (!isAuthenticated) return
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const response = await marketplaceJobsApi.get(jobId)
      setJob(response.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load this marketplace job')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isAuthenticated, jobId])

  useEffect(() => {
    if (!isRestoring && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(`/marketplace/jobs/${jobId}`)}`)
      return
    }
    void loadJob()
  }, [isAuthenticated, isRestoring, jobId, loadJob, router])

  useEffect(() => {
    const state = new URLSearchParams(window.location.search).get('payment')
    if (!state) return
    const messages: Record<string, string> = {
      success: 'Payment confirmed successfully. Your job is ready to continue.',
      pending: 'Payment is pending confirmation from the gateway.',
      review: 'Payment needs a manual review. Our support team will verify it.',
      failed: 'Payment was not completed. You can safely try again.',
    }
    setPaymentNotice(messages[state] || null)
  }, [])

  const currentProgress = useMemo(() => {
    if (!job) return -1
    const rank = statusRank.indexOf(job.status)
    let active = -1
    progressSteps.forEach((step, index) => {
      if (step.statuses.some((status) => statusRank.indexOf(status) <= rank)) active = index
    })
    return active
  }, [job])

  const quote = job ? latestActionableQuote(job) : undefined
  const approvedQuote = job?.quotes.find((item) => item.status === 'CUSTOMER_APPROVED')
  const displayQuote = quote || approvedQuote || job?.quotes[0]

  const decideQuote = async (decision: 'APPROVE' | 'REJECT') => {
    if (!job) return
    if (decision === 'REJECT' && !window.confirm('Reject this quote and ask the electrician to revise it?')) return
    setAction(`quote-${decision}`)
    try {
      const response = await marketplaceJobsApi.decideQuote(job.id, decision)
      setJob(response.data)
      toast.success(decision === 'APPROVE' ? 'Quote approved' : 'Quote sent back for revision')
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Could not update the quote')
    } finally {
      setAction(null)
    }
  }

  const createOtp = async () => {
    if (!job) return
    setAction('otp')
    try {
      const response = await marketplaceJobsApi.createArrivalOtp(job.id)
      setOtp(response.data)
      toast.success('Private arrival code created')
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Could not create an arrival code')
    } finally {
      setAction(null)
    }
  }

  const initiatePayment = async () => {
    if (!job) return
    setAction('payment')
    try {
      const response = await marketplacePaymentsApi.initiate(job.id, paymentMethod, crypto.randomUUID())
      if (response.data.status === 'PAID') {
        toast.success('This quote is already paid')
        await loadJob(true)
      } else if (response.data.paymentUrl) {
        window.location.assign(response.data.paymentUrl)
      } else {
        toast.info('Payment is being reconciled. Please refresh shortly.')
      }
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Could not start payment')
    } finally {
      setAction(null)
    }
  }

  const confirmCompletion = async () => {
    if (!job || !window.confirm('Confirm that the electrician completed the agreed work?')) return
    setAction('completion')
    try {
      const response = await marketplaceJobsApi.confirmCompletion(job.id)
      setJob(response.data)
      toast.success('Completion confirmed', { description: 'Your service warranty is now active.' })
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Could not confirm completion')
    } finally {
      setAction(null)
    }
  }

  let content
  if (isRestoring || loading) {
    content = <div className={styles.loadingState}>Loading secure job details…</div>
  } else if (error || !job) {
    content = <div className={styles.errorState}><ShieldCheck size={36} /><p>{error || 'Marketplace job not found'}</p><button id="retry-marketplace-job" type="button" className={styles.refreshButton} onClick={() => void loadJob()}><RefreshCw size={15} /> Try again</button></div>
  } else {
    content = (
      <>
        <section className={styles.detailHero}>
          <div className={styles.container}>
            <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/electrician">Electrician</Link><span>/</span><span>Job {job.id.slice(0, 8).toUpperCase()}</span></nav>
            <div className={styles.detailHeading}>
              <div><span className={styles.statusBadge}>{labelStatus(job.status)}</span><h1>{job.request.problemSummary}</h1><p><MapPin size={14} style={{ display: 'inline', marginRight: 6 }} />{job.request.serviceAddress}</p></div>
              <button id="refresh-marketplace-job" type="button" className={styles.refreshButton} disabled={refreshing} onClick={() => void loadJob(true)}><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />{refreshing ? 'Refreshing…' : 'Refresh'}</button>
            </div>
            <div className={styles.progressCard} aria-label="Job progress"><div className={styles.progressTrack}>{progressSteps.map((step, index) => <div key={step.label} className={`${styles.progressStep} ${index <= currentProgress ? styles.progressDone : ''}`}>{step.label}</div>)}</div></div>
          </div>
        </section>

        <section className={`${styles.container} ${styles.detailGrid}`}>
          <div className={styles.detailStack}>
            {paymentNotice && <div className={styles.notice}>{paymentNotice}</div>}
            <article className={styles.detailCard}>
              <h2>Service details</h2>
              <dl className={styles.definitionGrid}>
                <div><dt>Service</dt><dd>{job.request.skill?.name || job.request.service?.name || 'Electrical assistance'}</dd></div>
                <div><dt>Preferred time</dt><dd>{formatDate(job.request.scheduledFor)}</dd></div>
                <div><dt>Area</dt><dd>{job.request.serviceZone?.name || job.request.areaName || '—'}</dd></div>
                <div><dt>Request type</dt><dd>{job.request.isEmergency ? 'Emergency dispatch' : 'Standard dispatch'}</dd></div>
              </dl>
              {job.request.description && <p style={{ marginTop: 20, color: 'var(--marketplace-muted)', lineHeight: 1.7 }}>{job.request.description}</p>}
            </article>

            {displayQuote && (
              <article className={styles.detailCard}>
                <div className={styles.cardHeader}><h2 style={{ margin: 0 }}>Itemized quote</h2><span className={styles.statusBadge}>{labelStatus(displayQuote.status)}</span></div>
                <div className={styles.lineItems}>{displayQuote.lineItems.map((item) => <div className={styles.lineItem} key={item.id}><span>{item.description} × {item.quantity}</span><strong>{formatMoney(item.total)}</strong></div>)}</div>
                <div className={styles.quoteTotal}><div><small>Final service total</small>{displayQuote.expiresAt && <p style={{ color: 'var(--marketplace-muted)', fontSize: 11 }}>Valid until {formatDate(displayQuote.expiresAt)}</p>}</div><strong>{formatMoney(displayQuote.total)}</strong></div>
                {displayQuote.notes && <p style={{ color: 'var(--marketplace-muted)', fontSize: 13 }}>{displayQuote.notes}</p>}
                {quote && <div className={styles.actionButtons}><button id="approve-marketplace-quote" type="button" className={styles.primaryButton} disabled={action !== null} onClick={() => void decideQuote('APPROVE')}><CheckCircle2 size={16} />{action === 'quote-APPROVE' ? 'Approving…' : 'Approve quote'}</button><button id="reject-marketplace-quote" type="button" className={styles.dangerButton} disabled={action !== null} onClick={() => void decideQuote('REJECT')}>Request revision</button></div>}
              </article>
            )}

            <article className={styles.detailCard}>
              <h2>Job timeline</h2>
              <div className={styles.timeline}>
                {job.statusHistory.length === 0 ? <p style={{ color: 'var(--marketplace-muted)' }}>Status events will appear here as work progresses.</p> : job.statusHistory.map((event) => <div className={styles.timelineItem} key={event.id}><span className={styles.timelineDot} /><div><strong>{labelStatus(event.toStatus)}</strong>{event.note && <p>{event.note}</p>}<time>{formatDate(event.createdAt)}</time></div></div>)}
              </div>
            </article>
          </div>

          <aside className={styles.detailStack}>
            <article className={styles.providerCard}>
              <h2>Your electrician</h2>
              {job.provider ? <div className={styles.providerTop}><span className={styles.providerAvatar}>{job.provider.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{job.provider.displayName}</strong><div className={styles.rating}><Star size={13} fill="currentColor" /> {Number(job.provider.rating).toFixed(1)} · {job.provider.jobsCompleted} jobs</div></div></div> : <div className={styles.providerTop}><span className={styles.providerAvatar}><UserCheck size={22} /></span><div><strong>Dispatch in progress</strong><p style={{ color: 'var(--marketplace-muted)', fontSize: 12 }}>A verified professional will be assigned shortly.</p></div></div>}
            </article>

            {job.status === 'EN_ROUTE' && <article className={styles.actionCard}><h2><KeyRound size={19} style={{ display: 'inline', marginRight: 8 }} />Arrival verification</h2><p style={{ color: 'var(--marketplace-muted)', fontSize: 13 }}>Create this code only when the electrician is on the way. Share it in person after checking their identity.</p>{otp && <div className={styles.otpCode}><small>PRIVATE ARRIVAL CODE</small><strong>{otp.code}</strong><small>Expires {formatDate(otp.expiresAt)}</small></div>}<div className={styles.actionButtons}><button id="create-arrival-otp" type="button" className={styles.primaryButton} disabled={action !== null} onClick={() => void createOtp()}>{action === 'otp' ? 'Creating…' : otp ? 'Create new code' : 'Create arrival code'}</button></div></article>}

            {job.status === 'QUOTE_APPROVED' && approvedQuote && <article className={styles.actionCard}><h2><CreditCard size={19} style={{ display: 'inline', marginRight: 8 }} />Secure payment</h2><p style={{ color: 'var(--marketplace-muted)', fontSize: 13 }}>Pay the approved total of <strong>{formatMoney(approvedQuote.total)}</strong> through your preferred gateway.</p><div className={styles.paymentMethods}>{(['sslcommerz', 'bkash', 'nagad'] as PaymentMethod[]).map((method) => <button id={`payment-method-${method}`} type="button" key={method} className={`${styles.paymentMethod} ${paymentMethod === method ? styles.paymentMethodActive : ''}`} onClick={() => setPaymentMethod(method)}>{method === 'sslcommerz' ? 'Card / SSLCommerz' : method.toUpperCase()}</button>)}</div><div className={styles.actionButtons}><button id="pay-marketplace-quote" type="button" className={styles.primaryButton} disabled={action !== null} onClick={() => void initiatePayment()}>{action === 'payment' ? 'Connecting…' : 'Continue to payment'}</button></div></article>}

            {job.status === 'COMPLETED_PENDING_CONFIRMATION' && <article className={styles.actionCard}><h2><CheckCircle2 size={19} style={{ display: 'inline', marginRight: 8 }} />Confirm completion</h2><p style={{ color: 'var(--marketplace-muted)', fontSize: 13 }}>Confirm only after checking that the agreed work is complete. Your warranty period starts immediately.</p><div className={styles.actionButtons}><button id="confirm-marketplace-completion" type="button" className={styles.primaryButton} disabled={action !== null} onClick={() => void confirmCompletion()}>{action === 'completion' ? 'Confirming…' : 'Work is complete'}</button></div></article>}

            {job.status === 'COMPLETED' && <article className={styles.actionCard}><h2><ShieldCheck size={19} style={{ display: 'inline', marginRight: 8 }} />Warranty active</h2><div className={styles.notice}>This job was customer-confirmed. Warranty coverage ends {formatDate(job.warrantyEndsAt)}.</div><Link className={styles.linkButton} href="/electrician"><ArrowLeft size={14} /> Back to service dashboard</Link></article>}

            <article className={styles.actionCard}><h2>Need help?</h2><p style={{ color: 'var(--marketplace-muted)', fontSize: 13 }}>Keep all quote, payment and completion decisions inside ePowerFix for support and warranty protection.</p><div className={styles.requestMeta}><span><Clock3 size={13} /> Job created {formatDate(job.createdAt)}</span><span><CalendarClock size={13} /> Job #{job.id.slice(0, 8).toUpperCase()}</span><span><Wrench size={13} /> {labelStatus(job.status)}</span></div></article>
          </aside>
        </section>
      </>
    )
  }

  return <div className={styles.page}><Header /><CartDrawer /><CheckoutDialog /><main className={styles.main}>{content}</main><Footer /><ChatWidget /><BackToTopButton /></div>
}
