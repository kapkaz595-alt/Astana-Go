import Link from 'next/link';

const EMERGENCY_NUMBERS = [
  { label: '统一报警', number: '112', desc: '免费拨打，支持哈萨克语/俄语调度', icon: '🚨', color: '#B54B3A' },
  { label: '警察', number: '102', desc: '盗窃、袭击、证件丢失等报案', icon: '👮', color: '#3C7FE0' },
  { label: '消防', number: '101', desc: '火灾及危险品/燃气泄漏', icon: '🚒', color: '#E85C6B' },
  { label: '急救', number: '103', desc: '医疗急救', icon: '🚑', color: '#2B8C93' },
  { label: '燃气应急', number: '104', desc: '燃气泄漏专线', icon: '🔥', color: '#D9A441' },
];

export default function EmergencyPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] max-w-[480px] mx-auto px-[18px] py-6">
      <Link href="/" className="text-sm text-[#6B7280] mb-4 inline-block">‹ 返回首页</Link>
      <h1 className="text-xl font-extrabold mb-1" style={{ fontFamily: 'Manrope' }}>紧急求助中心</h1>
      <p className="text-sm text-[#6B7280] mb-6">阿斯塔纳官方紧急电话，均可免费拨打</p>

      <div className="flex flex-col gap-3">
        {EMERGENCY_NUMBERS.map((item) => (
          <a
            key={item.number}
            href={`tel:${item.number}`}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-[#E7E9EE] shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 text-white"
                 style={{ background: item.color }}>
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-[15px]">{item.label}</div>
              <div className="text-xs text-[#6B7280] mt-[2px]">{item.desc}</div>
            </div>
            <div className="text-2xl font-extrabold tabular-nums" style={{ fontFamily: 'Manrope' }}>
              {item.number}
            </div>
          </a>
        ))}
      </div>

      <div className="mt-6 p-4 bg-[#FFF7EC] rounded-xl text-xs text-[#8B6D3A] leading-relaxed">
        ⚠️ 拨打112/101时用简短俄语/哈萨克语关键词（地点+事件类型），或请附近本地人协助沟通。虚假报警在哈萨克斯坦属违法行为，可能面临罚款。
      </div>
    </main>
  );
}