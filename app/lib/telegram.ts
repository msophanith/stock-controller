// lib/telegram.ts
// Reusable Telegram Bot notification service — server-side only

import type { Product } from "@/types";

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

// ─── Stock notification helper ────────────────────────────────────────────────

export type StockChangeType = "IN" | "OUT" | "RETURN" | "ADJUSTMENT";

export interface StockChangePayload {
  type: StockChangeType;
  product: Pick<Product, "name" | "quantity" | "minStock">;
  qty: number;
}

/**
 * Builds the correct notification for a stock movement and sends it.
 * Also appends a low-stock alert when stock falls below minStock.
 */
export async function notifyStockChange({
  type,
  product,
  qty,
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

  await sendTelegramMessage(message);

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
