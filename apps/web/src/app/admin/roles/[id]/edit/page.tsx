"use client";
import { RoleForm } from "@/components/admin/RoleForm";
import { useParams } from "next/navigation";

export default function EditRolePage() {
  const { id } = useParams() as { id: string };

  // Since we don't have a backend for Roles yet, we'll mock the initial data.
  const mockRoles: any = {
    "1": { id: "1", name: "Admin" },
    "2": { id: "2", name: "Customer" },
    "4": { id: "4", name: "Super Admin" },
  };

  const data = mockRoles[id] || { id, name: `Role ${id}` };

  return <RoleForm initialData={data} />;
}
