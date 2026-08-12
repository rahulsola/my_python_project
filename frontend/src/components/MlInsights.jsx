import { useEffect, useState } from "react";
import API from "../api/userApi";

export default function MlInsights({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await API.get("/ml/stock-insights");
      setData(response.data);
    } catch (error) {
      showToast("Failed to load ML insights", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleRetrain = async () => {
    setTraining(true);
    try {
      const response = await API.post("/ml/retrain");
      showToast(response.data.message, response.data.trained ? "success" : "error");
      await loadInsights();
    } catch (error) {
      showToast("Failed to retrain model", "error");
    } finally {
      setTraining(false);
    }
  };

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
            Simple machine learning that flags products likely to run low on stock.
          </p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={training}
          className="px-5 py-2.5 bg-white text-violet-700 rounded-xl text-sm font-bold shadow-md hover:bg-violet-50 disabled:opacity-60 cursor-pointer"
        >
          {training ? "Training..." : "Retrain Model"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Model Status</p>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {data?.model_available ? "Trained" : "Rule-based"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Threshold: stock &lt; {data?.threshold}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">At Risk</p>
          <p className="text-2xl font-black text-rose-600 mt-2">{data?.low_stock_count || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Products flagged as low stock</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
          <p className="text-2xl font-black text-slate-800 mt-2">{data?.total_products || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Analyzed by the model</p>
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
