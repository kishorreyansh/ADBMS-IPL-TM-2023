import {
	Badge,
	Button,
	Group,
	Input,
	Modal,
	NumberInput,
	Popover,
	Select,
	Text,
} from '@mantine/core'
import {DatePicker} from '@mantine/dates'
import {useDisclosure} from '@mantine/hooks'
import type {Schedule, Zone} from '@prisma/client'
import {OrderStatus, PaymentMethod} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import {ListXIcon, Plus} from 'lucide-react'
import * as React from 'react'
import ReactInputMask from 'react-input-mask'
import {z} from 'zod'
import {EmptyState} from '~/components/ui/EmptyState'
import {PageHeading} from '~/components/ui/PageHeading'
import {
	Table,
	TableBody,
	TableTd,
	TableTh,
	TableThead,
	TableTr,
} from '~/components/ui/table'
import {createOrder} from '~/lib/order.server'
import {requireUserId} from '~/session.server'
import {useAppData} from '~/utils/hooks'
import {
	formatCurrency,
	formatDate,
	formatList,
	formatTime,
	orderStatusLookup,
	titleCase,
} from '~/utils/misc'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'
const CreateOrderSchema = z.object({
	fixtureId: z.string().min(1, 'Fixture is required'),
	zoneId: z.string().min(1, 'Zone is required'),
	noOfTickets: z.preprocess(
		Number,
		z.number().min(1, 'No of tickets is required')
	),
})

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof CreateOrderSchema>
}

