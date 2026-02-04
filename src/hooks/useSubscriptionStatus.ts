import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionStatus {
  isActive: boolean;
  isExpired: boolean;
  isReadOnly: boolean;
  canAccessData: boolean;
  daysRemaining: number;
  expiredDaysAgo: number;
  lastSubscriptionType: 'monthly' | 'yearly' | null;
  readOnlyMonths: number; // Number of months data is accessible in read-only mode
}

export function useSubscriptionStatus(): SubscriptionStatus {
  const { subscription } = useAuth();

  return useMemo(() => {
    const now = new Date();
    
    if (!subscription) {
      return {
        isActive: false,
        isExpired: false,
        isReadOnly: false,
        canAccessData: false,
        daysRemaining: 0,
        expiredDaysAgo: 0,
        lastSubscriptionType: null,
        readOnlyMonths: 0,
      };
    }

    const endDate = new Date(subscription.end_date);
    const startDate = new Date(subscription.start_date);
    const isActive = subscription.status === 'active' && endDate > now;
    const isExpired = !isActive && subscription.status !== 'cancelled';
    
    // Calculate days remaining or expired
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate subscription duration in months
    const subscriptionMonths = subscription.type === 'yearly' ? 12 : 1;
    
    // If expired, allow read-only access for the same duration as the subscription
    const expiredDaysAgo = isExpired ? Math.abs(diffDays) : 0;
    const maxReadOnlyDays = subscriptionMonths * 30; // Approximate
    const canAccessData = isActive || (isExpired && expiredDaysAgo <= maxReadOnlyDays);
    const isReadOnly = !isActive && canAccessData;

    return {
      isActive,
      isExpired,
      isReadOnly,
      canAccessData,
      daysRemaining: isActive ? diffDays : 0,
      expiredDaysAgo,
      lastSubscriptionType: subscription.type,
      readOnlyMonths: subscriptionMonths,
    };
  }, [subscription]);
}
