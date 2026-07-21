"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Home, RotateCcw, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const order = searchParams.get("order");
  const method = searchParams.get("method");
  const state = searchParams.get("state");
  const isPending = state === "pending";
  const needsReview = state === "review";

  const retryPayment = () => {
    if (!order) {
      router.push("/checkout");
      return;
    }
    const query = new URLSearchParams({ order });
    if (method) {query.set("method", method);}
    router.push(`/checkout?${query.toString()}`);
  };

  const icon = isPending || needsReview
    ? <AlertCircle className="h-9 w-9 text-amber-600" />
    : <XCircle className="h-9 w-9 text-red-600" />;
  const iconClass = isPending || needsReview ? "bg-amber-100" : "bg-red-100";
  const title = needsReview
    ? "Payment Needs Review"
    : isPending
      ? "Payment Is Being Confirmed"
      : "Payment Failed";
  const message = needsReview
    ? "The gateway reported a payment after the order reservation changed. Our team will review it before any fulfillment occurs."
    : isPending
      ? "We could not verify the payment result yet. Do not place a duplicate order; retrying uses the same pending order when it is still active."
      : "Your payment could not be completed. Your cart has been kept so you can retry safely.";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>
              {icon}
            </div>
            <h1 className="text-2xl font-bold mb-1">{title}</h1>
            <p className="text-muted-foreground text-sm mb-2">
              {needsReview ? "পেমেন্ট যাচাই করা হচ্ছে" : isPending ? "পেমেন্ট নিশ্চিত করা হচ্ছে" : "পেমেন্ট ব্যর্থ হয়েছে"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            {order && (
              <p className="text-xs text-muted-foreground mb-6 break-all">
                Order reference: <span className="font-medium text-foreground">{order}</span>
              </p>
            )}
            <div className="flex flex-col gap-2">
              {!needsReview && (
                <Button className="w-full" onClick={retryPayment}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isPending ? "Check / Retry Payment" : "Try Payment Again"}
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <PaymentFailContent />
    </Suspense>
  );
}
