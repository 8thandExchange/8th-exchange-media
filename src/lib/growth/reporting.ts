import type { GrowthMeasurement, GrowthMetric } from "@/lib/growth/types";

export interface MetricResult {
  metric: GrowthMetric;
  latest: GrowthMeasurement | null;
  change: number | null;
  changePercent: number | null;
  progressPercent: number | null;
  targetMet: boolean | null;
}

function finiteOrNull(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

export function calculateMetricResult(
  metric: GrowthMetric,
  measurements: GrowthMeasurement[]
): MetricResult {
  const latest =
    [...measurements].sort(
      (a, b) =>
        new Date(b.period_end).getTime() - new Date(a.period_end).getTime()
    )[0] ?? null;
  if (!latest) {
    return {
      metric,
      latest: null,
      change: null,
      changePercent: null,
      progressPercent: null,
      targetMet: null,
    };
  }

  const change = latest.value - metric.baseline_value;
  const changePercent =
    metric.baseline_value === 0 ? null : finiteOrNull((change / metric.baseline_value) * 100);
  const range = metric.target_value - metric.baseline_value;
  const progressPercent =
    range === 0 ? null : finiteOrNull((change / range) * 100);
  const targetMet =
    metric.direction === "increase"
      ? latest.value >= metric.target_value
      : latest.value <= metric.target_value;

  return { metric, latest, change, changePercent, progressPercent, targetMet };
}

export function safeRatio(numerator: number | undefined, denominator: number | undefined): number | null {
  if (numerator === undefined || denominator === undefined || denominator === 0) return null;
  return finiteOrNull(numerator / denominator);
}

export function calculateCommercialMetrics(
  values: Partial<Record<"spend" | "leads" | "bookings" | "customers" | "revenue", number>>
) {
  return {
    costPerLead: safeRatio(values.spend, values.leads),
    costPerBooking: safeRatio(values.spend, values.bookings),
    customerAcquisitionCost: safeRatio(values.spend, values.customers),
    returnOnAdSpend: safeRatio(values.revenue, values.spend),
  };
}
