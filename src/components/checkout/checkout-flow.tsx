"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  Truck,
  CreditCard,
  Building2,
  PackageCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export interface CheckoutFlowProps {
  session: {
    id: string;
    subtotal: number;
    shippingAmount: number;
    totalAmount: number;
    expiresAt: string;
    cart: {
      items: Array<{
        id: string;
        productId: string;
        quantity: number;
        product: {
          id: string;
          title: string;
          pricePerUnit: number;
          unit: string;
          sellerId: string;
          seller: { fullName: string };
        };
      }>;
    };
  };
  defaultAddress?: {
    villageOrStreet?: string;
    cityOrTown?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  buyerFullName: string;
  buyerPhone?: string | null;
}

export function CheckoutFlow({
  session,
  defaultAddress,
  buyerFullName,
  buyerPhone,
}: CheckoutFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 15-Minute Countdown Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(900); // 15 mins default

  useEffect(() => {
    const target = new Date(session.expiresAt).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setTimeLeftSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.expiresAt]);

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;

  const [shippingAddress, setShippingAddress] = useState({
    recipientName: buyerFullName || "",
    recipientPhone: buyerPhone || "+919876543210",
    villageOrStreet: defaultAddress?.villageOrStreet || "Commercial Hub Sector 5",
    cityOrTown: defaultAddress?.cityOrTown || "Kolkata",
    district: defaultAddress?.district || "Kolkata",
    state: defaultAddress?.state || "West Bengal",
    pincode: defaultAddress?.pincode || "700001",
  });

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "BANK_TRANSFER" | "RAZORPAY">("COD");
  const [isOnlinePaymentEnabled, setIsOnlinePaymentEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/payments/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.enabled) {
          setIsOnlinePaymentEnabled(true);
        }
      })
      .catch((err) => {
        console.warn("Failed to load payment config:", err);
      });
  }, []);

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const updateAddress = (field: string, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceOrder = async () => {
    if (timeLeftSeconds <= 0) {
      setErrorMessage("Checkout session has expired. Please return to cart and retry.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Online Payment via Razorpay
    if (paymentMethod === "RAZORPAY") {
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !(window as any).Razorpay) {
          throw new Error("Unable to load Razorpay checkout script. Please check your network connection or try COD/Bank Transfer.");
        }

        const orderRes = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkoutSessionId: session.id,
            shippingAddress,
          }),
        });

        const orderJson = await orderRes.json();
        if (!orderRes.ok || !orderJson.success) {
          throw new Error(orderJson.message || "Failed to initiate online payment");
        }

        const { razorpayOrderId, amount, currency, keyId, orderGroupId, orderNumber } = orderJson.data;

        const options = {
          key: keyId,
          amount,
          currency: currency || "INR",
          name: "EcoFarm Wholesale",
          description: `Order #${orderNumber}`,
          order_id: razorpayOrderId,
          prefill: {
            name: shippingAddress.recipientName || buyerFullName,
            contact: shippingAddress.recipientPhone || buyerPhone || "",
          },
          theme: {
            color: "#16a34a",
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              setErrorMessage("Payment was cancelled or dismissed. Your order has not been confirmed. You may retry payment when ready.");
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              setIsLoading(true);
              setErrorMessage(null);
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderGroupId,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });

              const verifyJson = await verifyRes.json();
              if (!verifyRes.ok || !verifyJson.success) {
                throw new Error(verifyJson.message || "Payment verification failed. Please contact support.");
              }

              router.push(`/checkout/success?orderNumber=${verifyJson.data?.orderNumber || orderNumber}`);
            } catch (err: any) {
              setErrorMessage(err.message || "Failed to verify online payment");
              setIsLoading(false);
            }
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (failedRes: any) => {
          setIsLoading(false);
          setErrorMessage(
            failedRes.error?.description || "Payment failed or was declined by your bank. Please retry payment or use COD."
          );
        });
        rzp.open();
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred during payment");
        setIsLoading(false);
      }
      return;
    }

    // COD and BANK_TRANSFER flow (Unchanged)
    try {
      const payload = {
        checkoutSessionId: session.id,
        paymentMethod,
        shippingAddress,
      };

      const res = await fetch(`/api/checkout/${session.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to place order");
      }

      router.push(`/checkout/success?orderNumber=${json.data.orderNumber}`);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-body text-left">
      {/* 15-Minute Reservation Banner */}
      <div className="flex items-center justify-between p-3.5 bg-brand-primary/10 border border-brand-primary/20 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-brand-primary font-semibold">
          <Clock className="h-4 w-4 animate-pulse shrink-0" />
          <span>Inventory reserved exclusively for this checkout session.</span>
        </div>
        <span className="font-mono text-sm font-bold text-brand-primary">
          {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
        </span>
      </div>

      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b border-surface-dim pb-4">
        {[
          { num: 1, title: "1. Delivery Facility" },
          { num: 2, title: "2. Payment Selection" },
          { num: 3, title: "3. Final Review & Place Order" },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-2 cursor-pointer ${step === s.num ? "text-brand-primary font-bold" : "text-slate-neutral"}`}
            onClick={() => setStep(s.num as any)}
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === s.num ? "bg-brand-primary text-white" : "bg-surface-low border border-surface-dim"
              }`}
            >
              {s.num}
            </div>
            <span className="text-xs font-heading hidden sm:inline">{s.title}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="border border-surface-dim bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 1: Delivery & Warehouse Destination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Recipient Name / Warehouse Manager" required>
                <Input
                  value={shippingAddress.recipientName}
                  onChange={(e) => updateAddress("recipientName", e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Contact Phone for Dispatch Logistics" required>
                <Input
                  value={shippingAddress.recipientPhone}
                  onChange={(e) => updateAddress("recipientPhone", e.target.value)}
                  required
                />
              </FormField>
            </div>

            <FormField label="Facility Street Address / Industrial Plot" required>
              <Input
                value={shippingAddress.villageOrStreet}
                onChange={(e) => updateAddress("villageOrStreet", e.target.value)}
                required
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="City / Town" required>
                <Input
                  value={shippingAddress.cityOrTown}
                  onChange={(e) => updateAddress("cityOrTown", e.target.value)}
                  required
                />
              </FormField>

              <FormField label="District" required>
                <Input
                  value={shippingAddress.district}
                  onChange={(e) => updateAddress("district", e.target.value)}
                  required
                />
              </FormField>

              <FormField label="State" required>
                <Input
                  value={shippingAddress.state}
                  onChange={(e) => updateAddress("state", e.target.value)}
                  required
                />
              </FormField>
            </div>

            <FormField label="6-Digit PIN Code" required>
              <Input
                value={shippingAddress.pincode}
                onChange={(e) => updateAddress("pincode", e.target.value)}
                required
              />
            </FormField>

            <div className="flex justify-end pt-4 border-t border-surface-dim">
              <Button
                variant="primary"
                onClick={() => setStep(2)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border border-surface-dim bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 2: Settlement & Payment Option</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === "COD"
                    ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
                    : "border-surface-dim bg-white hover:bg-surface-low"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-heading font-bold text-sm text-on-surface">
                      Cash on Delivery / Warehouse Unloading (COD)
                    </span>
                    <Badge variant="success" size="sm" className="ml-2">Recommended</Badge>
                  </div>
                  {paymentMethod === "COD" && <CheckCircle2 className="h-4 w-4 text-brand-primary" />}
                </div>
                <p className="text-xs text-slate-neutral mt-1">
                  Inspect harvest lots upon weighbridge delivery. Payment status remains PENDING until shipment is verified at destination.
                </p>
              </div>

              {/* Bank Transfer / Escrow */}
              <div
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === "BANK_TRANSFER"
                    ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
                    : "border-surface-dim bg-white hover:bg-surface-low"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-on-surface">
                    RTGS / Direct Bank Transfer to Escrow
                  </span>
                  {paymentMethod === "BANK_TRANSFER" && <CheckCircle2 className="h-4 w-4 text-brand-primary" />}
                </div>
                <p className="text-xs text-slate-neutral mt-1">
                  Direct inter-bank settlement. Funds held in verified platform escrow until dispatch confirmation.
                </p>
              </div>

              {/* Online Payment (Razorpay) */}
              {isOnlinePaymentEnabled ? (
                <div
                  onClick={() => setPaymentMethod("RAZORPAY")}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    paymentMethod === "RAZORPAY"
                      ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary"
                      : "border-surface-dim bg-white hover:bg-surface-low"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-brand-primary" />
                      <span className="font-heading font-bold text-sm text-on-surface">
                        Online Payment (UPI, Cards, Netbanking)
                      </span>
                      <Badge variant="success" size="sm">Instant & Secure</Badge>
                    </div>
                    {paymentMethod === "RAZORPAY" && <CheckCircle2 className="h-4 w-4 text-brand-primary" />}
                  </div>
                  <p className="text-xs text-slate-neutral mt-1">
                    Powered by Razorpay. Fast, 100% encrypted wholesale settlement with immediate payment confirmation.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 opacity-75 cursor-not-allowed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-slate-neutral" />
                      <span className="font-heading font-bold text-sm text-slate-neutral">
                        Online Gateway (UPI, Cards & Netbanking)
                      </span>
                    </div>
                    <Badge variant="secondary" size="sm">Unavailable</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Online payment gateway is temporarily unavailable. Please proceed with Cash on Delivery or Bank Transfer.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-surface-dim">
              <Button variant="outline" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                Back: Destination
              </Button>
              <Button variant="primary" onClick={() => setStep(3)} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Review Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border border-surface-dim bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Step 3: Review Multi-Vendor Order & Confirm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-surface-low rounded-lg border border-surface-dim space-y-2 text-xs">
              <div className="font-heading font-bold text-on-surface">Delivery Address Snapshot:</div>
              <p className="text-slate-neutral leading-relaxed">
                {shippingAddress.recipientName} ({shippingAddress.recipientPhone})<br />
                {shippingAddress.villageOrStreet}, {shippingAddress.cityOrTown}, {shippingAddress.district}, {shippingAddress.state} - {shippingAddress.pincode}
              </p>
            </div>

            <div className="p-3 bg-surface-low rounded-lg border border-surface-dim flex items-center justify-between text-xs">
              <span className="font-heading font-bold text-on-surface">Payment Method:</span>
              <span className="font-medium text-brand-primary">
                {paymentMethod === "RAZORPAY"
                  ? "Online Payment (Razorpay)"
                  : paymentMethod === "BANK_TRANSFER"
                  ? "RTGS / Direct Bank Transfer"
                  : "Cash on Delivery (COD)"}
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-neutral">
                Order Items ({session.cart.items.length} lots)
              </span>
              <div className="divide-y divide-surface-dim border border-surface-dim rounded-lg overflow-hidden">
                {session.cart.items.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between text-xs bg-white">
                    <div>
                      <span className="font-bold text-on-surface block">{it.product.title}</span>
                      <span className="text-slate-neutral">Producer: {it.product.seller.fullName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-brand-primary block">
                        {formatCurrency(it.product.pricePerUnit * it.quantity)}
                      </span>
                      <span className="text-slate-neutral">{it.quantity} {it.product.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-surface-low rounded-lg space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-neutral">Subtotal:</span>
                <span className="font-mono font-bold text-on-surface">{formatCurrency(session.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-neutral">Multi-Vendor Freight:</span>
                <span className="font-mono font-bold text-on-surface">{formatCurrency(session.shippingAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-surface-dim text-sm">
                <span className="font-heading font-bold text-on-surface">Total Settlement:</span>
                <span className="font-heading text-xl font-extrabold text-brand-primary">
                  {formatCurrency(session.totalAmount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-surface-dim">
              <Button variant="outline" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="h-4 w-4" />} disabled={isLoading}>
                Back: Payment
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handlePlaceOrder}
                isLoading={isLoading}
                rightIcon={
                  paymentMethod === "RAZORPAY" ? (
                    <CreditCard className="h-5 w-5" />
                  ) : (
                    <PackageCheck className="h-5 w-5" />
                  )
                }
              >
                {paymentMethod === "RAZORPAY"
                  ? `Pay ${formatCurrency(session.totalAmount)} & Confirm`
                  : "Place Multi-Vendor Order"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}