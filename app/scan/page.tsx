"use client";
// app/scan/page.tsx

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ScanLine,
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  Keyboard,
  X,
  Usb,
} from "lucide-react";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import {
  BarcodeScanner,
  BarcodeInput,
} from "@/components/scanner/barcode-scanner";
import { StockMovementModal } from "@/components/stock/stock-movement-modal";
import { apiGetProductByBarcode } from "@/lib/api";
import { useAddMovement } from "@/lib/queries";
import { useProductStore } from "@/store/app-store";
import { useBarcodeScannerListener } from "@/lib/hooks";
import {
  formatCurrency,
  getStockStatus,
  getStockStatusColor,
  cn,
} from "@/lib/utils";
import type { Product, StockMovementType } from "@/types";

export const dynamic = "force-dynamic";

type ScanMode = "camera" | "keyboard" | "hardware";
type MovementType = "IN" | "OUT" | "ADJUSTMENT";

function getQuantityDelta(type: MovementType, quantity: number): number {
  if (type === "IN") {
    return quantity;
  }
  if (type === "OUT") {
    return -quantity;
  }
  return quantity;
}

function getMovementToastMessage(type: MovementType, quantity: number): string {
  if (type === "IN") {
    return `+${quantity} added`;
  }
  if (type === "OUT") {
    return `-${quantity} removed`;
  }
  return "Stock adjusted";
}

