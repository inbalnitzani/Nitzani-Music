// src/utils/exportUsageReportPDF.ts
import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";

Font.register({
  family: "Noto Sans Hebrew",
  src: "/fonts/NotoSansHebrew-VariableFont_wdth,wght.ttf",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 20,
    fontSize: 12,
    direction: "rtl",
    fontFamily: "Noto Sans Hebrew",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1e293b",
  },
  table: {
    display: "flex",
    width: "auto",
    marginBottom: 10,
  },
  text:{
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1e293b",
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCol: {
    flex: 1,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    padding: 4,
  },
  tableCell: {
    fontSize: 10,
    textAlign: "right",
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    padding: 6,
  },
});

export const exportUsageReportPDF = async (
  data: any[],
  selectedFields: string[],
  fieldLabels: Record<string, string>,
  fileName: string
) => {
  const content = (
    <PDFDocument>
      <Page size="A4" style={styles.page}>
        <Text style={styles.text}>השימוש במחשבון אינו מהווה אישור או רישיון לשימוש ביצירה, ואינו מחייב את בעלי הזכויות בכל דרך שהיא.
המחשבון נועד לצרכים אינפורמטיביים בלבד ומשמש כאומדן ראשוני להערכת עלות אפשרית, בהתבסס על הנתונים שהוזנו על ידי המשתמש.

הסכום הסופי והתנאים לשימוש ביצירה יקבעו רק לאחר פנייה מסודרת אלינו, קבלת הסכמת בעלי הזכויות, וקבלת הצעת מחיר רשמית הכוללת טיוטת הסכם לשימוש ביצירה.

למידע נוסף או להגשת בקשה לשימוש ביצירה, ניתן ליצור קשר באמצעות הדוא"ל:
 yair@nitzani.co.il 
</Text>
        <Text style={styles.title}>{fileName || "דו\"ח שימוש ביצירות"}</Text>

        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableRow}>
            {selectedFields.map((key) => (
              <View key={key} style={styles.tableCol}>
                <Text style={styles.headerCell}>{fieldLabels[key] || key}</Text>
              </View>
            ))}
          </View>

          {/* Rows */}
          {data.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.tableRow}>
              {selectedFields.map((key) => (
                <View key={key} style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {String(row[key] ?? "")}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </PDFDocument>
  );

  const blob = await pdf(content).toBlob();
  saveAs(blob, fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`);
};
