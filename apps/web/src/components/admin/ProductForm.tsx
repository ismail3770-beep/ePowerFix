"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ImageUploader";
import { 
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Image as ImageIcon,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Image as ImageIcon2, Table, Code, Maximize2, MoreHorizontal,
  Info
} from "lucide-react";

interface ProductFormProps {
  initialData?: any;
}

// Reusable Token Input Component for Categories, Tags, Linked Products
const TokenInput = ({ value, onChange, placeholder = "" }: { value: string[], onChange: (v: string[]) => void, placeholder?: string }) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = inputValue.trim().replace(/,$/, "");
      if (val && !value.includes(val)) {
        onChange([...value, val]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeToken = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="min-h-[42px] w-full border border-slate-300 rounded-sm p-1.5 flex flex-wrap gap-1.5 bg-white items-center focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 transition-shadow">
      {value.map((token, idx) => (
        <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 text-[14px] px-2.5 py-1 flex items-center gap-1.5 rounded-sm">
          {token} 
          <button type="button" onClick={() => removeToken(idx)} className="text-slate-400 hover:text-red-500 focus:outline-none leading-none mt-[-2px]">×</button>
        </span>
      ))}
      <input 
        type="text" 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="outline-none text-[15px] flex-1 min-w-[120px] bg-transparent p-1 placeholder:text-slate-400" 
        placeholder={value.length === 0 ? placeholder : ""}
      />
    </div>
  );
};

