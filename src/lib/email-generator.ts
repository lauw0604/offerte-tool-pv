export type OfferEmailData = {
  offerNumber: string;
  customerName: string;
  customerEmail: string;
  totalInclVat: number;
  panelCount: number;
  annualYield: number;
  validUntilDate: string;
  introText: string;
};

export function generateOfferEmailText(data: OfferEmailData): string {
  const {
    offerNumber,
    customerName,
    totalInclVat,
    panelCount,
    annualYield,
    validUntilDate,
    introText,
  } = data;

  const today = new Date().toLocaleDateString("nl-NL");

  return `Beste ${customerName},

Dit is uw persoonlijke offerte voor een PV-systeem van Plus Min Energie.

Offertenummer: ${offerNumber}
Datum: ${today}
Geldig tot: ${validUntilDate}

${introText}

Systeemsamenvatting:
• Aantal zonnepanelen: ${panelCount}
• Geschatte jaaropbrengst: ${annualYield.toFixed(0)} kWh
• Totaal (incl. btw): €${totalInclVat.toFixed(2)}

De gedetailleerde offerte vindt u in de bijgevoegde PDF-document.

Volgende stappen:
1. Bekijk de offerte zorgvuldig
2. Controleer alle gegevens
3. Laat ons weten of u vragen heeft
4. Wij kunnen direct een installatiemoment inplannen

Heeft u nog vragen? Neem dan contact met ons op via:
📞 030 - 123 45 67
📧 info@plusminenenergie.nl

Met vriendelijke groet,

Plus Min Energie
Bolwerk 23
3901 EC Veenendaal
www.plusminenenergie.nl

---

P.S. Deze offerte is 30 dagen geldig. Daarna kunnen prijzen wijzigen.`;
}

export function downloadEmailAsText(
  data: OfferEmailData,
  filename: string = "email.txt"
) {
  const text = generateOfferEmailText(data);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function copyEmailToClipboard(data: OfferEmailData): Promise<void> {
  const text = generateOfferEmailText(data);
  return navigator.clipboard.writeText(text);
}
