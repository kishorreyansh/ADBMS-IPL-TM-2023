import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Outlet} from '@remix-run/react'
import {
	Building2Icon,
	BuildingIcon,
	LayoutDashboardIcon,
	UserCog2Icon,
	UserCogIcon,
} from 'lucide-react'
import {Nav, type NavMenuItems} from '~/components/Nav'
import {db} from '~/db.server'
import {getAllFixtures} from '~/lib/fixture.server'
import {getAllOrders} from '~/lib/order.server'
import {getAllStadiums} from '~/lib/stadium.server'
import {getAllTeams} from '~/lib/team.server'
import {isAudience, requireUser} from '~/session.server'

export const ROUTE = '/admin'

export type AdminLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	await requireUser(request)

	if (await isAudience(request)) {
		throw redirect('/')
	}

	const [stadiums, teams, fixtures, orders, zones] = await Promise.all([
		getAllStadiums(),
		getAllTeams(),
		getAllFixtures(),
		getAllOrders(),
		await db.zone.findMany(),
	])

	return json({stadiums, teams, fixtures, orders, zones})
}

const navMenu: NavMenuItems = [
	{
		title: 'Manage',
		items: [
			{
				name: 'Overview',
				href: `${ROUTE}`,
				icon: <LayoutDashboardIcon width={18} />,
			},
			{
				name: 'Schedules',
				href: `${ROUTE}/fixtures`,
				icon: <UserCog2Icon width={18} />,
			},
			{
				name: 'Teams',
				href: `${ROUTE}/teams`,
				icon: <UserCogIcon width={18} />,
			},
			{
				name: 'Stadiums',
				href: `${ROUTE}/stadiums`,
				icon: <BuildingIcon width={18} />,
			},
			{
				name: 'Zones',
				href: `${ROUTE}/zones`,
				icon: <Building2Icon width={18} />,
			},
		],
	},
]

export default function AdminLayout() {
	return (
		<>
			<div>
				<Nav menuItems={navMenu} />

				<div className="min-h-screen bg-stone-50 sm:pl-64">
					<Outlet />
				</div>
			</div>
		</>
	)
}
