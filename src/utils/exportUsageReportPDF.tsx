// src/utils/exportUsageReportPDF.ts
import {
  Document as PDFDocument,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
  Image
} from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import appLogo from "../assets/logo.png";

Font.register({
  family: "Rubik",
  src: "/fonts/Rubik-VariableFont_wght.ttf",
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 20,
    fontSize: 12,
    direction: "rtl",
    fontFamily: "Rubik",
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 10,
    objectFit: "contain"
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1e293b",
  },
  text: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#000000",
    fontFamily: "Rubik",
  },
  table: {
    display: "flex",
    width: "auto",
    marginBottom: 10,
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
    color: "#000000",
    fontWeight: "bold",
    fontFamily: "Rubik",
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    padding: 6,
    fontFamily: "Rubik",
  },
});

export const exportUsageReportPDF = async (
  data: any[],
  selectedFields: string[],
  fieldLabels: Record<string, string>,
  fileName: string
) => {
  const logoUrl = appLogo;

  const content = (
    <PDFDocument>
      <Page size="A4" style={styles.page}>
        <Image style={styles.logo} src={logoUrl} />

        <Text style={styles.text}>
          השימוש במחשבון אינו מהווה אישור או רישיון לשימוש ביצירה, ואינו מחייב את בעלי הזכויות בכל דרך שהיא.
          {"\n"}המחשבון נועד לצרכים אינפורמטיביים בלבד ומשמש כאומדן ראשוני להערכת עלות אפשרית, בהתבסס על הנתונים שהוזנו על ידי המשתמש.
          {"\n\n"}הסכום הסופי והתנאים לשימוש ביצירה יקבעו רק לאחר פנייה מסודרת אלינו, קבלת הסכמת בעלי הזכויות, וקבלת הצעת מחיר רשמית הכוללת טיוטת הסכם לשימוש ביצירה.
          {"\n\n"}למידע נוסף או להגשת בקשה לשימוש ביצירה, ניתן ליצור קשר באמצעות הדוא"ל:
          {"\n"}yair@nitzani.co.il
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
