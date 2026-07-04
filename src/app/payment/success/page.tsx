"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { CheckCircle, ArrowRight, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const order = searchParams.get("order");
  const method = searchParams.get("method");

  useEffect(() => {
    if (!order) {
      router.replace("/");
    }
  }, [order, router]);

  if (!order) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-9 w-9 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Payment Successful!</h1>
            <p className="text-muted-foreground text-sm mb-2">
              পেমেন্ট সফলভাবে সম্পন্ন হয়েছে
            </p>
            {order && (
              <p className="text-sm text-muted-foreground mb-1">
                Order ID: <span className="font-medium text-foreground">{order}</span>
              </p>
            )}
            {method && (
              <p className="text-xs text-muted-foreground mb-6">
                via {method.charAt(0).toUpperCase() + method.slice(1)}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-6">
              আপনার অর্ডার কনফার্ম করা হয়েছে। শীঘ্রই আমরা যোগাযোগ করব।
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => router.push("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  router.push("/profile");
                }}
              >
                View Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
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