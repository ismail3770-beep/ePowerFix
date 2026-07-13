"use client";

import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState, TableSkeleton, formatDate, roleColorMap } from "../shared";
import type { UserItem, UserToggleMutation } from "../types";

export default function UsersSection({ users, isLoading, onRetry, toggleMutation }: {
  users: UserItem[]; isLoading: boolean; onRetry: () => void;
  toggleMutation: UserToggleMutation;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Users</h2>

      {isLoading ? <TableSkeleton rows={5} cols={6} /> : users.length === 0 ? <EmptyState message="No users yet" /> : (
        <Card className="border border-[#E2E8F0] shadow-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E2E8F0] bg-gray-50/50">
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Joined</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-b border-[#E2E8F0]">
                    <TableCell className="text-xs font-medium">{u.name}</TableCell>
                    <TableCell className="text-xs text-gray-500">{u.email}</TableCell>
                    <TableCell className="text-xs font-mono">{u.phone}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs px-1.5 py-0 ${roleColorMap[u.role] || "bg-gray-100 text-gray-700"}`}>
                        {u.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="sm"
                        className={`h-7 text-xs ${u.isActive ? "text-destructive" : "text-green-600"}`}
                        onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}
                      >
                        {u.isActive ? <><EyeOff className="size-3.5 mr-1" />Deactivate</> : <><Eye className="size-3.5 mr-1" />Activate</>}
                      </Button>
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
