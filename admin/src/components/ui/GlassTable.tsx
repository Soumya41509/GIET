import React from 'react'
import { cn } from '../../utils/cn'

const GlassTable = React.forwardRef<
    HTMLTableElement,
    React.HTMLAttributes<HTMLTableElement> & { containerClassName?: string }
>(({ className, containerClassName, ...props }, ref) => (
    <div className={cn("relative w-full overflow-auto scrollbar-hide rounded-xl border border-white/40 bg-white/30 backdrop-blur-md", containerClassName)}>
        <table
            ref={ref}
            className={cn('w-full caption-bottom text-sm text-left', className)}
            {...props}
        />
    </div>
))
GlassTable.displayName = 'GlassTable'

const GlassTableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b border-white/30 sticky top-0 z-10', className)} {...props} />
))
GlassTableHeader.displayName = 'GlassTableHeader'

const GlassTableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        className={cn('[&_tr:last-child]:border-0', className)}
        {...props}
    />
))
GlassTableBody.displayName = 'GlassTableBody'

const GlassTableRow = React.forwardRef<
    HTMLTableRowElement,
    React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        className={cn(
            'border-b border-white/30 transition-colors hover:bg-white/40 data-[state=selected]:bg-white/50',
            className
        )}
        {...props}
    />
))
GlassTableRow.displayName = 'GlassTableRow'

const GlassTableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            'h-12 px-4 text-left align-middle font-medium text-teal-900 [&:has([role=checkbox])]:pr-0',
            className
        )}
        {...props}
    />
))
GlassTableHead.displayName = 'GlassTableHead'

const GlassTableCell = React.forwardRef<
    HTMLTableCellElement,
    React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0 text-slate-700', className)}
        {...props}
    />
))
GlassTableCell.displayName = 'GlassTableCell'

export {
    GlassTable,
    GlassTableHeader,
    GlassTableBody,
    GlassTableHead,
    GlassTableRow,
    GlassTableCell,
}
