import * as React from 'react'
import {cn} from '~/utils/misc'

const TableRowContext = React.createContext<
	| {
			hasBorder: boolean
	  }
	| undefined
>(undefined)

function useTableRow() {
	const context = React.useContext(TableRowContext)
	if (!context) {
		throw new Error('Components must be rendered within a <Table> component')
	}
	return context
}

type TableProps = {
	children: React.ReactNode
	className?: string
} & React.DetailedHTMLProps<
	React.TableHTMLAttributes<HTMLTableElement>,
	HTMLTableElement
>

const Table = React.forwardRef<HTMLTableElement, TableProps>((props, ref) => {
	const {children, className, ...delegateProps} = props

	return (
		<table
			ref={ref}
			className={cn('min-w-full border-separate border-spacing-0', className)}
			{...delegateProps}
		>
			{children}
		</table>
	)
}) as React.ForwardRefExoticComponent<
	TableProps & React.RefAttributes<HTMLTableElement>
>

type TableRowProps = {
	children: React.ReactNode
	className?: string
	hasBorder?: boolean
} & React.DetailedHTMLProps<
	React.HTMLAttributes<HTMLTableRowElement>,
	HTMLTableRowElement
>

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
	(props, ref) => {
		const {
			children,
			className,
			hasBorder: hasBorderProp,
			...delegateProps
		} = props

		const [hasBorder] = React.useState(hasBorderProp ?? false)

		return (
			<TableRowContext.Provider value={{hasBorder}}>
				<tr ref={ref} className={className} {...delegateProps}>
					{children}
				</tr>
			</TableRowContext.Provider>
		)
	}
)

type TableBodyProps = {
	children: React.ReactNode
	className?: string
} & React.DetailedHTMLProps<
	React.HTMLAttributes<HTMLTableSectionElement>,
	HTMLTableSectionElement
>

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
	(props, ref) => {
		const {children, className, ...delegateProps} = props
		return (
			<tbody ref={ref} className={cn(className)} {...delegateProps}>
				{children}
			</tbody>
		)
	}
)

type TableTheadProps = {
	children: React.ReactNode | string
} & React.DetailedHTMLProps<
	React.HTMLAttributes<HTMLTableSectionElement>,
	HTMLTableSectionElement
>

const TableThead = React.forwardRef<HTMLTableSectionElement, TableTheadProps>(
	(props, ref) => {
		const {children, className, ...delegateProps} = props

		return (
			<thead ref={ref} className={cn(className)} {...delegateProps}>
				{children}
			</thead>
		)
	}
)

type TableThProps = {
	children: React.ReactNode | string
	/**
	 * Position of the table head
	 *
	 * @default middle
	 */
	pos?: 'first' | 'middle' | 'last'
	className?: string
} & React.DetailedHTMLProps<
	React.ThHTMLAttributes<HTMLTableCellElement>,
	HTMLTableCellElement
>

const TableTh = React.forwardRef<HTMLTableCellElement, TableThProps>(
	(props, ref) => {
		const {children, pos = 'middle', className, ...delegateProps} = props

		return (
			<th
				ref={ref}
				scope="col"
				className={cn(
					'sticky top-0 z-10 border-b border-gray-300 bg-stone-50 bg-opacity-75 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter',
					pos === 'first' && 'pl-4 pr-3 sm:pl-6 lg:pl-8',
					pos === 'middle' && 'hidden px-3 lg:table-cell',
					pos === 'last' && 'pl-3 pr-4 sm:pr-6 lg:pr-8',
					className
				)}
				{...delegateProps}
			>
				{children}
			</th>
		)
	}
)

type TableDataProps = {
	children?: React.ReactNode | string
	pos?: 'first' | 'middle' | 'last'
	hasBorder?: boolean
	className?: string
} & React.DetailedHTMLProps<
	React.ThHTMLAttributes<HTMLTableCellElement>,
	HTMLTableCellElement
>

const TableData = React.forwardRef<HTMLTableCellElement, TableDataProps>(
	(props, ref) => {
		const {
			children,
			pos = 'middle',
			hasBorder: hasBorderProp,
			className,
			...delegateProps
		} = props

		const context = useTableRow()
		const hasBorder = hasBorderProp ?? context.hasBorder

		return (
			<td
				ref={ref}
				className={cn(
					'whitespace-nowrap py-6 text-sm text-gray-500',
					pos === 'first' &&
						'pl-4 pr-3 font-medium text-gray-800 sm:pl-6 lg:pl-8',
					pos === 'middle' && 'hidden px-3 lg:table-cell',
					pos === 'last' &&
						'px-3 pl-3 pr-4 text-right font-medium sm:pr-8 lg:pr-8',
					hasBorder && 'border-b border-gray-200',
					className
				)}
				{...delegateProps}
			>
				{children}
			</td>
		)
	}
)

// TableThead = TableThead
// Table.Tr = TableRow
// TableTbody = TableBody
// Table.Th = TableTh
// Table.Td = TableData

export {
	Table,
	TableThead,
	TableRow as TableTr,
	TableBody,
	TableTh,
	TableData as TableTd,
}
