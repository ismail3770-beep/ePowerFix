"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) {return "just now";}
  if (mins < 60) {return `${mins}m ago`;}
  const hours = Math.floor(mins / 60);
  if (hours < 24) {return `${hours}h ago`;}
  const days = Math.floor(hours / 24);
  if (days < 7) {return `${days}d ago`;}
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery<{ success: boolean; data: { data: Notification[]; unreadCount: number }; message?: string }>({
    queryKey: ["notifications"],
    queryFn: () => apiFetch("/api/notifications?limit=10"),
    refetchInterval: 30000,
  });

  const notifications = data?.data?.data ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/notifications/${id}/read`, { method: "PUT" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications/read-all", { method: "PUT" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center justify-center h-10 w-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
          <Bell className="h-5 w-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-h-[18px] min-w-[18px] h-[18px] w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200">
          <p className="text-sm font-semibold text-slate-900">
            Notifications {unreadCount > 0 && <span className="text-slate-500 font-normal">({unreadCount} new)</span>}
          </p>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] px-2 text-epf-500"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="size-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Bell className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-[13px] text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex-col items-start gap-1 p-3 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 border-b border-slate-100 last:border-0"
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <p className={`text-[13px] ${n.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
                    {n.title}
                  </p>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-epf-500 shrink-0" />}
                </div>
                <p className="text-[12px] text-slate-500 leading-snug w-full">{n.message}</p>
                <p className="text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
