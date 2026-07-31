"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function UserForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Split name if available
  const initialFirstName = initialData?.name ? initialData.name.split(" ")[0] : "";
  const initialLastName = initialData?.name ? initialData.name.split(" ").slice(1).join(" ") : "";

  const [form, setForm] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    role: initialData?.role || "CUSTOMER",
    password: "",
    confirmPassword: "",
    isActive: initialData?.isActive ?? true,
  });

  const save = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!initialData && !form.password) {
      toast.error("Password is required for new users");
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        role: form.role,
        isActive: form.isActive,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (initialData) {
        await apiFetch(`/api/admin/users/${initialData.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("User updated successfully");
      } else {
        await apiFetch(`/api/admin/users`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("User created successfully");
      }
      router.push("/admin/users");
    } catch {
      toast.error("Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit User" : "Create User"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/users")}>Users</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit User" : "Create User"}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-[250px] shrink-0 space-y-1">
          <div className="text-[14px] font-medium text-slate-700 bg-slate-50 px-4 py-3 rounded-sm">
            User Information
          </div>
          <div className="bg-slate-100 rounded-sm">
            <div className="px-4 py-2.5 text-[13px] text-slate-700 border-l-2 border-[#0052cc] bg-white cursor-pointer font-medium shadow-sm">
              Account
            </div>
            <div className="px-4 py-2.5 text-[13px] text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors">
              Permissions
            </div>
            {initialData && (
              <div className="px-4 py-2.5 text-[13px] text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors">
                New Password
              </div>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 w-full max-w-[800px]">
          <div className="border-b border-slate-200 pb-3 mb-6">
            <h2 className="text-[16px] font-medium text-slate-800">Account</h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
              <input 
                type="email" 
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Phone <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Roles <span className="text-red-500">*</span></label>
              <select 
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white" 
              >
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {!initialData && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Confirm Password <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>
              </>
            )}

            {initialData && (
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Status</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer" 
                  />
                  <span className="text-[13px] text-slate-700">Activated</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4 pt-2">
              <div></div>
              <button 
                onClick={save}
                disabled={saving}
                className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
