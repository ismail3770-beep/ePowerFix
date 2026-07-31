"use client";

import React, { useState, useEffect } from "react";
import { SingleImageUploader } from "@/components/ImageUploader";

function FieldRow({ label, children, required }: { label: string, children: React.ReactNode, required?: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] items-start gap-4">
      <label className="text-[13px] font-medium text-slate-700 pt-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

function SaveButton({ onClick, saving }: { onClick: () => void, saving: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] items-center gap-4 pt-6">
      <div></div>
      <button 
        onClick={onClick}
        disabled={saving}
        className="bg-[#0052cc] hover:bg-[#0047b3] disabled:opacity-50 text-white px-6 py-2 rounded text-[13px] font-medium transition-colors w-fit"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function GeneralTab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    metaTitle: initialData.metaTitle || "",
    metaDescription: initialData.metaDescription || "",
  });

  useEffect(() => {
    setData({
      metaTitle: initialData.metaTitle || "",
      metaDescription: initialData.metaDescription || "",
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">General</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Meta Title">
          <input 
            type="text" 
            value={data.metaTitle} 
            onChange={(e) => setData({ ...data, metaTitle: e.target.value })} 
            className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" 
          />
        </FieldRow>
        <FieldRow label="Meta Description">
          <textarea 
            value={data.metaDescription} 
            onChange={(e) => setData({ ...data, metaDescription: e.target.value })} 
            className="w-full h-24 text-[13px] rounded border border-slate-300 p-3 outline-none focus:border-[#0052cc]" 
          />
        </FieldRow>
        <FieldRow label="Supported Countries">
          <select className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 bg-white outline-none focus:border-[#0052cc]">
            <option>Bangladesh</option>
          </select>
        </FieldRow>
        <FieldRow label="Default Country" required>
          <select className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 bg-white outline-none focus:border-[#0052cc]">
            <option>Bangladesh</option>
          </select>
        </FieldRow>
        <FieldRow label="Default Timezone" required>
          <select className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 bg-white outline-none focus:border-[#0052cc]">
            <option>Asia/Dhaka</option>
          </select>
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function MaintenanceTab({ initialData = {}, save, saving }: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Maintenance</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Maintenance Mode">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}

export function LogoTab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    logoUrl: initialData.logoUrl || "",
    faviconUrl: initialData.faviconUrl || "",
  });

  useEffect(() => {
    setData({
      logoUrl: initialData.logoUrl || "",
      faviconUrl: initialData.faviconUrl || "",
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Logo</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Favicon">
          <SingleImageUploader value={data.faviconUrl} onChange={(url) => setData({...data, faviconUrl: url})} label="Favicon" />
        </FieldRow>
        <FieldRow label="Header Logo">
          <SingleImageUploader value={data.logoUrl} onChange={(url) => setData({...data, logoUrl: url})} label="Header Logo" />
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function StoreTab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    siteName: initialData.siteName || "",
    siteTagline: initialData.siteTagline || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
  });

  useEffect(() => {
    setData({
      siteName: initialData.siteName || "",
      siteTagline: initialData.siteTagline || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      address: initialData.address || "",
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Store</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Store Name" required>
          <input type="text" value={data.siteName} onChange={(e) => setData({...data, siteName: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Store Tagline">
          <input type="text" value={data.siteTagline} onChange={(e) => setData({...data, siteTagline: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Store Email" required>
          <input type="email" value={data.email} onChange={(e) => setData({...data, email: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Store Phone" required>
          <input type="text" value={data.phone} onChange={(e) => setData({...data, phone: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Store Address">
          <input type="text" value={data.address} onChange={(e) => setData({...data, address: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function PWATab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    primaryColor: initialData.primaryColor || "",
    bodyBg: initialData.bodyBg || "",
  });

  useEffect(() => {
    setData({
      primaryColor: initialData.primaryColor || "",
      bodyBg: initialData.bodyBg || "",
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">PWA & Colors</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Primary Color (hex)" required>
          <input type="text" value={data.primaryColor} onChange={(e) => setData({...data, primaryColor: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Background Color (hex)" required>
          <input type="text" value={data.bodyBg} onChange={(e) => setData({...data, bodyBg: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function CurrencyTab({ initialData = {}, save, saving }: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Currency</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Supported Currencies">
          <select className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 bg-white outline-none focus:border-[#0052cc]">
            <option>USD</option>
            <option>BDT</option>
          </select>
        </FieldRow>
        <FieldRow label="Default Currency" required>
          <select className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 bg-white outline-none focus:border-[#0052cc]">
            <option>BDT</option>
          </select>
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}

export function SMSTab({ initialData = {}, save, saving }: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">SMS</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="SMS Service">
          <select className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 bg-white outline-none focus:border-[#0052cc]">
            <option>Twilio</option>
            <option>Vonage</option>
          </select>
        </FieldRow>
        <FieldRow label="Twilio SID">
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}

export function MailTab({ initialData = {}, save, saving }: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Mail</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Mail Host">
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" defaultValue="smtp.mailtrap.io" />
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}

export function NewsletterTab({ initialData = {}, save, saving }: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Newsletter</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Mailchimp API Key">
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}

export function ReCaptchaTab({ initialData = {}, save, saving }: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Google reCAPTCHA</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Site Key">
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}

export function CustomCSSTab({ initialData = {}, save, saving }: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Custom CSS/JS</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Custom CSS">
          <textarea className="w-full h-32 text-[13px] rounded border border-slate-300 p-3 font-mono outline-none focus:border-[#0052cc]"></textarea>
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}
