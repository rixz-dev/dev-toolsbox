'use client';
import { useState, useEffect, useCallback } from 'react';
import { Settings, DEFAULTS, loadSettings, saveSettings } from '@/lib/data';

export function useSettings() {
  const [cfg, setCfg] = useState<Settings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCfg(loadSettings());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveSettings(cfg);
  }, [cfg, mounted]);

  const update = useCallback((patch: Partial<Settings>) => {
    setCfg(prev => ({ ...prev, ...patch }));
  }, []);

  return { cfg, update, mounted };
}
