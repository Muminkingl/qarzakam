import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useUserPlan = (userId) => {
  const [planData, setPlanData] = useState({
    isPremium: false,
    loanCount: 0,
    maxLoans: 10,
    loading: true,
    error: null,
    canAddMore: true
  });

  useEffect(() => {
    const fetchPlanData = async () => {
      if (!userId) return;

      try {
        // Get user's subscription status
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        // Get loan count
        const { data: loans, error: loansError } = await supabase
          .from('loans')
          .select('id')
          .eq('user_id', userId);

        if (loansError) throw loansError;

        const currentLoanCount = loans?.length || 0;
        const isUserPremium = !!subscription;
        const maxAllowedLoans = isUserPremium ? Infinity : 10;

        // Strict check for canAddMore
        const canAddMore = isUserPremium || currentLoanCount < maxAllowedLoans;

        setPlanData({
          isPremium: isUserPremium,
          loanCount: currentLoanCount,
          maxLoans: maxAllowedLoans,
          loading: false,
          error: null,
          canAddMore: canAddMore // This is now strictly enforced
        });
      } catch (error) {
        setPlanData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load plan data',
          canAddMore: false
        }));
      }
    };

    fetchPlanData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('loans')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'loans',
          filter: `user_id=eq.${userId}`
        }, 
        fetchPlanData
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return planData;
}; 