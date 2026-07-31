import { useState, useEffect } from "react";
import { X, ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function SliderBannersTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultBanners = [
    { id: 1, subtitle: "Camera", title: "& Accessories", ctaUrl: "/categories/camera-accessories/products", openInNewWindow: false, image: "" },
    { id: 2, subtitle: "Smart TV", title: "4K Ultra HD", ctaUrl: "/categories/smart-tv/products", openInNewWindow: false, image: "" }
  ];
  
  const [data, setData] = useState({ sliderBanners: defaultBanners });

  useEffect(() => {
    if (initialData?.sliderBanners) {
      setData({ sliderBanners: initialData.sliderBanners });
    }
  }, [initialData]);

  const updateBanner = (index: number, field: string, value: any) => {
    const newBanners = [...data.sliderBanners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setData({ sliderBanners: newBanners });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Slider Banners</h2>
      </div>
      
      {data.sliderBanners.map((banner: any, index: number) => (
        <div key={banner.id} className="border border-slate-200 rounded-sm overflow-hidden mb-6">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-[14px] font-medium text-slate-700">Banner {index + 1}</h3>
          </div>
          <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
            <div className="relative w-32 h-32 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 group">
              {banner.image ? (
                <>
                  <div onClick={() => updateBanner(index, 'image', "")} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                    <X className="w-3 h-3 text-slate-400" />
                  </div>
                  <img src={banner.image} className="max-w-full max-h-full object-cover" />
                </>
              ) : (
                <div className="text-center group-hover:opacity-20 transition-opacity cursor-pointer" onClick={() => {
                  const url = prompt("Enter banner image URL:");
                  if (url) updateBanner(index, 'image', url);
                }}>
                  <div className="text-[10px] font-medium text-slate-500">{banner.subtitle || "Subtitle"}</div>
                  <div className="text-[12px] font-bold text-slate-800">{banner.title || "Title"}</div>
                </div>
              )}
            </div>
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">Subtitle</label>
                <input type="text" value={banner.subtitle} onChange={e => updateBanner(index, 'subtitle', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">Title</label>
                <input type="text" value={banner.title} onChange={e => updateBanner(index, 'title', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1">Call to Action URL</label>
                <input type="text" value={banner.ctaUrl} onChange={e => updateBanner(index, 'ctaUrl', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={banner.openInNewWindow} onChange={e => updateBanner(index, 'openInNewWindow', e.target.checked)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[13px] text-slate-600">Open in new window</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function ThreeColumnFullWidthBannersTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultBanners = [
    { id: 1, ctaUrl: "/products", openInNewWindow: false, image: "" },
    { id: 2, ctaUrl: "/products", openInNewWindow: false, image: "" },
    { id: 3, ctaUrl: "/products", openInNewWindow: false, image: "" }
  ];

  const [data, setData] = useState({
    enableThreeColumnFullWidthBanners: true,
    threeColumnFullWidthBanners: defaultBanners
  });

  useEffect(() => {
    if (initialData) {
      setData({
        enableThreeColumnFullWidthBanners: initialData.enableThreeColumnFullWidthBanners ?? true,
        threeColumnFullWidthBanners: initialData.threeColumnFullWidthBanners || defaultBanners
      });
    }
  }, [initialData]);

  const updateBanner = (index: number, field: string, value: any) => {
    const newBanners = [...data.threeColumnFullWidthBanners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setData({ ...data, threeColumnFullWidthBanners: newBanners });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Three Column Full Width Banners</h2>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input type="checkbox" checked={data.enableThreeColumnFullWidthBanners} onChange={e => setData({...data, enableThreeColumnFullWidthBanners: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
        <span className="text-[13px] text-slate-600">Enable three column full width banners section</span>
      </div>

      {data.threeColumnFullWidthBanners.map((banner: any, index: number) => (
        <div key={banner.id} className="border border-slate-200 rounded-sm overflow-hidden mb-6">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-[14px] font-medium text-slate-700">Banner {index + 1}</h3>
          </div>
          <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
            <div className="relative w-32 h-20 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 group">
              {banner.image ? (
                <>
                  <div onClick={() => updateBanner(index, 'image', "")} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                    <X className="w-3 h-3 text-slate-400" />
                  </div>
                  <img src={banner.image} className="max-w-full max-h-full object-cover" />
                </>
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400 group-hover:opacity-50 cursor-pointer" onClick={() => {
                  const url = prompt("Enter banner image URL:");
                  if (url) updateBanner(index, 'image', url);
                }} />
              )}
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="block text-[13px] font-medium text-slate-700">Call to Action URL</label>
              <input type="text" value={banner.ctaUrl} onChange={e => updateBanner(index, 'ctaUrl', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={banner.openInNewWindow} onChange={e => updateBanner(index, 'openInNewWindow', e.target.checked)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[13px] text-slate-600">Open in new window</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function FeaturedCategoriesTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultCategories = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    categoryId: "",
    type: "Category Products",
    limit: "10"
  }));

  const [data, setData] = useState({
    enableFeaturedCategories: true,
    featuredCategoriesTitle: "Top Categories",
    featuredCategoriesSubtitle: "Find what you need",
    featuredCategories: defaultCategories
  });
  
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setData({
        enableFeaturedCategories: initialData.enableFeaturedCategories ?? true,
        featuredCategoriesTitle: initialData.featuredCategoriesTitle || "Top Categories",
        featuredCategoriesSubtitle: initialData.featuredCategoriesSubtitle || "Find what you need",
        featuredCategories: initialData.featuredCategories?.length ? initialData.featuredCategories : defaultCategories
      });
    }
    apiFetch<any>("/api/admin/categories").then(res => {
      if (res?.data?.categories) setCategories(res.data.categories);
    }).catch(console.error);
  }, [initialData]);

  const updateCategory = (index: number, field: string, value: any) => {
    const newCats = [...data.featuredCategories];
    newCats[index] = { ...newCats[index], [field]: value };
    setData({ ...data, featuredCategories: newCats });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Featured Categories</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableFeaturedCategories} onChange={e => setData({...data, enableFeaturedCategories: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable featured categories section</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-4">
        <label className="text-[13px] font-medium text-slate-700">Section Title</label>
        <input type="text" value={data.featuredCategoriesTitle} onChange={e => setData({...data, featuredCategoriesTitle: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-8">
        <label className="text-[13px] font-medium text-slate-700">Section Subtitle</label>
        <input type="text" value={data.featuredCategoriesSubtitle} onChange={e => setData({...data, featuredCategoriesSubtitle: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
      </div>

      {data.featuredCategories.map((cat: any, i: number) => (
        <div key={cat.id} className="mb-6">
          <h3 className="text-[14px] font-medium text-slate-700 mb-4">Category {i + 1}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Category</label>
              <select value={cat.categoryId} onChange={e => updateCategory(i, 'categoryId', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Type</label>
              <select value={cat.type} onChange={e => updateCategory(i, 'type', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                <option value="Category Products">Category Products</option>
                <option value="Latest Products">Latest Products</option>
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Products Limit</label>
              <input type="text" value={cat.limit} onChange={e => updateCategory(i, 'limit', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function ProductTabsOneTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultTabs = Array.from({ length: 4 }, (_, i) => ({
    id: i + 1,
    title: `Tab ${i + 1}`,
    categoryId: "",
    type: "Category Products",
    limit: "10"
  }));

  const [data, setData] = useState({
    enableProductTabsOne: true,
    productTabsOne: defaultTabs
  });
  
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setData({
        enableProductTabsOne: initialData.enableProductTabsOne ?? true,
        productTabsOne: initialData.productTabsOne?.length ? initialData.productTabsOne : defaultTabs
      });
    }
    apiFetch<any>("/api/admin/categories").then(res => {
      if (res?.data?.categories) setCategories(res.data.categories);
    }).catch(console.error);
  }, [initialData]);

  const updateTab = (index: number, field: string, value: any) => {
    const newTabs = [...data.productTabsOne];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setData({ ...data, productTabsOne: newTabs });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Product Tabs One</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableProductTabsOne} onChange={e => setData({...data, enableProductTabsOne: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable product tabs one section</span>
        </div>
      </div>

      {data.productTabsOne.map((tab: any, i: number) => (
        <div key={tab.id} className="mb-6">
          <h3 className="text-[14px] font-medium text-slate-700 mb-4">Tab {i + 1}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Title</label>
              <input type="text" value={tab.title} onChange={e => updateTab(i, 'title', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Type</label>
              <select value={tab.type} onChange={e => updateTab(i, 'type', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                <option value="Category Products">Category Products</option>
                <option value="Latest Products">Latest Products</option>
                <option value="Recently Viewed Products">Recently Viewed Products</option>
              </select>
            </div>
            {tab.type === "Category Products" && (
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Category</label>
                <select value={tab.categoryId} onChange={e => updateTab(i, 'categoryId', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Products Limit</label>
              <input type="text" value={tab.limit} onChange={e => updateTab(i, 'limit', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function TopBrandsTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    enableTopBrands: true,
    topBrands: [] as string[]
  });
  
  const [allBrands, setAllBrands] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setData({
        enableTopBrands: initialData.enableTopBrands ?? true,
        topBrands: initialData.topBrands || []
      });
    }
    apiFetch<any>("/api/admin/brands").then(res => {
      if (res?.data?.brands) setAllBrands(res.data.brands);
    }).catch(console.error);
  }, [initialData]);

  const removeBrand = (brandId: string) => {
    setData({...data, topBrands: data.topBrands.filter(id => id !== brandId)});
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Top Brands</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableTopBrands} onChange={e => setData({...data, enableTopBrands: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable brands section</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-start gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700 pt-2">Top Brands</label>
        <div className="space-y-3 w-full">
          <div className="min-h-[36px] w-full border border-slate-300 rounded-sm p-1.5 flex flex-wrap gap-1.5 bg-white">
            {data.topBrands.map(brandId => {
              const brand = allBrands.find(b => b.id === brandId) || { name: brandId };
              return (
                <div key={brandId} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-[3px] text-[12px] border border-slate-200">
                  {brand.name} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeBrand(brandId)} />
                </div>
              );
            })}
          </div>
          <select 
            className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white"
            onChange={e => {
              if (e.target.value && !data.topBrands.includes(e.target.value)) {
                setData({...data, topBrands: [...data.topBrands, e.target.value]});
              }
              e.target.value = "";
            }}
          >
            <option value="">Add a brand...</option>
            {allBrands.filter(b => !data.topBrands.includes(b.id)).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function FlashSaleVerticalProductsTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultVerticals = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    title: i === 0 ? "Watches" : i === 1 ? "Backpacks" : "Shirts",
    type: "Category Products",
    categoryId: "",
    limit: "10"
  }));

  const [data, setData] = useState({
    enableFlashSaleVerticals: true,
    flashSaleTitle: "Best <b>Deals</b>",
    flashSaleCampaignId: "",
    verticalProducts: defaultVerticals
  });
  
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setData({
        enableFlashSaleVerticals: initialData.enableFlashSaleVerticals ?? true,
        flashSaleTitle: initialData.flashSaleTitle || "Best <b>Deals</b>",
        flashSaleCampaignId: initialData.flashSaleCampaignId || "",
        verticalProducts: initialData.verticalProducts?.length ? initialData.verticalProducts : defaultVerticals
      });
    }
    apiFetch<any>("/api/admin/categories").then(res => {
      if (res?.data?.categories) setCategories(res.data.categories);
    }).catch(console.error);
  }, [initialData]);

  const updateVertical = (index: number, field: string, value: any) => {
    const newVerticals = [...data.verticalProducts];
    newVerticals[index] = { ...newVerticals[index], [field]: value };
    setData({ ...data, verticalProducts: newVerticals });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Flash Sale & Vertical Products</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-8">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableFlashSaleVerticals} onChange={e => setData({...data, enableFlashSaleVerticals: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable flash sale & vertical products section</span>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-[14px] font-medium text-slate-700 mb-4">Flash Sale</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
            <label className="text-[13px] font-medium text-slate-700">Title</label>
            <input type="text" value={data.flashSaleTitle} onChange={e => setData({...data, flashSaleTitle: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
            <label className="text-[13px] font-medium text-slate-700">Active Campaign ID</label>
            <input type="text" value={data.flashSaleCampaignId} onChange={e => setData({...data, flashSaleCampaignId: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
          </div>
        </div>
      </div>

      {data.verticalProducts.map((vert: any, i: number) => (
        <div key={vert.id} className="mb-6">
          <h3 className="text-[14px] font-medium text-slate-700 mb-4">Vertical Products {i + 1}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Title</label>
              <input type="text" value={vert.title} onChange={e => updateVertical(i, 'title', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Type</label>
              <select value={vert.type} onChange={e => updateVertical(i, 'type', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                <option value="Category Products">Category Products</option>
                <option value="Latest Products">Latest Products</option>
                <option value="Recently Viewed Products">Recently Viewed Products</option>
              </select>
            </div>
            {vert.type === "Category Products" && (
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Category</label>
                <select value={vert.categoryId} onChange={e => updateVertical(i, 'categoryId', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Products Limit</label>
              <input type="text" value={vert.limit} onChange={e => updateVertical(i, 'limit', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function TwoColumnBannersTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultBanners = [
    { id: 1, ctaUrl: "/categories/ultraslim/products", openInNewWindow: false, image: "" },
    { id: 2, ctaUrl: "/categories/watches/products", openInNewWindow: false, image: "" }
  ];

  const [data, setData] = useState({
    enableTwoColumnBanners: true,
    twoColumnBanners: defaultBanners
  });

  useEffect(() => {
    if (initialData) {
      setData({
        enableTwoColumnBanners: initialData.enableTwoColumnBanners ?? true,
        twoColumnBanners: initialData.twoColumnBanners?.length ? initialData.twoColumnBanners : defaultBanners
      });
    }
  }, [initialData]);

  const updateBanner = (index: number, field: string, value: any) => {
    const newBanners = [...data.twoColumnBanners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setData({ ...data, twoColumnBanners: newBanners });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Two column banners</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableTwoColumnBanners} onChange={e => setData({...data, enableTwoColumnBanners: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable two column banners section</span>
        </div>
      </div>

      {data.twoColumnBanners.map((banner: any, index: number) => (
        <div key={banner.id} className="border border-slate-200 rounded-sm overflow-hidden mb-6">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-[14px] font-medium text-slate-700">Banner {index + 1}</h3>
          </div>
          <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
            <div className="relative w-32 h-24 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 group">
              {banner.image ? (
                <>
                  <div onClick={() => updateBanner(index, 'image', "")} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                    <X className="w-3 h-3 text-slate-400" />
                  </div>
                  <img src={banner.image} className="max-w-full max-h-full object-cover" />
                </>
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400 group-hover:opacity-50 cursor-pointer" onClick={() => {
                  const url = prompt("Enter banner image URL:");
                  if (url) updateBanner(index, 'image', url);
                }} />
              )}
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="block text-[13px] font-medium text-slate-700">Call to Action URL</label>
              <input type="text" value={banner.ctaUrl} onChange={e => updateBanner(index, 'ctaUrl', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={banner.openInNewWindow} onChange={e => updateBanner(index, 'openInNewWindow', e.target.checked)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[13px] text-slate-600">Open in new window</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function ProductGridTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultTabs = [
    { id: 1, title: "Mobiles", type: "Category Products", categoryId: "", limit: "10" },
    { id: 2, title: "Fashion", type: "Category Products", categoryId: "", limit: "10" },
    { id: 3, title: "Laptops", type: "Category Products", categoryId: "", limit: "10" },
    { id: 4, title: "Tablets", type: "Category Products", categoryId: "", limit: "10" }
  ];

  const [data, setData] = useState({
    enableProductGrid: true,
    productGridTabs: defaultTabs
  });
  
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setData({
        enableProductGrid: initialData.enableProductGrid ?? true,
        productGridTabs: initialData.productGridTabs?.length ? initialData.productGridTabs : defaultTabs
      });
    }
    apiFetch<any>("/api/admin/categories").then(res => {
      if (res?.data?.categories) setCategories(res.data.categories);
    }).catch(console.error);
  }, [initialData]);

  const updateTab = (index: number, field: string, value: any) => {
    const newTabs = [...data.productGridTabs];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setData({ ...data, productGridTabs: newTabs });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Product Grid</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableProductGrid} onChange={e => setData({...data, enableProductGrid: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable product grid section</span>
        </div>
      </div>

      {data.productGridTabs.map((tab: any, i: number) => (
        <div key={tab.id} className="mb-6">
          <h3 className="text-[14px] font-medium text-slate-700 mb-4">Tab {i + 1}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Title</label>
              <input type="text" value={tab.title} onChange={e => updateTab(i, 'title', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Type</label>
              <select value={tab.type} onChange={e => updateTab(i, 'type', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                <option value="Category Products">Category Products</option>
                <option value="Latest Products">Latest Products</option>
              </select>
            </div>
            {tab.type === "Category Products" && (
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Category</label>
                <select value={tab.categoryId} onChange={e => updateTab(i, 'categoryId', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Products Limit</label>
              <input type="text" value={tab.limit} onChange={e => updateTab(i, 'limit', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function ThreeColumnBannersTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultBanners = [
    { id: 1, ctaUrl: "/categories/home-appliances/products", openInNewWindow: false, image: "" },
    { id: 2, ctaUrl: "/categories/mobile-accessories/products", openInNewWindow: false, image: "" },
    { id: 3, ctaUrl: "/categories/gadgets/products", openInNewWindow: false, image: "" }
  ];

  const [data, setData] = useState({
    enableThreeColumnBanners: true,
    threeColumnBanners: defaultBanners
  });

  useEffect(() => {
    if (initialData) {
      setData({
        enableThreeColumnBanners: initialData.enableThreeColumnBanners ?? true,
        threeColumnBanners: initialData.threeColumnBanners?.length ? initialData.threeColumnBanners : defaultBanners
      });
    }
  }, [initialData]);

  const updateBanner = (index: number, field: string, value: any) => {
    const newBanners = [...data.threeColumnBanners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setData({ ...data, threeColumnBanners: newBanners });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Three Column Banners</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableThreeColumnBanners} onChange={e => setData({...data, enableThreeColumnBanners: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable three column banners section</span>
        </div>
      </div>

      {data.threeColumnBanners.map((banner: any, i: number) => (
        <div key={banner.id} className="border border-slate-200 rounded-sm overflow-hidden mb-6">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-[14px] font-medium text-slate-700">Banner {i + 1}</h3>
          </div>
          <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
            <div className="relative w-32 h-24 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 group">
              {banner.image ? (
                <>
                  <div onClick={() => updateBanner(i, 'image', "")} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                    <X className="w-3 h-3 text-slate-400" />
                  </div>
                  <img src={banner.image} className="max-w-full max-h-full object-cover" />
                </>
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400 group-hover:opacity-50 cursor-pointer" onClick={() => {
                  const url = prompt("Enter banner image URL:");
                  if (url) updateBanner(i, 'image', url);
                }} />
              )}
            </div>
            <div className="flex-1 w-full space-y-2">
              <label className="block text-[13px] font-medium text-slate-700">Call to Action URL</label>
              <input type="text" value={banner.ctaUrl} onChange={e => updateBanner(i, 'ctaUrl', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={banner.openInNewWindow} onChange={e => updateBanner(i, 'openInNewWindow', e.target.checked)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-[13px] text-slate-600">Open in new window</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function ProductTabsTwoTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const defaultTabs = [
    { id: 1, title: "Latest Products", type: "Latest Products", categoryId: "", limit: "10" },
    { id: 2, title: "Recently Viewed", type: "Recently Viewed Products", categoryId: "", limit: "10" },
    { id: 3, title: "On Sale", type: "Category Products", categoryId: "", limit: "10" },
    { id: 4, title: "Top Selling", type: "Category Products", categoryId: "", limit: "10" }
  ];

  const [data, setData] = useState({
    enableProductTabsTwo: true,
    productTabsTwoTitle: "Hot Best Sellers",
    productTabsTwo: defaultTabs
  });
  
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setData({
        enableProductTabsTwo: initialData.enableProductTabsTwo ?? true,
        productTabsTwoTitle: initialData.productTabsTwoTitle || "Hot Best Sellers",
        productTabsTwo: initialData.productTabsTwo?.length ? initialData.productTabsTwo : defaultTabs
      });
    }
    apiFetch<any>("/api/admin/categories").then(res => {
      if (res?.data?.categories) setCategories(res.data.categories);
    }).catch(console.error);
  }, [initialData]);

  const updateTab = (index: number, field: string, value: any) => {
    const newTabs = [...data.productTabsTwo];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setData({ ...data, productTabsTwo: newTabs });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Product Tabs Two</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableProductTabsTwo} onChange={e => setData({...data, enableProductTabsTwo: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable product tabs two section</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-8">
        <label className="text-[13px] font-medium text-slate-700">Title</label>
        <input type="text" value={data.productTabsTwoTitle} onChange={e => setData({...data, productTabsTwoTitle: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
      </div>

      {data.productTabsTwo.map((tab: any, i: number) => (
        <div key={tab.id} className="mb-6">
          <h3 className="text-[14px] font-medium text-slate-700 mb-4">Tab {i + 1}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Title</label>
              <input type="text" value={tab.title} onChange={e => updateTab(i, 'title', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Type</label>
              <select value={tab.type} onChange={e => updateTab(i, 'type', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                <option value="Latest Products">Latest Products</option>
                <option value="Recently Viewed Products">Recently Viewed Products</option>
                <option value="Category Products">Category Products</option>
              </select>
            </div>
            {tab.type === "Category Products" && (
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
                <label className="text-[13px] font-medium text-slate-700">Category</label>
                <select value={tab.categoryId} onChange={e => updateTab(i, 'categoryId', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-[13px] font-medium text-slate-700">Products Limit</label>
              <input type="text" value={tab.limit} onChange={e => updateTab(i, 'limit', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => save(data)} disabled={saving} className="bg-[#0052cc] hover:bg-[#0047b3] text-white px-6 py-2 rounded-sm text-[13px] font-medium transition-colors w-fit">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export function OneColumnBannerTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    enableOneColumnBanner: true,
    oneColumnBanner: {
      ctaUrl: "/categories/home-appliances/products",
      openInNewWindow: false,
      image: ""
    }
  });

  useEffect(() => {
    if (initialData) {
      setData({
        enableOneColumnBanner: initialData.enableOneColumnBanner ?? true,
        oneColumnBanner: initialData.oneColumnBanner || data.oneColumnBanner
      });
    }
  }, [initialData]);

  const updateBanner = (field: string, value: any) => {
    setData({
      ...data,
      oneColumnBanner: { ...data.oneColumnBanner, [field]: value }
    });
  };

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">One Column Banner</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4 mb-6">
        <label className="text-[13px] font-medium text-slate-700">Section Status</label>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.enableOneColumnBanner} onChange={e => setData({...data, enableOneColumnBanner: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-[13px] text-slate-600">Enable One column banner section</span>
        </div>
      </div>

      <div className="border border-slate-200 rounded-sm overflow-hidden mb-6">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-[14px] font-medium text-slate-700">Banner</h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="relative w-32 h-20 border border-slate-200 rounded-sm flex items-center justify-center bg-slate-50 overflow-hidden shrink-0 group">
            {data.oneColumnBanner.image ? (
              <>
                <div onClick={() => updateBanner('image', "")} className="absolute top-1 right-1 w-5 h-5 bg-white shadow-sm border border-slate-100 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-100 z-10">
                  <X className="w-3 h-3 text-slate-400" />
                </div>
                <img src={data.oneColumnBanner.image} className="max-w-full max-h-full object-cover" />
              </>
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-400 group-hover:opacity-50 cursor-pointer" onClick={() => {
                const url = prompt("Enter banner image URL:");
                if (url) updateBanner('image', url);
              }} />
            )}
          </div>
          <div className="flex-1 w-full space-y-2">
            <label className="block text-[13px] font-medium text-slate-700">Call to Action URL</label>
            <input type="text" value={data.oneColumnBanner.ctaUrl} onChange={e => updateBanner('ctaUrl', e.target.value)} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={data.oneColumnBanner.openInNewWindow} onChange={e => updateBanner('openInNewWindow', e.target.checked)} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
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

export function BlogsTab({ save, saving, initialData }: { save: (data: any) => void, saving: boolean, initialData?: any }) {
  const [data, setData] = useState({
    enableBlogs: true,
    blogsTitle: "Recent Posts",
    blogsLimit: "5"
  });

  useEffect(() => {
    if (initialData) {
      setData({
        enableBlogs: initialData.enableBlogs ?? true,
        blogsTitle: initialData.blogsTitle || "Recent Posts",
        blogsLimit: initialData.blogsLimit || "5"
      });
    }
  }, [initialData]);

  return (
    <div className="max-w-[800px]">
      <div className="border-b border-slate-200 pb-3 mb-6">
        <h2 className="text-[16px] font-medium text-slate-800">Blogs</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Section Status</label>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={data.enableBlogs} onChange={e => setData({...data, enableBlogs: e.target.checked})} className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-[13px] text-slate-600">Enable Blogs Section</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Section Title</label>
          <input type="text" value={data.blogsTitle} onChange={e => setData({...data, blogsTitle: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-4">
          <label className="text-[13px] font-medium text-slate-700">Recent Blogs Limit</label>
          <input type="number" value={data.blogsLimit} onChange={e => setData({...data, blogsLimit: e.target.value})} className="h-9 w-full text-[13px] rounded-sm border border-slate-300 px-3 outline-none focus:border-blue-500 bg-white" />
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
