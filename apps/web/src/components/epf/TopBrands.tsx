"use client";

import Link from "next/link";

/**
 * FleetCart top-brands strip — mirrors top_brands.blade.php: a row of brand
 * logo tiles (bordered, centered logo) that scrolls horizontally.
 */

const brands = [
  "Schneider", "Siemens", "ABB", "Philips", "Havells", "Osram", "BRB", "Walton",
];

export default function TopBrands() {
  return (
    <section className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {brands.map((b) => (
            <Link
              key={b}
              href="/shop"
              className="flex items-center justify-center h-[80px] border border-[#e8e7eb] rounded-[8px] hover:border-[var(--ff-primary-a80)] transition-colors overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://placehold.co/140x50/ffffff/6e6e6e?text=${encodeURIComponent(b)}`}
                alt={b}
                loading="lazy"
                className="max-h-[50px] max-w-[80%] opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
