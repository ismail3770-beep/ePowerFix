"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck, ChevronRight, CircleAlert, Clock3, HardHat, Loader2,
  MapPin, Search, ShieldCheck, Star, UserCheck, UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { marketplaceAdminProvidersApi } from "@epowerfix/api-client";
import type {
  MarketplaceAdminProviderListItem,
  MarketplaceAdminProviderSummary,
  ProviderStatus,
} from "@epowerfix/types";

const STATUSES: Array<{ value: "ALL" | ProviderStatus; label: string }> = [
  { value: "ALL", label: "All profiles" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DRAFT", label: "Draft" },
];

const statusStyle: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-200",
  UNDER_REVIEW: "bg-sky-50 text-sky-700 border-sky-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
  SUSPENDED: "bg-red-50 text-red-700 border-red-200",
};

function statusLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "EP";
}

function formatDate(value?: string | null) {
  if (!value) return "Not submitted";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(value));
}

export default function AdminElectriciansPage() {
  const [providers, setProviders] = useState<MarketplaceAdminProviderListItem[]>([]);
  const [summary, setSummary] = useState<MarketplaceAdminProviderSummary | null>(null);
  const [status, setStatus] = useState<"ALL" | ProviderStatus>("ALL");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listResponse, summaryResponse] = await Promise.all([
        marketplaceAdminProvidersApi.list({
          page,
          limit: 20,
          status: status === "ALL" ? undefined : status,
          search: query || undefined,
        }),
        marketplaceAdminProvidersApi.summary(),
      ]);
      setProviders(listResponse.data.data);
      setTotal(listResponse.data.total);
      setTotalPages(Math.max(1, listResponse.data.totalPages));
      setSummary(summaryResponse.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load electrician profiles");
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(1); }, [query, status]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setQuery(search.trim());
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 text-white shadow-sm sm:p-8">
        <div className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-200"><ShieldCheck className="h-4 w-4" /> Marketplace trust</span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Electrician verification</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Review identity documents, verify professional skills, approve qualified electricians, and monitor marketplace access.</p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <UserCheck className="h-9 w-9 rounded-lg bg-sky-400/15 p-2 text-sky-300" />
            <div><p className="text-xs text-slate-400">Awaiting review</p><strong className="text-2xl">{summary?.awaitingReview ?? 0}</strong></div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">All profiles</span><UsersRound className="h-5 w-5 text-sky-600" /></div><strong className="mt-2 block text-2xl text-slate-900">{summary?.total ?? 0}</strong><p className="mt-1 text-xs text-slate-400">Electrician applications</p></article>
        <article className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</span><Clock3 className="h-5 w-5 text-amber-500" /></div><strong className="mt-2 block text-2xl text-slate-900">{summary?.byStatus.SUBMITTED ?? 0}</strong><p className="mt-1 text-xs text-slate-400">Ready to claim</p></article>
        <article className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Under review</span><ShieldCheck className="h-5 w-5 text-sky-600" /></div><strong className="mt-2 block text-2xl text-slate-900">{summary?.byStatus.UNDER_REVIEW ?? 0}</strong><p className="mt-1 text-xs text-slate-400">Being assessed</p></article>
        <article className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</span><BadgeCheck className="h-5 w-5 text-emerald-600" /></div><strong className="mt-2 block text-2xl text-slate-900">{summary?.byStatus.VERIFIED ?? 0}</strong><p className="mt-1 text-xs text-slate-400">Active professionals</p></article>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((option) => <button id={`filter-electricians-${option.value.toLowerCase()}`} key={option.value} onClick={() => setStatus(option.value)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${status === option.value ? "bg-sky-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>{option.label}{option.value !== "ALL" && summary ? ` (${summary.byStatus[option.value] ?? 0})` : ""}</button>)}
          </div>
          <form onSubmit={submitSearch} className="flex min-w-0 gap-2 lg:w-80">
            <label className="relative min-w-0 flex-1"><span className="sr-only">Search electricians</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="search-electricians" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" placeholder="Name, email, or phone" /></label>
            <button id="submit-electrician-search" className="rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800">Search</button>
          </form>
        </div>

        {loading ? <div className="grid min-h-72 place-items-center"><div className="text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-sky-600" />Loading electrician profiles…</div></div> : providers.length ? <div className="divide-y">
          {providers.map((provider) => <Link key={provider.id} href={`/admin/electricians/${provider.id}`} className="group grid gap-4 p-4 transition hover:bg-sky-50/40 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-700 text-sm font-bold text-white shadow-sm">{initials(provider.displayName)}</div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-slate-900">{provider.displayName}</h2><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyle[provider.status]}`}>{statusLabel(provider.status)}</span>{provider.emergencyAvailable && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Emergency</span>}</div>
              <p className="mt-1 truncate text-xs text-slate-500">{provider.user.email} · {provider.user.phone || "No phone"}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500"><span className="flex items-center gap-1"><HardHat className="h-3.5 w-3.5 text-sky-600" /> {provider.yearsExperience} years</span><span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> {provider._count.documents} documents</span><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-sky-600" /> {provider._count.serviceZones} zones</span><span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> {Number(provider.rating).toFixed(1)}</span></div>
            </div>
            <div className="flex items-center justify-between gap-5 sm:justify-end"><div className="text-right"><small className="block text-[10px] uppercase tracking-wide text-slate-400">Submitted</small><span className="text-xs font-medium text-slate-600">{formatDate(provider.submittedAt)}</span></div><ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-600" /></div>
          </Link>)}
        </div> : <div className="grid min-h-72 place-items-center p-8 text-center"><div><CircleAlert className="mx-auto mb-3 h-10 w-10 text-slate-300" /><h2 className="font-semibold text-slate-700">No electrician profiles found</h2><p className="mt-1 text-sm text-slate-400">Try another status or search term.</p></div></div>}

        <div className="flex flex-col gap-3 border-t bg-slate-50/60 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>{total} profiles · Page {page} of {totalPages}</span><div className="flex gap-2"><button id="previous-electrician-page" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border bg-white px-3 py-2 font-semibold disabled:opacity-40">Previous</button><button id="next-electrician-page" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border bg-white px-3 py-2 font-semibold disabled:opacity-40">Next</button></div></div>
      </section>
    </div>
  );
}
