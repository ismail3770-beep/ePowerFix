"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton, formatDate } from "../shared";
import type { BlogPostItem } from "../types";

export default function BlogSection({ posts, isLoading, onRetry, openAdd, openEdit, confirmDelete }: {
  posts: BlogPostItem[]; isLoading: boolean; onRetry: () => void;
  openAdd: () => void; openEdit: (b: BlogPostItem) => void; confirmDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Blog Posts</h2>
        <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs gap-1.5" onClick={openAdd}>
          <Plus className="size-3.5" /> Add Post
        </Button>
      </div>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : posts.length === 0 ? <EmptyState message="No blog posts yet" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Title</TableHead>
                  <TableHead className="text-xs">Slug</TableHead>
                  <TableHead className="text-xs">Views</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((b) => (
                  <TableRow key={b.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium">
                      <div className="flex items-center gap-2">
                        {b.coverImage && <img src={b.coverImage} alt="" className="h-8 w-8 rounded object-cover shrink-0" />}
                        <div>
                          <p className="font-medium">{b.title}</p>
                          {b.excerpt && <p className="text-gray-400 truncate max-w-[200px]">{b.excerpt}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400 font-mono">{b.slug}</TableCell>
                    <TableCell className="text-xs">{b.views}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${b.published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {b.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(b.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(b)}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => confirmDelete(b.id)}><Trash2 className="size-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
