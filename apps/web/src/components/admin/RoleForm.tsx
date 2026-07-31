"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Home } from "lucide-react";

const PERMISSION_MODULES = [
  {
    title: "Users",
    permissions: [
      { key: "users.index", label: "users.index" },
      { key: "users.create", label: "users.create" },
      { key: "users.edit", label: "users.edit" },
      { key: "users.destroy", label: "users.destroy" },
    ]
  },
  {
    title: "Roles",
    permissions: [
      { key: "roles.index", label: "roles.index" },
      { key: "roles.create", label: "roles.create" },
      { key: "roles.edit", label: "roles.edit" },
      { key: "roles.destroy", label: "roles.destroy" },
    ]
  },
  {
    title: "Products",
    permissions: [
      { key: "products.index", label: "products.index" },
      { key: "products.create", label: "products.create" },
      { key: "products.edit", label: "products.edit" },
      { key: "products.destroy", label: "products.destroy" },
    ]
  },
  {
    title: "Categories",
    permissions: [
      { key: "categories.index", label: "categories.index" },
      { key: "categories.create", label: "categories.create" },
      { key: "categories.edit", label: "categories.edit" },
      { key: "categories.destroy", label: "categories.destroy" },
    ]
  },
  {
    title: "Attributes",
    permissions: [
      { key: "attributes.index", label: "attributes.index" },
      { key: "attributes.create", label: "attributes.create" },
      { key: "attributes.edit", label: "attributes.edit" },
      { key: "attributes.destroy", label: "attributes.destroy" },
    ]
  },
  {
    title: "Options",
    permissions: [
      { key: "options.index", label: "options.index" },
      { key: "options.create", label: "options.create" },
      { key: "options.edit", label: "options.edit" },
      { key: "options.destroy", label: "options.destroy" },
    ]
  }
];

export function RoleForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "permissions">("general");

  const [form, setForm] = useState({
    name: initialData?.name || "",
  });

  const [permissions, setPermissions] = useState<Record<string, "allow" | "deny" | "inherit">>({});

  const handlePermissionChange = (key: string, value: "allow" | "deny" | "inherit") => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!form.name && activeTab === "general") {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    // Mock save process since no real API exists for roles yet
    setTimeout(() => {
      toast.success(`Role ${initialData ? "updated" : "created"} successfully`);
      setSaving(false);
      router.push("/admin/roles");
    }, 500);
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 text-slate-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-[22px] font-normal text-slate-800">{initialData ? "Edit Role" : "Create Role"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-500">
          <Home className="w-3.5 h-3.5 cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/dashboard")} />
          <span className="text-slate-300">&gt;</span>
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push("/admin/roles")}>Roles</span>
          <span className="text-slate-300">&gt;</span>
          <span>{initialData ? "Edit Role" : "Create Role"}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-sm p-6 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-[250px] shrink-0 space-y-1">
          <div className="text-[14px] font-medium text-slate-700 bg-slate-50 px-4 py-3 rounded-sm">
            Role Information
          </div>
          <div className="bg-slate-100 rounded-sm">
            <div 
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2.5 text-[13px] border-l-2 cursor-pointer font-medium transition-colors ${
                activeTab === "general" 
                  ? "border-[#0052cc] bg-white text-slate-700 shadow-sm" 
                  : "border-transparent text-slate-600 hover:bg-slate-200"
              }`}
            >
              General
            </div>
            <div 
              onClick={() => setActiveTab("permissions")}
              className={`px-4 py-2.5 text-[13px] border-l-2 cursor-pointer font-medium transition-colors ${
                activeTab === "permissions" 
                  ? "border-[#0052cc] bg-white text-slate-700 shadow-sm" 
                  : "border-transparent text-slate-600 hover:bg-slate-200"
              }`}
            >
              Permissions
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 w-full">
          
          {activeTab === "general" && (
            <div className="max-w-[800px]">
              <div className="border-b border-slate-200 pb-3 mb-6">
                <h2 className="text-[16px] font-medium text-slate-800">General</h2>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                  <label className="text-[13px] font-medium text-slate-700">Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" 
                  />
                </div>

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
          )}

          {activeTab === "permissions" && (
            <div>
              <div className="border-b border-slate-200 pb-3 mb-6">
                <h2 className="text-[16px] font-medium text-slate-800">Permissions</h2>
              </div>
              
              <div className="border border-slate-200 rounded-sm">
                <div className="grid grid-cols-[1fr_80px_80px_80px] bg-[#f8f9fa] border-b border-slate-200 text-[13px] font-medium text-slate-600 px-4 py-2 text-center">
                  <div className="text-left">Permissions</div>
                  <div>Allow</div>
                  <div>Deny</div>
                  <div>Inherit</div>
                </div>

                {PERMISSION_MODULES.map((module, i) => (
                  <div key={i} className="border-b border-slate-200 last:border-b-0">
                    <div className="bg-slate-50 px-4 py-2 text-[14px] font-medium text-slate-700 border-b border-slate-100">
                      {module.title}
                    </div>
                    <div>
                      {module.permissions.map((perm) => {
                        const val = permissions[perm.key] || "inherit";
                        return (
                          <div key={perm.key} className="grid grid-cols-[1fr_80px_80px_80px] text-[13px] px-4 py-2.5 items-center border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors text-center">
                            <div className="text-left text-slate-600">{perm.label}</div>
                            <div>
                              <input 
                                type="radio" 
                                checked={val === "allow"}
                                onChange={() => handlePermissionChange(perm.key, "allow")}
                                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                              />
                            </div>
                            <div>
                              <input 
                                type="radio" 
                                checked={val === "deny"}
                                onChange={() => handlePermissionChange(perm.key, "deny")}
                                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                              />
                            </div>
                            <div>
                              <input 
                                type="radio" 
                                checked={val === "inherit"}
                                onChange={() => handlePermissionChange(perm.key, "inherit")}
                                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button 
                  onClick={save}
                  disabled={saving}
                  className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
