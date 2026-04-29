import PDFDocument from "pdfkit";
import { ImageResponse } from "next/og";
import React from "react";
import { Product, StockMovement } from "@/types";
import fs from "node:fs";
import path from "node:path";

export type InvoiceItem = { product: Product; movement: StockMovement };

export function generateInvoicePDF(
  itemsOrProduct: Product | InvoiceItem[],
  movement?: StockMovement,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const items: InvoiceItem[] = Array.isArray(itemsOrProduct)
        ? itemsOrProduct
        : [
            {
              product: itemsOrProduct as Product,
              movement: movement as unknown as StockMovement,
            },
          ];

      const baseMovement = items[0].movement;

      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        resolve(Buffer.concat(buffers));
      });

      // Load fonts
      const regularFontPath = path.join(
        process.cwd(),
        "public",
        "fonts",
        "Suwannaphum-Regular.ttf",
      );
      const boldFontPath = path.join(
        process.cwd(),
        "public",
        "fonts",
        "Suwannaphum-Bold.ttf",
      );

      const hasFonts =
        fs.existsSync(regularFontPath) && fs.existsSync(boldFontPath);
      if (hasFonts) {
        doc.registerFont("Khmer", regularFontPath);
        doc.registerFont("Khmer-Bold", boldFontPath);
      }

      const regularFont = hasFonts ? "Khmer" : "Helvetica";
      const boldFont = hasFonts ? "Khmer-Bold" : "Helvetica-Bold";
      const obliqueFont = hasFonts ? "Khmer" : "Helvetica-Oblique";

      const primaryColor = "#f97316";
      const textColor = "#333333";
      const lightGray = "#f3f4f6";
      const darkGray = "#6b7280";
      const white = "#ffffff";

      // --- Header ---
      doc
        .fillColor(textColor)
        .fontSize(20)
        .font(regularFont)
        .text("ចម្ការដូងលក់គ្រឿងបន្លាស់", 50, 50);
      doc
        .fillColor(darkGray)
        .fontSize(10)
        .font(regularFont)
        .text("Tel: 086-563-535", 50, 80)
        .text("ABA: 001 303 053", 50, 95)
        .text("Account Name: SILA SAO", 50, 110);

      doc
        .fillColor(primaryColor)
        .fontSize(32)
        .font(boldFont)
        .text("វិក្កយបត្រ", 50, 45, { align: "right" });

      const dateStr = new Date(
        baseMovement.createdAt || Date.now(),
      ).toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh" });
      doc
        .fillColor(darkGray)
        .fontSize(10)
        .font(regularFont)
        .text(`Date: ${dateStr}`, 50, 90, { align: "right" });
      if (baseMovement.id) {
        doc.text(`Tx ID: ${baseMovement.id.substring(0, 8)}`, 50, 105, {
          align: "right",
        });
      }
      if (baseMovement.reference) {
        doc.text(`Ref: ${baseMovement.reference}`, 50, 115, { align: "right" });
      }

      // Separator
      doc
        .moveTo(50, 140)
        .lineTo(545, 140)
        .lineWidth(1)
        .strokeColor(lightGray)
        .stroke();

      // --- Transaction Details Table ---
      const tableTitleY = 170;
      doc
        .fillColor(textColor)
        .fontSize(12)
        .font(boldFont)
        .text("TRANSACTION DETAILS", 50, tableTitleY);

      let tableTop = tableTitleY + 20;

      // Table Header
      doc.rect(50, tableTop, 495, 30).fill(primaryColor);
      doc.fillColor(white).fontSize(10).font(boldFont);
      doc.text("ITEM", 70, tableTop + 10);
      doc.text("QTY", 350, tableTop + 10, { width: 50, align: "center" });
      doc.text("UNIT PRICE", 410, tableTop + 10, { width: 60, align: "right" });
      doc.text("TOTAL", 475, tableTop + 10, { width: 50, align: "right" });

      let currentY = tableTop + 30;
      let grandTotal = 0;

      items.forEach((item, index) => {
        const qty = Math.abs(item.movement.quantity);
        const unitPrice = item.movement.unitPrice ?? item.product.sellPrice;
        const totalAmount = qty * unitPrice;
        grandTotal += totalAmount;

        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc
          .rect(50, currentY, 495, 40)
          .fillAndStroke(index % 2 === 0 ? white : lightGray, lightGray);

        doc.fillColor(textColor).fontSize(10).font(regularFont);
        doc.text(item.product.name, 70, currentY + 8);
        doc
          .fillColor(darkGray)
          .fontSize(8)
          .text(`Barcode: ${item.product.barcode}`, 70, currentY + 22);

        doc.fillColor(textColor).fontSize(10).font(regularFont);
        doc.text(`${qty} ${item.product.unit || "pcs"}`, 350, currentY + 15, {
          width: 50,
          align: "center",
        });
        doc.text(`$${unitPrice.toFixed(2)}`, 410, currentY + 15, {
          width: 60,
          align: "right",
        });
        doc.text(`$${totalAmount.toFixed(2)}`, 475, currentY + 15, {
          width: 50,
          align: "right",
        });

        currentY += 40;
      });

      // Total Section
      const totalY = currentY + 20;
      if (totalY > 750) {
        doc.addPage();
        currentY = 50;
      }

      doc.rect(380, totalY, 165, 40).fill(lightGray);
      doc
        .fillColor(textColor)
        .fontSize(12)
        .font(boldFont)
        .text("Total Amount:", 395, totalY + 14);
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .text(`$${grandTotal.toFixed(2)}`, 470, totalY + 13, {
          width: 60,
          align: "right",
        });

      if (baseMovement.note) {
        doc
          .fillColor(darkGray)
          .fontSize(10)
          .font(obliqueFont)
          .text(`Note: ${baseMovement.note}`, 50, totalY + 20);
      }

      // --- Footer ---
      const bottomY = Math.max(totalY + 80, 760);
      if (bottomY > 800) {
        doc.addPage();
      }
      doc
        .moveTo(50, bottomY - 20)
        .lineTo(545, bottomY - 20)
        .lineWidth(1)
        .strokeColor(lightGray)
        .stroke();
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font(boldFont)
        .text("សូមអរគុណដែលបានជាវ!", 50, bottomY, {
          align: "center",
          width: 495,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function generateInvoiceImage(
  itemsOrProduct: Product | InvoiceItem[],
  movement?: StockMovement,
): Promise<Buffer> {
  const items: InvoiceItem[] = Array.isArray(itemsOrProduct)
    ? itemsOrProduct
    : [
        {
          product: itemsOrProduct as Product,
          movement: movement as StockMovement,
        },
      ];

  const baseMovement = items[0].movement;
  const date = new Date(baseMovement.createdAt || Date.now()).toLocaleString(
    "en-GB",
    { timeZone: "Asia/Phnom_Penh" },
  );

  let grandTotal = 0;
  items.forEach((item) => {
    const unitPrice = item.movement.unitPrice ?? item.product.sellPrice;
    grandTotal += Math.abs(item.movement.quantity) * unitPrice;
  });

  const regularFontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Suwannaphum-Regular.ttf",
  );
  const boldFontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Suwannaphum-Bold.ttf",
  );

  const fonts = [];
  if (fs.existsSync(regularFontPath)) {
    fonts.push({
      name: "Khmer",
      data: fs.readFileSync(regularFontPath),
      weight: 400 as const,
      style: "normal" as const,
    });
  }
  if (fs.existsSync(boldFontPath)) {
    fonts.push({
      name: "Khmer",
      data: fs.readFileSync(boldFontPath),
      weight: 700 as const,
      style: "normal" as const,
    });
  }

  const height = Math.max(800, 450 + items.length * 70);

  const element = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#f3f4f6",
        padding: "30px",
        fontFamily: '"Khmer", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        {/* Header Area */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            backgroundColor: "#fff7ed",
            padding: "35px 40px",
            borderBottom: "2px solid #fdba74",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#f97316",
                letterSpacing: "2px",
              }}
            >
              Car Accessories
            </span>
            <h1
              style={{
                fontSize: "42px",
                margin: "8px 0 0 0",
                color: "#1f2937",
                fontWeight: 800,
              }}
            >
              Invoice
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              marginTop: "4px",
            }}
          >
            <span
              style={{ fontSize: "16px", color: "#4b5563", fontWeight: 600 }}
            >
              {date}
            </span>
            {baseMovement.id && (
              <span
                style={{
                  fontSize: "14px",
                  color: "#6b7280",
                  marginTop: "12px",
                  backgroundColor: "#f3f4f6",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                TX: {baseMovement.id.substring(0, 8)}
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "40px",
            flex: 1,
            backgroundColor: "#ffffff",
          }}
        >
          {/* Sale Details */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <h2
              style={{
                fontSize: "14px",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                margin: "0 0 16px 0",
                color: "#9ca3af",
                fontWeight: 700,
              }}
            >
              Transaction Details
            </h2>

            {/* Table Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "2px solid #f3f4f6",
                paddingBottom: "10px",
                marginBottom: "16px",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "flex", flex: 2 }}>Item</span>
              <span
                style={{ display: "flex", flex: 1, justifyContent: "center" }}
              >
                Qty
              </span>
              <span
                style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}
              >
                Price
              </span>
              <span
                style={{ display: "flex", flex: 1, justifyContent: "flex-end" }}
              >
                Total
              </span>
            </div>

            {items.map((item, idx) => {
              const qty = Math.abs(item.movement.quantity);
              const unitPrice = item.movement.unitPrice ?? item.product.sellPrice;
              const totalAmount = qty * unitPrice;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "18px",
                    color: "#374151",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #f3f4f6",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 2,
                    }}
                  >
                    <span style={{ fontWeight: "bold" }}>
                      {item.product.name}
                    </span>
                    <span style={{ fontSize: "14px", color: "#9ca3af" }}>
                      {item.product.barcode}
                    </span>
                  </div>
                  <span
                    style={{
                      display: "flex",
                      flex: 1,
                      justifyContent: "center",
                      fontWeight: 600,
                    }}
                  >
                    {qty}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flex: 1,
                      justifyContent: "flex-end",
                      fontWeight: 600,
                    }}
                  >
                    ${unitPrice.toFixed(2)}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      flex: 1,
                      justifyContent: "flex-end",
                      fontWeight: 600,
                    }}
                  >
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              );
            })}

            {baseMovement.note && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "16px",
                  color: "#6b7280",
                  marginBottom: "16px",
                }}
              >
                <span>Note</span>
                <span
                  style={{
                    fontStyle: "italic",
                    maxWidth: "300px",
                    textAlign: "right",
                  }}
                >
                  "{baseMovement.note}"
                </span>
              </div>
            )}

            {/* Total */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "auto",
                backgroundColor: "#1f2937",
                color: "#ffffff",
                padding: "24px 30px",
                borderRadius: "16px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <span style={{ fontSize: "22px", fontWeight: 500 }}>
                Total Amount
              </span>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#f97316",
                }}
              >
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const res = new ImageResponse(element, {
    width: 600,
    height: height,
    fonts: fonts.length > 0 ? fonts : undefined,
  });

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
