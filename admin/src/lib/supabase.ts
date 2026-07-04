import { createClient } from '@supabase/supabase-js'

// Student Database - for Grievances, Timeline, Feedback
const supabaseUrl = import.meta.env.VITE_STUDENT_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_STUDENT_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Student Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
        schema: 'public',
    },
    global: {
        headers: {
            'x-client-info': 'giet-admin-panel',
        },
    },
})
