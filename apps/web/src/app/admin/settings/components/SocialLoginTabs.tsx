"use client";

import React from "react";

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

function SaveButton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[250px_1fr] items-center gap-4 pt-6">
      <div></div>
      <button className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded text-[13px] font-medium transition-colors w-fit">
        Save
      </button>
    </div>
  );
}

export function FacebookTab(props: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Facebook Login</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Status">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="App ID" required>
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="App Secret" required>
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton />
      </div>
    </div>
  );
}

export function GoogleTab(props: any) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Google Login</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Status">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Client ID" required>
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Client Secret" required>
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton />
      </div>
    </div>
  );
}
