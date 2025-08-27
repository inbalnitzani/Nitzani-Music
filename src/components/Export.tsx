import React, { useState } from "react";
import type { Song } from "../types/song.ts";
import { useTranslation } from "react-i18next";
import { exportSongs } from "../utils/exportSongs.tsx";
// import logo from "../assets/logo.png"; // נשתמש ב־URL שנוצר ע"י הבילד

type Props = { songsForExport: Song[] };

const Export: React.FC<Props> = ({ songsForExport }) => {
  const { t } = useTranslation();
  const [fileName, setFileName] = useState("songs_export");
  const [isRunning, setIsRunning] = useState(false);

  const fieldOptions = [
    { key: "title",   label: t("export.title") },
    { key: "artists", label: t("export.artists") },
    { key: "authors", label: t("export.authors") },
    { key: "keywords",label: t("export.keywords") },
    { key: "genres",  label: t("export.genres") },
    { key: "lyrics",  label: t("export.lyrics") },
    { key: "score",   label: t("export.score") },
    { key: "year",    label: t("export.year") },
    { key: "link",    label: t("export.link") },
  ];

  const [formats, setFormats] = useState<{ [k: string]: boolean }>({
    pdf: false,
    excel: false,
    word: false,
  });

  const [fields, setFields] = useState<{ [k: string]: boolean }>({
    title: true,
    artists: true,
    authors: true,
    keywords: true,
    genres: true,
    lyrics: true,
    score: true,
    year: true,
    link: true,
  });

  const note =
`רשימת היצירות המוצעת באתר ניתנת לצרכים קריאטיביים והשראתיים בלבד, ואינה מהווה אישור, היתר, רישיון או התחייבות מכל סוג לשימוש ביצירות אלה.
כל שימוש ביצירה כלשהי מהרשימה לרבות שידור, פרסום, הפצה, עריכה או סינכרון עם תוכן ויזואלי או אחר מחייב קבלת אישור מראש ובכתב מבעלי הזכויות הרלוונטיים.

לצורך קבלת הצעת מחיר והסדרת זכויות השימוש ביצירה, יש לפנות אלינו בדוא"ל: yair@nitzani.co.il`;

  const handleFormatChange = (format: string) =>
    setFormats(prev => ({ ...prev, [format]: !prev[format] }));

  const handleFieldChange = (field: string) =>
    setFields(prev => ({ ...prev, [field]: !prev[field] }));

  const handleExport = async () => {
    const selectedFieldKeys = Object.keys(fields).filter(k => fields[k]);

    if (!selectedFieldKeys.length) {
      alert(t("export.pick_fields") || "בחרי לפחות שדה אחד לייצוא");
      return;
    }
    if (!formats.pdf && !formats.excel && !formats.word) {
      alert(t("export.pick_format") || "אנא בחרי פורמט לייצוא");
      return;
    }
    if (!songsForExport?.length) {
      alert(t("export.no_songs_selected") || "לא נבחרו שירים לייצוא");
      return;
    }

    const rows = songsForExport.map(song =>
      Object.fromEntries(
        selectedFieldKeys.map(key => [key, song[key as keyof Song]])
      )
    );

    const fieldsMeta = fieldOptions.filter(f => selectedFieldKeys.includes(f.key));

    try {
      setIsRunning(true);
      await exportSongs({
        fileName,
        rows,
        fields: fieldsMeta,
        note,
        formats,
        // title: t("export.report_title") || "דוח שירים",
        // logoUrl: logo,                        // להשתמש ב-import
        // pdfFontUrl: "/fonts/Heebo-VariableFont_wght.ttf", // שם פרמטר לפי ה-utils הקיים
        // pdfFontFamily: "Heebo",
      });
      
    } catch (err) {
      console.error(err);
      alert(t("export.failed") || "אירעה שגיאה בייצוא");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="export-filename" className="block text-sm font-medium text-gray-700 mb-1">
          {t("export.file_name")}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("export.formats")}
        </label>
        <div className="flex flex-wrap gap-4">
          {["pdf","excel","word"].map(k => (
            <label key={k} className="inline-flex items-center">
              <input
                type="checkbox"
                className="checkbox-base"
                checked={!!formats[k]}
                onChange={() => handleFormatChange(k)}
              />
              <span className="ml-2 text-sm text-gray-700">
                {k === "pdf" ? t("export.pdf") : k === "excel" ? t("export.excel") : t("export.word")}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("export.fields")}
        </label>
        <div className="flex flex-wrap gap-4">
          {fieldOptions.map(opt => (
            <label key={opt.key} className="inline-flex items-center">
              <input
                type="checkbox"
                className="checkbox-base"
                checked={!!fields[opt.key]}
                onChange={() => handleFieldChange(opt.key)}
              />
              <span className="ml-2 text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button className="btn btn-primary" onClick={handleExport} disabled={isRunning}>
           {t('export.export')}
        </button>
      </div>
    </div>
  );
};

export default Export;
