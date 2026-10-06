import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvpbbinwiyijamfndekr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cGJiaW53aXlpamFtZm5kZWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNTYwMzQsImV4cCI6MjEwNTczMjAzNH0.vLL0G_EwM-ZHYsM913m8-UW0kmuappeh3U4eR4NDito';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
