import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Grid, Save, Palette, Type, Hash, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassCard, GlassCardContent } from '../components/ui/GlassCard'
import { GlassInput } from '../components/ui/GlassInput'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassModal } from '../components/ui/GlassModal'
import { supabase } from '../lib/supabase'
import { PageTransition, StaggerItem } from '../components/ui/PageTransition'
import { cn } from '../utils/cn'

interface Subcategory {
    id: string;
    category_id: string;
    name: string;
    is_active: boolean;
}

interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    is_active: boolean; // Added is_active
    subcategories?: Subcategory[];
}

const CategoryManagement = () => {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
    const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null)
    const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)

    const totalCategories = categories.length
    const activeCategories = categories.filter(c => c.is_active).length
    const totalSubcategories = categories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0)
    const activeSubcategories = categories.reduce((acc, c) => acc + (c.subcategories?.filter(s => s.is_active).length || 0), 0)

    useEffect(() => {
        fetchData();

        // Realtime subscription for Admin Panel
        const categoryChannel = supabase
            .channel('admin-category-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(categoryChannel);
        };
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*, subcategories(*)')
                .order('name')

            if (catError) throw catError
            setCategories(catData || [])
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleCategory = async (category: Category) => {
        // Optimistic update
        const previousCategories = [...categories]
        setCategories(prev => prev.map(c =>
            c.id === category.id ? { ...c, is_active: !c.is_active } : c
        ))

        try {
            const { error } = await supabase
                .from('categories')
                .update({ is_active: !category.is_active })
                .eq('id', category.id)

            if (error) throw error
        } catch (error) {
            console.error('Error toggling category:', error)
            setCategories(previousCategories) // Revert on error
            alert('Failed to update category status')
        }
    }

    const handleToggleSubcategory = async (subcategory: Subcategory) => {
        // Optimistic update
        const previousCategories = [...categories];
        setCategories(prev => prev.map(c => ({
            ...c,
            subcategories: c.subcategories?.map(s =>
                s.id === subcategory.id ? { ...s, is_active: !s.is_active } : s
            )
        })));

        try {
            const { error } = await supabase
                .from('subcategories')
                .update({ is_active: !subcategory.is_active })
                .eq('id', subcategory.id)

            if (error) throw error
        } catch (error) {
            console.error('Error toggling subcategory:', error)
            setCategories(previousCategories) // Revert on error
            alert('Failed to update subcategory status')
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Are you sure? This will delete all associated subcategories!')) return
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (error) {
            alert('Failed to delete category. Ensure it has no active grievances.')
        }
    }

    const handleDeleteSubcategory = async (id: string) => {
        if (!confirm('Are you sure?')) return
        try {
            const { error } = await supabase.from('subcategories').delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (error) {
            alert('Failed to delete subcategory.')
        }
    }

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const data = Object.fromEntries(formData.entries())

        try {
            if (editingCategory) {
                const { error } = await supabase.from('categories').update(data).eq('id', editingCategory.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('categories').insert([data])
                if (error) throw error
            }
            setIsCategoryModalOpen(false)
            setEditingCategory(null)
            fetchData()
        } catch (error) {
            alert('Failed to save category')
        }
    }

    const handleSaveSubcategory = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const data = Object.fromEntries(formData.entries())

        try {
            if (editingSubcategory) {
                const { error } = await supabase.from('subcategories').update(data).eq('id', editingSubcategory.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('subcategories').insert([{ ...data, category_id: targetCategoryId }])
                if (error) throw error
            }
            setIsSubcategoryModalOpen(false)
            setEditingSubcategory(null)
            fetchData()
        } catch (error) {
            alert('Failed to save subcategory')
        }
    }

    return (
        <PageTransition className="space-y-8 max-w-[1400px] mx-auto p-4 3xl:p-8">
            <StaggerItem>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl 3xl:text-6xl font-black text-slate-900 tracking-tight">Classification Hub</h1>
                        <p className="text-slate-500 font-bold mt-2 text-sm uppercase tracking-wider opacity-60">
                            {activeCategories} out of {totalCategories} categories & {activeSubcategories} out of {totalSubcategories} sub-areas are live
                        </p>
                    </div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <GlassButton
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-[1.25rem] px-8 h-14 shadow-2xl shadow-slate-200/50 3xl:h-18 3xl:px-12 3xl:text-xl"
                            onClick={() => {
                                setEditingCategory(null)
                                setIsCategoryModalOpen(true)
                            }}
                        >
                            <Plus className="h-5 w-5 3xl:h-7 3xl:w-7 mr-2" />
                            New Category
                        </GlassButton>
                    </motion.div>
                </div>
            </StaggerItem>

            <div className="flex flex-col gap-6">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-64 rounded-[2.5rem] bg-slate-100 animate-pulse" />
                        ))
                    ) : (
                        categories.map((cat) => (
                            <StaggerItem key={cat.id}>
                                <GlassCard
                                    className="rounded-[2.5rem] border-slate-200 shadow-xl transition-all duration-500 hover:shadow-2xl overflow-hidden"
                                >
                                    <GlassCardContent className="p-0">
                                        <div
                                            className="p-6 3xl:p-10 cursor-pointer transition-colors hover:bg-white/50"
                                            onClick={() => setExpandedCategoryId(expandedCategoryId === cat.id ? null : cat.id)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={cn(
                                                            "w-14 h-14 3xl:w-20 3xl:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all",
                                                            !cat.is_active && "grayscale opacity-50"
                                                        )}
                                                        style={{ backgroundColor: cat.color + '20' }}
                                                    >
                                                        <Grid style={{ color: cat.color }} className="w-6 h-6 3xl:w-10 3xl:h-10" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className={cn(
                                                                "text-xl 3xl:text-3xl font-black transition-colors",
                                                                cat.is_active ? "text-slate-800" : "text-slate-400"
                                                            )}>
                                                                {cat.name}
                                                            </h3>
                                                        </div>
                                                        <span className="text-[10px] 3xl:text-sm font-black text-slate-400 uppercase tracking-widest">
                                                            {cat.subcategories?.length || 0} Sub-areas Defined
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleToggleCategory(cat)
                                                            }}
                                                            className={cn(
                                                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                                                cat.is_active ? "bg-teal-500" : "bg-slate-200"
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                                    cat.is_active ? "translate-x-6" : "translate-x-1"
                                                                )}
                                                            />
                                                        </button>
                                                        <div className="h-6 w-px bg-slate-100" />
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setEditingCategory(cat)
                                                                    setIsCategoryModalOpen(true)
                                                                }}
                                                                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-teal-600 transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4 3xl:w-6 3xl:h-6" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteCategory(cat.id)
                                                                }}
                                                                className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4 3xl:w-6 3xl:h-6" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <motion.div
                                                        animate={{ rotate: expandedCategoryId === cat.id ? 180 : 0 }}
                                                        className="p-2 bg-slate-50 rounded-xl text-slate-400 border border-slate-100"
                                                    >
                                                        <ChevronDown className="w-5 h-5 3xl:w-7 3xl:h-7" />
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedCategoryId === cat.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden bg-slate-50/30 border-t border-slate-100"
                                                >
                                                    <div className="p-6 3xl:p-10 space-y-4">
                                                        <div className="space-y-3">
                                                            {cat.subcategories?.map(sub => (
                                                                <motion.div
                                                                    key={sub.id}
                                                                    layout
                                                                    className="flex items-center justify-between p-3 3xl:p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-200 transition-all group shadow-sm"
                                                                >
                                                                    <span className={cn(
                                                                        "font-bold text-sm 3xl:text-lg transition-colors",
                                                                        sub.is_active ? "text-slate-700" : "text-slate-400 line-through decoration-2"
                                                                    )}>
                                                                        {sub.name}
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-4">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    handleToggleSubcategory(sub)
                                                                                }}
                                                                                className={cn(
                                                                                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                                                                                    sub.is_active ? "bg-teal-500" : "bg-slate-200"
                                                                                )}
                                                                            >
                                                                                <span
                                                                                    className={cn(
                                                                                        "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                                                                        sub.is_active ? "translate-x-5" : "translate-x-1"
                                                                                    )}
                                                                                />
                                                                            </button>
                                                                            <div className="h-4 w-px bg-slate-100" />
                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        setEditingSubcategory(sub)
                                                                                        setTargetCategoryId(cat.id)
                                                                                        setIsSubcategoryModalOpen(true)
                                                                                    }}
                                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all"
                                                                                >
                                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        handleDeleteSubcategory(sub.id)
                                                                                    }}
                                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setTargetCategoryId(cat.id)
                                                                setEditingSubcategory(null)
                                                                setIsSubcategoryModalOpen(true)
                                                            }}
                                                            className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/30 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            Append Sub-area
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </GlassCardContent>
                                </GlassCard>
                            </StaggerItem>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Category Modal */}
            <GlassModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                title={editingCategory ? 'Edit Category' : 'New Classification'}
            >
                <form onSubmit={handleSaveCategory} className="p-8 space-y-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                <Type className="w-3 h-3" /> Category Identity
                            </label>
                            <GlassInput
                                name="name"
                                defaultValue={editingCategory?.name}
                                placeholder="e.g. Infrastructure, Hostels..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    <Palette className="w-3 h-3" /> Theme Color
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        name="color"
                                        defaultValue={editingCategory?.color || '#0d9488'}
                                        className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                                    />
                                    <GlassInput
                                        name="color"
                                        defaultValue={editingCategory?.color || '#0d9488'}
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    <Grid className="w-3 h-3" /> Icon Glyph
                                </label>
                                <GlassInput
                                    name="icon"
                                    defaultValue={editingCategory?.icon || 'grid'}
                                    placeholder="Icon name (lucide)"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <GlassButton type="button" variant="secondary" className="flex-1" onClick={() => setIsCategoryModalOpen(false)}>Discard</GlassButton>
                        <GlassButton type="submit" className="flex-1 bg-slate-900 text-white">
                            <Save className="w-4 h-4 mr-2" /> Commit
                        </GlassButton>
                    </div>
                </form>
            </GlassModal>

            {/* Subcategory Modal */}
            <GlassModal
                isOpen={isSubcategoryModalOpen}
                onClose={() => setIsSubcategoryModalOpen(false)}
                title={editingSubcategory ? 'Redefine Area' : 'New Logical Area'}
            >
                <form onSubmit={handleSaveSubcategory} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            <Hash className="w-3 h-3" /> Specific Sub-area Name
                        </label>
                        <GlassInput
                            name="name"
                            defaultValue={editingSubcategory?.name}
                            placeholder="e.g. Water Supply, Lab Equipment..."
                            required
                        />
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <GlassButton type="button" variant="secondary" className="flex-1" onClick={() => setIsSubcategoryModalOpen(false)}>Discard</GlassButton>
                        <GlassButton type="submit" className="flex-1 bg-slate-900 text-white">
                            <Save className="w-4 h-4 mr-2" /> Save Area
                        </GlassButton>
                    </div>
                </form>
            </GlassModal>
        </PageTransition>
    )
}

export default CategoryManagement
