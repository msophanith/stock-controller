// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { nanoid } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function generateId(): string {
  return nanoid()
}

export function getStockStatus(
  quantity: number,
  minStock: number
): 'out' | 'low' | 'ok' | 'good' {
  if (quantity === 0) return 'out'
  if (quantity <= minStock) return 'low'
  if (quantity <= minStock * 2) return 'ok'
  return 'good'
}

export function getStockStatusColor(status: ReturnType<typeof getStockStatus>): string {
  switch (status) {
    case 'out':
      return 'text-red-400 bg-red-500/20 border-red-500/30'
    case 'low':
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30'
    case 'ok':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30'
    case 'good':
      return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
  }
}

export const PRODUCT_CATEGORIES = [
  'Engine Parts',
  'Engine Oils',
  'Filters',
  'Wipers',
  'Lighting',
  'Fluids',
  'Drive Belts',
  'Brakes',
  'Suspension',
  'Electrical',
  'Bodywork',
  'Accessories',
  'Tools',
  'Other',
] as const

export const PRODUCT_UNITS = ['pcs', 'set', 'L', 'ml', 'kg', 'g', 'm', 'pair', 'roll'] as const

export function exportProductsToCSV(products: any[]): void {
  if (products.length === 0) {
    alert('No products to export')
    return
  }

  // Define CSV headers
  const headers = [
    'Barcode',
    'Product Name',
    'Category',
    'Description',
    'Buy Price',
    'Sell Price',
    'Current Stock',
    'Min Stock',
    'Unit',
    'Shelf/Location',
    'Stock Value',
    'Created Date',
    'Last Updated',
  ]

  // Map products to CSV rows
  const rows = products.map((p) => [
    p.barcode || '',
    p.name || '',
    p.category || '',
    p.description || '',
    p.buyPrice || '0',
    p.sellPrice || '0',
    p.quantity || '0',
    p.minStock || '0',
    p.unit || 'pcs',
    p.shelf || '',
    (p.sellPrice * p.quantity).toFixed(2),
    formatDate(p.createdAt),
    formatDate(p.updatedAt),
  ])

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(cell).replace(/"/g, '""')
          return escaped.includes(',') ? `"${escaped}"` : escaped
        })
        .join(',')
    ),
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `car-stock-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}