'use client';
// components/scanner/barcode-scanner.tsx

import { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { X, Flashlight, Camera, Copy, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

interface BarcodeScannerProps {
  readonly onScan: (barcode: string) => void;
  readonly onClose?: () => void;
  readonly className?: string;
}

const SCANNER_ID = 'html5qr-scanner';

export function BarcodeScanner({
  onScan,
  onClose,
  className,
}: Readonly<BarcodeScannerProps>) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerStartedRef = useRef<boolean>(false);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const lastScanRef = useRef<string>('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { barcodeHistory, addBarcodeToHistory, clearBarcodeHistory } = useAppStore();

  const handleScan = useCallback(
    (decodedText: string, _result: Html5QrcodeResult) => {
      if (decodedText === lastScanRef.current) return;
      lastScanRef.current = decodedText;

      // Debounce rapid scans
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        lastScanRef.current = '';
      }, 2000);

      // Add to history
      addBarcodeToHistory(decodedText);

      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate(50);

      onScan(decodedText);
    },
    [onScan, addBarcodeToHistory]
  );

  useEffect(() => {
    // Wait for DOM to be ready
    const container = containerRef.current;
    if (!container) {
      console.error('Scanner container not found');
      setError('Scanner element not found. Please reload.');
      return;
    }

    const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
    scannerRef.current = scanner;
    scannerStartedRef.current = false;

    const initializeScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 140 },
            aspectRatio: 1.777,
            disableFlip: false,
          },
          handleScan,
          () => {} // ongoing failure — ignore
        );
        scannerStartedRef.current = true;
        setIsStarted(true);
      } catch (err) {
        console.error('Scanner error:', err);
        const errorMsg = (err as Error)?.message || String(err);
        if (errorMsg.includes('permission')) {
          setError('Camera access denied. Please check permissions.');
        } else if (errorMsg.includes('not found') || errorMsg.includes('NotFoundError')) {
          setError('No camera found. Please check your device.');
        } else {
          setError(`Camera error: ${errorMsg}`);
        }
        scannerStartedRef.current = false;
        setIsStarted(false);
      }
    };

    initializeScanner();

    return () => {
      clearTimeout(debounceRef.current);
      // Only stop if scanner was successfully started
      if (scannerRef.current && scannerStartedRef.current) {
        scanner.stop().catch((err) => {
          console.warn('Error stopping scanner:', err);
        });
      }
    };
  }, [handleScan]);

  const toggleTorch = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !isStarted) return;
    try {
      const capabilities = scanner.getRunningTrackCapabilities() as any;
      if (capabilities?.torch) {
        await (scanner as any).applyVideoConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn((v) => !v);
      }
    } catch {
      // torch not supported
    }
  }, [isStarted, torchOn]);

  if (error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 p-8 text-center',
          'dark:text-slate-600 text-slate-400',
          className
        )}
      >
        <Camera size={48} className='dark:text-slate-600 text-slate-400' />
        <div>
          <p className='dark:text-slate-300 text-slate-700 font-medium'>{error}</p>
          <p className='dark:text-slate-500 text-slate-500 text-sm mt-1'>
            Allow camera access in your browser settings, then reload.
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className='btn-secondary'>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative flex flex-col', className)}>
      {/* Scanner viewport */}
      <div className='relative overflow-hidden rounded-2xl dark:bg-slate-950 bg-white border dark:border-slate-800 border-slate-200 w-full aspect-video' ref={containerRef}>
        <div id={SCANNER_ID} className='w-full h-full' />

        {/* Overlay corners */}
        {isStarted && (
          <div className='absolute inset-0 pointer-events-none'>
            {/* Top-left */}
            <div className='absolute top-[20%] left-[10%] w-8 h-8 border-t-2 border-l-2 border-orange-400 rounded-tl-md' />
            {/* Top-right */}
            <div className='absolute top-[20%] right-[10%] w-8 h-8 border-t-2 border-r-2 border-orange-400 rounded-tr-md' />
            {/* Bottom-left */}
            <div className='absolute bottom-[20%] left-[10%] w-8 h-8 border-b-2 border-l-2 border-orange-400 rounded-bl-md' />
            {/* Bottom-right */}
            <div className='absolute bottom-[20%] right-[10%] w-8 h-8 border-b-2 border-r-2 border-orange-400 rounded-br-md' />
            {/* Scan line */}
            <div className='absolute left-[10%] right-[10%] h-0.5 bg-orange-400/70 top-[50%] scanner-box shadow-[0_0_8px_rgba(251,146,60,0.6)]' />
          </div>
        )}

        {/* Controls overlay */}
        <div className='absolute bottom-3 right-3 flex gap-2'>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all',
              showHistory
                ? 'bg-blue-500/80 border-blue-400 text-white'
                : 'dark:bg-black/40 bg-white/40 dark:border-white/20 border-slate-400/30 dark:text-white/70 text-slate-700 hover:dark:bg-black/60 hover:bg-white/60'
            )}
            title='Barcode history'
          >
            <Clock size={18} />
          </button>
          <button
            onClick={toggleTorch}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border transition-all',
              torchOn
                ? 'bg-amber-500/80 border-amber-400 text-white'
                : 'dark:bg-black/40 bg-white/40 dark:border-white/20 border-slate-400/30 dark:text-white/70 text-slate-700 hover:dark:bg-black/60 hover:bg-white/60'
            )}
          >
            <Flashlight size={18} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className='w-10 h-10 rounded-full flex items-center justify-center dark:bg-black/40 bg-white/40 backdrop-blur-sm dark:border-white/20 border-slate-400/30 dark:text-white/70 text-slate-700 hover:dark:bg-black/60 hover:bg-white/60'
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Barcode history popup */}
        {showHistory && barcodeHistory.length > 0 && (
          <div className='absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col p-4 z-50'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='font-semibold text-white text-sm'>Recent Scans</h3>
              <button
                onClick={() => setShowHistory(false)}
                className='text-slate-400 hover:text-white'
              >
                <X size={18} />
              </button>
            </div>
            <div className='flex-1 overflow-y-auto space-y-2 mb-3'>
              {barcodeHistory.map((barcode, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onScan(barcode);
                    setShowHistory(false);
                  }}
                  className='w-full text-left p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 font-mono text-xs text-orange-300 transition-colors'
                >
                  {barcode}
                </button>
              ))}
            </div>
            <button
              onClick={clearBarcodeHistory}
              className='w-full btn-secondary text-xs py-2'
            >
              Clear History
            </button>
          </div>
        )}

        {showHistory && barcodeHistory.length === 0 && (
          <div className='absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-50'>
            <Clock size={32} className='text-slate-500 mb-2' />
            <p className='text-slate-400 text-sm'>No scan history yet</p>
          </div>
        )}
      </div>

      <p className='text-center text-sm dark:text-slate-500 text-slate-600 mt-3'>
        Point camera at a barcode to scan
      </p>
    </div>
  );
}

