"use client";

import CartDrawer from "@/components/epf/CartDrawer";
import CheckoutDialog from "@/components/epf/CheckoutDialog";
import ServiceBookingDialog from "@/components/epf/ServiceBookingDialog";
import ProductDetailDialog from "@/components/epf/ProductDetailDialog";
import ProjectDetailDialog from "@/components/epf/ProjectDetailDialog";
import ChatWidget from "@/components/epf/ChatWidget";
import NewsletterPopup from "@/components/epf/NewsletterPopup";
import BackToTopButton from "@/components/epf/BackToTopButton";

export default function HomeClient() {
  return (
    <>
      <CartDrawer />
      <CheckoutDialog />
      <ServiceBookingDialog />
      <ProductDetailDialog />
      <ProjectDetailDialog />
      <ChatWidget />
      <NewsletterPopup />
      <BackToTopButton />
    </>
  );
}