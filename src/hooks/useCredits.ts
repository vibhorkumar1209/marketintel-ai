'use client';

import { useState, useEffect } from 'react';

interface CreditsData {
  balance: number;
  subscription?: {
    plan: string;
    status: string;
  };
  isLoading: boolean;
  error?: string;
}

export function useCredits() {
  const [data, setData] = useState<CreditsData>({
    balance: 0,
    isLoading: true,
  });

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits');
        if (res.ok) {
          const creditsData = await res.json();
          setData({
            balance: creditsData.balance,
            subscription: creditsData.subscription,
            isLoading: false,
          });
        } else {
          setData((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Failed to fetch credits',
          }));
        }
      } catch (err) {
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: 'An error occurred',
        }));
        console.error('Failed to fetch credits:', err);
      }
    };

    fetchCredits();
  }, []);

  return data;
}
