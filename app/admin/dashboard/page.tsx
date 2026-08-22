export default function DashboardHomePage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">概览</h2>
      <p className="text-sm text-slate-500 mb-6">数据统计将在后续阶段接入</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">分类</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">—</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">商家</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">—</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm text-slate-500">内容</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">—</p>
        </div>
      </div>
    </div>
  );
}