export default function ScanPage() {
  const router = useRouter();
  const { addToActivityLog } = useProductStore();
  const { mutateAsync: addMovement } = useAddMovement();

  const [scanMode, setScanMode] = useState<ScanMode>("hardware");
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [preselectedType, setPreselectedType] =
    useState<StockMovementType>("IN");
  const [isSearching, setIsSearching] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(
    null,
  );

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      if (isSearching) return;
      setIsSearching(true);
      setFoundProduct(null);
      setNotFoundBarcode(null);
      setLastScannedBarcode(barcode);

      try {
        const product = await apiGetProductByBarcode(barcode);
        if (product) {
          setFoundProduct(product);
          addToActivityLog(`Scanned: ${product.name} (${barcode})`);
          toast.success(`Found: ${product.name}`);
        } else {
          setNotFoundBarcode(barcode);
          toast.info("Product not found — add it?");
        }
      } catch (err) {
        console.error("Barcode scan error:", err);
        toast.error("Scan failed");
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, addToActivityLog],
  );

  // Physical barcode scanner listener — active in "hardware" mode
  // Also active when showing product/not-found results so user can scan again
  useBarcodeScannerListener(handleBarcodeScan, {
    enabled: scanMode === "hardware" || !!foundProduct || !!notFoundBarcode,
  });

  async function handleMovement(data: {
    type: MovementType;
    quantity: number;
    note?: string;
    reference?: string;
  }) {
    if (!foundProduct) return;

    try {
      await addMovement({
        productId: foundProduct.id,
        type: data.type,
        quantity: data.quantity,
        note: data.note ?? null,
        reference: data.reference ?? null,
      });

      const delta = getQuantityDelta(data.type, data.quantity);
      const updated = {
        ...foundProduct,
        quantity: Math.max(0, foundProduct.quantity + delta),
        updatedAt: new Date().toISOString(),
      };

      setFoundProduct(updated);

      const toastMessage = getMovementToastMessage(data.type, data.quantity);
      toast.success(toastMessage);
      setShowMovementModal(false);
    } catch (err) {
      console.error("Movement failed:", err);
      toast.error("Failed to record movement");
    }
  }

  function openMovementModal(type: StockMovementType) {
    setPreselectedType(type);
    setShowMovementModal(true);
  }

  function resetScan() {
    setFoundProduct(null);
    setNotFoundBarcode(null);
    setLastScannedBarcode(null);
  }

  const status = foundProduct
    ? getStockStatus(foundProduct.quantity, foundProduct.minStock)
    : null;
  const statusColor = status ? getStockStatusColor(status) : null;

  const showFullScanner =
    scanMode === "camera" && !foundProduct && !notFoundBarcode;

  // Cycle through modes
  function cycleScanMode() {
    setScanMode((m) => {
      if (m === "hardware") return "camera";
      if (m === "camera") return "keyboard";
      return "hardware";
    });
    resetScan();
  }

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
          title="Scan"
          subtitle="Scan a product barcode"
          onBack={() => router.push("/dashboard")}
          action={
            <button
              onClick={cycleScanMode}
              className="btn-secondary py-2 px-3 text-sm gap-1.5"
              title={`Current: ${getModeLabel()} — click to switch`}
            >
              {getModeIcon()}
              <span className="text-xs">{getModeLabel()}</span>
            </button>
          }
        />
      )}

      <main
        className={cn(
          "pb-28 pt-4 space-y-4 page-enter",
          !showFullScanner && "px-4",
        )}
      >
        {/* Scanner / input modes */}
        {!foundProduct && !notFoundBarcode && (
          <>
            {scanMode === "camera" ? (
              <BarcodeScanner
                fullScreen
                onScan={handleBarcodeScan}
                onClose={() => setScanMode("keyboard")}
                onBack={() => router.push("/dashboard")}
              />
            ) : scanMode === "keyboard" ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-500 text-center">
                  Type or paste a barcode
                </p>
                <BarcodeInput onSubmit={handleBarcodeScan} />
              </div>
            ) : (
              /* Hardware scanner mode */
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                {/* Animated scanner icon */}
                <div className="relative group hover:scale-105 transition-transform duration-500 cursor-pointer" onClick={cycleScanMode}>
                  <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-orange-500/10 to-indigo-500/10 dark:from-orange-500/20 dark:to-indigo-500/20 border-2 border-dashed border-orange-500/40 dark:border-orange-500/30 flex items-center justify-center backdrop-blur-xl shadow-xl shadow-orange-500/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 dark:bg-black/20" />
                    <Usb
                      size={56}
                      className="text-orange-500 dark:text-orange-400 drop-shadow-lg group-hover:-rotate-12 group-hover:scale-110 transition-all duration-500 relative z-10"
                    />
                  </div>
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 rounded-[2.5rem] border-2 border-orange-500/30 animate-ping opacity-75" />
                </div>

                <div className="space-y-2 max-w-xs">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Ready to Scan
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Point your USB or Bluetooth barcode scanner at a product
                    barcode. The scan will be detected automatically.
                  </p>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Listening for scanner input
                  </span>
                </div>

                {/* Last scanned indicator */}
                {lastScannedBarcode && (
                  <div className="text-xs text-slate-500 dark:text-slate-600">
                    Last scanned:{" "}
                    <span className="font-mono text-orange-400">
                      {lastScannedBarcode}
                    </span>
                  </div>
                )}

                {/* Quick mode switches */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setScanMode("camera")}
                    className="btn-secondary py-2.5 px-4 text-sm"
                  >
                    <ScanLine size={16} />
                    Use Camera
                  </button>
                  <button
                    onClick={() => setScanMode("keyboard")}
                    className="btn-secondary py-2.5 px-4 text-sm"
                  >
                    <Keyboard size={16} />
                    Type Manually
                  </button>
                </div>
              </div>
            )}

            {isSearching && (
              <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-sm py-4">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Looking up barcode…
              </div>
            )}
          </>
        )}

        {/* Product found */}
        {foundProduct && (
          <div className="space-y-3">
            {/* Scanner still-listening indicator */}
            {scanMode === "hardware" && (
              <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Scanner active — scan another barcode to switch product
                </span>
              </div>
            )}

            {/* Product card */}
            <div className="card p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight line-clamp-2">
                    {foundProduct.name}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-500 mt-0.5">
                    {foundProduct.category}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-600 mt-1">
                    {foundProduct.barcode}
                  </p>
                </div>
                <button
                  onClick={resetScan}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 flex-shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Price + stock */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">
                    Sell Price
                  </p>
                  <p className="font-price font-bold text-xl text-orange-400">
                    {formatCurrency(foundProduct.sellPrice)}
                  </p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-600 dark:text-slate-500 mb-1">
                    Stock
                  </p>
                  <p
                    className={cn("font-price font-bold text-2xl", statusColor)}
                  >
                    {foundProduct.quantity}
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-500 ml-1">
                      {foundProduct.unit}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick actions — pre-selects movement type */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openMovementModal("IN")}
                  className="btn-success py-3"
                >
                  <TrendingUp size={18} />
                  Stock In
                </button>
                <button
                  onClick={() => openMovementModal("OUT")}
                  className="btn-danger py-3"
                >
                  <TrendingDown size={18} />
                  Stock Out
                </button>
              </div>
            </div>

            {/* View + Scan again */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/products/${foundProduct.id}`}
                className="btn-secondary py-3"
              >
                <Package size={18} />
                View Details
              </Link>
              <button onClick={resetScan} className="btn-secondary py-3">
                <ScanLine size={18} />
                Scan Again
              </button>
            </div>
          </div>
        )}

        {/* Product not found */}
        {notFoundBarcode && (
          <div className="space-y-4">
            {/* Scanner still-listening indicator */}
            {scanMode === "hardware" && (
              <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Scanner active — scan another barcode to try again
                </span>
              </div>
            )}

            <div className="card p-6 text-center">
              <Package
                size={48}
                className="text-slate-400 dark:text-slate-700 mx-auto mb-3"
              />
              <h2 className="font-bold text-slate-900 dark:text-slate-200 text-lg mb-1">
                Product Not Found
              </h2>
              <p className="font-mono text-sm text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg inline-block mt-1">
                {notFoundBarcode}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-500 mt-3">
                Would you like to add this product to your inventory?
              </p>
            </div>

            <Link
              href={`/products/new?barcode=${encodeURIComponent(
                notFoundBarcode,
              )}`}
              className="btn-primary w-full py-4 text-base"
            >
              <Plus size={20} />
              Add New Product
            </Link>

            <button onClick={resetScan} className="btn-secondary w-full py-3">
              <ScanLine size={18} />
              Scan Again
            </button>
          </div>
        )}
      </main>

      {!showFullScanner && <BottomNav />}

      {showMovementModal && foundProduct && (
        <StockMovementModal
          product={foundProduct}
          defaultType={preselectedType}
          onSubmit={handleMovement}
          onClose={() => setShowMovementModal(false)}
        />
      )}
    </div>
  );
}
