import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

export const useClerkSupabaseSync = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const syncUser = async () => {
        const { data, error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName,
            avatar_url: user.imageUrl,
            created_at: new Date().toISOString(),
          })
          .select();

        if (error) {
          console.error('Error syncing user:', error);
        }
      };

      syncUser();
    }
  }, [user, isLoaded]);
}; 