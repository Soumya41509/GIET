export interface Grievance {
    id: string
    title: string
    description?: string
    category: string
    subcategory?: string
    hostel?: string
    status: 'Submitted' | 'In Progress' | 'Resolved' | 'Rejected' | 'In-progress' | 'Reopened'
    created_at: string
    user_id?: string
    staff_id?: string
    image_url?: string
    video_url?: string
    priority?: string
    assigned_staff_id?: string
    current_step?: number
    escalation_deadline?: string
    flow_snapshot_id?: string
    updated_at?: string
    resolved_at?: string
    rejected_at?: string
    reopen_reason?: string
    reopen_proof_paths?: string[]
    is_manually_assigned?: boolean
}

export interface UserProfile {
    id: string
    name: string
    email: string
    role: string
    department?: string
}
