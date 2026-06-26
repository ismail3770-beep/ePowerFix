'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Question {
  id: string
  question: string
  answer?: string
  answeredAt?: string
  createdAt: string
  user: { id: string; name: string; email: string }
  product: { id: string; name: string; images: string[] }
}

export default function ProductQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selected, setSelected] = useState<Question | null>(null)
  const [answer, setAnswer] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await apiFetch<{ data: Question[] }>('/api/admin/product-questions')
      setQuestions(res.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAnswer = (q: Question) => {
    setSelected(q)
    setAnswer(q.answer || '')
    setDialogOpen(true)
  }

  const handleAnswer = async () => {
    if (!selected) return
    try {
      await apiFetch(`/api/admin/product-questions/${selected.id}/answer`, {
        method: 'PUT',
        body: JSON.stringify({ answer }),
      })
      setDialogOpen(false)
      load()
    } catch (err) { console.error(err) }
  }

  const remove = async (id: string) => {
    try {
      await apiFetch(`/api/admin/product-questions/${id}`, { method: 'DELETE' })
      load()
    } catch (err) { console.error(err) }
    finally { setDeleteTarget(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Q&A</h1>
        <p className="text-gray-500 mt-1">Answer customer questions about products</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No questions yet</TableCell></TableRow>
              ) : questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium max-w-[150px] truncate">{q.product?.name}</TableCell>
                  <TableCell>{q.user?.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{q.question}</TableCell>
                  <TableCell>
                    <Badge variant={q.answer ? 'default' : 'secondary'}>
                      {q.answer ? 'Answered' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openAnswer(q)}>
                      <MessageCircle className="w-4 h-4 mr-1" />{q.answer ? 'Edit' : 'Answer'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(q.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Answer Question</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Product: {selected.product?.name}</p>
                <p className="text-sm text-gray-500">By: {selected.user?.name}</p>
                <p className="mt-2 font-medium">Q: {selected.question}</p>
              </div>
              <div>
                <Label>Your Answer</Label>
                <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer..." rows={4} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAnswer}>Submit Answer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove(deleteTarget!)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
