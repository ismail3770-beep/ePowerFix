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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Eye, Trash2 } from "lucide-react"

type QuoteStatus = "PENDING" | "CONTACTED" | "CLOSED"

interface QuoteRequest {
  id: string
  name: string
  email: string
  description: string
  message: string
  status: QuoteStatus
  createdAt: string
}

export default function AdminQuoteRequestsPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ data: QuoteRequest[] }>("/api/admin/quote-requests")
      setQuotes(Array.isArray(res.data) ? res.data : (res.data as any)?.data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load quote requests"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const deleteQuote = useCallback(async (id: string) => {
    if (!confirm("Delete this quote request? This cannot be undone.")) return
    try {
      await apiFetch(`/api/admin/quote-requests/${id}`, { method: "DELETE" })
      setQuotes((prev) => prev.filter((q) => q.id !== id))
      if (selectedQuote?.id === id) setSelectedQuote(null)
      toast.success("Quote request deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    }
  }, [selectedQuote])

  const updateStatus = useCallback(
    async (id: string, status: QuoteStatus) => {
      try {
        await apiFetch(`/api/admin/quote-requests/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status }),
        })
        setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)))
        if (selectedQuote?.id === id) {
          setSelectedQuote((prev) => (prev ? { ...prev, status } : null))
        }
        toast.success(`Status updated to ${status}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status")
      }
    },
    [selectedQuote]
  )

  const formatDate = (d: string) => new Date(d).toLocaleDateString()

  const statusBadgeClass = (status: QuoteStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
      case "CONTACTED":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      case "CLOSED":
        return "bg-gray-100 text-gray-600 hover:bg-gray-100"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Quote Requests</h1>
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

  if (error && quotes.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Quote Requests</h1>
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchQuotes} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quote Requests</h1>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No quote requests found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Quote Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium">{quote.name}</TableCell>
                      <TableCell>{quote.email}</TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {quote.description}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {quote.message || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass(quote.status)}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(quote.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedQuote(quote)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteQuote(quote.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Select
                            value={quote.status}
                            onValueChange={(val) => updateStatus(quote.id, val as QuoteStatus)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="CONTACTED">Contacted</SelectItem>
                              <SelectItem value="CLOSED">Closed</SelectItem>
                            </SelectContent>
                          </Select>
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

      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quote Request Details</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <p>{selectedQuote.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <p>{selectedQuote.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Description:</span>
                <p>{selectedQuote.description}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Message:</span>
                <p className="whitespace-pre-wrap rounded-md bg-gray-50 dark:bg-gray-800 p-3 text-sm">
                  {selectedQuote.message || "No message"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <Badge variant="outline" className={`ml-2 ${statusBadgeClass(selectedQuote.status)}`}>
                  {selectedQuote.status}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Date:</span>
                <p>{new Date(selectedQuote.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Update Status:</span>
                <Select
                  value={selectedQuote.status}
                  onValueChange={(val) => updateStatus(selectedQuote.id, val as QuoteStatus)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedQuote(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
