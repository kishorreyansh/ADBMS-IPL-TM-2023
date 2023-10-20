type OverviewCardProps = {
	name: string
	stat: number
}

export function OverviewCardContainer({children}: {children: React.ReactNode}) {
	return <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</dl>
}

export function OverviewCard(props: OverviewCardProps) {
	const {name, stat} = props

	return (
		<div
			className="px-4 py-5 sm:p-6 bg-white rounded-md ring-stone-300/50 shadow ring-1 ring-"
			key={name}
		>
			<dt className="text-base font-normal text-gray-900">{name}</dt>
			<dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
				<div className="flex items-baseline text-2xl font-semibold text-indigo-600">
					{stat}
				</div>
			</dd>
		</div>
	)
}
