export const grievanceCategories = [
    {
        id: 'academics',
        name: 'Academics',
        color: '#8B5CF6',
        icon: 'book',
        subcategories: [
            'Faculty behavior or teaching issues',
            'Attendance discrepancies',
            'Internal marks / lab marks disputes',
            'Syllabus coverage or delay',
            'Exam schedule or revaluation issues',
            'Subject change or elective confusion',
            'Class timing clash',
        ],
    },
    {
        id: 'administrative',
        name: 'Administrative',
        color: '#F59E0B',
        icon: 'file-text',
        subcategories: [
            'Fee payment or refund issues',
            'Bonafide / certificate requests',
            'ID card or document correction',
            'Department coordination issues',
            'Late form submissions',
            'Internship or training approvals',
        ],
    },
    {
        id: 'technical',
        name: 'Technical',
        color: '#6366F1',
        icon: 'cpu',
        subcategories: [
            'Website / portal login issues',
            'Server downtime / form not loading',
            'Email or Wi-Fi not working',
            'College ERP or attendance portal bugs',
            'Lab system malfunction',
            'Network connectivity issues',
        ],
    },
    {
        id: 'hostel',
        name: 'Hostel',
        color: '#06B6D4',
        icon: 'home',
        subcategories: [
            'Room allocation or change request',
            'Water or electricity issue',
            'Mess food quality or timing',
            'Warden / staff behavior',
            'Cleanliness or maintenance delay',
            'Security / curfew concerns',
        ],
    },
    {
        id: 'library',
        name: 'Library',
        color: '#10B981',
        icon: 'book-open',
        subcategories: [
            'Book availability or delay in issue',
            'Library card problems',
            'Fine disputes',
            'System login issues',
            'Reading area maintenance',
        ],
    },
    {
        id: 'transport',
        name: 'Transport',
        color: '#F43F5E',
        icon: 'truck',
        subcategories: [
            'Bus timing / delay',
            'Route change request',
            'Driver / staff behavior',
            'Vehicle condition / seating issue',
            'Pass renewal or lost pass',
        ],
    },
    {
        id: 'canteen',
        name: 'Canteen / Food',
        color: '#EAB308',
        icon: 'coffee',
        subcategories: [
            'Food quality or hygiene issue',
            'Overpricing or billing error',
            'Menu variety / nutrition concern',
            'Staff misbehavior',
            'Waste management',
        ],
    },
    {
        id: 'security',
        name: 'Security',
        color: '#3B82F6',
        icon: 'shield',
        subcategories: [
            'Lost belongings',
            'Entry / exit disputes',
            'ID verification problems',
            'Misbehavior / harassment complaint',
            'Emergency response delay',
        ],
    },
    {
        id: 'cleanliness',
        name: 'Cleanliness / Maintenance',
        color: '#22C55E',
        icon: 'trash-2',
        subcategories: [
            'Washroom cleaning',
            'Classroom / corridor cleaning',
            'Garden or campus waste',
            'Equipment repair delay',
            'Pest control needed',
        ],
    },
    {
        id: 'others',
        name: 'Others',
        color: '#94A3B8',
        icon: 'tag',
        subcategories: [
            'Suggestions / improvements',
            'Event management complaints',
            'Student club / fest issues',
            'Power cut or water outage',
            'Other unspecified concern',
        ],
    },
];

export const hostels = [
    'Boys Hostel 1',
    'Boys Hostel 2',
    'Boys Hostel 3',
    'Boys Hostel 4',
    'Boys Hostel 5',
    'Girls Hostel 1',
];

/**
 * Normalizes hostel name to standard format
 * Handles case variations and extra spaces
 * @param hostelName - Raw hostel name from database
 * @returns Normalized hostel name or null if invalid
 */
export const normalizeHostelName = (hostelName: string | null | undefined): string | null => {
    if (!hostelName) return null;

    // Trim and normalize spaces
    const normalized = hostelName.trim().replace(/\s+/g, ' ');

    // Find exact match (case-insensitive)
    const match = hostels.find(h => h.toLowerCase() === normalized.toLowerCase());

    return match || normalized; // Return standardized version or original if no match
};

/**
 * Checks if a hostel name is valid
 * @param hostelName - Hostel name to validate
 * @returns true if valid hostel name
 */
export const isValidHostel = (hostelName: string | null | undefined): boolean => {
    if (!hostelName) return false;
    const normalized = hostelName.trim().toLowerCase();
    return hostels.some(h => h.toLowerCase() === normalized);
};

/**
 * Gets hostel type (Boys/Girls)
 * @param hostelName - Hostel name
 * @returns 'boys' | 'girls' | null
 */
export const getHostelType = (hostelName: string | null | undefined): 'boys' | 'girls' | null => {
    if (!hostelName) return null;
    const normalized = hostelName.toLowerCase();
    if (normalized.includes('boys')) return 'boys';
    if (normalized.includes('girls')) return 'girls';
    return null;
};
