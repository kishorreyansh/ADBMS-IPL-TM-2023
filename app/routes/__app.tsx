import type {LoaderArgs, SerializeFrom} from '@remix-run/node'
import {json, redirect} from '@remix-run/node'
import {Outlet} from '@remix-run/react'
import {LayoutDashboardIcon, ReceiptIcon, TicketIcon} from 'lucide-react'
import {Nav, NavMenuItems} from '~/components/Nav'
import {getAllUpcomingFixtures} from '~/lib/fixture.server'
import {getOrdersById} from '~/lib/order.server'
import {getAudiencePayments} from '~/lib/payment.server'
import {isAdmin, requireUserId} from '~/session.server'

export type AppLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const audienceId = await requireUserId(request)

	if (await isAdmin(request)) {
		return redirect('/admin')
	}

	const fixtures = await getAllUpcomingFixtures()
	const orders = await getOrdersById(audienceId)
	const payments = await getAudiencePayments(audienceId)

	return json({
		fixtures,
		orders,
		payments,
	})
}
const navMenu: NavMenuItems = [
	{
		items: [
			{
				name: 'Overview',
				href: `/`,
				icon: <LayoutDashboardIcon width={18} />,
			},
			{
				name: 'My Tickets',
				href: `/tickets`,
				icon: <TicketIcon width={18} />,
			},
			{
				name: 'Payments',
				href: `/payment-history`,
				icon: <ReceiptIcon width={18} />,
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
