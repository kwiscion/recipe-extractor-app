// Format decimal quantities to nice fractions for display
export function formatQuantity(quantity: number, scale = 1): string {
  const scaled = quantity * scale

  if (scaled === 0) return ""

  // Handle whole numbers
  if (Number.isInteger(scaled)) {
    return scaled.toString()
  }

  // Common fractions
  const fractions: [number, string][] = [
    [0.125, "1/8"],
    [0.25, "1/4"],
    [0.333, "1/3"],
    [0.375, "3/8"],
    [0.5, "1/2"],
    [0.625, "5/8"],
    [0.666, "2/3"],
    [0.75, "3/4"],
    [0.875, "7/8"],
  ]

  const wholePart = Math.floor(scaled)
  const decimalPart = scaled - wholePart

  // Find closest fraction
  let closestFraction = ""
  let closestDiff = 1

  for (const [value, display] of fractions) {
    const diff = Math.abs(decimalPart - value)
    if (diff < closestDiff && diff < 0.05) {
      closestDiff = diff
      closestFraction = display
    }
  }

  if (closestFraction) {
    if (wholePart === 0) {
      return closestFraction
    }
    return `${wholePart} ${closestFraction}`
  }

  // Fallback to decimal with max 2 decimal places
  return scaled.toFixed(2).replace(/\.?0+$/, "")
}