const FleetCard = ({ title, section, openSections, toggleSection, children }: any) => (
  <div className="bg-white rounded shadow-sm border border-slate-200 mb-6 overflow-hidden">
    <div 
      className="flex items-center justify-between px-6 py-5 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <h3 className="text-[16px] text-slate-800 font-medium">{title}</h3>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-sm text-slate-400">
        {openSections[section] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </Button>
    </div>
    {openSections[section] && (
      <div className="p-6">
        {children}
      </div>
    )}
  </div>
);

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true, attributes: true, variations: true, variants: true, options: true, downloads: true,
    media: true, pricing: true, inventory: true, seo: true, additional: true, linked: true
  });

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const parseJson = (val: any) => {
    if (typeof val === 'string') {
      try { return JSON.parse(val) || []; } catch { return []; }
    }
    return Array.isArray(val) ? val : [];
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    shortDesc: initialData?.shortDesc || "",
    price: initialData?.price?.toString() || "",
    comparePrice: initialData?.comparePrice?.toString() || "",
    salePrice: initialData?.salePrice?.toString() || "",
    costPrice: initialData?.costPrice?.toString() || "",
    sku: initialData?.sku || "",
    stock: initialData?.stock?.toString() || "0",
    categoryId: initialData?.categoryId || "__none__",
    brandId: initialData?.brandId || "__none__",
    images: initialData?.images || [],
    isFeatured: initialData?.isFeatured || false,
    isBestDeal: initialData?.isBestDeal || false,
    isActive: initialData?.isActive ?? true,
    isDigital: initialData?.isDigital || false,
    taxClass: initialData?.taxId || "__none__",
    
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
    slug: initialData?.slug || "",
    specialPriceType: initialData?.specialPriceType || "Percent",
    specialPriceStart: initialData?.specialPriceStart ? new Date(initialData.specialPriceStart).toISOString().split('T')[0] : "",
    specialPriceEnd: initialData?.specialPriceEnd ? new Date(initialData.specialPriceEnd).toISOString().split('T')[0] : "",
    newFrom: initialData?.newFrom ? new Date(initialData.newFrom).toISOString().split('T')[0] : "",
    newTo: initialData?.newTo ? new Date(initialData.newTo).toISOString().split('T')[0] : "",
    inventoryManagement: initialData?.inventoryManagement || "Track Inventory",
    stockAvailability: initialData?.stockAvailability || "In Stock",
  });

  const [selCategories, setSelCategories] = useState<string[]>(Array.isArray(initialData?.categories) ? initialData.categories : (typeof initialData?.categories === 'string' ? initialData.categories.split(',').map((t:string)=>t.trim()).filter(Boolean) : []));
  const [selTags, setSelTags] = useState<string[]>(Array.isArray(initialData?.tags) ? initialData.tags : (typeof initialData?.tags === 'string' ? initialData.tags.split(',').map((t:string)=>t.trim()).filter(Boolean) : []));
  const [upSells, setUpSells] = useState<string[]>(parseJson(initialData?.upSells));
  const [crossSells, setCrossSells] = useState<string[]>(parseJson(initialData?.crossSells));
  const [relatedProducts, setRelatedProducts] = useState<string[]>(parseJson(initialData?.relatedProducts));

  const [attributes, setAttributes] = useState<{name: string, values: string[]}[]>(
    parseJson(initialData?.productAttributes).map((a: any) => ({ name: a.name || '', values: Array.isArray(a.values) ? a.values : [] }))
  );
  
  const [variations, setVariations] = useState<{name: string, type: string, values: string[]}[]>([]);
  const [options, setOptions] = useState<{name: string, type: string, values: string[]}[]>([]);
  const [downloads, setDownloads] = useState<{fileUrl: string}[]>(initialData?.digitalFile ? [{fileUrl: initialData.digitalFile}] : []);

  useEffect(() => {
    apiFetch("/api/admin/product-categories").then((res: any) => setCategories(res.data?.data || res.data || []));
    apiFetch("/api/admin/brands").then((res: any) => setBrands(res.data?.data || res.data || []));
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (exit: boolean = false) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId === "__none__" ? null : formData.categoryId,
        brandId: formData.brandId === "__none__" ? null : formData.brandId,
        specialPriceType: formData.specialPriceType === "__none__" ? null : formData.specialPriceType,
        inventoryManagement: formData.inventoryManagement === "__none__" ? null : formData.inventoryManagement,
        price: parseFloat(formData.price) || 0,
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
        stock: parseInt(formData.stock) || 0,
        
        specialPriceStart: formData.specialPriceStart ? new Date(formData.specialPriceStart).toISOString() : null,
        specialPriceEnd: formData.specialPriceEnd ? new Date(formData.specialPriceEnd).toISOString() : null,
        newFrom: formData.newFrom ? new Date(formData.newFrom).toISOString() : null,
        newTo: formData.newTo ? new Date(formData.newTo).toISOString() : null,

        tags: selTags.join(', '),
        upSells: upSells,
        crossSells: crossSells,
        relatedProducts: relatedProducts,
        productAttributes: attributes,
        productOptions: options,
        digitalFile: downloads[0]?.fileUrl || null,
      };

      if (isEdit) {
        await apiFetch(`/api/admin/products/${initialData.id}`, { method: "PUT", body: JSON.stringify(payload) });
        toast.success("Product updated successfully");
      } else {
        await apiFetch("/api/admin/products", { method: "POST", body: JSON.stringify(payload) });
        toast.success("Product created successfully");
      }
      if (exit) router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("description") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.description;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    setFormData(prev => ({
      ...prev,
      description: `${before}${prefix}${selected || (suffix ? "" : "text")}${suffix}${after}`
    }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length + (selected ? 0 : 4));
    }, 10);
  };

  return (
    <div className="font-poppins bg-[#f3f4f6] min-h-screen -m-6 p-6 pb-28 text-slate-700">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-normal text-slate-800">
          {isEdit ? "Edit Product" : "Create Product"}
        </h1>
        <div className="text-[15px] text-slate-500 flex items-center gap-2">
          <span>Home</span>
          <span className="text-slate-300">/</span>
          <span>Products</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400">{isEdit ? "Edit Product" : "Create Product"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-0">
          <FleetCard openSections={openSections} toggleSection={toggleSection} title="General" section="general">
            <div className="space-y-7">
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Name <span className="text-red-500">*</span></Label>
                <Input value={formData.name} onChange={(e) => handleChange("name", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Description <span className="text-red-500">*</span></Label>
                <div className="border border-slate-300 rounded-sm overflow-hidden flex flex-col focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow">
                  <div className="bg-slate-50 border-b border-slate-300 p-1.5 flex flex-wrap gap-1 items-center">
                    <Select defaultValue="p">
                      <SelectTrigger className="h-9 w-32 bg-white text-[14px] border-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="p">Paragraph</SelectItem><SelectItem value="h1">Heading 1</SelectItem></SelectContent>
                    </Select>
                    <div className="w-px h-6 bg-slate-300 mx-1.5"></div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200" onClick={() => insertFormatting("**", "**")}><Bold className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200" onClick={() => insertFormatting("*", "*")}><Italic className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200" onClick={() => insertFormatting("__", "__")}><Underline className="h-[18px] w-[18px]" /></Button>
                    <div className="w-px h-6 bg-slate-300 mx-1.5"></div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200"><AlignLeft className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200"><AlignCenter className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200"><AlignRight className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200"><AlignJustify className="h-[18px] w-[18px]" /></Button>
                    <div className="w-px h-6 bg-slate-300 mx-1.5"></div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200" onClick={() => insertFormatting("- ")}><List className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200" onClick={() => insertFormatting("1. ")}><ListOrdered className="h-[18px] w-[18px]" /></Button>
                    <div className="w-px h-6 bg-slate-300 mx-1.5"></div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200" onClick={() => insertFormatting("[title](url)")}><Link2 className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200"><ImageIcon2 className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200"><Table className="h-[18px] w-[18px]" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-sm text-slate-600 hover:bg-slate-200" onClick={() => insertFormatting("`", "`")}><Code className="h-[18px] w-[18px]" /></Button>
                  </div>
                  <Textarea 
                    id="description"
                    value={formData.description} 
                    onChange={(e) => handleChange("description", e.target.value)} 
                    className="min-h-[300px] border-0 focus-visible:ring-0 rounded-none resize-y p-4 text-[15px]" 
                  />
                  <div className="bg-slate-50 border-t border-slate-300 p-2 px-4 text-right text-[12px] text-slate-400">
                    {formData.description.split(/\s+/).filter(Boolean).length} WORDS
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Brand</Label>
                <Select value={formData.brandId} onValueChange={(v) => handleChange("brandId", v)}>
                  <SelectTrigger className="h-[42px] text-[15px] rounded-sm border-slate-300"><SelectValue placeholder="Please Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Please Select</SelectItem>
                    {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Categories <span className="text-red-500">*</span></Label>
                <TokenInput value={selCategories} onChange={setSelCategories} placeholder="Type and press Enter..." />
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Tags</Label>
                <TokenInput value={selTags} onChange={setSelTags} placeholder="Type and press Enter..." />
              </div>

              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Tax Class</Label>
                <Select value={formData.taxClass} onValueChange={(v) => handleChange("taxClass", v)}>
                  <SelectTrigger className="h-[42px] text-[15px] rounded-sm border-slate-300"><SelectValue placeholder="Please Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Please Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-5 pt-3">
                <div className="flex items-center space-x-4">
                  <Label className="text-[15px] font-normal text-slate-700 w-20">Virtual</Label>
                  <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleChange("isDigital", !formData.isDigital)}>
                    <Checkbox id="isVirtual" checked={formData.isDigital} className="h-5 w-5 border-slate-300" />
                    <Label className="text-[15px] font-normal text-slate-600 cursor-pointer">The product won't be shipped</Label>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Label className="text-[15px] font-normal text-slate-700 w-20">Status</Label>
                  <div className="flex items-center space-x-3">
                    <Switch id="isActive" checked={formData.isActive} onCheckedChange={(v) => handleChange("isActive", v)} />
                    <Label htmlFor="isActive" className="text-[15px] font-normal text-slate-600 cursor-pointer">Enable the product</Label>
                  </div>
                </div>
              </div>
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Attributes" section="attributes">
            <div className="space-y-3">
              <div className="grid grid-cols-[40px_1fr_2fr_50px] gap-3 items-center px-2 text-[14px] text-slate-500 mb-2 font-medium">
                <div></div>
                <div>Attribute</div>
                <div>Values</div>
                <div></div>
              </div>
              {attributes.map((attr, idx) => (
                <div key={idx} className="flex gap-3 items-start bg-white border border-slate-200 rounded-sm p-2 relative group">
                  <div className="w-[40px] flex items-center justify-center pt-2.5 text-slate-300 cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <Input 
                      value={attr.name} 
                      onChange={(e) => {
                        const newArr = [...attributes];
                        newArr[idx].name = e.target.value;
                        setAttributes(newArr);
                      }} 
                      placeholder="e.g. Brand"
                      className="h-[42px] text-[15px] rounded-sm border-slate-300" 
                    />
                  </div>
                  <div className="flex-[2]">
                    <TokenInput 
                      value={attr.values} 
                      onChange={(vals) => {
                        const newArr = [...attributes];
                        newArr[idx].values = vals;
                        setAttributes(newArr);
                      }} 
                      placeholder="Type values..."
                    />
                  </div>
                  <div className="w-[50px] flex justify-center pt-1.5">
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-red-500 rounded-sm bg-slate-100" onClick={() => {
                      setAttributes(attributes.filter((_, i) => i !== idx));
                    }}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="pt-4">
                <Button type="button" variant="outline" className="h-[40px] px-5 text-[14px] font-medium border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm shadow-sm" onClick={() => setAttributes([...attributes, { name: '', values: [] }])}>
                  Add Attribute
                </Button>
              </div>
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Variations" section="variations">
            <div className="space-y-5">
              {variations.map((v, idx) => (
                <div key={idx} className="border border-slate-200 rounded-sm overflow-hidden">
                  <div className="bg-slate-50 px-5 py-3 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />
                      <span className="text-[15px] text-slate-700 font-medium">{v.name || "New Variation"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-200 rounded-sm" onClick={() => setVariations(variations.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-200 rounded-sm"><ChevronUp className="h-5 w-5" /></Button>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-5 bg-white">
                    <div className="space-y-2">
                      <Label className="text-[14px] text-slate-600">Name</Label>
                      <Input value={v.name} onChange={(e) => {
                        const newArr = [...variations];
                        newArr[idx].name = e.target.value;
                        setVariations(newArr);
                      }} className="h-[42px] text-[15px] rounded-sm border-slate-300" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[14px] text-slate-600">Type</Label>
                      <Select value={v.type} onValueChange={(val) => {
                        const newArr = [...variations];
                        newArr[idx].type = val;
                        setVariations(newArr);
                      }}>
                        <SelectTrigger className="h-[42px] text-[15px] rounded-sm border-slate-300"><SelectValue placeholder="Please Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Please Select">Please Select</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                          <SelectItem value="radio">Radio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2 mt-2">
                      <Label className="text-[14px] text-slate-600">Values</Label>
                      <TokenInput 
                        value={v.values} 
                        onChange={(vals) => {
                          const newArr = [...variations];
                          newArr[idx].values = vals;
                          setVariations(newArr);
                        }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" className="h-[40px] px-5 text-[14px] font-medium border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm shadow-sm" onClick={() => setVariations([...variations, { name: '', type: 'dropdown', values: [] }])}>
                  Add Variation
                </Button>
                <div className="flex gap-2">
                  <Select><SelectTrigger className="h-[40px] w-[180px] rounded-sm border-slate-300 text-[14px]"><SelectValue placeholder="Select Template" /></SelectTrigger></Select>
                  <Button type="button" variant="outline" className="h-[40px] px-5 text-[14px] font-medium border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm shadow-sm">
                    Insert
                  </Button>
                </div>
              </div>
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Variants" section="variants">
            <div className="bg-blue-50/50 border border-blue-200 text-[#0052cc] text-[15px] p-5 rounded-sm flex items-center gap-4">
              <Info className="h-6 w-6 text-blue-500 shrink-0" />
              Please add some variations to generate variants
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Options" section="options">
             <div className="space-y-5">
              {options.map((opt, idx) => (
                <div key={idx} className="border border-slate-200 rounded-sm overflow-hidden">
                  <div className="bg-slate-50 px-5 py-3 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />
                      <span className="text-[15px] text-slate-700 font-medium">{opt.name || "New Option"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-200 rounded-sm" onClick={() => setOptions(options.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:bg-slate-200 rounded-sm"><ChevronDown className="h-5 w-5" /></Button>
                    </div>
                  </div>
                  <div className="p-5 grid grid-cols-2 gap-5 bg-white">
                    <div className="space-y-2">
                      <Label className="text-[14px] text-slate-600">Option Name</Label>
                      <Input value={opt.name} onChange={(e) => {
                        const newArr = [...options];
                        newArr[idx].name = e.target.value;
                        setOptions(newArr);
                      }} className="h-[42px] text-[15px] rounded-sm border-slate-300" />
                    </div>
                     <div className="space-y-2">
                      <Label className="text-[14px] text-slate-600">Type</Label>
                      <Select value={opt.type} onValueChange={(val) => {
                        const newArr = [...options];
                        newArr[idx].type = val;
                        setOptions(newArr);
                      }}>
                        <SelectTrigger className="h-[42px] text-[15px] rounded-sm border-slate-300"><SelectValue placeholder="Dropdown" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                          <SelectItem value="radio">Radio</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2 mt-2">
                      <Label className="text-[14px] text-slate-600">Values</Label>
                      <TokenInput 
                        value={opt.values} 
                        onChange={(vals) => {
                          const newArr = [...options];
                          newArr[idx].values = vals;
                          setOptions(newArr);
                        }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" className="h-[40px] px-5 text-[14px] font-medium border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm shadow-sm" onClick={() => setOptions([...options, { name: '', type: 'dropdown', values: [] }])}>
                  Add Option
                </Button>
                <div className="flex gap-2">
                  <Select><SelectTrigger className="h-[40px] w-[180px] rounded-sm border-slate-300 text-[14px]"><SelectValue placeholder="Select Template" /></SelectTrigger></Select>
                  <Button type="button" variant="outline" className="h-[40px] px-5 text-[14px] font-medium border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm shadow-sm">
                    Insert
                  </Button>
                </div>
              </div>
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Downloads" section="downloads">
             <div className={`space-y-4 ${!formData.isDigital && 'opacity-50 pointer-events-none'}`}>
               {!formData.isDigital && <p className="text-[14px] text-orange-600 bg-orange-50 border border-orange-200 p-3 rounded-sm">Please enable 'Virtual' in the General section to manage downloads.</p>}
               {downloads.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                    <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />
                    <div className="flex-1 flex gap-3">
                      <Input value={d.fileUrl} onChange={(e) => {
                        const newArr = [...downloads];
                        newArr[idx].fileUrl = e.target.value;
                        setDownloads(newArr);
                      }} className="h-[42px] text-[15px] rounded-sm border-slate-300 bg-white" placeholder="File URL or upload path" />
                      <Button type="button" variant="outline" className="h-[42px] px-5 rounded-sm border-slate-300 bg-white font-medium shadow-sm">Choose</Button>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10 bg-white border border-slate-200 rounded-sm text-slate-400 hover:text-red-500" onClick={() => setDownloads(downloads.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                 </div>
               ))}
               
               <div className="pt-2">
                <Button type="button" variant="outline" className="h-[40px] px-5 text-[14px] font-medium border-slate-300 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-sm shadow-sm" onClick={() => setDownloads([...downloads, { fileUrl: '' }])}>
                  Add File
                </Button>
              </div>
             </div>
          </FleetCard>
          
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-0">
          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Media" section="media">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-square border border-slate-200 rounded-sm relative group overflow-hidden bg-white">
                  <img src="/placeholder.svg" className="w-full h-full object-cover p-1 opacity-20" alt="" />
                  <button type="button" className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="aspect-square border-2 border-dashed border-slate-200 rounded-sm flex items-center justify-center cursor-pointer hover:bg-slate-50 text-slate-400 transition-colors">
                <ImageIcon className="h-8 w-8 stroke-1" />
              </div>
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Pricing" section="pricing">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Price <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[15px]">$</span>
                  <Input type="number" step="0.01" value={formData.price} onChange={(e) => handleChange("price", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 pl-8 focus-visible:ring-1 focus-visible:ring-blue-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Special Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[15px]">%</span>
                  <Input type="number" step="0.01" value={formData.salePrice} onChange={(e) => handleChange("salePrice", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 pl-8 focus-visible:ring-1 focus-visible:ring-blue-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Special Price Type</Label>
                <Select value={formData.specialPriceType} onValueChange={(v) => handleChange("specialPriceType", v)}>
                  <SelectTrigger className="h-[42px] text-[15px] rounded-sm border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percent">Percent</SelectItem>
                    <SelectItem value="Fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Special Price Start</Label>
                <Input type="date" value={formData.specialPriceStart} onChange={(e) => handleChange("specialPriceStart", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Special Price End</Label>
                <Input type="date" value={formData.specialPriceEnd} onChange={(e) => handleChange("specialPriceEnd", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Inventory" section="inventory">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">SKU</Label>
                <Input value={formData.sku} onChange={(e) => handleChange("sku", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Inventory Management</Label>
                <Select value={formData.inventoryManagement} onValueChange={(v) => handleChange("inventoryManagement", v)}>
                  <SelectTrigger className="h-[42px] text-[15px] rounded-sm border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Track Inventory">Track Inventory</SelectItem>
                    <SelectItem value="Don't Track Inventory">Don't Track Inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Qty <span className="text-red-500">*</span></Label>
                <Input type="number" value={formData.stock} onChange={(e) => handleChange("stock", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Stock Availability</Label>
                <Select value={formData.stockAvailability} onValueChange={(v) => handleChange("stockAvailability", v)}>
                  <SelectTrigger className="h-[42px] text-[15px] rounded-sm border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Out Of Stock">Out Of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FleetCard>
          
          <FleetCard openSections={openSections} toggleSection={toggleSection} title="SEO" section="seo">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">URL</Label>
                <Input value={formData.slug} onChange={(e) => handleChange("slug", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Meta Title</Label>
                <Input value={formData.metaTitle} onChange={(e) => handleChange("metaTitle", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Meta Description</Label>
                <Textarea value={formData.metaDescription} onChange={(e) => handleChange("metaDescription", e.target.value)} className="rounded-sm border-slate-300 text-[15px] focus-visible:ring-1 focus-visible:ring-blue-500" rows={4} />
              </div>
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Additional" section="additional">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Short Description</Label>
                <Textarea value={formData.shortDesc} onChange={(e) => handleChange("shortDesc", e.target.value)} className="rounded-sm border-slate-300 h-28 text-[15px] focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">New From</Label>
                <Input type="date" value={formData.newFrom} onChange={(e) => handleChange("newFrom", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">New To</Label>
                <Input type="date" value={formData.newTo} onChange={(e) => handleChange("newTo", e.target.value)} className="h-[42px] text-[15px] rounded-sm border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500" />
              </div>
            </div>
          </FleetCard>

          <FleetCard openSections={openSections} toggleSection={toggleSection} title="Linked Products" section="linked">
             <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Up-Sells</Label>
                <TokenInput value={upSells} onChange={setUpSells} />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Cross-Sells</Label>
                <TokenInput value={crossSells} onChange={setCrossSells} />
              </div>
              <div className="space-y-2">
                <Label className="text-[15px] font-normal text-slate-700">Related Products</Label>
                <TokenInput value={relatedProducts} onChange={setRelatedProducts} />
              </div>
            </div>
          </FleetCard>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-slate-200 p-4 px-8 flex justify-end gap-4 z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.03)]">
        <Button type="button" variant="outline" className="h-[42px] px-8 text-[14px] font-medium border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-sm shadow-sm" disabled={saving} onClick={() => handleSave(false)}>
          SAVE
        </Button>
        <Button type="button" className="h-[42px] px-8 bg-[#0052cc] hover:bg-[#0047b3] text-white text-[14px] font-medium rounded-sm shadow-sm" disabled={saving} onClick={() => handleSave(true)}>
          {saving ? "SAVING..." : "SAVE & EXIT"}
        </Button>
      </div>
    </div>
  );
}
