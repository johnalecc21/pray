import { useState, useCallback } from 'react';
import type { FeedTab } from '../types';

export function useFeed() {
  const [activeTab, setActiveTab] = useState<FeedTab>('Para ti');
  const [liked,     setLiked]     = useState<Record<string, boolean>>({});
  const [saved,     setSaved]     = useState<Record<string, boolean>>({});

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return { activeTab, setActiveTab, liked, saved, toggleLike, toggleSave };
}
