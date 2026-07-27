"use client";

import { Zap, Lightbulb, Power, Cable, Sun, Fan } from "lucide-react";

/**
 * FleetCart featured-categories section — mirrors featured_categories.blade.php
 * + _featured-categories.scss: a header (title + excerpt) on the left, category
 * tabs (150x160 bordered image cards) on the right, and a product slider below
 * that swaps products by active tab.
 */

type Cat = {
  name: string;
  image: string;
};

const categories: Cat[] = [
  { name: "সার্কিট ব্রেকার", image: "https://placehold.co/145x145/e0f2fe/0068e1?text=MCB" },
  { name: "লাইটিং", image: "https://placehold.co/145x145/fef9c3/b45309?text=LED" },
  { name: "কেবল ও তার", image: "https://placehold.co/145x145/dbeafe/1d4ed8?text=Cable" },
  { name: "সোলার", image: "https://placehold.co/145x145/ffedd5/ea580c?text=Solar" },
  { name: "ফ্যান", image: "https://placehold.co/145x145/cffafe/0891b2?text=Fan" },
  { name: "টুলস", image: "https://placehold.co/145x145/e2e8f0/475569?text=Tools" },
];

export default function FeaturedCategories() {
  return (
    <section className="ff bg-white mt-[50px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        {/* Header: text + tabs */}
        <div className="flex flex-col xl:flex-row xl:items-start gap-6">
          <div className="xl:pr-8 xl:w-[650px] max-w-full xl:text-left text-center">
            <h2 className="text-[28px] leading-[36px] font-normal text-[#191919]">
              টপ ক্যাটাগরি — সবচেয়ে বেশি বিক্রি
            </h2>
            <span className="block mt-2.5 text-[15px] leading-6 font-light text-[#6e6e6e]">
              গত মাসে এই ক্যাটাগরিগুলো থেকে ১৫০০+ প্রোডাক্ট বিক্রি হয়েছে। পছন্দের প্রোডাক্ট বেছে নিন
              সেরা দামে।
            </span>
          </div>

          <ul className="flex flex-wrap justify-center xl:justify-end gap-3 xl:gap-5 xl:ml-auto p-0 m-0 list-none">
            {categories.map((cat) => (
              <li
                key={cat.name}
                className="ff-tab-item flex flex-col items-center justify-center text-center p-2.5 h-[120px] w-[110px] sm:h-[150px] sm:w-[150px] overflow-hidden cursor-pointer"
              >
                <div className="relative w-full pb-[50%] mb-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-full max-w-full"
                  />
                </div>
                <span className="block text-[13px] sm:text-[14px] text-[#191919] max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {cat.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
