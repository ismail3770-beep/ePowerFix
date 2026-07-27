"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

/**
 * FleetCart blog section — mirrors blog.blade.php: a section title with
 * underline + "view all" link, and a row of blog post cards (image, date,
 * title, excerpt).
 */

const posts = [
  {
    id: "1",
    title: "বাসার ওয়্যারিং-এ যে ৫টি ভুল এড়িয়ে চলবেন",
    excerpt: "নিরাপদ বৈদ্যুতিক সংযোগের জন্য সাধারণ কিন্তু বিপজ্জনক ভুলগুলো জেনে নিন।",
    date: "১৫ জুলাই, ২০২৬",
    image: "https://placehold.co/400x220/e0f2fe/0068e1?text=Wiring+Tips",
  },
  {
    id: "2",
    title: "সোলার প্যানেল কেনার আগে যা জানা জরুরি",
    excerpt: "সঠিক ক্ষমতা, ব্র্যান্ড ও ইনস্টলেশন খরচ সম্পর্কে বিস্তারিত গাইড।",
    date: "১০ জুলাই, ২০২৬",
    image: "https://placehold.co/400x220/ffedd5/ea580c?text=Solar+Guide",
  },
  {
    id: "3",
    title: "MCB বনাম RCCB — পার্থক্য ও প্রয়োজনীয়তা",
    excerpt: "আপনার সার্কিট সুরক্ষায় কোনটি কখন ব্যবহার করবেন তা বুঝে নিন।",
    date: "৫ জুলাই, ২০২৬",
    image: "https://placehold.co/400x220/dcfce7/15803d?text=MCB+vs+RCCB",
  },
];

export default function HomeBlog() {
  return (
    <section className="ff bg-white mt-[50px] pb-[60px]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="ff-section-title !text-[20px]">Blog & Tips</h3>
          <Link href="/blog" className="inline-flex items-center gap-1 text-[14px] text-[#0068e1] hover:underline">
            সব দেখুন <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.id}`}
              className="group block bg-white border border-[#e8e7eb] rounded-[8px] overflow-hidden hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow"
            >
              <div className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-[200px] object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-[12px] text-[#a6a6a6]">
                  <CalendarDays className="w-3.5 h-3.5" /> {p.date}
                </div>
                <h4 className="mt-2 text-[16px] font-medium text-[#191919] leading-snug line-clamp-2 group-hover:text-[#0068e1] transition-colors">
                  {p.title}
                </h4>
                <p className="mt-2 text-[14px] text-[#6e6e6e] leading-6 line-clamp-2">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
