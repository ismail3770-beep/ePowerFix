"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, ArrowRight, Home, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { useCartStore } from "@/store";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";

const PENDING_ONLINE_ORDER_KEY = "epowerfix-pending-online-order";

type PaymentStatusResponse = {
  data: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    reservationStatus: string;
  };
};

type VerificationState = "checking" | "paid" | "pending" | "error";

function clearPendingOnlineOrder(): void {
  try {
    window.sessionStorage.removeItem(PENDING_ONLINE_ORDER_KEY);
  } catch {
    // Cart confirmation remains correct even if session storage is unavailable.
  }
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const order = searchParams.get("order");
  const method = searchParams.get("method");
  const [verification, setVerification] = useState<VerificationState>("checking");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!order) {
      router.replace("/");
      return;
    }

    let active = true;
    apiFetch<PaymentStatusResponse>(`/api/orders/${encodeURIComponent(order)}/payment-status`)
      .then((response) => {
        if (!active) {return;}
        const payment = response.data;
        setOrderNumber(payment.orderNumber || payment.id);
        if (payment.paymentStatus === "PAID") {
          // The endpoint is authenticated and checks ownership server-side.
          // Only this verified branch clears the cart and pending retry marker.
          clearCart();
          clearPendingOnlineOrder();
          setVerification("paid");
          return;
        }
        setMessage("Your payment has not been confirmed yet. Your cart is still available.");
        setVerification("pending");
      })
      .catch(() => {
        if (!active) {return;}
        setMessage("We could not verify this payment for your account. Your cart has not been changed.");
        setVerification("error");
      });

    return () => { active = false; };
  }, [clearCart, order, router]);

  if (!order) {return null;}

  const retry = () => {
    const query = new URLSearchParams({ order });
    if (method) {query.set("method", method);}
    router.push(`/payment/fail?${query.toString()}&state=pending`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            {verification === "checking" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <Loader2 className="h-8 w-8 animate-spin text-epf-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Confirming Payment</h1>
                <p className="text-sm text-muted-foreground">Please wait while we verify the gateway result.</p>
              </>
            ) : verification === "paid" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-9 w-9 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">Payment Successful!</h1>
                <p className="text-muted-foreground text-sm mb-2">পেমেন্ট সফলভাবে সম্পন্ন হয়েছে</p>
                <p className="text-sm text-muted-foreground mb-1">
                  Order: <span className="font-medium text-foreground">{orderNumber || order}</span>
                </p>
                {method && (
                  <p className="text-xs text-muted-foreground mb-6">
                    via {method.charAt(0).toUpperCase() + method.slice(1)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mb-6">
                  আপনার অর্ডার কনফার্ম করা হয়েছে। শীঘ্রই আমরা যোগাযোগ করব।
                </p>
                <div className="flex flex-col gap-2">
                  <Button className="w-full" onClick={() => router.push("/")}>
                    <Home className="h-4 w-4 mr-2" />
                    Go to Home
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/profile")}>
                    View Orders
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-9 w-9 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Payment Not Confirmed</h1>
                <p className="text-sm text-muted-foreground mb-6">{message}</p>
                <div className="flex flex-col gap-2">
                  <Button className="w-full" onClick={retry}>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Check or Retry Payment
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.push("/checkout")}>
                    Return to Checkout
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
