'use client';

import { useEffect } from 'react';

export function ContentViewTracker({ contentId }: { contentId: string }) {
  useEffect(() => {
    const key = `viewed_${contentId}`;
    const lastViewed = localStorage.getItem(key);
    const now = Date.now();

    if (lastViewed && now - parseInt(lastViewed) < 24 * 60 * 60 * 1000) {
      return;
    }

    fetch('/api/v1/track-content-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_id: contentId }),
    }).then((res) => {
      if (res.ok) localStorage.setItem(key, now.toString());
    }).catch(() => {});
  }, [contentId]);

  return null;
}
