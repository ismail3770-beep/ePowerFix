"use client";

import React, { useState, useEffect } from "react";

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

function SaveButton({ onClick, saving }: { onClick?: () => void, saving?: boolean }) {
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

// Reusable component for payment gateway tabs
function PaymentGatewayTab({ 
  title, 
  hasSandbox = true,
  credentials = [] 
}: { 
  title: string, 
  hasSandbox?: boolean,
  credentials?: {key: string, label: string}[]
}) {
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">{title}</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Status">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Label" required>
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" defaultValue={title} />
        </FieldRow>
        <FieldRow label="Description" required>
          <textarea className="w-full h-24 text-[13px] rounded border border-slate-300 p-3 outline-none focus:border-[#0052cc]" defaultValue={`Pay with ${title}`}></textarea>
        </FieldRow>
        
        {hasSandbox && (
          <FieldRow label="Sandbox">
            <label className="relative inline-flex items-center cursor-pointer mt-1.5">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
            </label>
          </FieldRow>
        )}

        {credentials.map(cred => (
          <FieldRow key={cred.key} label={cred.label} required>
            <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
          </FieldRow>
        ))}

        <SaveButton />
      </div>
    </div>
  );
}

export function PayPalTab(props: any) { return <PaymentGatewayTab title="PayPal" credentials={[{key: "client_id", label: "Client ID"}, {key: "secret", label: "Secret"}]} />; }
export function StripeTab(props: any) { return <PaymentGatewayTab title="Stripe" credentials={[{key: "public_key", label: "Publishable Key"}, {key: "secret_key", label: "Secret Key"}]} />; }
export function PaytmTab(props: any) { return <PaymentGatewayTab title="Paytm" credentials={[{key: "merchant_id", label: "Merchant ID"}, {key: "merchant_key", label: "Merchant Key"}]} />; }
export function RazorpayTab(props: any) { return <PaymentGatewayTab title="Razorpay" hasSandbox={false} credentials={[{key: "key_id", label: "Key Id"}, {key: "key_secret", label: "Key Secret"}]} />; }
export function InstamojoTab(props: any) { return <PaymentGatewayTab title="Instamojo" credentials={[{key: "api_key", label: "API Key"}, {key: "auth_token", label: "Auth Token"}]} />; }
export function PaystackTab(props: any) { return <PaymentGatewayTab title="Paystack" credentials={[{key: "public_key", label: "Public Key"}, {key: "secret_key", label: "Secret Key"}]} />; }
export function AuthorizeNetTab(props: any) { return <PaymentGatewayTab title="Authorize.net" credentials={[{key: "login_id", label: "API Login ID"}, {key: "transaction_key", label: "Transaction Key"}]} />; }
export function MercadoPagoTab(props: any) { return <PaymentGatewayTab title="Mercado Pago" credentials={[{key: "public_key", label: "Public Key"}, {key: "access_token", label: "Access Token"}]} />; }
export function FlutterwaveTab(props: any) { return <PaymentGatewayTab title="Flutterwave" credentials={[{key: "public_key", label: "Public Key"}, {key: "secret_key", label: "Secret Key"}, {key: "encryption_key", label: "Encryption Key"}]} />; }
export function IyzicoTab(props: any) { return <PaymentGatewayTab title="Iyzico" credentials={[{key: "api_key", label: "API Key"}, {key: "secret_key", label: "Secret Key"}]} />; }
export function PayFastTab(props: any) { return <PaymentGatewayTab title="PayFast" credentials={[{key: "merchant_id", label: "Merchant ID"}, {key: "merchant_key", label: "Merchant Key"}, {key: "passphrase", label: "Passphrase"}]} />; }

