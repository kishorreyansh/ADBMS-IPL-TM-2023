import {Avatar, Divider, ScrollArea} from '@mantine/core'
import {Link, NavLink, useLocation} from '@remix-run/react'
import {Menu} from 'lucide-react'
import * as React from 'react'
import {useEffect, useState, type ReactNode} from 'react'
import {LogoutButton} from '~/components/LogoutButton'
import {useUser} from '~/utils/hooks'
import {cn, getInitials} from '~/utils/misc'

export type NavMenuItem = {
	title?: string
	items: {
		name: string
		href: string
		icon: ReactNode
	}[]
}

export type NavMenuItems = NavMenuItem[]

type NavProps = {
	menuItems: NavMenuItems
}

export function Nav(props: NavProps) {
	const {menuItems} = props
	const [showSidebar, setShowSidebar] = useState(false)

	const user = useUser()
	const location = useLocation()

	useEffect(() => {
		setShowSidebar(false)
	}, [location.pathname])

	return (
		<>
			<button
				className={cn('fixed z-20 sm:hidden', showSidebar && 'right-7 top-7')}
				onClick={() => setShowSidebar(!showSidebar)}
			>
				<Menu width={20} />
			</button>

			<div
				className={cn(
					'fixed z-10 flex h-full w-full transform flex-col gap-4 py-3 pl-3 transition-all sm:w-64 sm:translate-x-0',
					showSidebar ? 'translate-x-0' : '-translate-x-full'
				)}
			>
				<div className="flex h-full flex-col rounded-xl bg-stone-900 p-4 ring-1 ring-stone-700">
					<Link
						to="/"
						prefetch="intent"
						className="relative flex cursor-pointer items-center gap-4 py-1.5"
					>
						<Avatar
							src={null}
							alt="IPL Ticket Master"
							size="md"
							classNames={{
								placeholder: 'text-xl text-stone-700',
								root: 'h-8 flex items-center justify-center',
							}}
						>
							A
						</Avatar>

						<span className="font-cal text-xl tracking-wide text-gray-200">
							IPL TM
						</span>
					</Link>

					<ScrollArea classNames={{root: 'flex-1 mt-8'}}>
						<div className="flex flex-col gap-4">
							{menuItems.map(({title, items}, idx) => {
								const showDivider = idx !== menuItems.length - 1

								return (
									<React.Fragment key={idx}>
										<div className="flex flex-col gap-1">
											{title && (
												<p className="text-xss font-semibold uppercase text-gray-300">
													{title}
												</p>
											)}

											<div className="flex flex-col gap-1">
												{items.map(({name, href, icon}) => (
													<NavLink
														key={name}
														to={href}
														end
														prefetch="intent"
														className={({isActive}) =>
															cn(
																'flex items-center space-x-3 rounded-lg px-2 py-1.5 text-gray-300 transition-all duration-150 ease-in-out hover:bg-stone-700 active:bg-stone-800',
																isActive && 'bg-stone-700 text-gray-100'
															)
														}
													>
														{icon}
														<span className="text-sm font-medium">{name}</span>
													</NavLink>
												))}
											</div>
										</div>

										{showDivider && <Divider />}
									</React.Fragment>
								)
							})}
						</div>
					</ScrollArea>

					<div>
						<div className="my-2 border-t border-stone-700" />
						<div className="flex w-full items-center justify-between">
							<div className="flex w-full flex-1 items-center space-x-3 truncate rounded-lg px-2 py-1.5 text-white">
								<Avatar
									src={undefined}
									alt={`${user.name}'s avatar`}
									radius="xl"
									color="dark"
									size={32}
								>
									{getInitials(user.name)}
								</Avatar>
								<span className="truncate text-sm font-medium">
									{user.name}
								</span>
							</div>

							<LogoutButton />
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
