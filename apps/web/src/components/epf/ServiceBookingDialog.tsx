"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUIStore } from "@/store";

interface Service {
  id: string;
  name: string;
  nameBn: string;
  basePrice: number;
  priceUnit: string;
  priceLabel: string;
}

const areas = [
  "Mirpur", "Dhanmondi", "Gulshan", "Banani", "Uttara", "Mohammadpur",
  "Rampura", "Badda", "Bashundhara", "Wari", "Motijheel", "Tejgaon",
  "Mohakhali", "Cantonment", "Banani DOHS", "Baridhara DOHS",
];

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM",
];

export default function ServiceBookingDialog() {
  const { serviceBookingOpen, setServiceBookingOpen, bookingServiceId, setBookingServiceId } = useUIStore();
  const [service, setService] = useState<Service | null>(null);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    address: "Dhaka",
    area: "",
    preferredDate: "",
    preferredTime: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch service details
  useEffect(() => {
    if (!bookingServiceId || !serviceBookingOpen) return;
    fetch(`/api/services?category=all`)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.services || []).find((s: Service) => s.id === bookingServiceId);
        if (found) setService(found);
      })
      .catch(() => {});
  }, [bookingServiceId, serviceBookingOpen]);

  const mutation = useMutation({
    mutationFn: async (body: Record<string, string>) => {
      const res = await fetch("/api/services/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Booking failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("বুকিং সফল হয়েছে!", { description: "আমরা শীঘ্রই যোগাযোগ করব।" });
      handleClose();
    },
    onError: (err: Error) => {
      toast.error("বুকিং ব্যর্থ", { description: err.message });
    },
  });

  const handleClose = () => {
    setServiceBookingOpen(false);
    setBookingServiceId(null);
    setService(null);
    setForm({ customerName: "", customerPhone: "", customerEmail: "", address: "Dhaka", area: "", preferredDate: "", preferredTime: "", description: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.area) {
      toast.error("অনুগ্রহ করে প্রয়োজনীয় তথ্য দিন", { description: "Name, Phone এবং Area আবশ্যক।" });
      return;
    }
    const phone = form.customerPhone.startsWith("+880") ? form.customerPhone : `+880${form.customerPhone.replace(/^0/, "")}`;
    mutation.mutate({
      serviceId: bookingServiceId || "",
      phone,
      bookingDate: form.preferredDate,
      bookingTime: form.preferredTime,
      address: `${form.address}, ${form.area}`,
      notes: form.description ?? '',
    });
  };

  return (
    <Dialog open={serviceBookingOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>সার্ভিস বুকিং করুন</DialogTitle>
          <DialogDescription>তথ্য দিন, আমরা দ্রুত যোগাযোগ করব।</DialogDescription>
        </DialogHeader>

        {service && (
          <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 mb-4">
            <p className="font-semibold text-sm">{service.name}</p>
            {service.nameBn && <p className="text-xs text-muted-foreground">{service.nameBn}</p>}
            <p className="text-primary font-bold text-sm mt-1">৳{(service.basePrice ?? 0).toLocaleString()}{service.priceUnit ? `/${service.priceUnit}` : ""}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="b-name">Name / নাম <span className="text-destructive">*</span></Label>
            <Input id="b-name" placeholder="আপনার নাম লিখুন" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-phone">Phone / ফোন <span className="text-destructive">*</span></Label>
            <Input id="b-phone" type="tel" placeholder="01XXXXXXXXX" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-email">Email (optional)</Label>
            <Input id="b-email" type="email" placeholder="email@example.com" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-address">Address / ঠিকানা</Label>
            <Input id="b-address" placeholder="বাড়ি নং, রোড নং" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Area / এলাকা <span className="text-destructive">*</span></Label>
            <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
              <SelectTrigger className="w-full"><SelectValue placeholder="এলাকা নির্বাচন করুন" /></SelectTrigger>
              <SelectContent>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-date">Date / তারিখ</Label>
              <Input id="b-date" type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <Label>Time / সময়</Label>
              <Select value={form.preferredTime} onValueChange={(v) => setForm({ ...form, preferredTime: v })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="সময় নির্বাচন" /></SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-desc">Description / বিবরণ</Label>
            <Textarea id="b-desc" placeholder="আপনার সমস্যা বা প্রয়োজনীয়তা বিস্তারিত লিখুন..." rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Submitting..." : "বুকিং কনফার্ম করুন"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}