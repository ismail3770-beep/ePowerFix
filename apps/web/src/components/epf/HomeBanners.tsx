"use client";

import Link from "next/link";

/**
 * FleetCart promotional banner rows — mirrors three_column_banner.blade.php,
 * two_column_banner.blade.php and three_column_full_width_banner.blade.php.
 * Simple responsive image banners with hover zoom, 8px radius.
 */

function BannerImg({ href, src, alt }: { href: string; src: string; alt: string }) {
  return (
    <Link href={href} className="block overflow-hidden rounded-[8px] bg-[rgba(0,0,0,0.04)] group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </Link>
  );
}

export function ThreeColumnBanners() {
  const banners = [
    { href: "/shop", src: "https://placehold.co/460x220/e0f2fe/0068e1?text=Breakers", alt: "Breakers" },
    { href: "/deals", src: "https://placehold.co/460x220/fef3c7/b45309?text=Lighting+Deals", alt: "Lighting" },
    { href: "/services", src: "https://placehold.co/460x220/dcfce7/15803d?text=Solar", alt: "Solar" },
  ];
  return (
    <section className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {banners.map((b) => (
            <BannerImg key={b.alt} {...b} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function TwoColumnBanners() {
  const banners = [
    { href: "/shop", src: "https://placehold.co/700x240/ede9fe/6d28d9?text=Smart+Switches", alt: "Smart Switches" },
    { href: "/deals", src: "https://placehold.co/700x240/ffe4e6/be123c?text=Cable+Offers", alt: "Cable Offers" },
  ];
  return (
    <section className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {banners.map((b) => (
            <BannerImg key={b.alt} {...b} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function OneColumnBanner() {
  return (
    <section className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <BannerImg
          href="/deals"
          src="https://placehold.co/1400x260/0068e1/ffffff?text=Mega+Electrical+Sale+%E2%80%94+Up+to+50%25+Off"
          alt="Mega Sale"
        />
      </div>
    </section>
  );
}
