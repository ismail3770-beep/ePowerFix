'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAdminHeaderStore } from '@/store/admin-header-store'

interface FlashSale {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  discount: number
  isActive: boolean
  _count?: { products: number }
}

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FlashSale | null>(null)
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', discount: '' })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await apiFetch<{ data: FlashSale[] }>('/api/admin/flash-sales')
      setFlashSales(Array.isArray(res.data) ? res.data : (res.data as any)?.data || [])
    } catch (err: any) { console.error(err); toast.error(err.message || 'Failed') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', startDate: '', endDate: '', discount: '' })
    setDialogOpen(true)
  }

  const openEdit = (fs: FlashSale) => {
    setEditing(fs)
    setForm({
      title: fs.title,
      description: fs.description || '',
      startDate: fs.startDate?.slice(0, 16),
      endDate: fs.endDate?.slice(0, 16),
      discount: String(fs.discount),
    })
    setDialogOpen(true)
  }

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew('New Flash Sale', openCreate); return () => setAddNew('', null); }, [setAddNew]);

  const handleSave = async () => {
    // L11: Validate discount is a valid positive number before saving.
    const discountNum = parseFloat(form.discount)
    if (isNaN(discountNum) || discountNum <= 0) {
      toast.error('Discount must be a valid positive number')
      return
    }
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const body = { ...form, discount: discountNum }
      if (editing) {
        await apiFetch(`/api/admin/flash-sales/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await apiFetch('/api/admin/flash-sales', { method: 'POST', body: JSON.stringify(body) })
      }
      toast.success(editing ? 'Flash sale updated' : 'Flash sale created')
      setDialogOpen(false)
      load()
    } catch (err: any) { console.error(err); toast.error(err.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/flash-sales/${id}`, { method: 'DELETE' })
      load()
    } catch (err: any) { console.error(err); toast.error(err.message || 'Failed') }
    finally { setDeleteTarget(null) }
  }

  const toggleActive = async (fs: FlashSale) => {
    try {
      await apiFetch(`/api/admin/flash-sales/${fs.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !fs.isActive }),
      })
      load()
    } catch (err: any) { console.error(err); toast.error(err.message || 'Failed') }
  }

  if (loading) {return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flash Sales</h1>
          <p className="text-gray-500 mt-1">Manage time-limited discount events</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Flash Sale</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flashSales.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No flash sales yet</TableCell></TableRow>
              ) : flashSales.map((fs) => (
                <TableRow key={fs.id}>
                  <TableCell className="font-medium">{fs.title}</TableCell>
                  <TableCell><Badge variant="secondary">{fs.discount}%</Badge></TableCell>
                  <TableCell className="text-sm">{new Date(fs.startDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{new Date(fs.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>{fs._count?.products || 0}</TableCell>
                  <TableCell>
                    <Badge variant={fs.isActive ? 'default' : 'secondary'}>
                      {fs.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(fs)}>
                      {fs.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(fs)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(fs.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Flash Sale' : 'New Flash Sale'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summer Sale" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
            <div><Label>Discount (%)</Label><Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder="25" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
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
            <AlertDialogAction onClick={() => handleDelete(deleteTarget!)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
