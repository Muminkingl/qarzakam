import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export const setHeaders = (userId) => {
  if (userId) {
    supabase.functions.setAuth(userId);
    supabase.rest.headers = {
      ...supabase.rest.headers,
      'Authorization': `Bearer ${userId}`,
      'x-user-id': userId
    };
  }
}; 