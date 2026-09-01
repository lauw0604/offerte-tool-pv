export type ProductCategory =
  | "paneel"
  | "omvormer"
  | "optimizer"
  | "batterij"
  | "laadpaal"
  | "montage"
  | "elektra"
  | "overig";

export type Product = {
  id?: string;
  category: ProductCategory;
  brand: string;
  description: string;
  unit: "stuk" | "uur" | "set" | "meter";
  purchase_price: number;
  selling_price: number;
  vat_rate: number;
  watt_peak: number | null;
  capacity_kwh: number | null;
  active: boolean;
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    category: "paneel",
    brand: "JA Solar",
    description: "Monokristallijn paneel 455 Wp, zwart frame",
    unit: "stuk",
    purchase_price: 128,
    selling_price: 179,
    vat_rate: 0,
    watt_peak: 455,
    capacity_kwh: null,
    active: true,
  },
  {
    category: "paneel",
    brand: "Trina Solar",
    description: "Half-cell paneel 450 Wp, donker glas",
    unit: "stuk",
    purchase_price: 120,
    selling_price: 171,
    vat_rate: 0,
    watt_peak: 450,
    capacity_kwh: null,
    active: true,
  },
  {
    category: "omvormer",
    brand: "Sungrow",
    description: "Hybrid omvormer 5 kW met WiFi monitoring",
    unit: "set",
    purchase_price: 940,
    selling_price: 1345,
    vat_rate: 0,
    watt_peak: null,
    capacity_kwh: null,
    active: true,
  },
  {
    category: "omvormer",
    brand: "GoodWe",
    description: "String omvormer 6 kW met EasySolar interface",
    unit: "set",
    purchase_price: 850,
    selling_price: 1215,
    vat_rate: 0,
    watt_peak: null,
    capacity_kwh: null,
    active: true,
  },
  {
    category: "optimizer",
    brand: "Tigo",
    description: "Optimizer voor module monitoring en rendementoptimalisatie",
    unit: "stuk",
    purchase_price: 38,
    selling_price: 59,
    vat_rate: 0,
    watt_peak: null,
    capacity_kwh: null,
    active: true,
  },
  {
    category: "batterij",
    brand: "BYD",
    description: "Battery-Box Premium 13.8 kWh, slim beheer",
    unit: "set",
    purchase_price: 3650,
    selling_price: 5090,
    vat_rate: 21,
    watt_peak: null,
    capacity_kwh: 13.8,
    active: true,
  },
  {
    category: "batterij",
    brand: "Pylontech",
    description: "Home battery 10.24 kWh, modulaire stack",
    unit: "set",
    purchase_price: 2950,
    selling_price: 4195,
    vat_rate: 21,
    watt_peak: null,
    capacity_kwh: 10.24,
    active: true,
  },
  {
    category: "laadpaal",
    brand: "Easee",
    description: "Wallbox 11 kW met app en RFID",
    unit: "stuk",
    purchase_price: 780,
    selling_price: 1245,
    vat_rate: 21,
    watt_peak: null,
    capacity_kwh: null,
    active: true,
  },
  {
    category: "montage",
    brand: "Eigen team",
    description: "Monteur PV-installatie, montage en configuratie",
    unit: "uur",
    purchase_price: 58,
    selling_price: 82,
    vat_rate: 0,
    watt_peak: null,
    capacity_kwh: null,
    active: true,
  },
  {
    category: "elektra",
    brand: "Schneider",
    description: "Kabelset en elektra-voorziening voor laadpaal en panelen",
    unit: "set",
    purchase_price: 180,
    selling_price: 260,
    vat_rate: 21,
    watt_peak: null,
    capacity_kwh: null,
    active: true,
  },
  {
    category: "overig",
    brand: "Legrand",
    description: "Distribution board aansluiting en bijbehorende onderdelen",
    unit: "set",
    purchase_price: 220,
    selling_price: 340,
    vat_rate: 21,
    watt_peak: null,
    capacity_kwh: null,
    active: true,
  },
];
