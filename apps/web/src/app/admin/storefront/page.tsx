"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { LogoTab, MenusTab, FooterTab, NewsletterTab, FeaturesTab, ProductPageTab, SocialLinksTab } from "./components/GeneralSettingsTabs";
import { SliderBannersTab, ThreeColumnFullWidthBannersTab, FeaturedCategoriesTab, ProductTabsOneTab, TopBrandsTab, FlashSaleVerticalProductsTab, TwoColumnBannersTab, ProductGridTab, ThreeColumnBannersTab, ProductTabsTwoTab, OneColumnBannerTab, BlogsTab } from "./components/HomePageSectionsTabs";

export default function StorefrontPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isGeneralOpen, setIsGeneralOpen] = useState(true);
  const [isHomeOpen, setIsHomeOpen] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [generalData, setGeneralData] = useState({
    welcomeText: "Welcome to FleetCart!",
    themeColor: "#0052cc",
    mailThemeColor: "#0052cc",
    sliderArrowColor: "#0052cc"
  });

  useEffect(() => {
    apiFetch<any>("/api/admin/storefront-settings")
      .then((res) => {
        setSettings(res.data || {});
        if (res.data?.general) {
          setGeneralData({
            ...generalData,
            ...res.data.general
          });
        }
      })
      .catch((err) => {
        toast.error("Failed to load settings");
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSaveTab = async (tabKey: string, data: any) => {
    setIsSaving(true);
    try {
      await apiFetch<any>("/api/admin/storefront-settings", {
        method: "POST",
        body: JSON.stringify({
          group: "storefront",
          settings: {
            [tabKey]: data
          }
        })
      });
      setSettings(prev => ({ ...prev, [tabKey]: data }));
      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error("Failed to save settings");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGeneral = () => {
    handleSaveTab("general", generalData);
  };

  const generalTabs = [
    { id: "general", label: "General" },
    { id: "logo", label: "Logo" },
    { id: "menus", label: "Menus" },
    { id: "footer", label: "Footer" },
    { id: "newsletter", label: "Newsletter" },
    { id: "features", label: "Features" },
    { id: "product-page", label: "Product Page" },
    { id: "social-links", label: "Social Links" },
  ];

  const homeTabs = [
    { id: "slider-banners", label: "Slider Banners" },
    { id: "three-column-full-width-banners", label: "Three Column Full Width Banners" },
    { id: "featured-categories", label: "Featured Categories" },
    { id: "product-tabs-one", label: "Product Tabs One" },
    { id: "top-brands", label: "Top Brands" },
    { id: "flash-sale-and-vertical-products", label: "Flash Sale & Vertical Products" },
    { id: "two-column-banners", label: "Two column banners" },
    { id: "product-grid", label: "Product Grid" },
    { id: "three-column-banners", label: "Three Column Banners" },
    { id: "product-tabs-two", label: "Product Tabs Two" },
    { id: "one-column-banner", label: "One Column Banner" },
    { id: "blogs", label: "Blogs" },
  ];

  if (isLoading) {
    return <div className="flex-1 p-8 overflow-auto bg-slate-50 min-h-screen flex items-center justify-center">Loading settings...</div>;
  }

  return (
    <div className="flex-1 p-8 overflow-auto bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-800 mb-8">Storefront</h1>
        
        <div className="flex gap-6 bg-white p-6 rounded-md shadow-sm border border-slate-200 min-h-[600px]">
          {/* Sidebar */}
          <div className="w-[300px] shrink-0 border-r border-slate-100 pr-6">
            <div className="space-y-4">
              {/* General Settings Section */}
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
                            ? "text-blue-600 bg-white border-l-2 border-blue-600 -ml-[2px]" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-2 border-transparent -ml-[2px]"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Home Page Sections */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <button 
                  onClick={() => setIsHomeOpen(!isHomeOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 font-medium text-[14px]"
                >
                  Home Page Sections
                  {isHomeOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                {isHomeOpen && (
                  <div className="bg-slate-50 py-2 border-t border-slate-200">
                    {homeTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-8 py-2 text-[13px] ${
                          activeTab === tab.id 
                            ? "text-blue-600 bg-white border-l-2 border-blue-600 -ml-[2px]" 
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
          <div className="flex-1 pl-2">
            {activeTab === "general" && (
              <div className="max-w-[800px]">
                <div className="border-b border-slate-200 pb-3 mb-6">
                  <h2 className="text-[16px] font-medium text-slate-800">General</h2>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                    <label className="text-[13px] font-medium text-slate-700">Welcome Text</label>
                    <input type="text" value={generalData.welcomeText} onChange={e => setGeneralData({...generalData, welcomeText: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                    <label className="text-[13px] font-medium text-slate-700">Theme Color</label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-sm border border-slate-200 cursor-pointer" style={{ backgroundColor: generalData.themeColor }}></div>
                      <input type="text" value={generalData.themeColor} onChange={e => setGeneralData({...generalData, themeColor: e.target.value})} className="h-9 w-[100px] text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                    <label className="text-[13px] font-medium text-slate-700">Mail Theme Color</label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-sm border border-slate-200 cursor-pointer" style={{ backgroundColor: generalData.mailThemeColor }}></div>
                      <input type="text" value={generalData.mailThemeColor} onChange={e => setGeneralData({...generalData, mailThemeColor: e.target.value})} className="h-9 w-[100px] text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                    <label className="text-[13px] font-medium text-slate-700">Slider Arrow Color</label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-sm border border-slate-200 cursor-pointer" style={{ backgroundColor: generalData.sliderArrowColor }}></div>
                      <input type="text" value={generalData.sliderArrowColor} onChange={e => setGeneralData({...generalData, sliderArrowColor: e.target.value})} className="h-9 w-[100px] text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 pt-4">
                    <div></div>
                    <button onClick={handleSaveGeneral} disabled={isSaving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* General Settings */}
            {activeTab === "logo" && <LogoTab save={(data) => handleSaveTab("logo", data)} saving={isSaving} initialData={settings.logo} />}
            {activeTab === "menus" && <MenusTab save={(data) => handleSaveTab("menus", data)} saving={isSaving} initialData={settings.menus} />}
            {activeTab === "footer" && <FooterTab save={(data) => handleSaveTab("footer", data)} saving={isSaving} initialData={settings.footer} />}
            {activeTab === "newsletter" && <NewsletterTab save={(data) => handleSaveTab("newsletter", data)} saving={isSaving} initialData={settings.newsletter} />}
            {activeTab === "features" && <FeaturesTab save={(data) => handleSaveTab("features", data)} saving={isSaving} initialData={settings.features} />}
            {activeTab === "product-page" && <ProductPageTab save={(data) => handleSaveTab("product-page", data)} saving={isSaving} initialData={settings["product-page"]} />}
            {activeTab === "social-links" && <SocialLinksTab save={(data) => handleSaveTab("social-links", data)} saving={isSaving} initialData={settings["social-links"]} />}

            {/* Home Page Sections */}
            {activeTab === "slider-banners" && <SliderBannersTab save={(data) => handleSaveTab("slider-banners", data)} saving={isSaving} initialData={settings["slider-banners"]} />}
            {activeTab === "three-column-full-width-banners" && <ThreeColumnFullWidthBannersTab save={(data) => handleSaveTab("three-column-full-width-banners", data)} saving={isSaving} initialData={settings["three-column-full-width-banners"]} />}
            {activeTab === "featured-categories" && <FeaturedCategoriesTab save={(data) => handleSaveTab("featured-categories", data)} saving={isSaving} initialData={settings["featured-categories"]} />}
            {activeTab === "product-tabs-one" && <ProductTabsOneTab save={(data) => handleSaveTab("product-tabs-one", data)} saving={isSaving} initialData={settings["product-tabs-one"]} />}
            {activeTab === "top-brands" && <TopBrandsTab save={(data) => handleSaveTab("top-brands", data)} saving={isSaving} initialData={settings["top-brands"]} />}
            {activeTab === "flash-sale-and-vertical-products" && <FlashSaleVerticalProductsTab save={(data) => handleSaveTab("flash-sale-and-vertical-products", data)} saving={isSaving} initialData={settings["flash-sale-and-vertical-products"]} />}
            {activeTab === "two-column-banners" && <TwoColumnBannersTab save={(data) => handleSaveTab("two-column-banners", data)} saving={isSaving} initialData={settings["two-column-banners"]} />}
            {activeTab === "product-grid" && <ProductGridTab save={(data) => handleSaveTab("product-grid", data)} saving={isSaving} initialData={settings["product-grid"]} />}
            {activeTab === "three-column-banners" && <ThreeColumnBannersTab save={(data) => handleSaveTab("three-column-banners", data)} saving={isSaving} initialData={settings["three-column-banners"]} />}
            {activeTab === "product-tabs-two" && <ProductTabsTwoTab save={(data) => handleSaveTab("product-tabs-two", data)} saving={isSaving} initialData={settings["product-tabs-two"]} />}
            {activeTab === "one-column-banner" && <OneColumnBannerTab save={(data) => handleSaveTab("one-column-banner", data)} saving={isSaving} initialData={settings["one-column-banner"]} />}
            {activeTab === "blogs" && <BlogsTab save={(data) => handleSaveTab("blogs", data)} saving={isSaving} initialData={settings.blogs} />}
          </div>
        </div>
      </div>
    </div>
  );
}
