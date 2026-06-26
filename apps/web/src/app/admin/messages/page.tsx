"use client"

import { useEffect, useState, useCallback } from "react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Eye, Trash2, MailOpen, Mail } from "lucide-react"

interface Message {
  id: string
  name: string
  email: string
  subject: string
  message: string
  phone?: string
  isRead: boolean
  createdAt: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ data: Message[] }>("/api/admin/messages")
      setMessages(res.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load messages"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const toggleRead = useCallback(
    async (message: Message) => {
      try {
        await apiFetch(`/api/admin/messages/${message.id}`, {
          method: "PUT",
          body: JSON.stringify({ isRead: !message.isRead }),
        })
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: !m.isRead } : m))
        )
        toast.success(`Marked as ${message.isRead ? "unread" : "read"}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update message")
      }
    },
    []
  )

  const deleteMessage = useCallback(async () => {
    if (!deleteId) return
    try {
      await apiFetch(`/api/admin/messages/${deleteId}`, { method: "DELETE" })
      setMessages((prev) => prev.filter((m) => m.id !== deleteId))
      toast.success("Message deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete message")
    } finally {
      setDeleteId(null)
    }
  }, [deleteId])

  const formatDate = (d: string) => new Date(d).toLocaleDateString()

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Card>
          <CardContent className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && messages.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchMessages} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Messages</h1>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No messages found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contact Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id} className={!msg.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}>
                      <TableCell className="font-medium">{msg.name}</TableCell>
                      <TableCell>{msg.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{msg.subject}</TableCell>
                      <TableCell>{formatDate(msg.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={msg.isRead ? "secondary" : "default"}
                          className={
                            msg.isRead
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-100"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          }
                        >
                          {msg.isRead ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedMessage(msg)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRead(msg)}
                          >
                            {msg.isRead ? (
                              <Mail className="h-4 w-4 text-gray-500" />
                            ) : (
                              <MailOpen className="h-4 w-4 text-blue-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteId(msg.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p>{selectedMessage.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p>{selectedMessage.email}</p>
              </div>
              {selectedMessage.phone && (
                <div>
                  <span className="text-sm text-gray-500">Phone:</span>
                  <p>{selectedMessage.phone}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Subject:</span>
                <p>{selectedMessage.subject}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Message:</span>
                <p className="whitespace-pre-wrap rounded-md bg-gray-50 dark:bg-gray-800 p-3 text-sm">
                  {selectedMessage.message}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Date:</span>
                <p>{new Date(selectedMessage.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <Badge
                  variant={selectedMessage.isRead ? "secondary" : "default"}
                  className={
                    selectedMessage.isRead
                      ? "bg-gray-100 text-gray-600 ml-2"
                      : "bg-blue-100 text-blue-700 ml-2"
                  }
                >
                  {selectedMessage.isRead ? "Read" : "Unread"}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedMessage && (
              <Button variant="outline" onClick={() => toggleRead(selectedMessage)}>
                Mark as {selectedMessage.isRead ? "Unread" : "Read"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMessage} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
