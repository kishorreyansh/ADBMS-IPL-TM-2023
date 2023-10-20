type PageHeadingProps = {
	title: string
	rightSection?: React.ReactNode
}

export function PageHeading(props: PageHeadingProps) {
	const {title, rightSection} = props
	return (
		<div className="flex items-center justify-between">
			<h1 className="font-cal text-3xl font-bold">{title}</h1>
			{rightSection}
		</div>
	)
}
