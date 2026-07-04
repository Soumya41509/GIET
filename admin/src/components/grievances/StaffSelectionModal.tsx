import React, { useState } from 'react';
import { Search, User, Check, Building2 } from 'lucide-react';
import { GlassModal } from '../ui/GlassModal';
import { cn } from '../../utils/cn';

interface StaffMember {
    id: string;
    name: string;
    department: string;
}

interface StaffSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (staffId: string) => void;
    staffList: StaffMember[];
    currentAssignedId?: string;
}

export const StaffSelectionModal: React.FC<StaffSelectionModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    staffList,
    currentAssignedId
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStaff = staffList.filter(staff =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <GlassModal
            isOpen={isOpen}
            onClose={onClose}
            title="Reassign Staff"
            className="max-w-md"
        >
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search staff by name or department..."
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50/50 border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500/40 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                    {filteredStaff.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm font-bold text-slate-400">No staff members found.</p>
                        </div>
                    ) : (
                        filteredStaff.map(staff => (
                            <button
                                key={staff.id}
                                onClick={() => {
                                    onSelect(staff.id);
                                    onClose();
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 group",
                                    currentAssignedId === staff.id
                                        ? "bg-teal-50 border-teal-200 shadow-sm"
                                        : "bg-white/40 border-white/60 hover:bg-white/80 hover:border-teal-200 hover:shadow-md"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                        currentAssignedId === staff.id ? "bg-teal-500 text-white" : "bg-teal-50 text-teal-600 group-hover:bg-teal-100"
                                    )}>
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className={cn(
                                            "text-sm font-black",
                                            currentAssignedId === staff.id ? "text-teal-900" : "text-slate-800"
                                        )}>
                                            {staff.name}
                                        </p>
                                        <div className="flex items-center gap-1.5 ">
                                            <Building2 className="h-3 w-3 text-slate-400" />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                {staff.department}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {currentAssignedId === staff.id && (
                                    <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center">
                                        <Check className="h-3.5 w-3.5 text-white" />
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="pt-2">
                    <p className="text-[10px] text-slate-400 font-bold leading-tight text-center px-4">
                        Manually reassigning will pause the automatic escalation chain for this specific grievance.
                    </p>
                </div>
            </div>
        </GlassModal>
    );
};
