"use client";
// app/sell/page.tsx

import { useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Usb, ScanLine, Keyboard } from "lucide-react";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import { apiGetProductByBarcode } from "@/lib/api";
import { useAddMultipleMovements } from "@/lib/queries";
import { useProductStore } from "@/store/app-store";
import { useCartStore } from "@/store/cart-store";
import { useBarcodeScannerListener, useHasMounted } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { audioManager } from "@/lib/audio-manager";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";

// Refactored Components
import { CartItem } from "./components/CartItem";
import { ScannerArea } from "./components/ScannerArea";
import { CheckoutBar } from "./components/CheckoutBar";

export const dynamic = "force-dynamic";

type ScanMode = "camera" | "keyboard" | "hardware";

function SellPageContent() {
  const router = useRouter();
  const { addToActivityLog } = useProductStore();
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updatePrice,
    clearCart,
    getTotal,
    getItemCount,
  } = useCartStore();
  const { mutateAsync: addMovements, isPending: isSubmitting } =
    useAddMultipleMovements();
  const hasMounted = useHasMounted();

  const [scanMode, setScanMode] = useState<ScanMode>("hardware");
  const [isSearching, setIsSearching] = useState(false);

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      if (isSearching) return;
      setIsSearching(true);

      try {
        const product = await apiGetProductByBarcode(barcode);
        if (product) {
          addItem(product);
          addToActivityLog(`Cart: Added ${product.name} (${barcode})`);
          audioManager.playSuccess();
          toast.success(`Added to cart: ${product.name}`, { duration: 2000 });
        } else {
          audioManager.playError();
          toast.info("Product not found", {
            description: "Barcode: " + barcode,
          });
        }
      } catch (err) {
        console.error("Barcode scan error:", err);
        toast.error("Scan failed");
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, addToActivityLog, addItem],
  );

  useBarcodeScannerListener(handleBarcodeScan, {
    enabled: scanMode === "hardware",
  });

  async function handleCheckout() {
    if (items.length === 0) return;

    try {
      const movements = items.map((item) => ({
        productId: item.product.id,
        type: "OUT" as const,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        note: "Multiple Item Sale",
      }));

      await addMovements(movements);
      toast.success("Sale completed successfully", { icon: "✅" });
      addToActivityLog(`Sale: Completed for ${getItemCount()} items`);
      clearCart();
      audioManager.playSuccess();
      router.push("/dashboard");
    } catch (err) {
      console.error("Checkout failed:", err);
      audioManager.playError();
      toast.error("Failed to complete sale");
    }
  }

  // Keyboard shortcuts
  useKeyboardShortcuts({
    s: () => setScanMode("camera"),
    h: () => setScanMode("hardware"),
    k: () => setScanMode("keyboard"),
    c: handleCheckout,
    Escape: () => setScanMode("hardware"),
  });

  const showFullScanner = scanMode === "camera";

  function getModeIcon() {
    switch (scanMode) {
      case "hardware":
        return <Usb size={16} />;
      case "camera":
        return <ScanLine size={16} />;
      case "keyboard":
        return <Keyboard size={16} />;
    }
  }

  function getModeLabel() {
    switch (scanMode) {
      case "hardware":
        return "Scanner";
      case "camera":
        return "Camera";
      case "keyboard":
        return "Manual";
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      {!showFullScanner && (
        <Header
          title="Sell Items"
          subtitle={`${hasMounted ? getItemCount() : 0} items in cart`}
          onBack={() => router.push("/dashboard")}
          action={
            <button
              onClick={() =>
                setScanMode((m) =>
                  m === "hardware"
                    ? "camera"
                    : m === "camera"
                      ? "keyboard"
                      : "hardware",
                )
              }
              className="btn-secondary py-2 px-3 text-sm gap-1.5"
            >
              {getModeIcon()}
              <span className="text-xs">{getModeLabel()}</span>
            </button>
          }
        />
      )}

      {showFullScanner ? (
        <BarcodeScanner
          fullScreen
          onScan={(barcode) => {
            handleBarcodeScan(barcode);
            setScanMode("hardware");
          }}
          onClose={() => setScanMode("hardware")}
          onBack={() => setScanMode("hardware")}
        />
      ) : (
        <main className={cn("pb-40 pt-4 space-y-6 page-enter px-4")}>
          <ScannerArea
            scanMode={scanMode}
            isSearching={isSearching}
            onScan={handleBarcodeScan}
            onSwitchToCamera={() => setScanMode("camera")}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Cart Items
              </h2>
              {hasMounted && items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[10px] font-bold text-red-500 uppercase tracking-wider hover:opacity-80"
                >
                  Clear All
                </button>
              )}
            </div>

            {!hasMounted || items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center card bg-transparent border-dashed">
                <ShoppingCart
                  size={40}
                  className="text-slate-300 dark:text-slate-700 mb-3"
                />
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Your cart is empty
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                  Scan or search for items to sell
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <CartItem
                    key={item.product.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onUpdatePrice={updatePrice}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {!showFullScanner && items.length > 0 && (
        <CheckoutBar
          total={getTotal()}
          isSubmitting={isSubmitting}
          onCheckout={handleCheckout}
        />
      )}

      {!showFullScanner && <BottomNav />}
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SellPageContent />
    </Suspense>
  );
}
