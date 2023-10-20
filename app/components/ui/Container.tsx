import {cn} from "~/utils/misc"

export function Container({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string
}) {
	return (
		<div className={cn("flex max-w-screen-xl flex-col gap-12 p-10", className)}>
			<div className="flex flex-col gap-8">{children}</div>
		</div>
	)
}
