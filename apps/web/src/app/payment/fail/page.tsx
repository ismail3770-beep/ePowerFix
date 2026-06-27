"use client";

import { useRouter } from "next/navigation";
import { XCircle, RotateCcw, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/epf/Header";
import Footer from "@/components/epf/Footer";

export default function PaymentFailPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-9 w-9 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Payment Failed</h1>
            <p className="text-muted-foreground text-sm mb-2">
              পেমেন্ট ব্যর্থ হয়েছে
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              দুঃখিত, আপনার পেমেন্ট প্রসেস করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন বা ভিন্ন পেমেন্ট মেথড ব্যবহার করুন।
            </p>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => router.back()}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
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