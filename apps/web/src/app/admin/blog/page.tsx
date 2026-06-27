"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogHeader, DialogContent, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { SingleImageUploader } from "@/components/ImageUploader";
import { Search, Plus, Pencil } from "lucide-react";

type PostStatus = "DRAFT" | "PUBLISHED";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  author: string;
  status: PostStatus;
  imageUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

const statusBadge: Record<PostStatus, string> = {
  PUBLISHED: "bg-green-100 text-green-800 border-green-300",
  DRAFT: "bg-gray-100 text-gray-800 border-gray-300",
};

const emptyForm = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  author: "",
  status: "DRAFT" as PostStatus,
  imageUrl: "",
  tags: "",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res: any = await apiFetch(`/api/admin/blog${params}`);
      setPosts(res.data ?? []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(post: BlogPost) {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt ?? "",
      author: post.author,
      status: post.status,
      imageUrl: post.imageUrl ?? "",
      tags: post.tags.join(", "),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body = {
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editing) {
        await apiFetch(`/api/admin/blog/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        toast.success("Post updated");
      } else {
        await apiFetch("/api/admin/blog", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Post created");
      }

      setDialogOpen(false);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Post
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search posts..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No data found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-[240px] truncate">
                        {post.title}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {post.slug}
                      </TableCell>
                      <TableCell>{post.author}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge[post.status]} variant="outline">
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(post)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                rows={8}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                rows={3}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as PostStatus })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <SingleImageUploader
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                label="Cover Image"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