// ─── Inline barcode input fallback ───────────────────────────────────────────

interface BarcodeInputProps {
  readonly onSubmit: (barcode: string) => void;
  readonly placeholder?: string;
}

export function BarcodeInput({
  onSubmit,
  placeholder = 'Enter barcode…',
}: Readonly<BarcodeInputProps>) {
  const [value, setValue] = useState('');
  const [copiedValue, setCopiedValue] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { barcodeHistory, addBarcodeToHistory, clearBarcodeHistory } = useAppStore();

  const handleSubmit = (barcode: string) => {
    if (barcode.trim()) {
      addBarcodeToHistory(barcode.trim());
      onSubmit(barcode.trim());
      setValue('');
    }
  };

  const copyValue = useCallback(() => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopiedValue(true);
      setTimeout(() => setCopiedValue(false), 2000);
    }
  }, [value]);

  return (
    <div className='space-y-3'>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(value);
        }}
        className='flex gap-2'
      >
        <input
          type='text'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className='input-field flex-1'
          autoComplete='off'
          inputMode='numeric'
        />
        <button
          type='button'
          onClick={copyValue}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
            copiedValue
              ? 'bg-emerald-500 text-white'
              : 'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 bg-slate-200 border-slate-300 text-slate-600 hover:bg-slate-300 border'
          )}
          title='Copy barcode'
        >
          {copiedValue ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <button type='submit' className='btn-primary px-4'>
          Go
        </button>
      </form>

      {/* Barcode history in keyboard mode */}
      {barcodeHistory.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className='w-full text-xs font-medium text-slate-500 hover:text-slate-400 py-2 px-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors'
          >
            <Clock size={14} className='inline mr-1' />
            {barcodeHistory.length} Recent Scans
          </button>

          {showHistory && (
            <div className='mt-2 space-y-1 max-h-40 overflow-y-auto'>
              {barcodeHistory.map((barcode, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleSubmit(barcode);
                    setShowHistory(false);
                  }}
                  className='w-full text-left p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 font-mono text-xs text-orange-300 transition-colors'
                >
                  {barcode}
                </button>
              ))}
              <button
                onClick={clearBarcodeHistory}
                className='w-full text-xs text-slate-500 hover:text-slate-400 py-2 mt-2'
              >
                Clear history
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
