import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import HomeClient from "@/components/epf/HomeClient";
import AnnouncementBar from "@/components/epf/AnnouncementBar";
import HeroBanner from "@/components/epf/HeroBanner";
import HomeFeatures from "@/components/epf/HomeFeatures";
import FeaturedCategories from "@/components/epf/FeaturedCategories";
import TopBrands from "@/components/epf/TopBrands";
import ServicesSection from "@/components/epf/ServicesSection";
import ShopSection from "@/components/epf/ShopSection";
import ProjectsSection from "@/components/epf/ProjectsSection";
import ProjectKitsSection from "@/components/epf/ProjectKitsSection";
import { ThreeColumnBanners, TwoColumnBanners, OneColumnBanner } from "@/components/epf/HomeBanners";
import HomeBlog from "@/components/epf/HomeBlog";
import { getStorefrontSettings } from "@/lib/storefront-settings";

export const metadata = {
  title: "ePowerFix — বাংলাদেশের #১ ইলেকট্রিক্যাল মার্কেটপ্লেস",
  description:
    "১০,০০০+ অরিজিনাল ইলেকট্রিক্যাল প্রোডাক্ট | এক্সপার্ট সার্ভিস | সারাদেশে ফ্রি ডেলিভারি",
};

export default async function HomePage() {
  const settings = await getStorefrontSettings();
  
  // Optional: check feature toggles if they exist in settings, e.g.
  // const showFeatures = settings?.features?.status !== false;

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
        {settings?.['slider-banners']?.status !== false && <HeroBanner />}
        {settings?.features?.status !== false && <HomeFeatures />}
        {settings?.['featured-categories']?.status !== false && <FeaturedCategories />}
        {settings?.['three-column-banners']?.status !== false && <ThreeColumnBanners />}
        {/* Services / Projects might not have standard storefront toggles, render anyway */}
        <ServicesSection />
        <ShopSection />
        {settings?.['top-brands']?.status !== false && <TopBrands />}
        {settings?.['one-column-banner']?.status !== false && <OneColumnBanner />}
        <ProjectsSection />
        <ProjectKitsSection />
        {settings?.['two-column-banners']?.status !== false && <TwoColumnBanners />}
        {settings?.blogs?.status !== false && <HomeBlog />}
      </main>
      <Footer />
      <HomeClient />
    </>
  );
}
