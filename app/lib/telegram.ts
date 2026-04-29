// lib/telegram.ts
// Reusable Telegram Bot notification service — server-side only

import type { Product, StockMovement } from "@/types";

// ─── Core sender ──────────────────────────────────────────────────────────────

/**
 * Sends a plain-text message via the Telegram Bot API.
 * Fails silently — never throws, so it cannot break the main flow.
 */
export async function sendTelegramMessage(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log(
      "[Telegram] Token or Chat ID not configured. Cannot send message.",
    );
    // Telegram not configured — skip silently
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
        // Abort after 5 s so it never blocks the request pipeline
        signal: AbortSignal.timeout(5_000),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      console.warn("[Telegram] API error:", res.status, body);
    }
  } catch (err) {
    // Network error, timeout, etc. — log but do NOT re-throw
    console.warn("[Telegram] Failed to send message:", err);
  }
}

export async function sendTelegramPhoto(
  photoBuffer: Buffer,
  caption: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
    // Append photo buffer as Blob
    formData.append("photo", new Blob([photoBuffer as any]), "invoice.png");

    const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.warn(
        "[Telegram] API error (photo):",
        res.status,
        await res.text(),
      );
    }
  } catch (err) {
    console.warn("[Telegram] Failed to send photo:", err);
  }
}

export async function sendTelegramDocument(
  documentBuffer: Buffer,
  filename: string,
  caption: string,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");
    // Append document buffer as Blob
    formData.append(
      "document",
      new Blob([documentBuffer as any], { type: "application/pdf" }),
      filename,
    );

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendDocument`,
      {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!res.ok) {
      console.warn(
        "[Telegram] API error (document):",
        res.status,
        await res.text(),
      );
    }
  } catch (err) {
    console.warn("[Telegram] Failed to send document:", err);
  }
}

// ─── Stock notification helper ────────────────────────────────────────────────

export type StockChangeType = "IN" | "OUT" | "RETURN" | "ADJUSTMENT";

export interface StockChangePayload {
  type: StockChangeType;
  product: Pick<
    Product,
    | "name"
    | "quantity"
    | "minStock"
    | "barcode"
    | "category"
    | "unit"
    | "sellPrice"
  >;
  qty: number;
  unitPrice?: number;
  movementId?: string; // used for invoice tracking
}

/**
 * Builds the correct notification for a stock movement and sends it.
 * Also appends a low-stock alert when stock falls below minStock.
 */
import { generateInvoicePDF } from "./invoiceGenerator";

export async function notifyStockChange({
  type,
  product,
  qty,
  unitPrice,
  movementId,
}: StockChangePayload): Promise<void> {
  let message: string;

  switch (type) {
    case "IN":
      message = [
        `📦 <b>STOCK IN</b>`,
        `Product: ${product.name}`,
        `Qty: +${qty}`,
        `Stock: ${product.quantity}`,
      ].join("\n");
      break;

    case "OUT":
      message = [
        `🛒 <b>STOCK OUT</b>`,
        `Product: ${product.name}`,
        `Qty: -${qty}`,
        `Stock: ${product.quantity}`,
      ].join("\n");
      break;

    case "RETURN":
      message = [
        `↩️ <b>STOCK RETURN</b>`,
        `Product: ${product.name}`,
        `Qty: +${qty}`,
        `Stock: ${product.quantity}`,
      ].join("\n");
      break;

    case "ADJUSTMENT":
      message = [
        `🔧 <b>STOCK ADJUSTMENT</b>`,
        `Product: ${product.name}`,
        `Qty: ${qty > 0 ? "+" : ""}${qty}`,
        `Stock: ${product.quantity}`,
      ].join("\n");
      break;

    default:
      return;
  }

  // If OUT (sale), send invoice instead of a plain message
  if (type === "OUT") {
    try {
      const pseudoMovement: StockMovement = {
        id: movementId || "N/A",
        productId: "N/A",
        type: "OUT",
        quantity: -qty,
        unitPrice: unitPrice,
        createdAt: new Date().toISOString(),
      };

      const pdfBuffer = await generateInvoicePDF(
        product as Product,
        pseudoMovement,
      );

      await sendTelegramDocument(
        pdfBuffer,
        `invoice_${movementId || Date.now()}.pdf`,
        message + "\n\n📄 <i>Invoice PDF Attached</i>",
      );
    } catch (err) {
      console.warn("[Telegram] Failed to generate/send invoices:", err);
      // Fallback to text
      await sendTelegramMessage(message);
    }
  } else {
    await sendTelegramMessage(message);
  }

  // ── Low-stock alert (separate message) ────────────────────────────────────
  const threshold = product.minStock ?? 5;
  if (product.quantity <= threshold && product.quantity > 0) {
    await sendTelegramMessage(
      [
        `⚠️ <b>LOW STOCK ALERT</b>`,
        `Product: ${product.name}`,
        `Remaining: ${product.quantity} unit(s)`,
        `Minimum: ${threshold}`,
      ].join("\n"),
    );
  } else if (product.quantity === 0) {
    await sendTelegramMessage(
      [
        `🚨 <b>OUT OF STOCK</b>`,
        `Product: ${product.name} is now out of stock!`,
      ].join("\n"),
    );
  }
}
