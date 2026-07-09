"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Facebook, Youtube, Instagram, Twitter, Phone, Mail, MapPin } from "lucide-react";
import { apiFetch } from "@/lib/api";
import FadeIn from "@/components/epf/FadeIn";

const infoLinks = [
  { label: "About Us", href: "/contact" },
  { label: "Delivery Information", href: "/contact" },
  { label: "Terms & Conditions", href: "/contact" },
  { label: "Help Center", href: "/contact" },
  { label: "Returns & Refunds", href: "/contact" },
];

const serviceLinks = [
  { label: "Home Wiring", href: "/services" },
  { label: "Industrial Setup", href: "/services" },
  { label: "Solar Panel", href: "/services" },
  { label: "Generator Service", href: "/services" },
  { label: "Inspection", href: "/services" },
];

const extrasLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Projects", href: "/projects" },
  { label: "Project Kits", href: "/project-kits" },
  { label: "Order Track", href: "/order-track" },
  { label: "Blog", href: "/blog" },
  { label: "Deals", href: "/deals" },
];

const accountLinks = [
  { label: "My Account", href: "/profile" },
  { label: "Order History", href: "/profile" },
  { label: "Wish List", href: "/wishlist" },
  { label: "Newsletter", href: "/" },
  { label: "Contact Us", href: "/contact" },
  { label: "Get a Quote", href: "/get-quote" },
];

interface SocialLinks {
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  youtubeUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  copyrightText?: string | null;
  siteName?: string;
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[15px] font-semibold text-white mb-4 pb-2.5 border-b border-white/10">
      {children}
    </h4>
  );
}

function FooterItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <a href={href} className="text-[14px] text-white/50 hover:text-epf-500 transition-colors duration-150 leading-relaxed">
        {children}
      </a>
    </li>
  );
}

