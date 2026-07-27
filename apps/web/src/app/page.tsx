import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import HomeClient from "@/components/epf/HomeClient";
import AnnouncementBar from "@/components/epf/AnnouncementBar";
import HeroBanner from "@/components/epf/HeroBanner";
import HomeFeatures from "@/components/epf/HomeFeatures";
import FeaturedCategories from "@/components/epf/FeaturedCategories";
import TopBrands from "@/components/epf/TopBrands";
import ServicesSection from "@/components/epf/ServicesSection";
import ProjectsSection from "@/components/epf/ProjectsSection";
import { ThreeColumnBanners, TwoColumnBanners, OneColumnBanner } from "@/components/epf/HomeBanners";
import HomeBlog from "@/components/epf/HomeBlog";

export const metadata = {
  title: "ePowerFix — বাংলাদেশের #১ ইলেকট্রিক্যাল মার্কেটপ্লেস",
  description:
    "১০,০০০+ অরিজিনাল ইলেকট্রিক্যাল প্রোডাক্ট | এক্সপার্ট সার্ভিস | সারাদেশে ফ্রি ডেলিভারি",
};

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      {/*
        Home body flow — designed to build trust then convert:
        1. Hero (impact)  2. Features (trust)  3. Categories (browse)
        4. Promo banner   5. Flash sale (urgency)  6. Services (what we do)
        7. Product tabs   8. Brands (credibility)  9. Promo banners
        10. Projects (proof)  11. Project kits (bundles)  12. Blog (engage) — last.
        Header & Footer intentionally untouched.
      */}
      <main className="bg-white pb-2">
        <HeroBanner />
        <HomeFeatures />
        <FeaturedCategories />
        <ThreeColumnBanners />
        <ServicesSection />
        <TopBrands />
        <OneColumnBanner />
        <ProjectsSection />
        <TwoColumnBanners />
        <HomeBlog />
      </main>
      <Footer />
      <HomeClient />
    </>
  );
}
