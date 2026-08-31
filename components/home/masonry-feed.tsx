'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MerchantCard } from './merchant-card';
import { ContentCard } from './content-card';

type FeedItem = { type: 'merchant' | 'content'; [key: string]: any };

export function MasonryFeed({ initialItems, initialHasMore }: { initialItems: FeedItem[]; initialHasMore: boolean }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  setItems(initialItems);
}, [initialItems]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/v1/feed?page=${nextPage}&page_size=6`);
    const json = await res.json();
    setItems((prev) => [...prev, ...json.data]);
    setPage(nextPage);
    setHasMore(json.pagination.has_more);
    setLoading(false);
  }, [page, hasMore, loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
     <div className="columns-2 md:columns-4 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
        {items.map((item) =>
          item.type === 'merchant' ? (
            <MerchantCard key={`m-${item.id}`} item={item} />
          ) : (
            <ContentCard key={`c-${item.id}`} item={item} />
          )
        )}
      </div>
      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {loading && <span className="text-xs" style={{ color: '#14171F99' }}>加载中…</span>}
        {!hasMore && !loading && <span className="text-xs text-gray-400">没有更多了</span>}
      </div>
    </div>
  );
}
