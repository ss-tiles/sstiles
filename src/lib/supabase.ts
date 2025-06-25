import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    'Missing REACT_APP_SUPABASE_URL environment variable. ' +
    'Please add your Supabase project URL to the .env file. ' +
    'You can find this in your Supabase dashboard under Settings > API.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing REACT_APP_SUPABASE_ANON_KEY environment variable. ' +
    'Please add your Supabase anon key to the .env file. ' +
    'You can find this in your Supabase dashboard under Settings > API.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 