import Link from 'next/link';
import Image from 'next/image';

export function ContentCard({ item }: { item: any }) {
  return (
    <Link
      href={`/contents/${item.slug}`}
      className="block rounded-xl overflow-hidden bg-white"
      style={{ boxShadow: '0 1px 4px rgba(20,23,31,0.08)' }}
    >
      {item.cover_image && (
        <div className="relative w-full" style={{ aspectRatio: '3/4' }}>
          <Image src={item.cover_image} alt={item.title || ''} fill className="object-cover" />
        </div>
      )}
      <div className="p-2.5">
        <div className="text-sm font-medium line-clamp-2" style={{ color: '#14171F' }}>{item.title}</div>
        {item.excerpt && <div className="text-xs text-gray-400 line-clamp-2 mt-1">{item.excerpt}</div>}
      </div>
    </Link>
  );
}