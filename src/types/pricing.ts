import { z } from "zod";

export const WineColorEnum = z.enum(["RED", "WHITE", "ROSE", "DESSERT"]);

export const PriceRowV3 = z.object({
  brand: z.string().min(1, "Brand required"),
  area: z.string().min(1, "Area required"),
  color: WineColorEnum.nullable().optional(),
  product_name: z.string().min(1, "Product required"),
  packed_case: z.coerce.number().int().min(1, "Case must be ≥ 1"),
  size_text: z.string().min(1, "Size required"),
  ex_vat_per_case: z.coerce.number().min(0).nullable().optional(),
  ex_vat_per_unit: z.coerce.number().min(0).nullable().optional(),
  inc_vat_per_case: z.coerce.number().min(0).nullable().optional(),
  inc_vat_per_unit: z.coerce.number().min(0).nullable().optional(),
  source_file: z.string().optional().nullable(),
  row_number: z.coerce.number().int().optional().nullable(),
});

export type ParsedRow = z.infer<typeof PriceRowV3> & {
  _errors?: string[];
  display_price?: number | null;
  isValid?: boolean;
  errors: string[];
  warnings: string[];
  isSectionHeader?: boolean;
};

export function parseLocaleNumber(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  let s = String(input).trim();
  if (!s) return null;
  s = s.replace(/\u00A0/g, " ").replace(/\s+/g, "");
  if (/,/.test(s) && /\./.test(s)) s = s.replace(/,/g, "");
  else if (/,/.test(s)) s = s.replace(/,/g, ".");
  s = s.replace(/[^0-9.+-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const COLOR_MAP: Record<string, "RED"|"WHITE"|"ROSE"|"DESSERT"> = {
  red: "RED",
  rouge: "RED",
  blanc: "WHITE",
  white: "WHITE",
  wit: "WHITE",
  rosé: "ROSE",
  rose: "ROSE",
  blush: "ROSE",
  dessert: "DESSERT",
  desert: "DESSERT",
  sweet: "DESSERT",
};

const NAME_HINTS = [
  { rx: /(ros[eé]|blush|caitlyn\s*ros[eé])/i, val: "ROSE" as const },
  { rx: /(chenin|sauvignon\s*blanc|chenin\s*blanc|blanc|chardonnay|viognier|pinot\s*(grigio|gris)|brut(?!\s*ros[eé])|sparkling\s*brut|white|stoneflower)/i, val: "WHITE" as const },
  { rx: /(merlot|shiraz|syrah|pinotage|cabernet|cab\s*sauv|malbec|granite\s*red|red\s*blend|the\s*blend|sandveld|paddock\s*shiraz|evanthuis|gondolier|san\s*louis)/i, val: "RED" as const },
  { rx: /(jerepiko|jeripigo|port|moscat|moscato|late\s*harvest|noble\s*late)/i, val: "DESSERT" as const },
];

export function normalizeColor(input: unknown, productName?: string): "RED"|"WHITE"|"ROSE"|"DESSERT"|null {
  const raw = String(input ?? "").trim();
  if (raw) {
    const k = raw.toLowerCase();
    if (COLOR_MAP[k]) return COLOR_MAP[k];
  }
  const name = productName ?? "";
  for (const h of NAME_HINTS) if (h.rx.test(name)) return h.val;
  return null;
}

export function computeDisplayPrice(r: Partial<z.infer<typeof PriceRowV3>>): number | null {
  return (
    r?.inc_vat_per_unit ?? r?.ex_vat_per_unit ??
    (r?.inc_vat_per_case && r?.packed_case ? r.inc_vat_per_case / r.packed_case : null) ??
    (r?.ex_vat_per_case && r?.packed_case ? r.ex_vat_per_case / r.packed_case : null) ??
    null
  );
}