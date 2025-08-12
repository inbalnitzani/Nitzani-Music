// utils/exportSongs.ts
import ExcelJS from "exceljs";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  ExternalHyperlink,
  TextRun,
  ImageRun, // ← NEW (לוגו ב-Word)
} from "docx";
import {
  pdf,
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Font,
  Image, // ← NEW (לוגו ב-PDF)
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import appLogo from "../assets/logo.png";

export type ExportRow = Record<string, unknown>;
export type ExportFields = { key: string; label: string }[];

type ExportOptions = {
  fileName: string;
  rows: ExportRow[];            // השורות אחרי סינון/מיפוי
  fields: ExportFields;         // סדר ותיוג עמודות
  note?: string;                // טקסט גילוי/הערה לראש המסמך
  formats: { pdf?: boolean; excel?: boolean; word?: boolean };
};

// ---------------------- BRANDING ----------------------
const LOGO_URL: string = appLogo; 

// הטענה חד-פעמית של הלוגו כ-DataURL (נוח ל-PDF/Excel/Word)
let logoDataUrlPromise: Promise<string> | null = null;
async function fetchAsDataURL(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}
function getLogoDataUrl(): Promise<string> {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = fetchAsDataURL(LOGO_URL).catch(() => "");
  }
  return logoDataUrlPromise;
}
function dataURLToUint8Array(dataURL: string): Uint8Array {
  const base64 = dataURL.split(",")[1] || "";
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------------------- Font (כמו שהיה אצלך) ----------------------
let fontRegistered = false;
function ensureHebrewFont() {
  if (fontRegistered) return;
  try {
    Font.register({
      family: "Noto Sans Hebrew",
      src: "/fonts/NotoSansHebrew-VariableFont_wdth,wght.ttf",
    });
    fontRegistered = true;
  } catch {}
}

// ---------------------- Styles (הוספתי header+logo ל-PDF) ----------------------
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 20,
    fontSize: 12,
    direction: "rtl",
    fontFamily: "Noto Sans Hebrew",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logo: { width: 120, height: 40, objectFit: "contain" },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center", flex: 1 },

  table: { display: "flex", width: "auto", marginBottom: 10 },
  tableRow: { flexDirection: "row" },
  tableCol: { flex: 1, borderStyle: "solid", borderWidth: 1, borderColor: "#000", padding: 4 },
  tableCell: { fontSize: 10, textAlign: "right" },
});

const headerCell = {
  fontSize: 12,
  fontWeight: "bold",
  color: "#1e293b",
  textAlign: "center",
  padding: 6,
} as const;

// ---------------------- PDF ----------------------
async function exportPDF(
  fileName: string,
  fields: ExportFields,
  rows: ExportRow[],
  note?: string
) {
  ensureHebrewFont();
  const logoDataUrl = await getLogoDataUrl();

  const doc = (
    <PDFDocument>
      <Page size="A4" style={pdfStyles.page}>
        {logoDataUrl ? (
          <View style={pdfStyles.header}>
            <View style={{ width: 120 }} />
            <Text style={pdfStyles.title}>{fileName || "שירים"}</Text>
            <Image src={logoDataUrl} style={pdfStyles.logo} />
          </View>
        ) : null}

        {!!note && (
          <Text style={{ fontSize: 11, marginBottom: 10, textAlign: "right" }}>{note}</Text>
        )}

        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            {fields.map((f) => (
              <View key={f.key} style={pdfStyles.tableCol}>
                <Text style={headerCell as any}>{f.label}</Text>
              </View>
            ))}
          </View>
          {rows.map((row, idx) => (
            <View key={idx} style={pdfStyles.tableRow}>
              {fields.map((f) => (
                <View key={f.key} style={pdfStyles.tableCol}>
                  {f.key === "link" && row[f.key] ? (
                    <Link src={String(row[f.key])} style={pdfStyles.tableCell}>
                      קישור
                    </Link>
                  ) : (
                    <Text style={pdfStyles.tableCell}>
                      {Array.isArray(row[f.key])
                        ? (row[f.key] as string[]).join(", ")
                        : String(row[f.key] ?? "")}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </PDFDocument>
  );
  const blob = await pdf(doc).toBlob();
  saveAs(blob, fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
}

// ---------------------- Excel ----------------------
async function exportExcel(
  fileName: string,
  fields: ExportFields,
  rows: ExportRow[],
  note?: string
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet1");

  // לוגו בראש הגליון
  const logoDataUrl = await getLogoDataUrl();
  if (logoDataUrl) {
    const base64 = logoDataUrl.split(",")[1] || "";
    const imageId = workbook.addImage({ base64, extension: "png" });
    worksheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 180, height: 60 },
    });
    worksheet.addRow([]); // מרווח אחרי לוגו
  }

  if (note?.trim()) {
    worksheet.addRow([note]);
    worksheet.mergeCells(worksheet.lastRow!.number, 1, worksheet.lastRow!.number, fields.length);
    worksheet.getCell(worksheet.lastRow!.number, 1).alignment = {
      horizontal: "right",
      vertical: "middle",
      readingOrder: 2,
      wrapText: true,
    };
    worksheet.addRow([]);
  }

  worksheet.addRow(fields.map((f) => f.label));

  rows.forEach((row) => {
    worksheet.addRow(
      fields.map((f) =>
        f.key === "link" && row[f.key]
          ? { text: "קישור", hyperlink: String(row[f.key]) }
          : (row[f.key] as any)
      )
    );
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`);
}

// ---------------------- Word ----------------------
async function exportWord(
  fileName: string,
  fields: ExportFields,
  rows: ExportRow[],
  note?: string
) {
  const children: any[] = [];

  // לוגו בראש המסמך
  const logoDataUrl = await getLogoDataUrl();
  if (logoDataUrl) {
    const bytes = dataURLToUint8Array(logoDataUrl);
    children.push(
      new Paragraph({
        children: [
          new ImageRun({ data: bytes, transformation: { width: 180, height: 60 } }),
        ],
      })
    );
  }

  if (note?.trim()) {
    children.push(
      new Paragraph({
        bidirectional: true,
        children: [new TextRun({ text: note, font: "Arial" })],
      })
    );
  }

  const tableRows = [
    new TableRow({
      children: fields.map((f) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: f.label, font: "Arial", bold: true })],
            }),
          ],
        })
      ),
    }),
    ...rows.map(
      (row) =>
        new TableRow({
          children: fields.map((f) =>
            new TableCell({
              children: [
                new Paragraph({
                  bidirectional: true,
                  children:
                    f.key === "link" && row[f.key]
                      ? [
                          new ExternalHyperlink({
                            link: String(row[f.key]),
                            children: [new TextRun({ text: "קישור", style: "Hyperlink", font: "Arial" })],
                          }),
                        ]
                      : [new TextRun({ text: String(row[f.key] ?? ""), font: "Arial" })],
                }),
              ],
            })
          ),
        })
    ),
  ];

  children.push(new Table({ rows: tableRows }));

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName.endsWith(".docx") ? fileName : `${fileName}.docx`);
}

// ---------------------- Public API (כמו שהיה) ----------------------
export async function exportSongs(opts: ExportOptions) {
  const { fileName, rows, fields, note, formats } = opts;
  if (formats.pdf) await exportPDF(fileName, fields, rows, note);
  if (formats.excel) await exportExcel(fileName, fields, rows, note);
  if (formats.word) await exportWord(fileName, fields, rows, note);
  if (!formats.pdf && !formats.excel && !formats.word) {
    throw new Error("No export format selected");
  }
}
