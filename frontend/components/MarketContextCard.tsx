import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";

export interface MarketContext {
  crop_price_per_kg: number;
  avg_yield: number;
  yield_unit: string;
  total_crop_value_bdt: number;
  estimated_loss_pct: number;
  estimated_loss_bdt: number;
  treatment_cost_bdt: number;
  recommended_product: string;
  net_saving_bdt: number;
  worth_treating: boolean;
  verdict: string;
}

interface Props {
  marketContext: MarketContext;
}

export default function MarketContextCard({ marketContext }: Props) {
  const {
    crop_price_per_kg,
    avg_yield,
    yield_unit,
    total_crop_value_bdt,
    estimated_loss_pct,
    estimated_loss_bdt,
    treatment_cost_bdt,
    recommended_product,
    net_saving_bdt,
    worth_treating,
    verdict,
  } = marketContext;

  const formatBDT = (num: number) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-25 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
            <TrendingUp size={20} className="text-blue-600" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Treatment Value Analysis</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            worth_treating
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-amber-100 text-amber-700 border-amber-200"
          }`}
        >
          {worth_treating ? (
            <>
              <CheckCircle2 size={12} strokeWidth={2.5} />
              Worth Treating
            </>
          ) : (
            <>
              <AlertCircle size={12} strokeWidth={2.5} />
              Marginal Value
            </>
          )}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-5 space-y-5">

        {/* Metrics Grid (3 cards) */}
        <div className="grid grid-cols-3 gap-3">
          {/* Crop Value */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Crop Value</p>
            <p className="text-lg font-bold text-gray-900">{formatBDT(total_crop_value_bdt)}</p>
            <p className="text-xs text-gray-400 mt-1">
              {crop_price_per_kg}৳/kg × {avg_yield} {yield_unit.split("/")[0]}
            </p>
          </div>

          {/* Estimated Loss */}
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-center">
            <p className="text-xs font-medium text-red-600 mb-1">Est. Loss</p>
            <p className="text-lg font-bold text-red-700">{formatBDT(estimated_loss_bdt)}</p>
            <p className="text-xs text-red-500 mt-1">{estimated_loss_pct}% of crop value</p>
          </div>

          {/* Treatment Cost */}
          <div className="rounded-lg border border-primary-100 bg-primary-50 p-3 text-center">
            <p className="text-xs font-medium text-primary-600 mb-1">Treatment</p>
            <p className="text-lg font-bold text-primary-700">{formatBDT(treatment_cost_bdt)}</p>
            <p className="text-xs text-primary-500 mt-1">One-time cost</p>
          </div>
        </div>

        {/* Net Saving (Prominent) */}
        <div
          className={`rounded-xl border-2 p-6 text-center ${
            worth_treating
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
            Estimated Net Saving from Treatment
          </p>
          <p
            className={`text-4xl font-extrabold mb-1 ${
              worth_treating ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatBDT(net_saving_bdt)}
          </p>
          <p className="text-sm font-medium text-gray-600">
            {worth_treating ? "✓ Financially viable" : "⚠ Marginal returns"}
          </p>
        </div>

        {/* Verdict */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm italic text-blue-900 leading-relaxed">{verdict}</p>
        </div>

        {/* Recommended Product Badge */}
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 text-sm font-medium text-green-700">
            <CheckCircle2 size={14} strokeWidth={2.5} />
            Recommended: <span className="font-semibold">{recommended_product}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
