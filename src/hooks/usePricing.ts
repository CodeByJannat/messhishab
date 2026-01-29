import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Pricing {
  monthly_price: number;
  yearly_price: number;
}

export function usePricing() {
  const [pricing, setPricing] = useState<Pricing>({ monthly_price: 20, yearly_price: 200 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('monthly_price, yearly_price')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setPricing({
          monthly_price: Number(data.monthly_price),
          yearly_price: Number(data.yearly_price),
        });
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => fetchPricing();

  return { pricing, isLoading, refetch };
}