export const action: ActionFunction = async ({request}) => {
	const audienceId = await requireUserId(request)
	const {fields, fieldErrors} = await validateAction(request, CreateOrderSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	return createOrder({
		audienceId,
		zoneId: fields.zoneId,
		fixtureId: fields.fixtureId,
		noOfTickets: fields.noOfTickets,
	})
		.then(() => json<ActionData>({success: true}))
		.catch(error => {
			console.error(error)
			return badRequest<ActionData>({success: false})
		})
}

export default function BuyTickets() {
	const id = React.useId()
	const fetcher = useFetcher<ActionData>()
	const {orders, fixtures} = useAppData()

	const [selectedFixtureId, setSelectedFixtureId] = React.useState<
		Schedule['id'] | null
	>(fixtures[0]?.id ?? null)

	const [selectedFixture, setSelectedFixture] =
		React.useState<typeof fixtures[number]>()
	const [noOfTickets, setNoOfTickets] = React.useState<number | undefined>(1)
	const [selectedZoneId, setSelectedZoneId] = React.useState<Zone['id'] | null>(
		null
	)

	const [isModalOpen, handleModal] = useDisclosure(false, {
		onClose: () => {
			setSelectedFixtureId(null)
			setNoOfTickets(1)
			setSelectedZoneId(null)
		},
	})

	const isSubmitting = fetcher.state !== 'idle'
	const totalPrice = React.useMemo(() => {
		if (!selectedFixture || !noOfTickets || !selectedZoneId) return 0

		const zone = selectedFixture.stadium.zones.find(
			z => z.id === selectedZoneId
		)

		if (!zone) return 0

		return zone.pricePerSeat * noOfTickets
	}, [selectedFixture, noOfTickets, selectedZoneId])

	const upcomingFixtures = React.useMemo(
		() =>
			fixtures.filter(fixture =>
				fixture.timeSlot?.date
					? new Date(fixture.timeSlot.date) > new Date()
					: false
			),
		[fixtures]
	)

	React.useEffect(() => {
		if (!selectedFixtureId) return
		setSelectedFixture(fixtures.find(f => f.id === selectedFixtureId))
	}, [selectedFixtureId, fixtures])

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	return (
		<>
			<div className="flex max-w-screen-xl flex-col gap-12 p-10">
				<div className="flex flex-col gap-8">
					<PageHeading
						title="My Tickets"
						rightSection={
							<Button
								color="dark"
								radius="md"
								onClick={() => handleModal.open()}
								leftIcon={<Plus size={18} />}
							>
								Create
							</Button>
						}
					/>

					{orders.length > 0 ? (
						<div className="flow-root">
							<div className="inline-block min-w-full py-2 align-middle">
								<Table>
									<TableThead>
										<TableTr>
											<TableTh pos="first">Ticket ID</TableTh>
											<TableTh>Match</TableTh>
											<TableTh>No of Tickets</TableTh>
											<TableTh>Total Price</TableTh>
											<TableTh>Status</TableTh>
											<TableTh pos="last">
												<span className="sr-only">Actions</span>
											</TableTh>
										</TableTr>
									</TableThead>
									<TableBody>
										{orders.map((order, idx) => (
											<TicketRow order={order} key={order.id} idx={idx} />
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					) : (
						<EmptyState
							label="No tickets have been purchased yet"
							icon={<ListXIcon size={70} className="text-gray-600" />}
						/>
					)}
				</div>
			</div>

			<Modal
				opened={isModalOpen}
				onClose={() => handleModal.close()}
				title="Buy tickets"
				centered
				overlayBlur={1.2}
				overlayOpacity={0.6}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<Select
							name="fixtureId"
							label="Fixture"
							itemComponent={SelectItem}
							value={selectedFixtureId}
							onChange={e => setSelectedFixtureId(e)}
							data={upcomingFixtures.map(f => ({
								fixtureDate: f.timeSlot?.date,
								fixtureStartTime: f.timeSlot?.start,
								fixtureEndTime: f.timeSlot?.end,
								stadium: f.stadium?.name,
								teamOne: f.teamOne?.name,
								teamTwo: f.teamTwo?.name,
								label: `${f.teamOne?.name} vs ${f.teamTwo?.name}`,
								value: f.id,
							}))}
							error={fetcher.data?.fieldErrors?.fixtureId}
							required
						/>

						<NumberInput
							name="noOfTickets"
							label="No of tickets"
							value={noOfTickets}
							onChange={e => setNoOfTickets(e)}
							error={fetcher.data?.fieldErrors?.noOfTickets}
							min={1}
							required
						/>

						<Select
							name="zoneId"
							label="Zone"
							error={
								selectedFixture?.stadium.zones.length === 0
									? 'No zones'
									: fetcher.data?.fieldErrors?.zoneId
							}
							placeholder="Select a zone"
							defaultValue={selectedFixture?.stadium.zones?.[0].id ?? undefined}
							value={selectedZoneId}
							onChange={e => setSelectedZoneId(e)}
							data={
								selectedFixture?.stadium.zones.map(z => ({
									label: z.name,
									value: z.id,
								})) ?? []
							}
							required
						/>

						{/* <p className="text-sm">
							Available Seats:{' '}
							{selectedFixture?.stadium.size! - selectedFixtureTicketSales}
						</p> */}

						<p className="text-sm">
							{totalPrice ? `Total price: ${formatCurrency(totalPrice)}` : null}
						</p>

						<Select
							label="Payment method"
							clearable={false}
							required
							data={Object.values(PaymentMethod).map(method => ({
								label: titleCase(method.replace(/_/g, ' ')),
								value: method,
							}))}
						/>

						<Input.Wrapper id={id} label="Credit card number" required>
							<Input
								id={id}
								component={ReactInputMask}
								mask="9999 9999 9999 9999"
								placeholder="XXXX XXXX XXXX XXXX"
								alwaysShowMask={false}
							/>
						</Input.Wrapper>

						<div className="flex items-center gap-4">
							<Input.Wrapper id={id + 'cvv'} label="CVV" required>
								<Input
									id={id + 'cvv'}
									name="cvv"
									component={ReactInputMask}
									mask="999"
									placeholder="XXX"
									alwaysShowMask={false}
								/>
							</Input.Wrapper>

							<DatePicker
								name="expiryDate"
								label="Expiry"
								inputFormat="MM/YYYY"
								clearable={false}
								placeholder="MM/YYYY"
								labelFormat="MM/YYYY"
								minDate={new Date()}
								initialLevel="year"
								hideOutsideDates
								required
							/>
						</div>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => handleModal.close()}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
							>
								Buy tickets
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}

function TicketRow({
	order,
	idx,
}: {
	order: ReturnType<typeof useAppData>['orders'][0]
	idx: number
}) {
	const {orders} = useAppData()
	const fetcher = useFetcher()

	const [showSeats, handleShowSeats] = useDisclosure(false)

	const seats = order.tickets.map(t => t.seatNo)
	const isOrderCompleted = order.status === OrderStatus.SUCCESS
	const isSubmitting = fetcher.state !== 'idle'

	const [isTicketModalOpen, handleTicketModal] = useDisclosure(false)

	const isLastIndex = orders.length - 1 === idx
	return (
		<>
			<TableTr key={order.id} hasBorder={!isLastIndex}>
				<TableTd pos="first">
					{order.scheduleId.slice(0, 8).toUpperCase()}
				</TableTd>
				<TableTd>
					<div className="flex flex-col">
						<div className="font-medium text-gray-900">
							{order.schedule.teamOne.name} vs {order.schedule.teamTwo.name}
						</div>
						<div className="font-medium text-gray-500">
							{order.schedule.stadium.name}
						</div>
						<div className="font-medium text-gray-500">
							{formatDate(order.schedule.timeSlot?.date ?? new Date())}
						</div>
						<div className="text-gray-500">
							{formatTime(order.schedule.timeSlot?.start ?? new Date())} -{' '}
							{formatTime(order.schedule.timeSlot?.end ?? new Date())}
						</div>
					</div>
				</TableTd>
				<TableTd>{order.noOfTickets}</TableTd>
				<TableTd>{formatCurrency(order.payment?.amount ?? 0)}</TableTd>
				<TableTd>
					<Badge
						className="max-w-min"
						variant="dot"
						fullWidth={false}
						color={order.status === OrderStatus.SUCCESS ? 'green' : 'red'}
					>
						{orderStatusLookup(order.status)}
					</Badge>
				</TableTd>
				<TableTd pos="last">
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
								variant="subtle"
								color="gray"
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
						variant="subtle"
						color="gray"
						compact
						loaderPosition="right"
						loading={isSubmitting}
						disabled={!isOrderCompleted}
						onClick={() => handleTicketModal.open()}
					>
						View Tickets
					</Button>
					<Button
						variant="subtle"
						color="red"
						compact
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
									action: '/api/cancel-order',
								}
							)
						}
					>
						Cancel Order
					</Button>
				</TableTd>
			</TableTr>

			<Modal
				opened={isTicketModalOpen}
				onClose={() => handleTicketModal.close()}
				title="Ticket Details"
				centered
			>
				<div className="grid grid-cols-2 gap-8">
					{order.tickets.map((ticket, index) => (
						<React.Fragment key={index}>
							<div className="flex flex-col gap-2">
								<Text size="sm" opacity={0.9}>
									Ticket ID
								</Text>
								<Text size="sm" opacity={0.9}>
									Seat No.
								</Text>
							</div>

							<div className="flex flex-col gap-2">
								<Text size="sm" opacity={0.7}>
									{ticket.id.slice(0, 8).toUpperCase()}
								</Text>
								<Text size="sm" opacity={0.7}>
									{ticket.seatNo}
								</Text>
							</div>
						</React.Fragment>
					))}
				</div>
			</Modal>
		</>
	)
}

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
	fixtureDate: string
	fixtureStartTime: string
	fixtureEndTime: string
	teamOne: string
	teamTwo: string
	stadium: string
	label: string
}

const SelectItem = React.forwardRef<HTMLDivElement, ItemProps>(
	(props: ItemProps, ref) => {
		const {
			teamOne,
			teamTwo,
			fixtureDate,
			fixtureStartTime,
			fixtureEndTime,
			stadium,
			...others
		} = props
		return (
			<div ref={ref} {...others}>
				<Group noWrap>
					<div>
						<Text size="sm">
							{teamOne} vs {teamTwo}
						</Text>
						<Text size="xs" opacity={0.65}>
							{stadium}
						</Text>
						<Text size="xs" opacity={0.65}>
							{formatDate(fixtureDate)} ({formatTime(fixtureStartTime)} -{' '}
							{formatTime(fixtureEndTime)})
						</Text>
					</div>
				</Group>
			</div>
		)
	}
)
