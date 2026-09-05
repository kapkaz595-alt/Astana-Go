import Link from 'next/link';
import Image from 'next/image';

export function MerchantCard({ item }: { item: any }) {
  return (
    <Link
      href={`/merchants/${item.slug}`}
      className="block rounded-xl overflow-hidden bg-white"
      style={{ boxShadow: '0 1px 4px rgba(20,23,31,0.08)' }}
    >
      {item.cover_image && (
        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
          <Image src={item.cover_image} alt={item.name || ''} fill className="object-cover" />
          <span
            className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: item.is_open_now ? '#2B8C93' : '#9CA3AF' }}
          >
            {item.is_open_now ? '营业中' : '休息中'}
          </span>
        </div>
      )}
      <div className="p-2.5">
        <div className="text-sm font-medium" style={{ color: '#14171F' }}>{item.name}</div>
        <div className="flex items-center justify-between mt-1.5 text-xs">
          <span style={{ color: '#D9A441' }}>{item.price_range || ''}</span>
          <span className="flex items-center gap-1 text-gray-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {item.verification_status === 'verified' && <span style={{ color: '#2B8C93' }}>✓认证</span>}
            <span>👁 {item.view_count}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
