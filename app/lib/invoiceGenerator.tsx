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
              product: itemsOrProduct,
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
      const secondaryColor = "#1f2937";
      const textColor = "#111827";
      const lightGray = "#f9fafb";
      const borderGray = "#e5e7eb";
      const darkGray = "#6b7280";
      const white = "#ffffff";

      // --- Background Accent ---
      doc.rect(0, 0, 595, 10).fill(primaryColor);

      // --- Header ---
      // Shop Name (Left)
      doc
        .fillColor(secondaryColor)
        .fontSize(22)
        .font(boldFont)
        .text("លក់គ្រឿងបន្លាស់ ចម្ការដូង", 50, 45);

      doc
        .fillColor(darkGray)
        .fontSize(10)
        .font(regularFont)
        .text("Tel: 086-563-535", 50, 75);

      // Invoice Label (Right)
      doc
        .fillColor(primaryColor)
        .fontSize(36)
        .font(boldFont)
        .text("វិក្កយបត្រ", 350, 40, { align: "right", width: 195 });

      doc
        .fillColor(secondaryColor)
        .fontSize(12)
        .font(regularFont)
        .text("INVOICE", 350, 80, { align: "right", width: 195 });

      const dateStr = new Date(
        baseMovement.createdAt || Date.now(),
      ).toLocaleString("en-GB", { timeZone: "Asia/Phnom_Penh" });

      // Transaction Info Box
      const infoBoxY = 110;
      doc.rect(50, infoBoxY, 495, 50).fill(lightGray);
      doc.rect(50, infoBoxY, 2, 50).fill(primaryColor);

      doc
        .fillColor(darkGray)
        .fontSize(8)
        .font(boldFont)
        .text("កាលបរិច្ឆេទ", 70, infoBoxY + 12);
      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font(regularFont)
        .text(dateStr, 70, infoBoxY + 25);

      if (baseMovement.id) {
        const date = new Date(baseMovement.createdAt || Date.now());
        const YY = date.getFullYear().toString().slice(-2);
        const DD = date.getDate().toString().padStart(2, "0");
        const MM = (date.getMonth() + 1).toString().padStart(2, "0");
        // Extract numbers from ID for a pseudo-sequence if no real counter exists
        const seq =
          baseMovement.id
            .replace(/[^0-9]/g, "")
            .slice(-4)
            .padStart(4, "0") || "0001";
        const formattedId = `${YY}${DD}${MM}${seq}`;

        doc
          .fillColor(darkGray)
          .fontSize(8)
          .font(boldFont)
          .text("INVOICE ID", 200, infoBoxY + 12);
        doc
          .fillColor(secondaryColor)
          .fontSize(10)
          .font(regularFont)
          .text(`#${formattedId}`, 200, infoBoxY + 25);
      }

      if (baseMovement.reference) {
        doc
          .fillColor(darkGray)
          .fontSize(8)
          .font(boldFont)
          .text("REFERENCE", 350, infoBoxY + 12);
        doc
          .fillColor(secondaryColor)
          .fontSize(10)
          .font(regularFont)
          .text(baseMovement.reference, 350, infoBoxY + 25);
      }

      // --- Transaction Details Table ---
      let tableTop = 190;

      // Table Header
      doc.rect(50, tableTop, 495, 25).fill(secondaryColor);
      doc.fillColor(white).fontSize(9).font(boldFont);
      doc.text("ITEM DESCRIPTION", 70, tableTop + 8);
      doc.text("QTY", 350, tableTop + 8, { width: 50, align: "center" });
      doc.text("PRICE", 410, tableTop + 8, { width: 60, align: "right" });
      doc.text("AMOUNT", 475, tableTop + 8, { width: 60, align: "right" });

      let currentY = tableTop + 25;
      let grandTotal = 0;

      items.forEach((item, index) => {
        const qty = Math.abs(item.movement.quantity);
        const unitPrice = item.movement.unitPrice ?? item.product.sellPrice;
        const totalAmount = qty * unitPrice;
        grandTotal += totalAmount;

        doc.fillColor(textColor).fontSize(10).font(regularFont);
        doc.text(item.product.name, 70, currentY + 12);

        doc
          .fillColor(darkGray)
          .fontSize(8)
          .text(item.product.barcode, 70, currentY + 25);

        doc.fillColor(textColor).fontSize(10);
        doc.text(`${qty} ${item.product.unit || "pcs"}`, 350, currentY + 18, {
          width: 50,
          align: "center",
        });
        doc.text(`$${unitPrice.toFixed(2)}`, 410, currentY + 18, {
          width: 60,
          align: "right",
        });
        doc.text(`$${totalAmount.toFixed(2)}`, 475, currentY + 18, {
          width: 60,
          align: "right",
        });

        currentY += 45;

        // Underline
        doc
          .moveTo(50, currentY)
          .lineTo(545, currentY)
          .lineWidth(0.5)
          .strokeColor(borderGray)
          .stroke();
      });

      // Total Section
      const totalY = currentY + 20;

      doc.rect(345, totalY, 200, 60).fill(primaryColor);
      doc
        .fillColor(white)
        .fontSize(12)
        .font(boldFont)
        .text("TOTAL AMOUNT", 360, totalY + 15);
      doc.fontSize(18).text(`$${grandTotal.toFixed(2)}`, 360, totalY + 32, {
        width: 170,
        align: "right",
      });

      if (baseMovement.note) {
        doc
          .fillColor(darkGray)
          .fontSize(9)
          .font(obliqueFont)
          .text(`Note: ${baseMovement.note}`, 50, totalY + 10, { width: 280 });
      }

      // --- Payment QR Code logic ---
      const qrPath = path.join(process.cwd(), "public", "ABA.jpeg");
      const hasQR = fs.existsSync(qrPath);

      if (hasQR) {
        const qrSize = 120;
        const qrBoxY = totalY + (baseMovement.note ? 35 : 10);

        // Payment Info Box
        doc.rect(50, qrBoxY, 180, 70).fill(lightGray);
        doc.rect(50, qrBoxY, 2, 70).fill(primaryColor);

        doc.image(qrPath, 55, qrBoxY + 5, { width: qrSize - 10 });

        doc
          .fillColor(primaryColor)
          .fontSize(8)
          .font(boldFont)
          .text("ស្កេនដើម្បីទូទាត់", 170, qrBoxY + 42);
      }

      // --- Footer ---
      const finalFooterY = 720;

      doc
        .moveTo(50, finalFooterY)
        .lineTo(545, finalFooterY)
        .lineWidth(0.5)
        .strokeColor(borderGray)
        .stroke();

      doc
        .fillColor(secondaryColor)
        .fontSize(12)
        .font(boldFont)
        .text("THANK YOU FOR YOUR BUSINESS!", 270, finalFooterY + 35, {
          align: "right",
          width: 275,
        });

      doc
        .fillColor(darkGray)
        .fontSize(8)
        .font(regularFont)
        .text(
          "Please keep this invoice for your records.",
          270,
          finalFooterY + 55,
          {
            align: "right",
            width: 275,
          },
        );

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
          product: itemsOrProduct,
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

  const qrPath = path.join(process.cwd(), "public", "ABA.jpeg");
  let qrBase64 = "";
  if (fs.existsSync(qrPath)) {
    const qrBuffer = fs.readFileSync(qrPath);
    qrBase64 = `data:image/jpeg;base64,${qrBuffer.toString("base64")}`;
  }

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

  const height = Math.max(900, 500 + items.length * 80 + (qrBase64 ? 150 : 0));

  const element = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
        padding: "40px",
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
          borderRadius: "32px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Top Accent Bar */}
        <div
          style={{ height: "12px", backgroundColor: "#1f2937", width: "100%" }}
        />

        {/* Header Area */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "50px 60px 40px 60px",
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1
              style={{
                fontSize: "32px",
                margin: 0,
                color: "#1f2937",
                fontWeight: 900,
                letterSpacing: "-0.5px",
              }}
            >
              ចម្ការដូងលក់គ្រឿងបន្លាស់
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "2px",
                  backgroundColor: "#f97316",
                  marginRight: "10px",
                }}
              />
              <span
                style={{ fontSize: "16px", color: "#6b7280", fontWeight: 600 }}
              >
                Tel: 086-563-535
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: "56px",
                fontWeight: 900,
                color: "#f97316",
                lineHeight: 1,
              }}
            >
              INVOICE
            </span>
            <span
              style={{
                fontSize: "16px",
                color: "#9ca3af",
                marginTop: "8px",
                fontWeight: 500,
              }}
            >
              {date}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "40px 60px",
            flex: 1,
          }}
        >
          {/* Info Chips */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
            {baseMovement.id && (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Invoice ID
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#334155",
                    fontWeight: 600,
                  }}
                >
                  {(() => {
                    const d = new Date(baseMovement.createdAt || Date.now());
                    const YY = d.getFullYear().toString().slice(-2);
                    const DD = d.getDate().toString().padStart(2, "0");
                    const MM = (d.getMonth() + 1).toString().padStart(2, "0");
                    const seq =
                      baseMovement.id
                        .replace(/[^0-9]/g, "")
                        .slice(-4)
                        .padStart(4, "0") || "0001";
                    return `#${YY}${DD}${MM}${seq}`;
                  })()}
                </span>
              </div>
            )}
            {baseMovement.reference && (
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "12px 20px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: "#94a3b8",
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  Reference
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#334155",
                    fontWeight: 600,
                  }}
                >
                  {baseMovement.reference}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            {/* Table Header */}
            <div
              style={{
                display: "flex",
                backgroundColor: "#1f2937",
                borderRadius: "12px",
                padding: "15px 25px",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  flex: 3,
                  color: "#9ca3af",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                ITEM
              </span>
              <span
                style={{
                  flex: 1,
                  color: "#9ca3af",
                  fontSize: "12px",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                QTY
              </span>
              <span
                style={{
                  flex: 1,
                  color: "#9ca3af",
                  fontSize: "12px",
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                PRICE
              </span>
              <span
                style={{
                  flex: 1,
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  textAlign: "right",
                }}
              >
                TOTAL
              </span>
            </div>

            {items.map((item, idx) => {
              const qty = Math.abs(item.movement.quantity);
              const unitPrice =
                item.movement.unitPrice ?? item.product.sellPrice;
              const totalAmount = qty * unitPrice;
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    padding: "20px 25px",
                    borderBottom: "1px solid #f1f5f9",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      flex: 3,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "18px",
                        fontWeight: 700,
                        color: "#1e293b",
                      }}
                    >
                      {item.product.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        marginTop: "4px",
                      }}
                    >
                      {item.product.barcode}
                    </span>
                  </div>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#475569",
                      textAlign: "center",
                    }}
                  >
                    {qty} {item.product.unit || "pcs"}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#475569",
                      textAlign: "right",
                    }}
                  >
                    ${unitPrice.toFixed(2)}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#0f172a",
                      textAlign: "right",
                    }}
                  >
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              );
            })}

            {/* Note and QR Code Section */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: "30px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: "300px",
                }}
              >
                {baseMovement.note && (
                  <div style={{ marginBottom: "20px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Note
                    </span>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#64748b",
                        margin: "5px 0 0 0",
                        fontStyle: "italic",
                      }}
                    >
                      "{baseMovement.note}"
                    </p>
                  </div>
                )}

                {qrBase64 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "#f8fafc",
                      padding: "12px",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <img
                      src={qrBase64}
                      width="60"
                      height="75"
                      style={{ borderRadius: "8px" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        marginLeft: "15px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "#1e293b",
                        }}
                      >
                        PAYMENT INFO
                      </span>
                      <span style={{ fontSize: "10px", color: "#64748b" }}>
                        ABA Bank KHQR
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#f97316",
                          marginTop: "5px",
                        }}
                      >
                        ស្កេនដើម្បីទូទាត់
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Section */}
              <div
                style={{
                  backgroundColor: "#f97316",
                  padding: "25px 35px",
                  borderRadius: "24px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  boxShadow: "0 20px 25px -5px rgba(249, 115, 22, 0.2)",
                }}
              >
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    opacity: 0.8,
                    textTransform: "uppercase",
                  }}
                >
                  Total Amount
                </span>
                <span
                  style={{
                    color: "#ffffff",
                    fontSize: "42px",
                    fontWeight: 900,
                    marginTop: "5px",
                  }}
                >
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            padding: "40px 60px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <span
              style={{ fontSize: "20px", fontWeight: 800, color: "#1e293b" }}
            >
              THANK YOU!
            </span>
            <span
              style={{ fontSize: "14px", color: "#64748b", marginTop: "5px" }}
            >
              Come back soon!
            </span>
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
