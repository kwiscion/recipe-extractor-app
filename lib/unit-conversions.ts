import { formatQuantity } from "@/lib/format-quantity";

export type AlternativeMeasurement = {
  value: number;
  unit: string;
  exact: boolean;
  note?: string;
};

type Unit =
  | "tsp"
  | "tbsp"
  | "ml"
  | "l"
  | "g"
  | "kg"
  | "oz"
  | "lb";

function normalizeUnit(input: string): Unit | null {
  const u = input.trim().toLowerCase();
  if (!u) return null;

  // volume
  if (u === "tsp" || u === "teaspoon" || u === "teaspoons") return "tsp";
  if (u === "tbsp" || u === "tablespoon" || u === "tablespoons") return "tbsp";
  if (u === "ml" || u === "milliliter" || u === "milliliters") return "ml";
  if (u === "l" || u === "lt" || u === "liter" || u === "liters") return "l";

  // weight
  if (u === "g" || u === "gram" || u === "grams") return "g";
  if (u === "kg" || u === "kilogram" || u === "kilograms") return "kg";
  if (u === "oz" || u === "ounce" || u === "ounces") return "oz";
  if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds") return "lb";

  return null;
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function formatAltValue(value: number, unit: string): string {
  const u = normalizeUnit(unit) ?? unit;

  // Metric units: prefer decimals, not fractions.
  if (u === "ml") {
    const rounded = value >= 50 ? roundTo(value, 1) : roundTo(value, 0.5);
    return rounded % 1 === 0 ? `${rounded.toFixed(0)}` : `${rounded.toFixed(1).replace(/\.0$/, "")}`;
  }
  if (u === "l") {
    const rounded = roundTo(value, 0.01);
    return `${rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
  }
  if (u === "g") {
    const rounded = value >= 50 ? roundTo(value, 1) : roundTo(value, 0.5);
    return rounded % 1 === 0 ? `${rounded.toFixed(0)}` : `${rounded.toFixed(1).replace(/\.0$/, "")}`;
  }
  if (u === "kg") {
    const rounded = roundTo(value, 0.01);
    return `${rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
  }

  // Cooking units: fractions are friendlier.
  return formatQuantity(value, 1);
}

/**
 * Deterministic conversions only (no density-based volume↔weight).
 */
export function getAlternativeMeasurements(
  quantity: number,
  unitRaw: string,
): AlternativeMeasurement[] {
  if (!Number.isFinite(quantity) || quantity <= 0) return [];
  const unit = normalizeUnit(unitRaw);
  if (!unit) return [];

  const out: AlternativeMeasurement[] = [];

  // Volume conversions
  if (unit === "tsp") {
    out.push({ value: quantity * 5, unit: "ml", exact: true });
    // Helpful also: tbsp
    out.push({ value: quantity / 3, unit: "tbsp", exact: true });
  }

  if (unit === "tbsp") {
    out.push({ value: quantity * 15, unit: "ml", exact: true });
    out.push({ value: quantity * 3, unit: "tsp", exact: true });
  }

  if (unit === "ml") {
    out.push({ value: quantity / 15, unit: "tbsp", exact: true });
    out.push({ value: quantity / 5, unit: "tsp", exact: true });
    if (quantity >= 1000) out.push({ value: quantity / 1000, unit: "l", exact: true });
  }

  if (unit === "l") {
    out.push({ value: quantity * 1000, unit: "ml", exact: true });
  }

  // Weight conversions
  if (unit === "g") {
    out.push({ value: quantity / 28.349523125, unit: "oz", exact: true });
    if (quantity >= 1000) out.push({ value: quantity / 1000, unit: "kg", exact: true });
    if (quantity >= 453.592) out.push({ value: quantity / 453.59237, unit: "lb", exact: true });
  }

  if (unit === "kg") {
    out.push({ value: quantity * 1000, unit: "g", exact: true });
    out.push({ value: (quantity * 1000) / 28.349523125, unit: "oz", exact: true });
    out.push({ value: (quantity * 1000) / 453.59237, unit: "lb", exact: true });
  }

  if (unit === "oz") {
    out.push({ value: quantity * 28.349523125, unit: "g", exact: true });
  }

  if (unit === "lb") {
    out.push({ value: quantity * 453.59237, unit: "g", exact: true });
  }

  // De-dupe units (keep first)
  const seen = new Set<string>();
  const deduped = out.filter((m) => {
    const key = (m.unit ?? "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Keep list short
  return deduped.slice(0, 3);
}


