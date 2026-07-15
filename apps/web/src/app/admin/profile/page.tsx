"use client";

import type * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { User, Camera, Lock, Settings, Save, Loader2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

const tabs = [
  { key: "profile", label: "User profile", icon: User },
  { key: "avatar", label: "Avatar", icon: Camera },
  { key: "password", label: "Change password", icon: Lock },
  { key: "preferences", label: "Preferences", icon: Settings },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AdminProfilePage() {
  const { user, setUser, restoreAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") ?? "");
  const [username, setUsername] = useState(user?.email?.split("@")[0] ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [emailChanged, setEmailChanged] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Preferences state
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form with user data when it loads
  useEffect(() => {
    if (user) {
      setFirstName(user.name?.split(" ")[0] ?? "");
      setLastName(user.name?.split(" ").slice(1).join(" ") ?? "");
      setUsername(user.email?.split("@")[0] ?? "");
      setEmail(user.email ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  // Track if email changed
  useEffect(() => {
    setEmailChanged(email.toLowerCase() !== (user?.email ?? "").toLowerCase());
  }, [email, user?.email]);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !username.trim() || !email.trim()) {
      toast.error("Required fields are missing");
      return;
    }

    if (emailChanged && !currentPasswordForEmail) {
      toast.error("Current password is required to change email");
      return;
    }

    setSaving(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
      const body: Record<string, any> = { name: fullName, username: username.trim(), phone: phone || null };

      if (emailChanged) {
        body.email = email.trim();
        body.currentPassword = currentPasswordForEmail;
      }

      const res = await api.put("/api/auth/profile", body);
      const updatedUser = (res as any)?.data;

      if (updatedUser) {
        setUser(updatedUser);
        // Also re-fetch from server to get fresh JWT data
        await restoreAuth();
      }

      setEmailChanged(false);
      setCurrentPasswordForEmail("");
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {return;}
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData, credentials: "include" });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {throw new Error(uploadData.error || "Upload failed");}
      const uploadedUrl = uploadData?.url || uploadData?.data?.url;
      if (uploadedUrl) {
        await api.put("/api/auth/profile", { avatar: uploadedUrl });
        toast.success("Avatar updated successfully");
        await restoreAuth();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.put("/api/auth/profile", { avatar: null });
      toast.success("Avatar removed");
      await restoreAuth();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove avatar");
    }
  };

  const handleSavePreferences = async () => {
    const preferences = { language, timezone };
    localStorage.setItem('epowerfix-prefs', JSON.stringify(preferences));
    toast.success("Preferences saved");
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e2e8f0]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-[14px] font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-[#0EA5E9] text-[#0EA5E9]"
                  : "border-transparent text-[#64748b] hover:text-[#111827] hover:border-[#cbd5e1]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <Card className="border border-[#e2e8f0] shadow-sm bg-white">
        <CardContent className="p-6">
          {/* User Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] mb-5">User profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
                <div className="space-y-1.5">
                  <Label htmlFor="first-name" className="text-[13px] font-medium text-[#374151]">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="first-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last-name" className="text-[13px] font-medium text-[#374151]">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-[13px] font-medium text-[#374151]">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[13px] font-medium text-[#374151]">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20 pr-9"
                    />
                    <Mail className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                  </div>
                </div>
                {/* Show current password field when email is changed */}
                {emailChanged && (
                  <div className="col-span-1 md:col-span-2 rounded-md border border-amber-200 bg-amber-50 p-4 space-y-3">
                    <p className="text-[13px] text-amber-800 font-medium">
                      To confirm email change, please enter your current password.
                    </p>
                    <div className="max-w-sm space-y-1.5">
                      <Label htmlFor="email-password" className="text-[13px] font-medium text-[#374151]">
                        Current Password <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email-password"
                        type="password"
                        value={currentPasswordForEmail}
                        onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                        placeholder="Enter current password"
                        className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[13px] font-medium text-[#374151]">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="h-[40px] px-6 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[14px] font-medium rounded-md"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Update
                </Button>
              </div>
            </div>
          )}

          {/* Avatar Tab */}
          {activeTab === "avatar" && (
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] mb-5">Avatar</h3>
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-[#0EA5E9] text-white text-[28px] font-bold flex items-center justify-center shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="space-y-3">
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpg,image/jpeg" className="hidden" onChange={handleUploadAvatar} />
                  <Button className="h-[38px] px-4 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[14px] font-medium rounded-md" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="mr-2 h-4 w-4" />
                    Upload New Avatar
                  </Button>
                  <Button variant="outline" className="h-[38px] px-4 text-[14px] text-red-600 border-red-200 hover:bg-red-50 rounded-md" onClick={handleRemoveAvatar}>
                    Remove Avatar
                  </Button>
                </div>
              </div>
              <p className="text-[12px] text-[#94a3b8] mt-4">Allowed file types: png, jpg, jpeg. Max file size: 2MB.</p>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] mb-5">Change password</h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password" className="text-[13px] font-medium text-[#374151]">
                    Current Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-[13px] font-medium text-[#374151]">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-[13px] font-medium text-[#374151]">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-[40px] text-[14px] border-[#e2e8f0] focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="h-[40px] px-6 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[14px] font-medium rounded-md"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Change Password
                </Button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] mb-5">Preferences</h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="language" className="text-[13px] font-medium text-[#374151]">Language</Label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="h-[40px] w-full text-[14px] border border-[#e2e8f0] rounded-md px-3 bg-white focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20 outline-none"
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা (Bangla)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="timezone" className="text-[13px] font-medium text-[#374151]">Timezone</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="h-[40px] w-full text-[14px] border border-[#e2e8f0] rounded-md px-3 bg-white focus:border-[#0EA5E9] focus:ring-[#0EA5E9]/20 outline-none"
                  >
                    <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="h-[40px] px-6 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-[14px] font-medium rounded-md"
                >
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}