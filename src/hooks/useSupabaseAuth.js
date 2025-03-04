import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

export function useSupabaseAuth() {
  const { user } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;

      try {
        // First check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!existingUser) {
          // Create user if doesn't exist
          const { error: createError } = await supabase
            .from('users')
            .insert([
              {
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                full_name: `${user.firstName} ${user.lastName}`.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);

          if (createError) {
            console.error('Error creating user in Supabase:', createError);
          }
        }
      } catch (error) {
        console.error('Error syncing user:', error);
      }
    };

    syncUser();
  }, [user]);

  return user;
} 