export default function Footer() {
  const [settings, setSettings] = useState<SocialLinks>({});

  useEffect(() => {
    apiFetch<{ data: SocialLinks }>("/api/settings")
      .then((res) => setSettings(res.data || {}))
      .catch(() => {});
  }, []);

  const socials = [
    { icon: Facebook, label: "Facebook", url: settings.facebookUrl ?? undefined },
    { icon: Twitter, label: "Twitter", url: settings.twitterUrl ?? undefined },
    { icon: Instagram, label: "Instagram", url: settings.instagramUrl ?? undefined },
    { icon: Youtube, label: "YouTube", url: settings.youtubeUrl ?? undefined },
  ].filter((s) => s.url);

  return (
    <footer className="bg-[#111827] border-t border-white/5">
      <FadeIn>
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-10 lg:py-12">
          <div className="lg:grid lg:grid-cols-5 lg:gap-6">
            {/* Brand Column */}
            <div className="mb-8 lg:mb-0 lg:col-span-1">
              <Link href="/" className="flex flex-col shrink-0 mb-4">
                <span className="text-[30px] font-extrabold tracking-tight text-white leading-none">
                  e<span className="text-[#0EA5E9]">Power</span>Fix
                </span>
                <span className="text-[11px] text-white/40 font-semibold tracking-[0.2em] uppercase leading-none mt-1">ELECTRICAL MARKETPLACE</span>
              </Link>
              <p className="text-[14px] text-white/50 leading-relaxed mb-5 max-w-[260px]">
                Your trusted partner for professional electrical services, quality components and engineering project kits in Bangladesh.
              </p>
              <ul className="space-y-2 mb-5">
                {settings.address && (
                  <li className="flex items-center gap-2.5 text-[14px] text-white/50">
                    <MapPin className="h-4 w-4 text-[#0EA5E9]/70 shrink-0" />
                    <span>{settings.address}</span>
                  </li>
                )}
                {settings.phone && (
                  <li className="flex items-center gap-2.5 text-[14px] text-white/50">
                    <Phone className="h-4 w-4 text-[#0EA5E9]/70 shrink-0" />
                    <span>{settings.phone}</span>
                  </li>
                )}
                {settings.email && (
                  <li className="flex items-center gap-2.5 text-[14px] text-white/50">
                    <Mail className="h-4 w-4 text-[#0EA5E9]/70 shrink-0" />
                    <span>{settings.email}</span>
                  </li>
                )}
              </ul>
              {socials.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  {socials.map((s) => (
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="h-8 w-8 flex items-center justify-center rounded-full border border-white/10 hover:border-[#0EA5E9] hover:bg-[#0EA5E9] text-white/50 hover:text-white transition-colors"
                      aria-label={s.label}>
                      <s.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Link Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 px-2 md:px-0 lg:col-span-4">
              {/* Information */}
              <div>
                <FooterHeading>Information</FooterHeading>
                <ul className="space-y-2.5">{infoLinks.map((l) => <FooterItem key={l.label} href={l.href}>{l.label}</FooterItem>)}</ul>
              </div>

              {/* Customer Service */}
              <div>
                <FooterHeading>Customer Service</FooterHeading>
                <ul className="space-y-2.5">{serviceLinks.map((l) => <FooterItem key={l.label} href={l.href}>{l.label}</FooterItem>)}</ul>
              </div>

              {/* Extras */}
              <div>
                <FooterHeading>Extras</FooterHeading>
                <ul className="space-y-2.5">{extrasLinks.map((l) => <FooterItem key={l.label} href={l.href}>{l.label}</FooterItem>)}</ul>
              </div>

              {/* My Account */}
              <div>
                <FooterHeading>My Account</FooterHeading>
                <ul className="space-y-2.5">{accountLinks.map((l) => <FooterItem key={l.label} href={l.href}>{l.label}</FooterItem>)}</ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12 py-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-white/30">{settings.copyrightText || `© ${new Date().getFullYear()} ${settings.siteName || "ePowerFix"}. All rights reserved.`}</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] text-white/30">Safe Payments:</span>
              {/* VISA */}
              <span className="h-6 w-10 bg-white rounded flex items-center justify-center">
                <svg viewBox="0 0 48 32" className="h-4 w-auto"><rect width="48" height="32" rx="2" fill="#1A1F71"/><path d="M20.5 22.5l2.1-12.8h3.4l-2.1 12.8zM33.5 10c-.7-.3-1.7-.5-3-.5-3.3 0-5.7 1.7-5.7 4.2 0 1.8 1.6 2.9 2.9 3.5 1.3.6 1.7 1 1.7 1.6 0 .8-1 1.2-1.9 1.2-1.3 0-2-.2-3-.6l-.4-.2-.5 2.9c.8.4 2.3.7 3.9.7 3.5 0 5.8-1.7 5.8-4.3 0-1.5-.9-2.6-2.8-3.5-1.2-.6-1.9-1-1.9-1.6 0-.5.6-1.1 1.9-1.1 1 0 1.8.2 2.4.5l.3.1.5-2.9zM40.8 9.7h-2.6c-.8 0-1.4.2-1.8 1l-5 11.8h3.6l.7-1.9h4.4l.4 1.9h3.2l-2.9-12.8zm-4.3 8.3l1.4-3.8.8 3.8h-2.2zM17.2 9.7l-3.3 8.7-.4-2c-.6-2.1-2.6-4.3-4.8-5.5l3 11.6h3.6l5.4-12.8h-3.5z" fill="#fff"/><path d="M11.3 9.7H6.1l0 .2c4 1 6.7 3.5 7.8 6.5l-1.1-5.7c-.2-.8-.7-1-1.5-1z" fill="#F9A533"/></svg>
              </span>
              {/* Mastercard */}
              <span className="h-6 w-10 bg-white rounded flex items-center justify-center">
                <svg viewBox="0 0 48 32" className="h-4 w-auto"><rect width="48" height="32" rx="2" fill="#333"/><circle cx="20" cy="16" r="8" fill="#EB001B" opacity="0.9"/><circle cx="28" cy="16" r="8" fill="#F79E1B" opacity="0.9"/><path d="M24 9.7a8 8 0 010 12.6 8 8 0 000-12.6z" fill="#FF5F00" opacity="0.9"/></svg>
              </span>
              {/* bKash */}
              <span className="h-6 w-10 bg-[#E2136E] rounded flex items-center justify-center">
                <svg viewBox="0 0 48 32" className="h-4 w-auto"><rect width="48" height="32" rx="2" fill="#E2136E"/><text x="24" y="22" textAnchor="middle" fill="white" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="16">b</text></svg>
              </span>
              {/* Nagad */}
              <span className="h-6 w-10 bg-[#F6921E] rounded flex items-center justify-center">
                <svg viewBox="0 0 48 32" className="h-4 w-auto"><rect width="48" height="32" rx="2" fill="#F6921E"/><text x="24" y="22" textAnchor="middle" fill="white" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="15">N</text></svg>
              </span>
            </div>
          </div>
        </div>
      </FadeIn>
    </footer>
  );
}