import { useEffect, useState } from "react";
import API from "../api/userApi";

export default function MlInsights({ showToast }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const [insightsRes, statusRes] = await Promise.all([
        API.get("/ml/stock-insights"),
        API.get("/ml/status"),
      ]);
      setData(insightsRes.data);
      setStatus(statusRes.data);
    } catch (error) {
      showToast("Failed to load ML insights", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading ML insights...
      </div>
    );
  }

  const atRisk = data?.insights?.filter((item) => item.low_stock) || [];
  const healthy = data?.insights?.filter((item) => !item.low_stock) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-violet-700 to-purple-800 text-white rounded-2xl p-6 shadow-lg shadow-violet-700/10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">ML Stock Insights</h1>
          <p className="text-violet-100 text-sm mt-1">
            Predictions from a model trained offline and loaded once at server startup.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-300">Offline training</p>
        <p className="text-sm mt-2">
          Retrain manually in your terminal, then restart the backend to load the new model:
        </p>
        <code className="block mt-3 bg-slate-950 text-emerald-300 text-sm rounded-xl px-4 py-3 font-mono">
          {status?.train_command || "python -m app.ml.train_stock_model"}
        </code>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model Status</p>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {status?.model_loaded ? "Loaded" : "Rule-based"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {status?.model_loaded ? `${status.feature_count} features` : "No .pkl file loaded"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">At Risk</p>
          <p className="text-2xl font-black text-rose-600 mt-2">{data?.low_stock_count || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Products flagged as low stock</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
          <p className="text-2xl font-black text-slate-800 mt-2">{data?.total_products || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Threshold: stock &lt; {data?.threshold}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Trained</p>
          <p className="text-sm font-bold text-slate-800 mt-2">
            {status?.trained_at ? new Date(status.trained_at).toLocaleString() : "Not trained yet"}
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase">{status?.method || "rules"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-rose-50">
            <h2 className="font-bold text-rose-700">Low Stock Alerts</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {atRisk.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No low-stock products detected.</p>
            ) : (
              atRisk.map((item) => (
                <div key={item.product_id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.category || "Uncategorized"} · ${item.price} · {item.stock} in stock
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">{item.method}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50">
            <h2 className="font-bold text-emerald-700">Healthy Stock</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {healthy.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No healthy-stock products yet.</p>
            ) : (
              healthy.map((item) => (
                <div key={item.product_id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.category || "Uncategorized"} · ${item.price} · {item.stock} in stock
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">{item.method}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
