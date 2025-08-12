import React, { useState } from "react";
import type { Song } from "../types/song";
import { useTranslation } from 'react-i18next';
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, ExternalHyperlink, TextRun } from "docx";
import { pdf, Document as PDFDocument, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

// Register your Hebrew font (do this once, outside the component)
Font.register({
  family: 'Noto Sans Hebrew',
  src: '/fonts/NotoSansHebrew-VariableFont_wdth,wght.ttf',
});

const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 20,
    fontSize: 12,
    direction: 'rtl',
    fontFamily: 'Noto Sans Hebrew'
  },
  table: { display: "flex", width: "auto", marginBottom: 10 },
  tableRow: { flexDirection: "row" },
  tableCol: { flex: 1, borderStyle: "solid", borderWidth: 1, borderColor: '#000', padding: 4 },
  tableCell: { fontSize: 10, textAlign: 'right' }
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 20,
    fontSize: 12,
    direction: 'rtl',
    fontFamily: 'Noto Sans Hebrew'
  },
  table: { display: "flex", width: "auto", marginBottom: 10 },
  tableRow: { flexDirection: "row" },
  tableCol: { flex: 1, borderStyle: "solid", borderWidth: 1, borderColor: '#000', padding: 4 },
  tableCell: { fontSize: 10, textAlign: 'right' },
  headerCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',           // dark text
    textAlign: 'center',
    padding: 6,

  }, title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1e293b',
    fontFamily: 'Noto Sans Hebrew'
  }
});
const Export: React.FC<{ songsForExport: Song[] }> = ({ songsForExport }) => {
  const [fileName, setFileName] = useState("songs_export");
  const { t } = useTranslation();
  const fieldOptions = [
    { key: "title", label: t('export.title') },
    { key: "artists", label: t('export.artists') },
    { key: "authors", label: t('export.authors') },
    { key: "keywords", label: t('export.keywords') },
    { key: "genres", label: t('export.genres') },
    { key: "lyrics", label: t('export.lyrics') },
    { key: "score", label: t('export.score') },
    { key: "year", label: t('export.year') },
    { key: "link", label: t('export.link') },
  ];
  const formatsOptions = [
    { key: "pdf", label: t('export.pdf') },
    { key: "excel", label: t('export.excel') },
    { key: "word", label: t('export.word') },
  ];
  const [formats, setFormats] = useState<{ [key: string]: boolean }>({
    pdf: false,
    excel: false,
    word: false,
  });
  const [fields, setFields] = useState<{ [key: string]: boolean }>({
    title: true,
    artists: true,
    authors: true,
    keywords: true,
    genres: true,
    lyrics: true,
    score: true,
    year: true,
    link: true
  });
  const [note] = useState<string>(`רשימת היצירות המוצעת באתר ניתנת לצרכים קריאטיביים והשראתיים בלבד, ואינה מהווה אישור, היתר, רישיון או התחייבות מכל סוג לשימוש ביצירות אלה.
    כל שימוש ביצירה כלשהי מהרשימה  לרבות שידור, פרסום, הפצה, עריכה או סינכרון עם תוכן ויזואלי או אחר  מחייב קבלת אישור מראש ובכתב מבעלי הזכויות הרלוונטיים.
    
    לצורך קבלת הצעת מחיר והסדרת זכויות השימוש ביצירה, יש לפנות אלינו בדוא"ל: yair@nitzani.co.il`);


  const handleFormatChange = (format: string) => {
    setFormats(prev => ({ ...prev, [format]: !prev[format] }));
  };

  const handleFieldChange = (field: string) => {
    setFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleExport = () => {
    const selectedFieldKeys = Object.keys(fields).filter(key => fields[key]);
    const filteredSongs = songsForExport.map(song =>
      Object.fromEntries(
        selectedFieldKeys.map(key => [key, song[key as keyof Song]])
      )
    );

    if (formats.pdf) {
      exportPDF(filteredSongs, selectedFieldKeys, fileName);
    }
    if (formats.excel) {
      exportExcel(filteredSongs, selectedFieldKeys, fileName);
    }
    if (formats.word) {
      exportWord(filteredSongs, selectedFieldKeys, fileName);
    }
    if (!formats.pdf && !formats.excel && !formats.word) {
      alert("אנא בחר פורמט לייצוא");
    }
  };

  const exportPDF = async (data: Partial<Song>[], selectedFieldKeys: string[], fileName: string) => {
    const doc = (
      <PDFDocument>
        <Page size="A4" style={pdfStyles.page}>
          {note?.trim() && (
            <Text style={{ fontSize: 11, marginBottom: 10, textAlign: 'right' }}>
              {note}
            </Text>
          )}
          <Text style={styles.title}>{fileName || "שירים"}</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.table}>
              {/* Table Header */}
              <View style={pdfStyles.tableRow}>
                {selectedFieldKeys.map(key => (
                  <View key={key} style={styles.tableCol}>
                    <Text style={styles.headerCell}>
                      {fieldOptions.find(f => f.key === key)?.label || key}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            {/* Table Body */}
            {data.map((row, idx) => (
              <View key={idx} style={pdfStyles.tableRow}>
                {selectedFieldKeys.map(key => (
                  <View key={key} style={pdfStyles.tableCol}>
                    {key === "link" && row[key as keyof Song] ? (
                      <Link src={String(row[key as keyof Song])} style={pdfStyles.tableCell}>
                        קישור
                      </Link>
                    ) : (
                      <Text style={pdfStyles.tableCell}>
                        {key !== "link"
                          ? Array.isArray(row[key as keyof Song])
                            ? (row[key as keyof Song] as string[]).join(', ')
                            : String(row[key as keyof Song] ?? '')
                          : ''}
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
    saveAs(blob, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  };
  const exportExcel = async (data: Partial<Song>[], selectedFieldKeys: string[], fileName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    if (note?.trim()) {
      worksheet.addRow([note]);
      worksheet.mergeCells(1, 1, 1, selectedFieldKeys.length);
      worksheet.getCell(1, 1).alignment = { horizontal: 'right', vertical: 'middle' };
      worksheet.addRow([]);
    }
    worksheet.addRow(selectedFieldKeys.map(key => fieldOptions.find(f => f.key === key)?.label || key));
    worksheet.addRows(
      data.map(row =>
        selectedFieldKeys.map(key =>
          key === "link" && row[key as keyof Song]
            ? { text: "קישור", hyperlink: String(row[key as keyof Song]) }
            : row[key as keyof Song]
        )
      )
    ); const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const exportWord = async (data: Partial<Song>[], selectedFieldKeys: string[], fileName: string) => {
    const tableRows = [
      new TableRow({
        children: selectedFieldKeys.map(key =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: fieldOptions.find(f => f.key === key)?.label || key, font: "Arial", bold: true })]
              })
            ]
          })
        )
      }),
      ...data.map(row =>
        new TableRow({
          children: selectedFieldKeys.map(key =>
            new TableCell({
              children: [
                new Paragraph({
                  bidirectional: true,
                  children:
                    key === "link" && row[key as keyof Song]
                      ? [new ExternalHyperlink({
                        link: String(row[key as keyof Song]),
                        children: [new TextRun({ text: "קישור", style: "Hyperlink", font: "Arial" })],
                      })]
                      : [new TextRun({ text: String(row[key as keyof Song] ?? ""), font: "Arial" })]
                })
              ]
            })
          )
        })
      )
    ];

    const children = [];

    if (note?.trim()) {
      children.push(
        new Paragraph({
          bidirectional: true,
          children: [new TextRun({ text: note, font: "Arial" })],
        })
      );
    }

    children.push(new Table({ rows: tableRows }));

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".docx") ? fileName : `${fileName}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-6 justify-items">
      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-1"
          htmlFor="export-filename"
        >
          {t('export.file_name')}
        </label>
        <input
          id="export-filename"
          type="text"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          placeholder="songs_export"
          className="input-base w-full"
        />
      </div>

      {/* formats */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('export.formats')}
        </label>
        <div className="flex flex-wrap gap-4">
          {formatsOptions.map(opt => (
            <label key={opt.key} className="inline-flex items-center">
              <input
                type="checkbox"
                className="checkbox-base"
                checked={formats[opt.key]}
                onChange={() => handleFormatChange(opt.key)}
              />
              <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
      {/* fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('export.fields')}
        </label>
        <div className="flex flex-wrap gap-4">
          {fieldOptions.map(opt => (
            <label key={opt.key} className="inline-flex items-center">
              <input
                type="checkbox"
                className="checkbox-base"
                checked={fields[opt.key]}
                onChange={() => handleFieldChange(opt.key)}
              />
              <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          className="btn btn-primary"
          onClick={handleExport}
        >
          {t('export.export')}
        </button>
      </div>

    </div>
  );
};



export default Export;