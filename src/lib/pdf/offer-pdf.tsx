"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";

type OfferLineDoc = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  productCategory: string;
};

type OfferPdfData = {
  offerNumber: string;
  customerName: string;
  customerAddress: string;
  postcodeCity: string;
  introText: string;
  panelCount: number;
  totalWattPeak: number;
  annualYield: number;
  lines: OfferLineDoc[];
  totals: {
    subtotalA: number;
    subtotalB: number;
    totalExcl: number;
    totalVat: number;
    totalIncl: number;
  };
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    color: "#0f172a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
    paddingBottom: 12,
  },
  brandBox: {
    flex: 1,
  },
  title: {
    color: "#0C447C",
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  meta: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.5,
  },
  invoiceInfo: {
    width: 180,
    alignItems: "flex-end",
  },
  infoLabel: {
    fontSize: 9,
    color: "#94a3b8",
    marginBottom: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#0C447C",
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 9,
    fontWeight: 700,
    color: "#0f172a",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  col1: { width: "42%" },
  col2: { width: "12%" },
  col3: { width: "12%" },
  col4: { width: "14%" },
  col5: { width: "20%" },
  totalsBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fafc",
    padding: 12,
    width: 230,
    alignSelf: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 10,
  },
  totalsTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#0C447C",
    color: "#0C447C",
    fontWeight: 700,
  },
});

function OfferDocument({
  offerNumber,
  customerName,
  customerAddress,
  postcodeCity,
  introText,
  panelCount,
  totalWattPeak,
  annualYield,
  lines,
  totals,
}: OfferPdfData) {
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandBox}>
            <Text style={styles.title}>Plus Min Energie</Text>
            <Text style={styles.meta}>Bolwerk 23, Veenendaal</Text>
            <Text style={styles.meta}>info@plusminenenergie.nl • 030 - 123 45 67</Text>
          </View>

          <View style={styles.invoiceInfo}>
            <Text style={styles.infoLabel}>Offertenummer</Text>
            <Text style={styles.text}>{offerNumber}</Text>
            <Text style={styles.infoLabel}>Datum</Text>
            <Text style={styles.text}>{new Date().toLocaleDateString("nl-NL")}</Text>
            <Text style={styles.infoLabel}>Geldig tot</Text>
            <Text style={styles.text}>{validUntil.toLocaleDateString("nl-NL")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Klantgegevens</Text>
          <Text style={styles.text}>{customerName}</Text>
          {customerAddress ? <Text style={styles.text}>{customerAddress}</Text> : null}
          {postcodeCity ? <Text style={styles.text}>{postcodeCity}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Introductie</Text>
          <Text style={styles.text}>{introText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Systeemsamenvatting</Text>
          <Text style={styles.text}>Aantal panelen: {panelCount}</Text>
          <Text style={styles.text}>Totaal wattpiek: {totalWattPeak} Wp</Text>
          <Text style={styles.text}>Geschatte jaaropbrengst: {annualYield.toFixed(0)} kWh</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specificatie</Text>

          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Omschrijving</Text>
            <Text style={styles.col2}>Aantal</Text>
            <Text style={styles.col3}>Prijs</Text>
            <Text style={styles.col4}>BTW</Text>
            <Text style={styles.col5}>Totaal</Text>
          </View>

          {lines
            .filter((line) => line.description)
            .map((line, index) => (
              <View key={`${line.description}-${index}`} style={styles.tableRow}>
                <Text style={styles.col1}>{line.description}</Text>
                <Text style={styles.col2}>{line.quantity}</Text>
                <Text style={styles.col3}>€{line.unitPrice.toFixed(2)}</Text>
                <Text style={styles.col4}>{line.vatRate}%</Text>
                <Text style={styles.col5}>€{(line.quantity * line.unitPrice).toFixed(2)}</Text>
              </View>
            ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>Deel A</Text>
            <Text>€{totals.subtotalA.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Deel B</Text>
            <Text>€{totals.subtotalB.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Excl. btw</Text>
            <Text>€{totals.totalExcl.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>BTW</Text>
            <Text>€{totals.totalVat.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsTotal}>
            <Text>Totaal incl. btw</Text>
            <Text>€{totals.totalIncl.toFixed(2)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateOfferPdfUrl(data: OfferPdfData) {
  const blob = await pdf(<OfferDocument {...data} />).toBlob();
  return URL.createObjectURL(blob);
}

export async function downloadOfferPdf(data: OfferPdfData, filename: string) {
  const url = await generateOfferPdfUrl(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default OfferDocument;
