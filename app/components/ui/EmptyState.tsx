import {XIcon} from "lucide-react"

type EmptyStateProps = {
	label: string
	icon?: React.ReactNode
}
export function EmptyState(props: EmptyStateProps) {
	const {label, icon} = props
	return (
		<div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<div className="flex items-center justify-center">
				{icon ?? <XIcon size={70} className="text-gray-600" />}
			</div>
			<span className="mt-4 block text-sm font-semibold text-gray-500">
				{label}
			</span>
		</div>
	)
}
