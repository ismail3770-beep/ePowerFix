"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BadgeCheck, BadgeX, Ban, Check, CheckCircle2, ChevronRight,
  Clock3, FileCheck2, FileX2, HardHat, Loader2, MapPin, RefreshCw,
  RotateCcw, Search, ShieldCheck, ShieldX, Star, UserCheck, Wrench, X,
} from "lucide-react";
import { toast } from "sonner";
import { marketplaceAdminProvidersApi } from "@epowerfix/api-client";
import type { MarketplaceAdminProviderDetail, ProviderStatus } from "@epowerfix/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type ProviderWithUser = MarketplaceAdminProviderDetail;

const statusStyle: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-sky-50 text-sky-700 border-sky-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
};

const documentTypeLabels: Record<string, string> = {
  NID_FRONT: "NID Front",
  NID_BACK: "NID Back",
  SELFIE: "Identity Selfie",
  ADDRESS_PROOF: "Address Proof",
  SKILL_PROOF: "Skill Evidence",
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function statusLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "EP";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function money(value: string, currency = "BDT") {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
}

export default function AdminElectricianDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [recoverNote, setRecoverNote] = useState("");
  const [recoverStatus, setRecoverStatus] = useState<"UNDER_REVIEW" | "VERIFIED">("UNDER_REVIEW");
  const [docRejectReason, setDocRejectReason] = useState<Record<string, string>>({});
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await marketplaceAdminProvidersApi.get(params.id);
      setProvider(response.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load electrician profile");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  async function startReview() {
    setActionLoading("start-review");
    try {
      const response = await marketplaceAdminProvidersApi.startReview(params.id);
      setProvider(response.data);
      toast.success("Review started");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start review");
    } finally {
      setActionLoading(null);
    }
  }

  async function decide(status: "VERIFIED" | "REJECTED") {
    setActionLoading(`decide-${status}`);
    try {
      const response = await marketplaceAdminProvidersApi.decide(params.id, status, status === "REJECTED" ? rejectReason || undefined : undefined);
      setProvider(response.data);
      toast.success(`Electrician ${status === "VERIFIED" ? "verified" : "rejected"}`);
      setRejectReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not process decision");
    } finally {
      setActionLoading(null);
    }
  }

  async function suspend() {
    if (!suspendReason.trim()) return toast.error("Please provide a reason for suspension");
    setActionLoading("suspend");
    try {
      const response = await marketplaceAdminProvidersApi.suspend(params.id, suspendReason);
      setProvider(response.data);
      toast.success("Electrician suspended");
      setSuspendReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not suspend");
    } finally {
      setActionLoading(null);
    }
  }

  async function recover() {
    setActionLoading("recover");
    try {
      const response = await marketplaceAdminProvidersApi.recover(params.id, recoverStatus, recoverNote || undefined);
      setProvider(response.data);
      toast.success("Electrician recovered");
      setRecoverNote("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not recover");
    } finally {
      setActionLoading(null);
    }
  }

  async function reviewDocument(documentId: string, status: "APPROVED" | "REJECTED") {
    setActionLoading(`doc-${documentId}`);
    try {
      const response = await marketplaceAdminProvidersApi.reviewDocument(params.id, documentId, status, status === "REJECTED" ? docRejectReason[documentId] || undefined : undefined);
      setProvider((prev) => prev ? { ...prev, documents: prev.documents.map((d) => d.id === documentId ? response.data : d) } : prev);
      toast.success(`Document ${status === "APPROVED" ? "approved" : "rejected"}`);
      setDocRejectReason((prev) => { const next = { ...prev }; delete next[documentId]; return next; });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review document");
    } finally {
      setActionLoading(null);
    }
  }

  async function reviewSkill(skillId: string, isVerified: boolean) {
    setActionLoading(`skill-${skillId}`);
    try {
      const response = await marketplaceAdminProvidersApi.reviewSkill(params.id, skillId, isVerified);
      setProvider((prev) => prev ? { ...prev, skills: prev.skills.map((s) => s.id === skillId ? response.data : s) } : prev);
      toast.success(`Skill ${isVerified ? "verified" : "unverified"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review skill");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-sky-600" />
          <p className="text-sm text-slate-500">Loading electrician profile…</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <ShieldX className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h2 className="font-semibold text-slate-700">Electrician not found</h2>
          <p className="mt-1 text-sm text-slate-400">This profile may have been removed.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/electricians")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to electricians
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/electricians")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{provider.displayName}</h1>
          <p className="text-sm text-slate-500">Electrician verification detail</p>
        </div>
        <Badge className={`ml-auto rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyle[provider.status]}`}>
          {statusLabel(provider.status)}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Star className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-xs text-slate-500">Rating</p>
              <p className="text-lg font-bold text-slate-900">{Number(provider.rating).toFixed(1)}</p>
              <p className="text-xs text-slate-400">{provider.reviewCount} reviews</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <HardHat className="h-8 w-8 text-sky-600" />
            <div>
              <p className="text-xs text-slate-500">Experience</p>
              <p className="text-lg font-bold text-slate-900">{provider.yearsExperience} years</p>
              <p className="text-xs text-slate-400">{provider.jobsCompleted} jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BadgeCheck className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs text-slate-500">Documents</p>
              <p className="text-lg font-bold text-slate-900">{provider.documents.filter((d) => d.status === "APPROVED").length}/{provider.documents.length}</p>
              <p className="text-xs text-slate-400">approved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wrench className="h-8 w-8 text-violet-600" />
            <div>
              <p className="text-xs text-slate-500">Skills</p>
              <p className="text-lg font-bold text-slate-900">{provider.skills.filter((s) => s.isVerified).length}/{provider.skills.length}</p>
              <p className="text-xs text-slate-400">verified</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="zones">Service Zones</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500">Display Name</label>
                <p className="text-sm text-slate-900">{provider.displayName}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">বাংলা নাম</label>
                <p className="text-sm text-slate-900">{provider.displayNameBn || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Email</label>
                <p className="text-sm text-slate-900">{provider.user.email}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Phone</label>
                <p className="text-sm text-slate-900">{provider.user.phone || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Years of Experience</label>
                <p className="text-sm text-slate-900">{provider.yearsExperience}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Emergency Available</label>
                <p className="text-sm text-slate-900">{provider.emergencyAvailable ? "Yes" : "No"}</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-500">Professional Bio</label>
                <p className="text-sm text-slate-900">{provider.bio || "—"}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Submitted</label>
                <p className="text-sm text-slate-900">{formatDate(provider.submittedAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Reviewed</label>
                <p className="text-sm text-slate-900">{formatDate(provider.reviewedAt)}</p>
              </div>
              {provider.rejectionReason && (
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-rose-500">Rejection Reason</label>
                  <p className="text-sm text-rose-700">{provider.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {provider.documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <FileX2 className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-700">No documents uploaded</p>
                <p className="text-sm text-slate-400">This electrician has not submitted any verification documents yet.</p>
              </CardContent>
            </Card>
          ) : (
            provider.documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={`rounded-lg p-2 ${doc.status === "APPROVED" ? "bg-emerald-50" : doc.status === "REJECTED" ? "bg-rose-50" : "bg-amber-50"}`}>
                    {doc.status === "APPROVED" ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : doc.status === "REJECTED" ? <BadgeX className="h-6 w-6 text-rose-500" /> : <Clock3 className="h-6 w-6 text-amber-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{documentTypeLabels[doc.type] || doc.type}</h3>
                      <Badge variant="outline" className={`text-xs ${doc.status === "APPROVED" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : doc.status === "REJECTED" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {statusLabel(doc.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Uploaded {formatDate(doc.createdAt)}</p>
                    {doc.rejectionReason && <p className="mt-1 text-xs text-rose-600">Reason: {doc.rejectionReason}</p>}
                  </div>
                  {doc.status === "PENDING" && (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          disabled={actionLoading === `doc-${doc.id}`}
                          onClick={() => reviewDocument(doc.id, "APPROVED")}
                        >
                          {actionLoading === `doc-${doc.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-200 text-rose-700 hover:bg-rose-50"
                          disabled={actionLoading === `doc-${doc.id}`}
                          onClick={() => setOpenDialog(`doc-reject-${doc.id}`)}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                {openDialog === `doc-reject-${doc.id}` && (
                  <div className="border-t bg-slate-50 px-4 py-3">
                    <label className="block text-xs font-medium text-slate-500">Rejection reason</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        placeholder="Why is this document being rejected?"
                        value={docRejectReason[doc.id] || ""}
                        onChange={(e) => setDocRejectReason((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                      />
                      <Button size="sm" variant="destructive" onClick={() => { void reviewDocument(doc.id, "REJECTED"); setOpenDialog(null); }}>
                        Confirm reject
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenDialog(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          {provider.skills.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Wrench className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-700">No skills added</p>
                <p className="text-sm text-slate-400">This electrician has not listed any skills yet.</p>
              </CardContent>
            </Card>
          ) : (
            provider.skills.map((skill) => (
              <Card key={skill.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`rounded-lg p-2 ${skill.isVerified ? "bg-emerald-50" : "bg-amber-50"}`}>
                    {skill.isVerified ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : <Clock3 className="h-6 w-6 text-amber-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{skill.skill.name}</h3>
                      {skill.skill.nameBn && <span className="text-xs text-slate-400">({skill.skill.nameBn})</span>}
                      <Badge variant="outline" className={`text-xs ${skill.isVerified ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                        {skill.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{skill.yearsExperience} years experience · Proficiency: {skill.proficiency || "STANDARD"}</p>
                    {skill.verifiedAt && <p className="text-xs text-slate-400">Verified at {formatDate(skill.verifiedAt)}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant={skill.isVerified ? "outline" : "default"}
                    className={skill.isVerified ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}
                    disabled={actionLoading === `skill-${skill.id}`}
                    onClick={() => reviewSkill(skill.id, !skill.isVerified)}
                  >
                    {actionLoading === `skill-${skill.id}` ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : skill.isVerified ? <ShieldX className="mr-1 h-3 w-3" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
                    {skill.isVerified ? "Unverify" : "Verify"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          {provider.serviceZones.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <MapPin className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-700">No service zones configured</p>
                <p className="text-sm text-slate-400">This electrician has not selected any service areas yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {provider.serviceZones.map((zone) => (
                <Card key={zone.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                      <div>
                        <h3 className="font-semibold text-slate-900">{zone.serviceZone.name}</h3>
                        <p className="text-xs text-slate-500">{zone.serviceZone.nameBn && `${zone.serviceZone.nameBn} · `}{zone.serviceZone.district.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">{zone.travelRadiusKm} km radius</span>
                          {zone.emergencyAvailable && <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-700">Emergency</span>}
                          <span className={`rounded-md px-2 py-0.5 ${zone.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                            {zone.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          {provider.availability.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Clock3 className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-medium text-slate-700">No availability set</p>
                <p className="text-sm text-slate-400">This electrician has not configured their weekly schedule yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                {DAYS.map((day, index) => {
                  const slot = provider.availability.find((a) => a.dayOfWeek === index);
                  return (
                    <div key={day} className={`flex items-center justify-between px-4 py-3 ${index < 6 ? "border-b" : ""}`}>
                      <span className="text-sm font-medium text-slate-700">{day}</span>
                      {slot?.isActive ? (
                        <span className="text-sm text-slate-900">{slot.startTime} – {slot.endTime}</span>
                      ) : (
                        <span className="text-sm text-slate-400">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Badge className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyle[provider.status]}`}>
                  {statusLabel(provider.status)}
                </Badge>
                <span className="text-sm text-slate-500">Current status</span>
              </div>

              <div className="space-y-4 rounded-lg border bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-700">Verification Flow</h3>
                <div className="flex flex-wrap gap-3">
                  {provider.status === "SUBMITTED" && (
                    <Button
                      disabled={actionLoading === "start-review"}
                      onClick={startReview}
                    >
                      {actionLoading === "start-review" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                      Start Review
                    </Button>
                  )}
                  {(provider.status === "UNDER_REVIEW" || provider.status === "SUBMITTED") && (
                    <>
                      <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        disabled={actionLoading === "decide-VERIFIED"}
                        onClick={() => decide("VERIFIED")}
                      >
                        {actionLoading === "decide-VERIFIED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BadgeCheck className="mr-2 h-4 w-4" />}
                        Approve & Verify
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={actionLoading === "decide-REJECTED"}
                        onClick={openDialog === "reject" ? () => { void decide("REJECTED"); setOpenDialog(null); } : () => setOpenDialog("reject")}
                      >
                        {actionLoading === "decide-REJECTED" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                        Reject
                      </Button>
                    </>
                  )}
                  {provider.status !== "SUSPENDED" && provider.status !== "DRAFT" && (
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      disabled={actionLoading === "suspend"}
                      onClick={openDialog === "suspend" ? suspend : () => setOpenDialog("suspend")}
                    >
                      {actionLoading === "suspend" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                      Suspend
                    </Button>
                  )}
                  {provider.status === "SUSPENDED" && (
                    <Button
                      disabled={actionLoading === "recover"}
                      onClick={openDialog === "recover" ? recover : () => setOpenDialog("recover")}
                    >
                      {actionLoading === "recover" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                      Recover
                    </Button>
                  )}
                </div>

                {openDialog === "reject" && (
                  <div className="mt-3 space-y-2">
                    <label className="text-xs font-medium text-slate-500">Rejection reason (required)</label>
                    <div className="flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                        placeholder="Why is this application being rejected?"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <Button size="sm" variant="destructive" disabled={!rejectReason.trim() || actionLoading === "decide-REJECTED"} onClick={() => { void decide("REJECTED"); setOpenDialog(null); }}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenDialog(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {openDialog === "suspend" && (
                  <div className="mt-3 space-y-2">
                    <label className="text-xs font-medium text-slate-500">Suspension reason (required)</label>
                    <div className="flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        placeholder="Why is this electrician being suspended?"
                        value={suspendReason}
                        onChange={(e) => setSuspendReason(e.target.value)}
                      />
                      <Button size="sm" variant="destructive" disabled={!suspendReason.trim() || actionLoading === "suspend"} onClick={suspend}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenDialog(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {openDialog === "recover" && (
                  <div className="mt-3 space-y-2">
                    <label className="text-xs font-medium text-slate-500">Recover to</label>
                    <div className="flex gap-2">
                      <select
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        value={recoverStatus}
                        onChange={(e) => setRecoverStatus(e.target.value as "UNDER_REVIEW" | "VERIFIED")}
                      >
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="VERIFIED">Verified</option>
                      </select>
                    </div>
                    <label className="text-xs font-medium text-slate-500">Note (optional)</label>
                    <div className="flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        placeholder="Reason for recovery"
                        value={recoverNote}
                        onChange={(e) => setRecoverNote(e.target.value)}
                      />
                      <Button size="sm" disabled={actionLoading === "recover"} onClick={recover}>Confirm</Button>
                      <Button size="sm" variant="ghost" onClick={() => setOpenDialog(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
