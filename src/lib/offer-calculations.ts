export type OfferOrientation =
  | "zuid"
  | "zuidoost-zuidwest"
  | "oost-west"
  | "oost"
  | "west"
  | "noord";

export type OfferLine = {
  id: string;
  productCategory: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export const ORIENTATION_FACTORS: Record<OfferOrientation, number> = {
  zuid: 1,
  "zuidoost-zuidwest": 0.95,
  "oost-west": 0.85,
  oost: 0.8,
  west: 0.8,
  noord: 0.6,
};

export function calculateAnnualYield(
  panelCount: number,
  wattPeakPerPanel: number,
  orientation: OfferOrientation,
): number {
  const normalizedPanelCount = Number.isFinite(panelCount) ? Math.max(panelCount, 0) : 0;
  const normalizedWattPeak = Number.isFinite(wattPeakPerPanel) ? Math.max(wattPeakPerPanel, 0) : 0;
  const factor = ORIENTATION_FACTORS[orientation] ?? 1;

  return ((normalizedPanelCount * normalizedWattPeak) / 1000) * 875 * factor;
}

export function isZeroVatCategory(category: string): boolean {
  return ["paneel", "omvormer", "optimizer", "montage"].includes(category);
}

export function calculateOfferTotals(
  lines: OfferLine[],
  discountAmount = 0,
) {
  const subtotalA = lines
    .filter((line) => isZeroVatCategory(line.productCategory))
    .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const subtotalB = lines
    .filter((line) => !isZeroVatCategory(line.productCategory))
    .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const totalBeforeDiscount = subtotalA + subtotalB;
  const discountA = totalBeforeDiscount > 0 ? (subtotalA / totalBeforeDiscount) * discountAmount : 0;
  const discountB = totalBeforeDiscount > 0 ? (subtotalB / totalBeforeDiscount) * discountAmount : 0;

  const netA = subtotalA - discountA;
  const netB = subtotalB - discountB;

  const vatA = netA * 0;
  const vatB = netB * 0.21;
  const totalExcl = netA + netB;
  const totalVat = vatA + vatB;
  const totalIncl = totalExcl + totalVat;

  return {
    subtotalA,
    subtotalB,
    discountA,
    discountB,
    netA,
    netB,
    vatA,
    vatB,
    totalExcl,
    totalVat,
    totalIncl,
  };
}
