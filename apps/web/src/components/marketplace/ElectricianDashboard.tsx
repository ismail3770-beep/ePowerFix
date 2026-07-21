'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, ArrowRight, BadgeCheck, Banknote, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, ChevronRight, Clock3, FileCheck2, FileUp, Loader2, MapPin,
  RefreshCw, ShieldCheck, Sparkles, Star, UploadCloud, UserRound, Wrench, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  marketplaceCatalogApi,
  marketplaceProviderProfileApi,
} from '@epowerfix/api-client'
import type {
  MarketplaceProviderDashboard,
  MarketplaceProviderProfile,
  MarketplaceServiceZone,
  MarketplaceSkill,
  ProviderDocumentType,
  ProviderReadinessIssue,
} from '@epowerfix/types'
import { useAuthStore } from '@/store/auth-store'
import Header from '@/components/epf/Header'
import Footer from '@/components/epf/Footer'
import CartDrawer from '@/components/epf/CartDrawer'
import CheckoutDialog from '@/components/epf/CheckoutDialog'
import ChatWidget from '@/components/epf/ChatWidget'
import BackToTopButton from '@/components/epf/BackToTopButton'
import styles from './electrician-dashboard.module.css'

const DOCUMENTS: Array<{ type: ProviderDocumentType; title: string; hint: string }> = [
  { type: 'NID_FRONT', title: 'NID front', hint: 'Clear photo of the front side' },
  { type: 'NID_BACK', title: 'NID back', hint: 'Clear photo of the back side' },
  { type: 'SELFIE', title: 'Identity selfie', hint: 'A recent, well-lit portrait' },
  { type: 'ADDRESS_PROOF', title: 'Address proof', hint: 'Utility bill or official document' },
  { type: 'SKILL_PROOF', title: 'Skill evidence', hint: 'Certificate, licence, or work record' },
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const ACTIVE_JOB_STATES = ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'INSPECTION', 'QUOTE_PENDING', 'QUOTE_APPROVED', 'IN_PROGRESS', 'COMPLETED_PENDING_CONFIRMATION']

const issueLabels: Record<string, string> = {
  DISPLAY_NAME_REQUIRED: 'Add your professional name',
  EXPERIENCE_REQUIRED: 'Add valid work experience',
  SKILL_REQUIRED: 'Select at least one skill',
  VERIFIED_SKILL_REQUIRED: 'An admin must verify one skill',
  SERVICE_ZONE_REQUIRED: 'Select at least one service area',
  AVAILABILITY_REQUIRED: 'Add at least one availability slot',
}

function statusLabel(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function money(value: string, currency = 'BDT') {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value || 0))
}

