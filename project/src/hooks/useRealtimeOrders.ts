import { useEffect } from 'react';
import { supabaseBrowser } from '@/lib/supabase';

export default function useRealtimeOrders(onUpdate: (payload: any) => void) {
  useEffect(() => {
    // Subscribe to INSERT and UPDATE events on the service_orders table
    const channel = supabaseBrowser
      .channel('service_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_orders' },
        (payload) => {
          console.log('Realtime order update:', payload);
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [onUpdate]);
}
