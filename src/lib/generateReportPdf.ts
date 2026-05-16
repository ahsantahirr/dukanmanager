import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatRs } from "./format";

export interface ReportStats {
  totalSales: number;
  totalProfit: number;
  transactions: number;
  avgPerDay: number;
}

export interface DailyStat {
  date: string;
  sales: number;
  profit: number;
  transactions: number;
}

export interface SaleRow {
  date: string;
  item: string;
  category: string;
  quantity: string;
  total: number;
  profit: number;
}

export interface ReportPdfData {
  businessName?: string;
  weekly: ReportStats;
  monthly: ReportStats;
  daily: DailyStat[];
  recentSales?: SaleRow[];
}

function addSummarySection(
  doc: jsPDF,
  y: number,
  title: string,
  stats: ReportStats,
  period: string
): number {
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const lines = [
    `Period: ${period}`,
    `Total Sales: ${formatRs(stats.totalSales)}`,
    `Total Profit: ${formatRs(stats.totalProfit)}`,
    `Transactions: ${stats.transactions}`,
    `Average per day: ${formatRs(stats.avgPerDay)}`,
  ];

  let currentY = y + 6;
  lines.forEach((line) => {
    doc.text(line, 14, currentY);
    currentY += 5;
  });

  return currentY + 4;
}

export function generateReportPdf(data: ReportPdfData): void {
  const doc = new jsPDF();
  const generatedAt = format(new Date(), "MMM dd, yyyy · hh:mm a");
  const fileName = `dukan-report-${format(new Date(), "yyyy-MM-dd")}.pdf`;

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Dukan Manager", 14, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Sales & Profit Report", 14, 28);

  if (data.businessName) {
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text(data.businessName, 14, 36);
    doc.setFont("helvetica", "normal");
  }

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text(`Generated: ${generatedAt}`, 14, data.businessName ? 43 : 36);

  doc.setTextColor(0, 0, 0);
  let y = data.businessName ? 52 : 45;

  y = addSummarySection(doc, y, "Weekly Summary", data.weekly, "Last 7 days");
  y = addSummarySection(doc, y, "Monthly Summary", data.monthly, "Last 30 days");

  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Daily Breakdown (Last 7 Days)", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Sales", "Profit", "Transactions"]],
    body: data.daily.map((day) => [
      day.date,
      formatRs(day.sales),
      formatRs(day.profit),
      String(day.transactions),
    ]),
    theme: "striped",
    headStyles: { fillColor: [11, 132, 255] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable?.finalY ?? y + 40;

  if (data.recentSales && data.recentSales.length > 0) {
    if (finalY > 230) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Recent Transactions", 14, finalY + 10);

    autoTable(doc, {
      startY: finalY + 14,
      head: [["Date", "Item", "Category", "Qty", "Total", "Profit"]],
      body: data.recentSales.map((sale) => [
        sale.date,
        sale.item,
        sale.category,
        sale.quantity,
        formatRs(sale.total),
        formatRs(sale.profit),
      ]),
      theme: "striped",
      headStyles: { fillColor: [54, 179, 126] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} · Dukan Manager`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(fileName);
}