function dateLabel(value?: string | null) {
  if (!value) return 'Not scheduled'
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function issueLabel(issue: ProviderReadinessIssue) {
  if (issue.startsWith('DOCUMENT_REQUIRED:')) return `${statusLabel(issue.split(':')[1] || '')} is required`
  if (issue.startsWith('DOCUMENT_NOT_APPROVED:')) return `${statusLabel(issue.split(':')[1] || '')} needs approval`
  return issueLabels[issue] || statusLabel(issue)
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'EP'
}

export default function ElectricianDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, isRestoring, restoreAuth } = useAuthStore()
  const [dashboard, setDashboard] = useState<MarketplaceProviderDashboard | null>(null)
  const [skills, setSkills] = useState<MarketplaceSkill[]>([])
  const [zones, setZones] = useState<MarketplaceServiceZone[]>([])
  const [loading, setLoading] = useState(true)
  const [missingProfile, setMissingProfile] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [form, setForm] = useState({ displayName: '', displayNameBn: '', bio: '', yearsExperience: 0, emergencyAvailable: false })
  const [selectedSkills, setSelectedSkills] = useState<Record<string, number>>({})
  const [selectedZones, setSelectedZones] = useState<Record<string, { radius: number; emergency: boolean }>>({})
  const [schedule, setSchedule] = useState<Record<number, { enabled: boolean; start: string; end: string }>>(
    Object.fromEntries(DAYS.map((_, day) => [day, { enabled: day !== 5, start: '09:00', end: '18:00' }]))
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [skillResponse, zoneResponse] = await Promise.all([
        marketplaceCatalogApi.skills(),
        marketplaceCatalogApi.serviceZones(),
      ])
      setSkills(skillResponse.data)
      setZones(zoneResponse.data)
      try {
        const response = await marketplaceProviderProfileApi.dashboard()
        const data = response.data
        setDashboard(data)
        setMissingProfile(false)
        setForm({
          displayName: data.profile.displayName,
          displayNameBn: data.profile.displayNameBn || '',
          bio: data.profile.bio || '',
          yearsExperience: data.profile.yearsExperience,
          emergencyAvailable: data.profile.emergencyAvailable,
        })
        setSelectedSkills(Object.fromEntries(data.profile.skills.map((item) => [item.skill.id, item.yearsExperience])))
        setSelectedZones(Object.fromEntries(data.profile.serviceZones.map((item) => [item.serviceZone.id, { radius: item.travelRadiusKm, emergency: item.emergencyAvailable }])))
        const nextSchedule = Object.fromEntries(DAYS.map((_, day) => [day, { enabled: false, start: '09:00', end: '18:00' }]))
        data.profile.availability.forEach((slot) => {
          nextSchedule[slot.dayOfWeek] = { enabled: true, start: slot.startTime, end: slot.endTime }
        })
        setSchedule(nextSchedule)
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : ''
        if (message.includes('profile') || message.includes('provider')) setMissingProfile(true)
        else throw error
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load the electrician workspace')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isRestoring && !isAuthenticated) {
      router.replace('/login?redirect=/electrician/dashboard')
      return
    }
    if (!isRestoring && isAuthenticated) void load()
  }, [isAuthenticated, isRestoring, load, router])

  const profile = dashboard?.profile
  const canVerifyEdit = !profile || ['DRAFT', 'REJECTED'].includes(profile.status)
  const canOperationalEdit = !profile || ['DRAFT', 'REJECTED', 'VERIFIED'].includes(profile.status)
  const completedSteps = useMemo(() => {
    if (!profile) return 0
    return [profile.displayName, profile.skills.length, profile.serviceZones.length, profile.availability.length, profile.documents.length === DOCUMENTS.length].filter(Boolean).length
  }, [profile])
  const activeJobs = dashboard ? ACTIVE_JOB_STATES.reduce((sum, status) => sum + (dashboard.jobs.byStatus[status as keyof typeof dashboard.jobs.byStatus] || 0), 0) : 0

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSaving('profile')
    try {
      if (missingProfile) {
        await marketplaceProviderProfileApi.create(form)
        await restoreAuth()
        toast.success('Your electrician profile has been created')
      } else {
        await marketplaceProviderProfileApi.update(form)
        toast.success('Profile details updated')
      }
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save profile')
    } finally {
      setSaving(null)
    }
  }

  async function saveSkills() {
    if (!Object.keys(selectedSkills).length) return toast.error('Select at least one skill')
    setSaving('skills')
    try {
      await marketplaceProviderProfileApi.replaceSkills(Object.entries(selectedSkills).map(([skillId, yearsExperience]) => ({ skillId, yearsExperience, proficiency: 'STANDARD' })))
      toast.success('Skills updated')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save skills') }
    finally { setSaving(null) }
  }

  async function saveZones() {
    if (!Object.keys(selectedZones).length) return toast.error('Select at least one service area')
    setSaving('zones')
    try {
      await marketplaceProviderProfileApi.replaceZones(Object.entries(selectedZones).map(([serviceZoneId, value]) => ({ serviceZoneId, travelRadiusKm: value.radius, emergencyAvailable: value.emergency })))
      toast.success('Service areas updated')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save service areas') }
    finally { setSaving(null) }
  }

  async function saveSchedule() {
    const slots = Object.entries(schedule).filter(([, value]) => value.enabled).map(([day, value]) => ({ dayOfWeek: Number(day), startTime: value.start, endTime: value.end }))
    if (!slots.length) return toast.error('Add at least one working day')
    setSaving('schedule')
    try {
      await marketplaceProviderProfileApi.replaceAvailability(slots)
      toast.success('Availability updated')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save availability') }
    finally { setSaving(null) }
  }

  async function uploadDocument(type: ProviderDocumentType, file?: File) {
    if (!file) return
    setSaving(type)
    try {
      await marketplaceProviderProfileApi.uploadDocument(type, file)
      toast.success(`${statusLabel(type)} uploaded securely`)
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Document upload failed') }
    finally { setSaving(null) }
  }

  async function submitForReview() {
    setSaving('submit')
    try {
      await marketplaceProviderProfileApi.submit()
      toast.success('Profile submitted for ePowerFix verification')
      await load()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Profile is not ready for submission') }
    finally { setSaving(null) }
  }

  if (loading || isRestoring) {
    return <main className={styles.loading}><Loader2 className={styles.spinner} /><p>Preparing your electrician workspace…</p></main>
  }

  return (
    <div className={styles.shell}>
      <Header />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.container}>
            <div className={styles.heroGrid}>
              <div>
                <span className={styles.eyebrow}><Sparkles size={15} /> Electrician workspace</span>
                <h1>Build trust. Manage work. <span>Grow with ePowerFix.</span></h1>
                <p>One professional workspace for your verified profile, service coverage, documents, jobs, and earnings.</p>
                <div className={styles.heroActions}>
                  {profile?.status === 'VERIFIED' && <Link className={styles.primaryButton} href={`/electricians/${profile.id}`}>View public profile <ArrowRight size={17} /></Link>}
                  <a className={styles.secondaryButton} href="#profile-setup">Complete profile <ChevronRight size={17} /></a>
                </div>
              </div>
              <div className={styles.identityCard}>
                <div className={styles.avatar}>{initials(profile?.displayName || user?.name || 'Electrician')}</div>
                <div className={styles.identityBody}>
                  <span className={`${styles.status} ${styles[`status${profile?.status || 'DRAFT'}`] || ''}`}><span />{statusLabel(profile?.status || 'New profile')}</span>
                  <h2>{profile?.displayName || user?.name || 'Your electrician profile'}</h2>
                  <p>{profile?.bio || 'Add your expertise and service promise to help customers choose confidently.'}</p>
                  <div className={styles.progressHeader}><span>Profile readiness</span><strong>{completedSteps}/5</strong></div>
                  <div className={styles.progress}><span style={{ width: `${completedSteps * 20}%` }} /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={`${styles.container} ${styles.workspace}`}>
          {profile?.status === 'REJECTED' && <div className={styles.alert}><AlertCircle /><div><strong>Changes requested</strong><p>{profile.rejectionReason || 'Review the highlighted information and submit again.'}</p></div></div>}
          {profile?.status === 'UNDER_REVIEW' && <div className={styles.info}><ShieldCheck /><div><strong>Verification in progress</strong><p>Your submitted identity and skill evidence are being reviewed. Verification fields are temporarily locked.</p></div></div>}

          <section className={styles.stats} aria-label="Performance summary">
            <article><span className={styles.statIcon}><BriefcaseBusiness /></span><div><small>Active jobs</small><strong>{activeJobs}</strong><p>{dashboard?.jobs.total || 0} all-time jobs</p></div></article>
            <article><span className={styles.statIcon}><Banknote /></span><div><small>Net earnings</small><strong>{money(dashboard?.finance.netEarnings || '0')}</strong><p>{money(dashboard?.finance.availableForPayout || '0')} available</p></div></article>
            <article><span className={styles.statIcon}><Star /></span><div><small>Customer rating</small><strong>{profile ? Number(profile.rating).toFixed(1) : '—'}</strong><p>{profile?.reviewCount || 0} published reviews</p></div></article>
            <article><span className={styles.statIcon}><BadgeCheck /></span><div><small>Completed work</small><strong>{profile?.jobsCompleted || 0}</strong><p>Verified ePowerFix jobs</p></div></article>
          </section>

          <div className={styles.mainGrid} id="profile-setup">
            <div className={styles.primaryColumn}>
              <section className={styles.panel}>
                <div className={styles.panelHeader}><div><span>01 · Identity</span><h2>Professional profile</h2><p>This information appears on your customer-facing profile.</p></div><UserRound /></div>
                <form className={styles.formGrid} onSubmit={saveProfile}>
                  <label>Professional name<input id="electrician-display-name" required minLength={2} disabled={!canVerifyEdit && profile?.status !== 'VERIFIED'} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></label>
                  <label>বাংলা নাম<input id="electrician-display-name-bn" value={form.displayNameBn} onChange={(e) => setForm({ ...form, displayNameBn: e.target.value })} /></label>
                  <label>Years of experience<input id="electrician-experience" type="number" min={0} max={60} disabled={!canVerifyEdit} value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: Number(e.target.value) })} /></label>
                  <label className={styles.toggleLabel}><input id="electrician-emergency" type="checkbox" checked={form.emergencyAvailable} onChange={(e) => setForm({ ...form, emergencyAvailable: e.target.checked })} /><span><strong>Emergency response</strong><small>Show that you accept urgent requests</small></span></label>
                  <label className={styles.full}>Professional bio<textarea id="electrician-bio" maxLength={1200} rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell customers about your training, specialist work, and service standards…" /></label>
                  <div className={`${styles.full} ${styles.actions}`}><button id="save-electrician-profile" className={styles.saveButton} disabled={saving === 'profile'}>{saving === 'profile' ? <Loader2 className={styles.spinner} /> : <Check />} {missingProfile ? 'Create profile' : 'Save profile'}</button></div>
                </form>
              </section>

              {!missingProfile && <>
                <section className={styles.panel}>
                  <div className={styles.panelHeader}><div><span>02 · Expertise</span><h2>Skills & experience</h2><p>Select the electrical services you can deliver professionally.</p></div><Wrench /></div>
                  <div className={styles.choiceGrid}>{skills.map((skill) => {
                    const selected = selectedSkills[skill.id] !== undefined
                    return <button type="button" key={skill.id} className={`${styles.choiceCard} ${selected ? styles.choiceSelected : ''}`} onClick={() => canVerifyEdit && setSelectedSkills((current) => { const next = { ...current }; if (selected) delete next[skill.id]; else next[skill.id] = Math.max(1, form.yearsExperience); return next })} disabled={!canVerifyEdit}>
                      <span className={styles.choiceCheck}>{selected && <Check />}</span><strong>{skill.name}</strong><small>{skill.nameBn}</small>
                      {selected && <label onClick={(event) => event.stopPropagation()}>Experience <input aria-label={`${skill.name} years experience`} type="number" min={0} max={60} value={selectedSkills[skill.id]} onChange={(e) => setSelectedSkills({ ...selectedSkills, [skill.id]: Number(e.target.value) })} /></label>}
                    </button>
                  })}</div>
                  {canVerifyEdit && <div className={styles.actions}><button id="save-electrician-skills" type="button" className={styles.saveButton} onClick={saveSkills} disabled={saving === 'skills'}>{saving === 'skills' ? <Loader2 className={styles.spinner} /> : <Check />} Save skills</button></div>}
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}><div><span>03 · Coverage</span><h2>Service areas</h2><p>Choose where you work and how far you can travel.</p></div><MapPin /></div>
                  <div className={styles.zoneList}>{zones.map((zone) => {
                    const selected = selectedZones[zone.id]
                    return <div key={zone.id} className={`${styles.zoneRow} ${selected ? styles.zoneSelected : ''}`}>
                      <button type="button" onClick={() => canOperationalEdit && setSelectedZones((current) => { const next = { ...current }; if (selected) delete next[zone.id]; else next[zone.id] = { radius: 10, emergency: false }; return next })} disabled={!canOperationalEdit}><span className={styles.choiceCheck}>{selected && <Check />}</span><span><strong>{zone.name}</strong><small>{zone.district.name} · {zone.nameBn}</small></span></button>
                      {selected && <div className={styles.zoneControls}><label>Radius <input type="number" min={1} max={100} value={selected.radius} onChange={(e) => setSelectedZones({ ...selectedZones, [zone.id]: { ...selected, radius: Number(e.target.value) } })} /><span>km</span></label><label className={styles.miniToggle}><input type="checkbox" checked={selected.emergency} onChange={(e) => setSelectedZones({ ...selectedZones, [zone.id]: { ...selected, emergency: e.target.checked } })} /> Emergency</label></div>}
                    </div>
                  })}</div>
                  {canOperationalEdit && <div className={styles.actions}><button id="save-electrician-zones" type="button" className={styles.saveButton} onClick={saveZones} disabled={saving === 'zones'}>{saving === 'zones' ? <Loader2 className={styles.spinner} /> : <Check />} Save coverage</button></div>}
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}><div><span>04 · Schedule</span><h2>Weekly availability</h2><p>Keep your working hours accurate for better job matching.</p></div><CalendarDays /></div>
                  <div className={styles.schedule}>{DAYS.map((day, dayOfWeek) => { const slot = schedule[dayOfWeek]; return <div key={day} className={styles.scheduleRow}><label className={styles.dayToggle}><input type="checkbox" checked={slot.enabled} disabled={!canOperationalEdit} onChange={(e) => setSchedule({ ...schedule, [dayOfWeek]: { ...slot, enabled: e.target.checked } })} /><span>{day}</span></label><div className={styles.timeInputs}><input aria-label={`${day} start time`} type="time" disabled={!slot.enabled || !canOperationalEdit} value={slot.start} onChange={(e) => setSchedule({ ...schedule, [dayOfWeek]: { ...slot, start: e.target.value } })} /><span>to</span><input aria-label={`${day} end time`} type="time" disabled={!slot.enabled || !canOperationalEdit} value={slot.end} onChange={(e) => setSchedule({ ...schedule, [dayOfWeek]: { ...slot, end: e.target.value } })} /></div></div> })}</div>
                  {canOperationalEdit && <div className={styles.actions}><button id="save-electrician-availability" type="button" className={styles.saveButton} onClick={saveSchedule} disabled={saving === 'schedule'}>{saving === 'schedule' ? <Loader2 className={styles.spinner} /> : <Check />} Save schedule</button></div>}
                </section>

                <section className={styles.panel}>
                  <div className={styles.panelHeader}><div><span>05 · Verification</span><h2>Secure documents</h2><p>Files are privately stored and visible only to you and authorized ePowerFix reviewers.</p></div><ShieldCheck /></div>
                  <div className={styles.documentGrid}>{DOCUMENTS.map((definition) => { const document = profile?.documents.find((item) => item.type === definition.type); return <article key={definition.type} className={styles.documentCard}>
                    <span className={styles.documentIcon}>{document?.status === 'APPROVED' ? <CheckCircle2 /> : document?.status === 'REJECTED' ? <AlertCircle /> : <FileCheck2 />}</span>
                    <div><strong>{definition.title}</strong><p>{document?.rejectionReason || definition.hint}</p>{document && <span className={`${styles.documentStatus} ${styles[`doc${document.status}`]}`}>{statusLabel(document.status)}</span>}</div>
                    {canVerifyEdit && <label className={styles.uploadButton} htmlFor={`upload-${definition.type}`}>{saving === definition.type ? <Loader2 className={styles.spinner} /> : <UploadCloud />}<span>{document ? 'Replace' : 'Upload'}</span><input id={`upload-${definition.type}`} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => void uploadDocument(definition.type, e.target.files?.[0])} /></label>}
                  </article> })}</div>
                  <p className={styles.privacyNote}><ShieldCheck /> JPEG, PNG, WebP, or PDF · Maximum 8 MB per file · Never public</p>
                </section>
              </>}
            </div>

            <aside className={styles.sideColumn}>
              <section className={`${styles.panel} ${styles.readinessPanel}`}>
                <div className={styles.readinessIcon}><Zap /></div><h2>Verification checklist</h2><p>Complete every requirement to submit your profile.</p>
                <div className={styles.checklist}>{(dashboard?.readinessIssues.length ? dashboard.readinessIssues : ['READY']).map((issue) => issue === 'READY' ? <div key={issue} className={styles.completeItem}><CheckCircle2 /><span>Profile is ready for review</span></div> : <div key={issue} className={styles.pendingItem}><Clock3 /><span>{issueLabel(issue as ProviderReadinessIssue)}</span></div>)}</div>
                {profile && ['DRAFT', 'REJECTED'].includes(profile.status) && <button id="submit-electrician-profile" className={styles.submitButton} onClick={submitForReview} disabled={saving === 'submit' || !!dashboard?.readinessIssues.length}>{saving === 'submit' ? <Loader2 className={styles.spinner} /> : <FileUp />} Submit for verification</button>}
              </section>

              <section className={styles.panel}><div className={styles.miniHeading}><h2>Recent jobs</h2><span>{dashboard?.jobs.total || 0}</span></div><div className={styles.jobList}>{dashboard?.jobs.recent.length ? dashboard.jobs.recent.map((job) => <Link href={`/marketplace/jobs/${job.id}`} key={job.id} className={styles.jobItem}><span className={styles.jobDot} /><div><strong>{job.request.problemSummary}</strong><small><MapPin /> {job.request.serviceZone.name}</small><small><Clock3 /> {dateLabel(job.request.scheduledFor)}</small></div><span className={styles.jobStatus}>{statusLabel(job.status)}</span></Link>) : <div className={styles.empty}><BriefcaseBusiness /><p>No assigned jobs yet.</p></div>}</div></section>
              <section className={styles.supportCard}><div><Sparkles /><h2>Need profile help?</h2><p>Our verification team can guide you through document and skill requirements.</p></div><Link href="/contact">Contact support <ArrowRight /></Link></section>
            </aside>
          </div>
        </div>
      </main>
      <Footer /><CartDrawer /><CheckoutDialog /><ChatWidget /><BackToTopButton />
    </div>
  )
}
