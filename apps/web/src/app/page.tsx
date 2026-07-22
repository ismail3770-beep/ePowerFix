import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import HomeClient from "@/components/epf/HomeClient";
import AnnouncementBar from "@/components/epf/AnnouncementBar";
import HeroBanner from "@/components/epf/HeroBanner";
import TrustBar from "@/components/epf/TrustBar";
import CategoryGrid from "@/components/epf/CategoryGrid";
import FlashDeals from "@/components/epf/FlashDeals";
import ShopSection from "@/components/epf/ShopSection";
import BestDeals from "@/components/epf/BestDeals";
import ServicesSection from "@/components/epf/ServicesSection";
import ServicesBanner from "@/components/epf/ServicesBanner";
import BrandStrip from "@/components/epf/BrandStrip";
import ProjectsSection from "@/components/epf/ProjectsSection";
import RecentlyViewed from "@/components/epf/RecentlyViewed";

export default function HomePage() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main aria-label="Homepage">
        <HeroBanner />
        <TrustBar />
        <CategoryGrid />
        <FlashDeals />
        <ShopSection />
        <BestDeals />
        <ServicesSection />
        <ServicesBanner />
        <BrandStrip />
        <ProjectsSection />
        <RecentlyViewed />
      </main>
      <Footer />
      <HomeClient />
    </>
  );
}
