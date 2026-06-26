"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, TableSkeleton, StatusBadge, formatDate, messageTypeMap } from "../shared";
import type { Message, StringMutation } from "../types";

export default function MessagesSection({ messages, isLoading, expandedMsgId, setExpandedMsgId, markRead, deleteMsgId, setDeleteMsgId, deleteMutation, onRetry }: {
  messages: Message[]; isLoading: boolean; expandedMsgId: string | null; setExpandedMsgId: (id: string | null) => void;
  markRead: StringMutation; deleteMsgId: string | null; setDeleteMsgId: (id: string | null) => void;
  deleteMutation: StringMutation; onRetry: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Messages</h2>

      {isLoading ? <TableSkeleton rows={5} cols={4} /> : messages.length === 0 ? <EmptyState message="No messages" /> : (
        <div className="space-y-2">
          {messages.map((m) => (
            <Card key={m.id} className={`border border-[#E2E8F0] shadow-none bg-white transition-colors ${!m.isRead ? "border-l-4 border-l-[#0EA5E9]" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <StatusBadge status={m.type} map={messageTypeMap} />
                      {!m.isRead && <span className="w-2 h-2 rounded-full bg-[#0EA5E9] shrink-0" />}
                    </div>
                    {m.subject && <p className="text-xs text-gray-600 mt-0.5">{m.subject}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{m.email} · {formatDate(m.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setExpandedMsgId(expandedMsgId === m.id ? null : m.id)}>
                      {expandedMsgId === m.id ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    </Button>
                    {!m.isRead && <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => markRead.mutate(m.id)}><Eye className="size-3.5" /></Button>}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteMsgId(m.id)}><Trash2 className="size-3.5" /></Button>
                  </div>
                </div>
                {expandedMsgId === m.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-[#E2E8F0]">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.message}</p>
                    {m.phone && <p className="text-xs text-gray-400 mt-2">Phone: {m.phone}</p>}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