export function BkashTab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    bkashEnabled: initialData.bkashEnabled || false,
    bkashPhoneNumber: initialData.bkashPhoneNumber || "",
    bkashApiKey: initialData.bkashApiKey || "",
    bkashSecretKey: initialData.bkashSecretKey || "",
    bkashSandbox: initialData.bkashSandbox ?? true,
  });

  useEffect(() => {
    setData({
      bkashEnabled: initialData.bkashEnabled || false,
      bkashPhoneNumber: initialData.bkashPhoneNumber || "",
      bkashApiKey: initialData.bkashApiKey || "",
      bkashSecretKey: initialData.bkashSecretKey || "",
      bkashSandbox: initialData.bkashSandbox ?? true,
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Bkash</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Enable Bkash">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" checked={data.bkashEnabled} onChange={(e) => setData({...data, bkashEnabled: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Sandbox Mode">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" checked={data.bkashSandbox} onChange={(e) => setData({...data, bkashSandbox: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Phone Number" required>
          <input type="text" value={data.bkashPhoneNumber} onChange={(e) => setData({...data, bkashPhoneNumber: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="API Key" required>
          <input type="text" value={data.bkashApiKey} onChange={(e) => setData({...data, bkashApiKey: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Secret Key" required>
          <input type="text" value={data.bkashSecretKey} onChange={(e) => setData({...data, bkashSecretKey: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function NagadTab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    nagadEnabled: initialData.nagadEnabled || false,
    nagadPhoneNumber: initialData.nagadPhoneNumber || "",
    nagadApiKey: initialData.nagadApiKey || "",
    nagadSecretKey: initialData.nagadSecretKey || "",
    nagadSandbox: initialData.nagadSandbox ?? true,
  });

  useEffect(() => {
    setData({
      nagadEnabled: initialData.nagadEnabled || false,
      nagadPhoneNumber: initialData.nagadPhoneNumber || "",
      nagadApiKey: initialData.nagadApiKey || "",
      nagadSecretKey: initialData.nagadSecretKey || "",
      nagadSandbox: initialData.nagadSandbox ?? true,
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Nagad</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Enable Nagad">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" checked={data.nagadEnabled} onChange={(e) => setData({...data, nagadEnabled: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Sandbox Mode">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" checked={data.nagadSandbox} onChange={(e) => setData({...data, nagadSandbox: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Phone Number" required>
          <input type="text" value={data.nagadPhoneNumber} onChange={(e) => setData({...data, nagadPhoneNumber: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="API Key" required>
          <input type="text" value={data.nagadApiKey} onChange={(e) => setData({...data, nagadApiKey: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Secret Key" required>
          <input type="text" value={data.nagadSecretKey} onChange={(e) => setData({...data, nagadSecretKey: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function SSLCommerzTab({ initialData = {}, save, saving }: any) {
  const [data, setData] = useState({
    sslcommerzEnabled: initialData.sslcommerzEnabled || false,
    sslcommerzStoreId: initialData.sslcommerzStoreId || "",
    sslcommerzStorePassword: initialData.sslcommerzStorePassword || "",
    sslcommerzSandbox: initialData.sslcommerzSandbox ?? true,
  });

  useEffect(() => {
    setData({
      sslcommerzEnabled: initialData.sslcommerzEnabled || false,
      sslcommerzStoreId: initialData.sslcommerzStoreId || "",
      sslcommerzStorePassword: initialData.sslcommerzStorePassword || "",
      sslcommerzSandbox: initialData.sslcommerzSandbox ?? true,
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">SSLCommerz</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Enable SSLCommerz">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" checked={data.sslcommerzEnabled} onChange={(e) => setData({...data, sslcommerzEnabled: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Sandbox Mode">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" checked={data.sslcommerzSandbox} onChange={(e) => setData({...data, sslcommerzSandbox: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Store ID" required>
          <input type="text" value={data.sslcommerzStoreId} onChange={(e) => setData({...data, sslcommerzStoreId: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <FieldRow label="Store Password" required>
          <input type="text" value={data.sslcommerzStorePassword} onChange={(e) => setData({...data, sslcommerzStorePassword: e.target.value})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

// Manual Methods
export function CashOnDeliveryTab({ initialData = {}, save, saving }: any) { 
  const [data, setData] = useState({
    codEnabled: initialData.codEnabled ?? true,
    codFee: initialData.codFee || 0,
  });

  useEffect(() => {
    setData({
      codEnabled: initialData.codEnabled ?? true,
      codFee: initialData.codFee || 0,
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Cash On Delivery</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Enable Cash On Delivery">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" checked={data.codEnabled} onChange={(e) => setData({...data, codEnabled: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Fee" required>
          <input type="number" step="0.01" value={data.codFee} onChange={(e) => setData({...data, codFee: parseFloat(e.target.value) || 0})} className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" />
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function BankTransferTab({ initialData = {}, save, saving }: any) { 
  const [data, setData] = useState({
    bankTransferEnabled: initialData.bankTransferEnabled || false,
    bankTransferInstructions: initialData.bankTransferInstructions || "",
  });

  useEffect(() => {
    setData({
      bankTransferEnabled: initialData.bankTransferEnabled || false,
      bankTransferInstructions: initialData.bankTransferInstructions || "",
    });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Bank Transfer</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Enable Bank Transfer">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" checked={data.bankTransferEnabled} onChange={(e) => setData({...data, bankTransferEnabled: e.target.checked})} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Instructions" required>
          <textarea value={data.bankTransferInstructions} onChange={(e) => setData({...data, bankTransferInstructions: e.target.value})} className="w-full h-24 text-[13px] rounded border border-slate-300 p-3 outline-none focus:border-[#0052cc]"></textarea>
        </FieldRow>
        <SaveButton onClick={() => save(data)} saving={saving} />
      </div>
    </div>
  );
}

export function CheckMoneyOrderTab({ initialData = {}, save, saving }: any) { 
  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6 flex justify-between items-center">
        <h2 className="text-[16px] font-medium text-slate-800">Check / Money Order</h2>
      </div>
      <div className="space-y-5">
        <FieldRow label="Status">
          <label className="relative inline-flex items-center cursor-pointer mt-1.5">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052cc]"></div>
          </label>
        </FieldRow>
        <FieldRow label="Label" required>
          <input type="text" className="w-full h-10 text-[13px] rounded border border-slate-300 px-3 outline-none focus:border-[#0052cc]" defaultValue="Check / Money Order" />
        </FieldRow>
        <FieldRow label="Description" required>
          <textarea className="w-full h-24 text-[13px] rounded border border-slate-300 p-3 outline-none focus:border-[#0052cc]" defaultValue="Please send a check to Store Name, Store Street, Store Town, Store State / County, Store Postcode."></textarea>
        </FieldRow>
        <FieldRow label="Instructions" required>
          <textarea className="w-full h-24 text-[13px] rounded border border-slate-300 p-3 outline-none focus:border-[#0052cc]" defaultValue="Please send a check to Store Name, Store Street, Store Town, Store State / County, Store Postcode."></textarea>
        </FieldRow>
        <SaveButton onClick={() => {}} saving={saving} />
      </div>
    </div>
  );
}
