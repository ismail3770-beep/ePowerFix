'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAdminHeaderStore } from '@/store/admin-header-store'

interface Tax {
  id: string
  name: string
  rate: number
  type: 'PERCENTAGE' | 'FLAT'
  isActive: boolean
}

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Tax[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Tax | null>(null)
  const [form, setForm] = useState({ name: '', rate: '', type: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT' })
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const load = async () => {
    try {
      const res = await apiFetch<{ data: Tax[] }>('/api/admin/taxes')
      setTaxes(Array.isArray(res.data) ? res.data : (res.data as any)?.data || [])
    } catch (err: any) { console.error(err); toast.error(err.message || 'Failed') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', rate: '', type: 'PERCENTAGE' })
    setDialogOpen(true)
  }

  const openEdit = (tax: Tax) => {
    setEditing(tax)
    setForm({ name: tax.name, rate: String(tax.rate), type: tax.type })
    setDialogOpen(true)
  }

  const setAddNew = useAdminHeaderStore((s) => s.setAddNew);
  useEffect(() => { setAddNew('New Tax', openCreate); return () => setAddNew('', null); }, [setAddNew]);

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = { ...form, rate: parseFloat(form.rate) }
      if (editing) {
        await apiFetch(`/api/admin/taxes/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await apiFetch('/api/admin/taxes', { method: 'POST', body: JSON.stringify(body) })
      }
      setDialogOpen(false)
      load()
    } catch (err: any) { console.error(err); toast.error(err.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/admin/taxes/${id}`, { method: 'DELETE' })
      load()
    } catch (err: any) { console.error(err); toast.error(err.message || 'Failed') }
    finally { setDeleteTarget(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Management</h1>
          <p className="text-gray-500 mt-1">Configure tax rules for products</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Tax</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No taxes configured</TableCell></TableRow>
              ) : taxes.map((tax) => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium">{tax.name}</TableCell>
                  <TableCell>{tax.type === 'PERCENTAGE' ? `${tax.rate}%` : `৳${tax.rate}`}</TableCell>
                  <TableCell><Badge variant="outline">{tax.type}</Badge></TableCell>
                  <TableCell><Badge variant={tax.isActive ? 'default' : 'secondary'}>{tax.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(tax)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(tax.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Tax' : 'New Tax'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VAT" /></div>
            <div><Label>Rate</Label><Input type="number" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="15" /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FLAT">Flat Amount (৳)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
