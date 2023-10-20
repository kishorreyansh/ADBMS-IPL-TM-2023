import {ArrowLeftIcon, DocumentChartBarIcon} from '@heroicons/react/24/solid'
import {Badge, Button, Popover} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import {OrderStatus, PaymentStatus} from '@prisma/client'
import type {ActionArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import invariant from 'tiny-invariant'
import {TailwindContainer} from '~/components/TailwindContainer'
import {cancelOrder} from '~/lib/order.server'
import {useAdminData} from '~/utils/hooks'
import {
	formatList,
	formatTime,
	orderStatusLookup,
	titleCase,
} from '~/utils/misc'

export const action = async ({request}: ActionArgs) => {
	const formData = await request.formData()

	const intent = formData.get('intent')?.toString()
	invariant(intent, 'Invalid intent')

	switch (intent) {
		case 'cancel-order': {
			const orderId = formData.get('orderId')?.toString()
			invariant(orderId, 'Invalid order id')

			return cancelOrder(orderId)
				.then(() => json({success: true}))
				.catch(e => {
					console.error(e)
					return json({success: false, error: e.message})
				})
		}

		default:
			return json({success: false, message: 'Invalid intent'}, {status: 400})
	}
}

export default function ManageOrders() {
	const {orders} = useAdminData()

	return (
		<>
			<TailwindContainer className="mt-16">
				<div className="px-4 sm:px-6 lg:px-8">
					<div className="sm:flex sm:items-center">
						<div>
							<Button
								leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
								variant="subtle"
								size="md"
								component={Link}
								to=".."
								pl={0}
								mb={20}
								color="gray"
							>
								Back
							</Button>
							<h1 className="text-3xl font-semibold text-gray-900">Orders</h1>
							<p className="mt-1 text-sm text-gray-700">
								View and manage all the orders placed
							</p>
						</div>
					</div>
					<div className="mt-8 flex flex-col">
						<div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
							<div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
								<div className="shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
									{orders.length > 0 ? (
										<table className="min-w-full divide-y divide-gray-300">
											<thead className="bg-gray-50">
												<tr>
													<th
														scope="col"
														className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
													>
														Name
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Fixture
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														No of tickets
													</th>
													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Amount
													</th>

													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Payment Status
													</th>

													<th
														scope="col"
														className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
													>
														Order Status
													</th>

													<th
														scope="col"
														className="relative py-3.5 pl-3 pr-4 sm:pr-6"
													></th>
												</tr>
											</thead>

											<tbody className="divide-y divide-gray-200 bg-white">
												{orders.map(order => (
													<OrderRow order={order} key={order.id} />
												))}
											</tbody>
										</table>
									) : (
										<div className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
											<DocumentChartBarIcon className="mx-auto h-9 w-9 text-gray-500" />
											<span className="mt-4 block text-sm font-medium text-gray-500">
												No order found. <br />
												Come back later.
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</TailwindContainer>
		</>
	)
}

function OrderRow({
	order,
}: {
	order: ReturnType<typeof useAdminData>['orders'][number]
}) {
	const fetcher = useFetcher()
	const [showSeats, handleShowSeats] = useDisclosure(false)

	const seats = order.tickets.map(t => t.seatNo)
	const isSubmitting = fetcher.state !== 'idle'
	const isOrderCompleted = order.status === OrderStatus.SUCCESS

	return (
		<tr key={order.id}>
			<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">{order.audience.name}</div>
					<div className="text-gray-500">{order.audience.email}</div>
				</div>
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				<div className="flex flex-col">
					<div className="font-medium text-gray-900">
						{order.schedule.teamOne.name} vs {order.schedule.teamTwo.name}
					</div>
					<div className="font-medium text-gray-500">
						{order.schedule.stadium.name}
					</div>
					<div className="text-gray-500">
						{formatTime(order.schedule.timeSlot?.start ?? new Date())} -{' '}
						{formatTime(order.schedule.timeSlot?.end ?? new Date())}
					</div>
				</div>
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				{order.noOfTickets.toString().padStart(2, '0')}
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				${order.payment?.amount.toFixed(2)}
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				<Badge
					className="max-w-min"
					variant="outline"
					fullWidth={false}
					color={
						order.payment?.status === PaymentStatus.PAID
							? 'green'
							: PaymentStatus.REFUNDED
							? 'red'
							: 'blue'
					}
				>
					{titleCase(order.payment?.status ?? '')}
				</Badge>
			</td>

			<td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
				<Badge
					className="max-w-min"
					variant="dot"
					fullWidth={false}
					color={order.status === OrderStatus.SUCCESS ? 'green' : 'red'}
				>
					{orderStatusLookup(order.status)}
				</Badge>
			</td>

			<td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-sm font-medium">
				<div className="flex items-center justify-end gap-2">
					<Popover
						width={200}
						position="bottom-start"
						withArrow
						shadow="md"
						opened={showSeats}
						disabled={!isOrderCompleted}
					>
						<Popover.Target>
							<Button
								onMouseEnter={() => handleShowSeats.open()}
								onMouseLeave={() => handleShowSeats.close()}
								variant="white"
								compact
								disabled={!isOrderCompleted}
							>
								View Seats
							</Button>
						</Popover.Target>
						<Popover.Dropdown
							sx={{pointerEvents: 'none'}}
							className="whitespace-normal break-words"
						>
							{formatList(seats)}
						</Popover.Dropdown>
					</Popover>

					<Button
						variant="white"
						compact
						color="red"
						loaderPosition="right"
						loading={isSubmitting}
						disabled={!isOrderCompleted}
						onClick={() =>
							fetcher.submit(
								{
									orderId: order.id,
									intent: 'cancel-order',
								},
								{
									method: 'post',
									replace: true,
								}
							)
						}
					>
						Cancel Order
					</Button>
				</div>
			</td>
		</tr>
	)
}
