"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import type { MarketplaceNotification, MarketplaceNotificationListResponse } from "@epowerfix/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface LegacyNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

type InboxNotification = {
  id: string;
  source: "legacy" | "marketplace";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  href: string | null;
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function marketplaceNotificationHref(notification: MarketplaceNotification): string | null {
  let payload: Record<string, unknown> = {};
  try {
    const parsed = typeof notification.payload === "string"
      ? JSON.parse(notification.payload)
      : notification.payload;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      payload = parsed as Record<string, unknown>;
    }
  } catch {
    // A malformed optional payload must not break the notification inbox.
  }

  const payloadJobId = typeof payload.jobId === "string" ? payload.jobId : null;
  const jobId = payloadJobId || (notification.entityType === "MARKETPLACE_JOB" ? notification.entityId : null);
  return jobId ? `/marketplace/jobs/${encodeURIComponent(jobId)}` : null;
}

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const legacyQuery = useQuery<{ success: boolean; data: { data: LegacyNotification[]; unreadCount: number } }>({
    queryKey: ["notifications", "legacy"],
    queryFn: () => apiFetch("/api/notifications?limit=10"),
    refetchInterval: 30000,
  });
  const marketplaceQuery = useQuery<MarketplaceNotificationListResponse>({
    queryKey: ["notifications", "marketplace"],
    queryFn: () => apiFetch("/api/marketplace/notifications?limit=10"),
    refetchInterval: 30000,
    retry: false,
  });

  const legacyNotifications: InboxNotification[] = (legacyQuery.data?.data?.data ?? []).map((item) => ({
    id: item.id,
    source: "legacy",
    title: item.title,
    message: item.message,
    isRead: item.isRead,
    createdAt: item.createdAt,
    href: null,
  }));
  const marketplaceNotifications: InboxNotification[] = (marketplaceQuery.data?.data?.data ?? []).map((item: MarketplaceNotification) => ({
    id: item.id,
    source: "marketplace",
    title: item.title,
    message: item.message,
    isRead: Boolean(item.readAt),
    createdAt: item.createdAt,
    href: marketplaceNotificationHref(item),
  }));
  const notifications = [...legacyNotifications, ...marketplaceNotifications]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 12);
  const unreadCount = (legacyQuery.data?.data?.unreadCount ?? 0) + (marketplaceQuery.data?.unreadCount ?? 0);

  const refreshInbox = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markReadMutation = useMutation({
    mutationFn: (notification: InboxNotification) => apiFetch(
      notification.source === "marketplace"
        ? `/api/marketplace/notifications/${encodeURIComponent(notification.id)}/read`
        : `/api/notifications/${encodeURIComponent(notification.id)}/read`,
      { method: "PUT" },
    ),
    onSuccess: refreshInbox,
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => Promise.allSettled([
      apiFetch("/api/notifications/read-all", { method: "PUT" }),
      apiFetch("/api/marketplace/notifications/read-all", { method: "PUT" }),
    ]),
    onSuccess: () => {
      void refreshInbox();
      toast.success("All notifications marked as read");
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button id="notification-inbox-trigger" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md">
          <Bell className="h-5 w-5 text-slate-700" />
          {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-1 text-[10px] font-bold text-white shadow-sm">{unreadCount > 99 ? "99+" : unreadCount}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(23rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border-slate-200 p-0 shadow-2xl">
        <div className="bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 px-4 py-3.5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-sm font-semibold">Your inbox</p><p className="mt-0.5 text-[11px] text-sky-100/75">Orders and electrician service updates</p></div>
            {unreadCount > 0 && <Button id="notification-mark-all-read" size="sm" variant="ghost" disabled={markAllReadMutation.isPending} className="h-8 text-[11px] text-sky-100 hover:bg-white/10 hover:text-white" onClick={(event) => { event.preventDefault(); markAllReadMutation.mutate(); }}><CheckCheck className="mr-1 size-3.5" />Mark all read</Button>}
          </div>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white px-6 py-12 text-center"><div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-sky-50"><Bell className="h-5 w-5 text-sky-500" /></div><p className="text-sm font-semibold text-slate-800">You&apos;re all caught up</p><p className="mt-1 text-xs text-slate-500">New order and service activity will appear here.</p></div>
        ) : (
          <div className="max-h-[390px] overflow-y-auto bg-white">
            {notifications.map((notification) => (
              <DropdownMenuItem key={`${notification.source}:${notification.id}`} id={`notification-${notification.source}-${notification.id}`} className={`flex cursor-pointer flex-col items-start gap-1 border-b border-slate-100 p-3.5 last:border-0 focus:bg-sky-50 ${notification.isRead ? "bg-white" : "bg-sky-50/60"}`} onClick={() => {
                if (!notification.isRead) markReadMutation.mutate(notification);
                if (notification.href) {
                  setOpen(false);
                  router.push(notification.href);
                }
              }}>
                <div className="flex w-full items-start justify-between gap-3"><p className={`text-[13px] leading-snug ${notification.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-950"}`}>{notification.title}</p>{!notification.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500 ring-4 ring-sky-100" />}</div>
                <p className="w-full text-[12px] leading-relaxed text-slate-500">{notification.message}</p>
                <div className="mt-1 flex items-center gap-2"><span className="text-[10px] font-medium uppercase tracking-wide text-sky-600">{notification.source === "marketplace" ? "Service" : "Store"}</span><span className="text-[11px] text-slate-400">{timeAgo(notification.createdAt)}</span>{notification.href && <span className="text-[10px] font-semibold text-emerald-600">Open job</span>}</div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
