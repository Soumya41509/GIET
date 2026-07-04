import { createClient } from '@supabase/supabase-js'

// Admin Database - for Auth, Admins, Staff, Profiles
const supabaseUrl = import.meta.env.VITE_ADMIN_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_ADMIN_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Admin Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Student Database - for Grievance Data, Dashboard Stats
const studentSupabaseUrl = import.meta.env.VITE_STUDENT_SUPABASE_URL?.trim()
const studentSupabaseKey = import.meta.env.VITE_STUDENT_SUPABASE_ANON_KEY?.trim()

if (!studentSupabaseUrl || !studentSupabaseKey) {
    throw new Error('Missing Student Supabase environment variables')
}

export const studentSupabase = createClient(studentSupabaseUrl, studentSupabaseKey)
