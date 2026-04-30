"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileUp,
  Check,
  AlertCircle,
  X,
  Loader2,
  Download,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { bulkImportProducts, BulkImportResult } from "../_actions/bulk-import";
import { toast } from "sonner";
import { createPortal } from "react-dom";

export function BulkImportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      let data: any[] = [];

      if (file.name.endsWith(".csv")) {
        data = await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        data = await parseXLSX(file);
      } else {
        toast.error("Please upload a CSV or Excel file");
        setIsUploading(false);
        return;
      }

      if (data.length === 0) {
        toast.error("The file is empty");
        setIsUploading(false);
        return;
      }

      const importResult = await bulkImportProducts(data);
      setResult(importResult);

      if (importResult.success) {
        toast.success(
          `Successfully imported ${importResult.imported} products`,
        );
      } else if (importResult.imported > 0) {
        toast.warning(
          `Imported ${importResult.imported} products with some errors`,
        );
      } else {
        toast.error("Failed to import products");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("An error occurred during import");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  };

  const parseXLSX = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const bstr = e.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const downloadTemplate = () => {
    const headers = [
      "barcode",
      "name",
      "category",
      "description",
      "buyPrice",
      "sellPrice",
      "quantity",
      "minStock",
      "shelf",
      "unit",
    ];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "product_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-white/95 dark:bg-slate-900/95 rounded-[2.5rem] shadow-[0_0_80px_-15px_rgba(0,0,0,0.6)] dark:shadow-[0_0_80px_-15px_rgba(249,115,22,0.3)] border border-white/20 dark:border-white/10 animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="relative p-8 overflow-y-auto scrollbar-hide">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-8 relative">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 dark:bg-orange-500/20 rounded-2xl">
                  <FileUp className="text-orange-500" size={24} />
                </div>
                Bulk Import
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-1">
                Add products via CSV or Excel
              </p>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setResult(null);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-all hover:rotate-90"
            >
              <X size={24} />
            </button>
          </div>

          {!result ? (
            <div className="space-y-8 relative">
              <div
                className={`relative p-12 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer overflow-hidden
                  ${
                    isUploading
                      ? "border-orange-500/50 bg-orange-500/5"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-orange-500/40 hover:bg-orange-500/5 hover:scale-[1.01]"
                  }`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />

                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-4" />
                      <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 animate-pulse" />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">
                      Processing...
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      Analyzing your data items
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-slate-900 dark:text-white font-bold text-xl mb-2">
                      Drop your file here
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
                      Click to browse or drag & drop CSV or Excel
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={downloadTemplate}
                  className="group flex flex-col items-center justify-center gap-3 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all duration-300"
                >
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 group-hover:text-orange-500 transition-colors">
                    <Download size={24} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Template
                  </span>
                </button>

                <div className="flex flex-col items-center justify-center gap-2 p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 text-center">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-blue-500">
                    Info
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Barcodes must be unique
                  </p>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-3xl">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
                  Required Fields
                </p>
                <div className="flex flex-wrap gap-2">
                  {["barcode", "name", "category", "buyPrice", "sellPrice"].map(
                    (field) => (
                      <span
                        key={field}
                        className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                      >
                        {field}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div
                className={`p-6 rounded-[2rem] flex flex-col items-center text-center gap-4 ${result.success ? "bg-green-500/10 border border-green-500/20" : "bg-orange-500/10 border border-orange-500/20"}`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${result.success ? "bg-green-500 shadow-green-500/20" : "bg-orange-500 shadow-orange-500/20"}`}
                >
                  {result.success ? (
                    <Check className="text-white" size={32} />
                  ) : (
                    <AlertCircle className="text-white" size={32} />
                  )}
                </div>
                <div>
                  <h4
                    className={`text-xl font-bold ${result.success ? "text-green-500" : "text-orange-500"}`}
                  >
                    {result.success ? "Success!" : "Partial Success"}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">
                    {result.imported} products have been processed.
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-slate-950/30">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Issues Found ({result.errors.length})
                    </p>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-4 space-y-2">
                    {result.errors.map((err, i) => (
                      <div
                        key={i}
                        className="text-xs p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col gap-1 shadow-sm"
                      >
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-900 dark:text-slate-200">
                            {err.barcode}
                          </span>
                          <span className="text-red-500 font-bold">Error</span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  setResult(null);
                }}
                className="btn-primary w-full py-5 rounded-[1.5rem] text-lg"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary py-2 px-4 text-sm flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/10 backdrop-blur-md"
      >
        <Upload size={16} className="text-orange-500" />
        Import
      </button>

      {isOpen && mounted && createPortal(modalContent, document.body)}
    </>
  );
}
