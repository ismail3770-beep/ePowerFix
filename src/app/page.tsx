import type { Metadata } from "next";
import AnnouncementBar from "@/components/epf/AnnouncementBar";
import Header from "@/components/epf/Header";
import HeroBanner from "@/components/epf/HeroBanner";
import BrandStrip from "@/components/epf/BrandStrip";
import BestDeals from "@/components/epf/BestDeals";
import ServicesSection from "@/components/epf/ServicesSection";
import ShopSection from "@/components/epf/ShopSection";
import ProjectsSection from "@/components/epf/ProjectsSection";
import TrustBar from "@/components/epf/TrustBar";
import RecentlyViewed from "@/components/epf/RecentlyViewed";
import NewsletterBanner from "@/components/epf/NewsletterBanner";
import Footer from "@/components/epf/Footer";
import HomeClient from "@/components/epf/HomeClient";
import FadeIn from "@/components/epf/FadeIn";

export const metadata: Metadata = {
  title: "ePowerFix — Trusted Electrical Solutions in Bangladesh",
  description:
    "Professional electrical wiring, solar installation, industrial automation, and safety equipment. Shop quality electrical products with expert service across Dhaka, Bangladesh.",
  keywords: [
    "electrical services Bangladesh",
    "solar panel installation Dhaka",
    "home wiring",
    "industrial automation",
    "electrical products online",
    "ePowerFix",
  ],
  openGraph: {
    title: "ePowerFix — Trusted Electrical Solutions in Bangladesh",
    description:
      "Professional electrical wiring, solar installation, industrial automation, and safety equipment.",
    type: "website",
    locale: "en_BD",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <BrandStrip />
        <FadeIn delay={0.1}><BestDeals /></FadeIn>
        <FadeIn delay={0.15}><ServicesSection /></FadeIn>
        <FadeIn delay={0.2}><ShopSection /></FadeIn>
        <FadeIn delay={0.25}><ProjectsSection /></FadeIn>
        <TrustBar />
        <RecentlyViewed />
        <FadeIn delay={0.35}><NewsletterBanner /></FadeIn>
      </main>
      <Footer />
      <HomeClient />
    </div>
  );
}