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
import { Trash2 } from "lucide-react"

interface Subscriber {
  id: string
  email: string
  subscribedAt: string
  isActive: boolean
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ data: Subscriber[] }>("/api/admin/newsletter")
      const payload = res.data
      setSubscribers(Array.isArray(payload) ? payload : (payload as any)?.data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load subscribers"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  const deleteSubscriber = useCallback(async () => {
    if (!deleteId) {return}
    try {
      await apiFetch(`/api/admin/newsletter/${deleteId}`, { method: "DELETE" })
      setSubscribers((prev) => prev.filter((s) => s.id !== deleteId))
      toast.success("Subscriber deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete subscriber")
    } finally {
      setDeleteId(null)
    }
  }, [deleteId])

  const formatDate = (d: string) => new Date(d).toLocaleDateString()

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Newsletter</h1>
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

  if (error && subscribers.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchSubscribers} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Newsletter</h1>

      {subscribers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No subscribers found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Subscribers ({subscribers.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.email}</TableCell>
                      <TableCell>{formatDate(sub.subscribedAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sub.isActive ? "default" : "secondary"}
                          className={
                            sub.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                          }
                        >
                          {sub.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => setDeleteId(sub.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscriber? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSubscriber} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
