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
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Eye } from "lucide-react"

interface Review {
  id: string
  rating: number
  comment: string
  status: "APPROVED" | "PENDING" | "REJECTED"
  createdAt: string
  user?: { name: string; email: string }
  product?: { name: string }
  service?: { name: string }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ data: Review[] }>("/api/admin/reviews")
      setReviews(Array.isArray(res.data) ? res.data : (res.data as any)?.data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load reviews"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const updateStatus = useCallback(
    async (id: string, status: "APPROVED" | "REJECTED") => {
      try {
        await apiFetch(`/api/admin/reviews/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status }),
        })
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
        toast.success(`Review ${status.toLowerCase()}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update review")
      }
    },
    []
  )

  const formatDate = (d: string) => new Date(d).toLocaleDateString()

  const renderStars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n)

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Reviews</h1>
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

  if (error && reviews.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Reviews</h1>
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchReviews} variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reviews</h1>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            No reviews found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Reviews</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.user?.name || review.user?.email || "N/A"}
                      </TableCell>
                      <TableCell>
                        {review.product?.name || review.service?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <span className="text-yellow-500" title={`${review.rating}/5`}>
                          {renderStars(review.rating)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {review.comment || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            review.status === "APPROVED"
                              ? "secondary"
                              : review.status === "REJECTED"
                                ? "destructive"
                                : "outline"
                          }
                          className={
                            review.status === "APPROVED"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : review.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                                : ""
                          }
                        >
                          {review.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedReview(review)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {review.status !== "APPROVED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => updateStatus(review.id, "APPROVED")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {review.status !== "REJECTED" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => updateStatus(review.id, "REJECTED")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
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

      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Reviewer:</span>
                <p>{selectedReview.user?.name || selectedReview.user?.email || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Item:</span>
                <p>{selectedReview.product?.name || selectedReview.service?.name || "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Rating:</span>
                <p className="text-yellow-500">
                  {renderStars(selectedReview.rating)} ({selectedReview.rating}/5)
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Comment:</span>
                <p className="whitespace-pre-wrap">{selectedReview.comment || "No comment"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <Badge
                  variant={
                    selectedReview.status === "APPROVED"
                      ? "secondary"
                      : selectedReview.status === "REJECTED"
                        ? "destructive"
                        : "outline"
                  }
                  className={
                    selectedReview.status === "APPROVED"
                      ? "bg-green-100 text-green-700 ml-2"
                      : selectedReview.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700 ml-2"
                        : "ml-2"
                  }
                >
                  {selectedReview.status}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-500">Date:</span>
                <p>{new Date(selectedReview.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
