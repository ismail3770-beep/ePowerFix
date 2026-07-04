import Link from "next/link";
import { Home } from "lucide-react";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";
import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[120px] sm:text-[160px] font-extrabold text-[#E2E8F0] leading-none select-none">
            404
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] -mt-8 mb-3">
            Page Not Found
          </h1>
          <p className="text-[15px] text-[#6B7280] mb-8 max-w-md mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-6 bg-[#111827] hover:bg-[#0EA5E9] text-white text-[14px] font-semibold rounded-[4px] transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <CheckoutDialog />
      <ProductDetailDialog />
      <ServiceBookingDialog />
      <ProjectDetailDialog />
      <ChatWidget />
    </>
  );
}