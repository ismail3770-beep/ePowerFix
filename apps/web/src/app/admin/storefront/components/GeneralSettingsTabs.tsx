import { useState, useEffect } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function LogoTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    favicon: "",
    headerLogo: "",
    mailLogo: ""
  });

  useEffect(() => {
    if (initialData) setData({
      favicon: initialData.favicon || "",
      headerLogo: initialData.headerLogo || "",
      mailLogo: initialData.mailLogo || ""
    });
  }, [initialData]);

  // Dummy file picker simulation for now (should ideally upload and get URL)
  const handleUpload = (field: string) => {
    const url = prompt("Enter image URL (mock upload):");
    if (url) setData({ ...data, [field]: url });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Logo</h2>
      </div>
      <div className="space-y-6">
        <div>
          <h3 className="text-[14px] font-medium text-slate-700 mb-3">Favicon</h3>
          <button onClick={() => handleUpload("favicon")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-sm text-[13px] border border-slate-200 mb-3 flex items-center gap-2">
            <span className="w-3.5 h-3.5">📂</span> Browse
          </button>
          <div className="relative w-24 h-24 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50">
            {data.favicon ? (
              <>
                <div onClick={() => setData({...data, favicon: ""})} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                  <X className="w-3 h-3 text-slate-400" />
                </div>
                <img src={data.favicon} alt="Favicon" className="max-w-full max-h-full object-contain p-2" />
              </>
            ) : (
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">🛒</div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-[14px] font-medium text-slate-700 mb-3">Header Logo</h3>
          <button onClick={() => handleUpload("headerLogo")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-sm text-[13px] border border-slate-200 mb-3 flex items-center gap-2">
            <span className="w-3.5 h-3.5">📂</span> Browse
          </button>
          <div className="relative w-32 h-24 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50">
            {data.headerLogo ? (
              <>
                <div onClick={() => setData({...data, headerLogo: ""})} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                  <X className="w-3 h-3 text-slate-400" />
                </div>
                <img src={data.headerLogo} alt="Header Logo" className="max-w-full max-h-full object-contain p-2" />
              </>
            ) : (
              <div className="text-blue-600 font-bold text-lg flex items-center gap-1">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full"></div> FleetCart
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-[14px] font-medium text-slate-700 mb-3">Mail Logo</h3>
          <button onClick={() => handleUpload("mailLogo")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-sm text-[13px] border border-slate-200 mb-3 flex items-center gap-2">
            <span className="w-3.5 h-3.5">📂</span> Browse
          </button>
          <div className="relative w-32 h-24 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50">
            {data.mailLogo ? (
              <>
                <div onClick={() => setData({...data, mailLogo: ""})} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                  <X className="w-3 h-3 text-slate-400" />
                </div>
                <img src={data.mailLogo} alt="Mail Logo" className="max-w-full max-h-full object-contain p-2" />
              </>
            ) : (
              <div className="text-blue-600 font-bold text-lg flex items-center gap-1">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full"></div> FleetCart
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MenusTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    primaryMenu: "",
    categoryMenu: "",
    footerMenuOneTitle: "Our Services",
    footerMenuOne: "",
    footerMenuTwoTitle: "Information",
    footerMenuTwo: ""
  });
  
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setData({
        primaryMenu: initialData.primaryMenu || "",
        categoryMenu: initialData.categoryMenu || "",
        footerMenuOneTitle: initialData.footerMenuOneTitle || "Our Services",
        footerMenuOne: initialData.footerMenuOne || "",
        footerMenuTwoTitle: initialData.footerMenuTwoTitle || "Information",
        footerMenuTwo: initialData.footerMenuTwo || ""
      });
    }
    
    // Fetch menus for selects
    apiFetch<any>("/api/admin/menus").then(res => {
      if (res?.data) {
        setMenus(res.data);
      }
    }).catch(console.error);
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Menus</h2>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Primary Menu</label>
          <select value={data.primaryMenu} onChange={e => setData({...data, primaryMenu: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
            <option value="">Select Primary Menu</option>
            {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Category Menu</label>
          <select value={data.categoryMenu} onChange={e => setData({...data, categoryMenu: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
            <option value="">Select Category Menu</option>
            {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Footer Menu One Title</label>
          <input type="text" value={data.footerMenuOneTitle} onChange={e => setData({...data, footerMenuOneTitle: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Footer Menu One</label>
          <select value={data.footerMenuOne} onChange={e => setData({...data, footerMenuOne: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
            <option value="">Select Footer Menu 1</option>
            {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Footer Menu Two Title</label>
          <input type="text" value={data.footerMenuTwoTitle} onChange={e => setData({...data, footerMenuTwoTitle: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Footer Menu Two</label>
          <select value={data.footerMenuTwo} onChange={e => setData({...data, footerMenuTwo: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
            <option value="">Select Footer Menu 2</option>
            {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 pt-4">
          <div></div>
          <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FooterTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    footerTags: ["Accessories", "Electronics", "Entertainment", "Fashion", "Gadgets", "Hot deals", "Lifestyle", "Smartphone"],
    footerCopyrightText: 'Copyright &copy; <a href="{{ store_url }}">{{ store_name }}</a> {{ year }}. All rights reserved.',
    paymentMethodsImage: ""
  });
  
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (initialData) {
      setData({
        footerTags: initialData.footerTags || data.footerTags,
        footerCopyrightText: initialData.footerCopyrightText || data.footerCopyrightText,
        paymentMethodsImage: initialData.paymentMethodsImage || ""
      });
    }
  }, [initialData]);

  const removeTag = (tag: string) => {
    setData({...data, footerTags: data.footerTags.filter((t: string) => t !== tag)});
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!data.footerTags.includes(tagInput.trim())) {
        setData({...data, footerTags: [...data.footerTags, tagInput.trim()]});
      }
      setTagInput("");
    }
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Footer</h2>
      </div>
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-start gap-4">
          <label className="text-[13px] font-medium text-slate-700 pt-2">Footer Tags</label>
          <div className="min-h-[36px] w-full border border-slate-300 rounded-sm p-1.5 flex flex-wrap gap-1.5 bg-white">
            {data.footerTags.map((tag: string) => (
              <div key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-[3px] text-[12px] border border-slate-200">
                {tag} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)} />
              </div>
            ))}
            <input 
              type="text" 
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Type tag and press enter..."
              className="outline-none text-[13px] flex-1 min-w-[150px] bg-transparent ml-1"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Footer Copyright Text</label>
          <input type="text" value={data.footerCopyrightText} onChange={e => setData({...data, footerCopyrightText: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 font-mono" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-start gap-4 mt-6 pt-6 border-t border-slate-100">
          <label className="text-[13px] font-medium text-slate-700 pt-2">Accepted Payment Methods Image</label>
          <div>
            <button onClick={() => {
              const url = prompt("Enter image URL:");
              if (url) setData({...data, paymentMethodsImage: url});
            }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-sm text-[13px] border border-slate-200 mb-3 flex items-center gap-2">
              <span className="w-3.5 h-3.5">📂</span> Browse
            </button>
            <div className="relative w-32 h-24 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50 overflow-hidden">
              {data.paymentMethodsImage ? (
                <>
                  <div onClick={() => setData({...data, paymentMethodsImage: ""})} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                    <X className="w-3 h-3 text-slate-400" />
                  </div>
                  <img src={data.paymentMethodsImage} className="max-w-full max-h-full object-contain p-2" />
                </>
              ) : (
                <div className="flex gap-1">
                  <div className="w-6 h-4 bg-blue-800 text-[6px] text-white flex items-center justify-center font-bold">VISA</div>
                  <div className="w-6 h-4 bg-blue-400 text-[6px] text-white flex items-center justify-center font-bold">Pay</div>
                  <div className="w-6 h-4 bg-orange-500 text-[6px] text-white flex items-center justify-center font-bold">MC</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NewsletterTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    newsletterBackgroundImage: ""
  });

  useEffect(() => {
    if (initialData) setData({ newsletterBackgroundImage: initialData.newsletterBackgroundImage || "" });
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Newsletter</h2>
      </div>
      <div>
        <h3 className="text-[14px] font-medium text-slate-700 mb-3">Background Image</h3>
        <button onClick={() => {
          const url = prompt("Enter image URL:");
          if (url) setData({...data, newsletterBackgroundImage: url});
        }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded-sm text-[13px] border border-slate-200 mb-3 flex items-center gap-2">
          <span className="w-3.5 h-3.5">📂</span> Browse
        </button>
        <div className="relative w-32 h-32 border border-slate-200 rounded-sm flex items-center justify-center bg-blue-100 overflow-hidden">
          {data.newsletterBackgroundImage ? (
            <>
              <div onClick={() => setData({ newsletterBackgroundImage: "" })} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                <X className="w-3 h-3 text-slate-400" />
              </div>
              <img src={data.newsletterBackgroundImage} className="max-w-full max-h-full object-cover" />
            </>
          ) : (
            <ImageIcon className="w-8 h-8 text-blue-500" />
          )}
        </div>
      </div>
      <div className="pt-6">
        <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export function FeaturesTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultFeatures = [
    { id: 1, title: "24/7 SUPPORT", subtitle: "Support every time", icon: "las la-headphones" },
    { id: 2, title: "ACCEPT PAYMENT", subtitle: "Visa, Paypal, Master", icon: "las la-credit-card" },
    { id: 3, title: "SECURED PAYMENT", subtitle: "100% secured", icon: "las la-shield-alt" },
    { id: 4, title: "FREE SHIPPING", subtitle: "Order over $100", icon: "las la-truck" },
    { id: 5, title: "30 DAYS RETURN", subtitle: "30 days guarantee", icon: "las la-calendar-minus" },
  ];

  const [data, setData] = useState({
    enableFeaturesSection: true,
    features: defaultFeatures
  });

  useEffect(() => {
    if (initialData) {
      setData({
        enableFeaturesSection: initialData.enableFeaturesSection ?? true,
        features: initialData.features || defaultFeatures
      });
    }
  }, [initialData]);

  const updateFeature = (index: number, field: string, value: string) => {
    const newFeatures = [...data.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setData({ ...data, features: newFeatures });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Features</h2>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Section Status</label>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={data.enableFeaturesSection} onChange={e => setData({...data, enableFeaturesSection: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-[13px] text-slate-600">Enable features section</span>
          </div>
        </div>
        
        {data.features.map((f: any, i: number) => (
          <div key={f.id || i} className="pt-4 border-t border-slate-100">
            <h3 className="text-[14px] font-medium text-slate-700 mb-4">Feature {i + 1}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Title</label>
                <input type="text" value={f.title} onChange={e => updateFeature(i, 'title', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Subtitle</label>
                <input type="text" value={f.subtitle} onChange={e => updateFeature(i, 'subtitle', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Icon</label>
                <input type="text" value={f.icon} onChange={e => updateFeature(i, 'icon', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-4">
          <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductPageTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    productPageBannerCtaUrl: "/categories/headphones/products",
    productPageBannerOpenInNewWindow: false,
    productPageBannerImage: ""
  });

  useEffect(() => {
    if (initialData) {
      setData({
        productPageBannerCtaUrl: initialData.productPageBannerCtaUrl || "/categories/headphones/products",
        productPageBannerOpenInNewWindow: initialData.productPageBannerOpenInNewWindow || false,
        productPageBannerImage: initialData.productPageBannerImage || ""
      });
    }
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Product Page</h2>
      </div>
      
      <div className="border border-slate-200 rounded-sm overflow-hidden mb-6">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="text-[14px] font-medium text-slate-700">Product Page Banner</h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="relative w-32 h-32 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 group">
            {data.productPageBannerImage ? (
              <>
                <div onClick={() => setData({...data, productPageBannerImage: ""})} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                  <X className="w-3 h-3 text-slate-400" />
                </div>
                <img src={data.productPageBannerImage} className="max-w-full max-h-full object-cover" />
              </>
            ) : (
              <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center">
                <span className="text-[10px] text-blue-500 font-bold">20% OFF</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer" onClick={() => {
              const url = prompt("Enter banner image URL:");
              if (url) setData({...data, productPageBannerImage: url});
            }}>
              <span className="text-white text-xs">Change Image</span>
            </div>
          </div>
          <div className="flex-1 w-full space-y-2">
            <label className="block text-[13px] font-medium text-slate-700">Call to Action URL</label>
            <input type="text" value={data.productPageBannerCtaUrl} onChange={e => setData({...data, productPageBannerCtaUrl: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={data.productPageBannerOpenInNewWindow} onChange={e => setData({...data, productPageBannerOpenInNewWindow: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-[13px] text-slate-600">Open in new window</span>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function SocialLinksTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: ""
  });

  useEffect(() => {
    if (initialData) {
      setData({
        facebook: initialData.facebook || "",
        twitter: initialData.twitter || "",
        instagram: initialData.instagram || "",
        youtube: initialData.youtube || ""
      });
    }
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Social Links</h2>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Facebook</label>
          <input type="text" value={data.facebook} onChange={e => setData({...data, facebook: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Twitter</label>
          <input type="text" value={data.twitter} onChange={e => setData({...data, twitter: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Instagram</label>
          <input type="text" value={data.instagram} onChange={e => setData({...data, instagram: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Youtube</label>
          <input type="text" value={data.youtube} onChange={e => setData({...data, youtube: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 pt-4">
          <div></div>
          <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
