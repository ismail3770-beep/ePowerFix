"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { 
  GeneralTab, MaintenanceTab, LogoTab, StoreTab, PWATab, CurrencyTab, 
  SMSTab, MailTab, NewsletterTab, ReCaptchaTab, CustomCSSTab 
} from "./components/GeneralSettingsTabs";
import { FacebookTab, GoogleTab } from "./components/SocialLoginTabs";
import { FreeShippingTab, LocalPickupTab, FlatRateTab } from "./components/ShippingTabs";
import { 
  PayPalTab, StripeTab, PaytmTab, RazorpayTab, InstamojoTab, PaystackTab, 
  AuthorizeNetTab, MercadoPagoTab, FlutterwaveTab, IyzicoTab, PayFastTab, 
  BkashTab, NagadTab, SSLCommerzTab, CashOnDeliveryTab, BankTransferTab, CheckMoneyOrderTab 
} from "./components/PaymentTabs";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  
  const [isGeneralOpen, setIsGeneralOpen] = useState(true);
  const [isSocialOpen, setIsSocialOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    apiFetch<any>("/api/admin/settings")
      .then((res) => {
        setSettings(res.data || {});
      })
      .catch((err) => {
        toast.error("Failed to load settings");
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    try {
      await apiFetch<any>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(data)
      });
      setSettings(prev => ({ ...prev, ...data }));
      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error("Failed to save settings");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const generalTabs = [
    { id: "general", label: "General" },
    { id: "maintenance", label: "Maintenance" },
    { id: "logo", label: "Logo" },
    { id: "store", label: "Store" },
    { id: "pwa", label: "PWA" },
    { id: "currency", label: "Currency" },
    { id: "sms", label: "SMS" },
    { id: "mail", label: "Mail" },
    { id: "newsletter", label: "Newsletter" },
    { id: "recaptcha", label: "Google reCAPTCHA" },
    { id: "custom-css", label: "Custom CSS/JS" },
  ];

  const socialTabs = [
    { id: "facebook", label: "Facebook" },
    { id: "google", label: "Google" },
  ];

  const shippingTabs = [
    { id: "free-shipping", label: "Free Shipping" },
    { id: "local-pickup", label: "Local Pickup" },
    { id: "flat-rate", label: "Flat Rate" },
  ];

  const paymentTabs = [
    { id: "paypal", label: "PayPal" },
    { id: "stripe", label: "Stripe" },
    { id: "paytm", label: "Paytm" },
    { id: "razorpay", label: "Razorpay" },
    { id: "instamojo", label: "Instamojo" },
    { id: "paystack", label: "Paystack" },
    { id: "authorize-net", label: "Authorize.net" },
    { id: "mercado-pago", label: "Mercado Pago" },
    { id: "flutterwave", label: "Flutterwave" },
    { id: "iyzico", label: "Iyzico" },
    { id: "payfast", label: "PayFast" },
    { id: "bkash", label: "Bkash" },
    { id: "nagad", label: "Nagad" },
    { id: "sslcommerz", label: "SSLCommerz" },
    { id: "cod", label: "Cash On Delivery" },
    { id: "bank-transfer", label: "Bank Transfer" },
    { id: "check", label: "Check / Money Order" },
  ];

  if (isLoading) {
    return <div className="flex-1 p-8 bg-[#F1F5F9] min-h-screen flex items-center justify-center text-slate-500">Loading settings...</div>;
  }

  const tabProps = { initialData: settings, save: handleSave, saving: isSaving };

  return (
    <div className="flex-1 p-8 overflow-auto bg-[#F1F5F9] min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-800 mb-8">Settings</h1>
        
        <div className="flex flex-col lg:flex-row gap-6 bg-white p-6 rounded-md shadow-sm border border-slate-200 min-h-[600px]">
          {/* Sidebar */}
          <div className="w-full lg:w-[300px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
            <div className="space-y-4">
              
              {/* General Settings */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <button 
                  onClick={() => setIsGeneralOpen(!isGeneralOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 font-medium text-[14px]"
                >
                  General Settings
                  {isGeneralOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isGeneralOpen && (
                  <div className="bg-slate-50 py-2 border-t border-slate-200">
                    {generalTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-8 py-2 text-[13px] ${
                          activeTab === tab.id 
                            ? "text-[#0052cc] bg-white border-l-2 border-[#0052cc] -ml-[2px]" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-2 border-transparent -ml-[2px]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Logins */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <button 
                  onClick={() => setIsSocialOpen(!isSocialOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 font-medium text-[14px]"
                >
                  Social Logins
                  {isSocialOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isSocialOpen && (
                  <div className="bg-slate-50 py-2 border-t border-slate-200">
                    {socialTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-8 py-2 text-[13px] ${
                          activeTab === tab.id 
                            ? "text-[#0052cc] bg-white border-l-2 border-[#0052cc] -ml-[2px]" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-2 border-transparent -ml-[2px]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Shipping Methods */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <button 
                  onClick={() => setIsShippingOpen(!isShippingOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 font-medium text-[14px]"
                >
                  Shipping Methods
                  {isShippingOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isShippingOpen && (
                  <div className="bg-slate-50 py-2 border-t border-slate-200">
                    {shippingTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-8 py-2 text-[13px] ${
                          activeTab === tab.id 
                            ? "text-[#0052cc] bg-white border-l-2 border-[#0052cc] -ml-[2px]" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-2 border-transparent -ml-[2px]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <button 
                  onClick={() => setIsPaymentOpen(!isPaymentOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 font-medium text-[14px]"
                >
                  Payment Methods
                  {isPaymentOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isPaymentOpen && (
                  <div className="bg-slate-50 py-2 border-t border-slate-200 max-h-[300px] overflow-y-auto">
                    {paymentTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-8 py-2 text-[13px] ${
                          activeTab === tab.id 
                            ? "text-[#0052cc] bg-white border-l-2 border-[#0052cc] -ml-[2px]" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-2 border-transparent -ml-[2px]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 lg:pl-2">
            
            {/* General Settings Tabs */}
            {activeTab === "general" && <GeneralTab {...tabProps} />}
            {activeTab === "maintenance" && <MaintenanceTab {...tabProps} />}
            {activeTab === "logo" && <LogoTab {...tabProps} />}
            {activeTab === "store" && <StoreTab {...tabProps} />}
            {activeTab === "pwa" && <PWATab {...tabProps} />}
            {activeTab === "currency" && <CurrencyTab {...tabProps} />}
            {activeTab === "sms" && <SMSTab {...tabProps} />}
            {activeTab === "mail" && <MailTab {...tabProps} />}
            {activeTab === "newsletter" && <NewsletterTab {...tabProps} />}
            {activeTab === "recaptcha" && <ReCaptchaTab {...tabProps} />}
            {activeTab === "custom-css" && <CustomCSSTab {...tabProps} />}
            
            {/* Social Login Tabs */}
            {activeTab === "facebook" && <FacebookTab {...tabProps} />}
            {activeTab === "google" && <GoogleTab {...tabProps} />}

            {/* Shipping Methods Tabs */}
            {activeTab === "free-shipping" && <FreeShippingTab {...tabProps} />}
            {activeTab === "local-pickup" && <LocalPickupTab {...tabProps} />}
            {activeTab === "flat-rate" && <FlatRateTab {...tabProps} />}

            {/* Payment Methods Tabs */}
            {activeTab === "paypal" && <PayPalTab {...tabProps} />}
            {activeTab === "stripe" && <StripeTab {...tabProps} />}
            {activeTab === "paytm" && <PaytmTab {...tabProps} />}
            {activeTab === "razorpay" && <RazorpayTab {...tabProps} />}
            {activeTab === "instamojo" && <InstamojoTab {...tabProps} />}
            {activeTab === "paystack" && <PaystackTab {...tabProps} />}
            {activeTab === "authorize-net" && <AuthorizeNetTab {...tabProps} />}
            {activeTab === "mercado-pago" && <MercadoPagoTab {...tabProps} />}
            {activeTab === "flutterwave" && <FlutterwaveTab {...tabProps} />}
            {activeTab === "iyzico" && <IyzicoTab {...tabProps} />}
            {activeTab === "payfast" && <PayFastTab {...tabProps} />}
            {activeTab === "bkash" && <BkashTab {...tabProps} />}
            {activeTab === "nagad" && <NagadTab {...tabProps} />}
            {activeTab === "sslcommerz" && <SSLCommerzTab {...tabProps} />}
            {activeTab === "cod" && <CashOnDeliveryTab {...tabProps} />}
            {activeTab === "bank-transfer" && <BankTransferTab {...tabProps} />}
            {activeTab === "check" && <CheckMoneyOrderTab {...tabProps} />}

          </div>
        </div>
      </div>
    </div>
  );
}