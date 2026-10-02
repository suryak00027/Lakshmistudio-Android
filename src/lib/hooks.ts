import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { Settings } from './types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    setSettings(data as Settings | null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { settings, loading, refetch: fetch, refetchSettings: fetch };
}

export function useSupabaseQuery<T>(
  table: string,
  select: string = '*',
  deps: unknown[] = []
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryKey = JSON.stringify(deps);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = supabase.from(table).select(select);
    const { data: result, error: err } = await q;
    if (err) {
      setError(err.message);
      setData([]);
    } else {
      setData((result || []) as T[]);
    }
    setLoading(false);
  }, [table, select, queryKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
