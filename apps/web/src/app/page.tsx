import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import HomeClient from "@/components/epf/HomeClient";
import AnnouncementBar from "@/components/epf/AnnouncementBar";
import HeroBanner from "@/components/epf/HeroBanner";
import CategoryGrid from "@/components/epf/CategoryGrid";
import FlashDeals from "@/components/epf/FlashDeals";
import ShopSection from "@/components/epf/ShopSection";
import ServicesSection from "@/components/epf/ServicesSection";
import WhyChooseUs from "@/components/epf/WhyChooseUs";
import Testimonials from "@/components/epf/Testimonials";
import BrandStrip from "@/components/epf/BrandStrip";
import CtaBand from "@/components/epf/CtaBand";

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
      <main className="bg-[#F8FAFC]">
        <HeroBanner />
        <CategoryGrid />
        <FlashDeals />
        <ShopSection />
        <ServicesSection />
        <WhyChooseUs />
        <Testimonials />
        <div className="bg-white border-y border-slate-200/70">
          <BrandStrip />
        </div>
        <CtaBand />
      </main>
      <Footer />
      <HomeClient />
    </>
  );
}
