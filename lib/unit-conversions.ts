import { formatQuantity } from "@/lib/format-quantity";
import type { AlternativeMeasurement } from "@/lib/types";

type Unit =
  | "tsp"
  | "tbsp"
  | "ml"
  | "l"
  | "g"
  | "kg"
  | "oz"
  | "lb"
  | "dag"
  | "cup-pl";

function normalizeUnit(input: string): Unit | null {
  const u0 = input.trim().toLowerCase();
  const u = u0.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strip diacritics
  if (!u) return null;

  // volume
  if (u === "tsp" || u === "teaspoon" || u === "teaspoons") return "tsp";
  if (u === "tbsp" || u === "tablespoon" || u === "tablespoons") return "tbsp";
  if (u === "ml" || u === "milliliter" || u === "milliliters") return "ml";
  if (u === "l" || u === "lt" || u === "liter" || u === "liters") return "l";

  // Polish volume units (common)
  if (
    u === "lyzeczka" ||
    u === "lyzeczki" ||
    u === "lyzeczke" ||
    u === "lyzecz." ||
    u === "lyz." ||
    u === "lyzec"
  )
    return "tsp";
  if (
    u === "lyzka" ||
    u === "lyzki" ||
    u === "lyzke" ||
    u === "lyz." ||
    u === "lyzka." ||
    u === "lyz"
  )
    return "tbsp";
  if (u === "szklanka" || u === "szklanki" || u === "szkl.") return "cup-pl";

  // weight
  if (u === "g" || u === "gram" || u === "grams") return "g";
  if (u === "kg" || u === "kilogram" || u === "kilograms") return "kg";
  if (u === "oz" || u === "ounce" || u === "ounces") return "oz";
  if (u === "lb" || u === "lbs" || u === "pound" || u === "pounds") return "lb";
  if (u === "dag" || u === "dkg") return "dag";

  return null;
}

function isPolishUnitString(input: string): boolean {
  const s = input.toLowerCase();
  return (
    s.includes("ły") ||
    s.includes("lyz") ||
    s.includes("szkl") ||
    s.includes("szt") ||
    s.includes("dag") ||
    s.includes("dkg")
  );
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function formatAltValue(value: number, unit: string): string {
  const u = normalizeUnit(unit) ?? unit;

  // Metric units: prefer decimals, not fractions.
  if (u === "ml") {
    const rounded = value >= 50 ? roundTo(value, 1) : roundTo(value, 0.5);
    return rounded % 1 === 0
      ? `${rounded.toFixed(0)}`
      : `${rounded.toFixed(1).replace(/\.0$/, "")}`;
  }
  if (u === "l") {
    const rounded = roundTo(value, 0.01);
    return `${rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
  }
  if (u === "g") {
    const rounded = value >= 50 ? roundTo(value, 1) : roundTo(value, 0.5);
    return rounded % 1 === 0
      ? `${rounded.toFixed(0)}`
      : `${rounded.toFixed(1).replace(/\.0$/, "")}`;
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
  unitRaw: string
): AlternativeMeasurement[] {
  if (!Number.isFinite(quantity) || quantity <= 0) return [];
  const unit = normalizeUnit(unitRaw);
  if (!unit) return [];

  const prefersPolishUnits = isPolishUnitString(unitRaw);
  const out: AlternativeMeasurement[] = [];

  // Volume conversions
  if (unit === "tsp") {
    out.push({ quantity: quantity * 5, unit: "ml", exact: true, note: "" });
    if (prefersPolishUnits) {
      out.push({
        quantity: quantity / 3,
        unit: "łyżka",
        exact: true,
        note: "",
      });
    }
  }

  if (unit === "tbsp") {
    out.push({ quantity: quantity * 15, unit: "ml", exact: true, note: "" });
    if (prefersPolishUnits) {
      out.push({
        quantity: quantity * 3,
        unit: "łyżeczka",
        exact: true,
        note: "",
      });
    }
  }

  if (unit === "ml") {
    if (quantity >= 1000)
      out.push({ quantity: quantity / 1000, unit: "l", exact: true, note: "" });
    if (prefersPolishUnits && quantity < 250) {
      out.push({
        quantity: quantity / 15,
        unit: "łyżka",
        exact: true,
        note: "",
      });
      out.push({
        quantity: quantity / 5,
        unit: "łyżeczka",
        exact: true,
        note: "",
      });
    }
  }

  if (unit === "l") {
    out.push({ quantity: quantity * 1000, unit: "ml", exact: true, note: "" });
  }

  // Polish cup convention (typical: 1 szklanka ≈ 250 ml) — mark as estimate
  if (unit === "cup-pl") {
    out.push({
      quantity: quantity * 250,
      unit: "ml",
      exact: false,
      note: "typowo 1 szklanka ≈ 250 ml",
    });
  }

  // Weight conversions
  if (unit === "g") {
    if (quantity >= 1000)
      out.push({
        quantity: quantity / 1000,
        unit: "kg",
        exact: true,
        note: "",
      });
  }

  if (unit === "kg") {
    out.push({ quantity: quantity * 1000, unit: "g", exact: true, note: "" });
  }

  if (unit === "dag") {
    out.push({ quantity: quantity * 10, unit: "g", exact: true, note: "" });
  }

  if (unit === "oz") {
    out.push({
      quantity: quantity * 28.349523125,
      unit: "g",
      exact: true,
      note: "",
    });
  }

  if (unit === "lb") {
    out.push({
      quantity: quantity * 453.59237,
      unit: "g",
      exact: true,
      note: "",
    });
  }

  // De-dupe units (keep first)
  const seen = new Set<string>();
  const deduped = out.filter((m) => {
    const key = m.unit.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Keep list short
  return deduped.slice(0, 3);
}
