"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery<{ success: boolean; data: { data: Notification[]; unreadCount: number }; message?: string }>({
    queryKey: ["notifications"],
    queryFn: () => fetch(`${API}/notifications?limit=10`, { credentials: "include" }).then((r) => r.json()),
    refetchInterval: 30000,
  });

  const notifications = data?.data?.data ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API}/notifications/${id}/read`, { method: "PUT", credentials: "include" }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () =>
      fetch(`${API}/notifications/read-all`, { method: "PUT", credentials: "include" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center justify-center h-10 w-10 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors">
          <Bell className="h-5 w-5 text-[#374151]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-h-[18px] min-w-[18px] h-[18px] w-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E2E8F0]">
          <p className="text-sm font-semibold text-[#111827]">
            Notifications {unreadCount > 0 && <span className="text-[#6B7280] font-normal">({unreadCount} new)</span>}
          </p>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] px-2 text-[#0EA5E9]"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="size-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Bell className="h-8 w-8 text-[#CBD5E1] mb-2" />
            <p className="text-[13px] text-[#6B7280]">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex-col items-start gap-1 p-3 cursor-pointer hover:bg-[#F8FAFC] focus:bg-[#F8FAFC] border-b border-[#F1F5F9] last:border-0"
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <p className={`text-[13px] ${n.isRead ? "font-medium text-[#374151]" : "font-semibold text-[#111827]"}`}>
                    {n.title}
                  </p>
                  {!n.isRead && <span className="h-2 w-2 rounded-full bg-[#0EA5E9] shrink-0" />}
                </div>
                <p className="text-[12px] text-[#6B7280] leading-snug w-full">{n.message}</p>
                <p className="text-[11px] text-[#94A3B8]">{timeAgo(n.createdAt)}</p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
