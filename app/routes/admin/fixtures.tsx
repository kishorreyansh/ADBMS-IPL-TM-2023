import {CalendarDaysIcon, ClockIcon} from '@heroicons/react/24/outline'
import {Badge, Button, Drawer, NativeSelect, Select, clsx} from '@mantine/core'
import {DatePicker, TimeInput} from '@mantine/dates'
import {useDisclosure} from '@mantine/hooks'
import type {Schedule, Stadium, Team} from '@prisma/client'
import {ScheduleStatus} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import {ListXIcon, Plus} from 'lucide-react'
import * as React from 'react'
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
import {createOrUpdateFixture} from '~/lib/fixture.server'
import {ManageFixtureSchema} from '~/lib/zod.schema'
import {useAdminData} from '~/utils/hooks'
import {formatDate, formatTime, titleCase} from '~/utils/misc'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

enum MODE {
	edit,
	add,
}

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageFixtureSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(
		request,
		ManageFixtureSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	await createOrUpdateFixture(fields)
	return json<ActionData>({success: true})
}

export default function ManageFixtures() {
	const fetcher = useFetcher<ActionData>()
	const {fixtures, stadiums, teams} = useAdminData()
	const [isModalOpen, handleModal] = useDisclosure(false)

	const [selectedFixtureId, setSelectedFixtureId] = React.useState<
		Schedule['id'] | null
	>(null)
	const [selectedFixture, setSelectedFixture] = React.useState<
		typeof fixtures[number] | null
	>(null)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [stadiumId, setStadiumId] = React.useState<Stadium['id']>()
	const [teamOneId, setTeamOneId] = React.useState<Team['id'] | null>(null)
	const [teamTwoId, setTeamTwoId] = React.useState<Team['id'] | null>(null)
	const [fixtureDate, setFixtureDate] = React.useState<Date | null>(null)
	const [fixtureStartTime, setFixtureStartTime] = React.useState<Date | null>(
		null
	)
	const [fixtureEndTime, setFixtureEndTime] = React.useState<Date | null>(null)

	const [enableSubmit, setEnableSubmit] = React.useState(false)
	const [error, setError] = React.useState<string | null>(null)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (!teamOneId || !teamTwoId) return

		if (teamOneId === teamTwoId) {
			setTeamTwoId(null)
		}
	}, [teamOneId, teamTwoId])

	React.useEffect(() => {
		if (isSubmitting) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedFixtureId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	React.useEffect(() => {
		if (!selectedFixtureId) {
			setSelectedFixture(null)
			setTeamOneId(null)
			setTeamTwoId(null)
			setFixtureDate(null)
			setFixtureStartTime(null)
			setFixtureEndTime(null)
			setStadiumId(stadiums[0].id)
			return
		}

		const fixture = fixtures.find(schedule => schedule.id === selectedFixtureId)
		if (!fixture) return

		setSelectedFixture(fixture)
		setTeamOneId(fixture.teamOneId)
		setTeamTwoId(fixture.teamTwoId)
		setFixtureDate(new Date(fixture.timeSlot?.date ?? ''))
		setFixtureStartTime(new Date(fixture.timeSlot?.start ?? ''))
		setFixtureEndTime(new Date(fixture.timeSlot?.end ?? ''))
		setStadiumId(fixture.stadiumId)

		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fixtures, selectedFixtureId])

	React.useEffect(() => {
		setEnableSubmit(false)
		setError(null)

		if (!fixtureDate || !fixtureStartTime || !fixtureEndTime) {
			return
		}

		if (!teamOneId && !teamTwoId && !stadiumId) {
			return
		}

		if (fixtureStartTime.getTime() >= fixtureEndTime.getTime()) {
			setError('Fixture start-time must be before end-time')
			return
		}

		const isConflict = (teamId: Team['id']) => {
			const teamFixtures = fixtures.filter(
				fixture =>
					fixture.timeSlot?.date === fixtureDate.toISOString() &&
					fixture.id !== selectedFixtureId &&
					(fixture.teamOneId === teamId || fixture.teamTwoId === teamId) &&
					fixture.status !== ScheduleStatus.CANCELLED
			)

			const isTeamFixtureClashing = teamFixtures.some(fixture => {
				const startTime = new Date(fixture.timeSlot?.start ?? '')
				const endTime = new Date(fixture.timeSlot?.end ?? '')

				return (
					(startTime.getTime() >= fixtureStartTime.getTime() &&
						startTime.getTime() < fixtureEndTime.getTime()) ||
					(endTime.getTime() > fixtureStartTime.getTime() &&
						endTime.getTime() <= fixtureEndTime.getTime()) ||
					(startTime.getTime() <= fixtureStartTime.getTime() &&
						endTime.getTime() >= fixtureEndTime.getTime())
				)
			})

			return isTeamFixtureClashing
		}

		if (stadiumId) {
			const stadiumFixtures = fixtures.filter(
				fixture =>
					fixture.timeSlot?.date === fixtureDate.toISOString() &&
					fixture.id !== selectedFixtureId &&
					stadiumId === fixture.stadiumId &&
					fixture.status !== ScheduleStatus.CANCELLED
			)

			const isStadiumFixtureClashing = stadiumFixtures.some(fixture => {
				const startTime = new Date(fixture.timeSlot?.start ?? '')
				const endTime = new Date(fixture.timeSlot?.end ?? '')

				return (
					(startTime.getTime() >= fixtureStartTime.getTime() &&
						startTime.getTime() < fixtureEndTime.getTime()) ||
					(endTime.getTime() > fixtureStartTime.getTime() &&
						endTime.getTime() <= fixtureEndTime.getTime()) ||
					(startTime.getTime() <= fixtureStartTime.getTime() &&
						endTime.getTime() >= fixtureEndTime.getTime())
				)
			})

			if (isStadiumFixtureClashing) {
				setError('Stadium has a fixture at the same time')
				return
			}
		}

		if (teamOneId) {
			const isTeamOneClashing = isConflict(teamOneId)
			if (isTeamOneClashing) {
				setError('Team One has another fixture on the same date and time')
				return
			}
		}

		if (teamTwoId) {
			const isTeamTwoClashing = isConflict(teamTwoId)
			if (isTeamTwoClashing) {
				setError('Team Two has another fixture on the same date and time')
				return
			}
		}

		setEnableSubmit(true)
	}, [
		fixtureDate,
		fixtureEndTime,
		fixtureStartTime,
		fixtures,
		selectedFixtureId,
		stadiumId,
		teamOneId,
		teamTwoId,
	])

	return (
		<>
			<div className="flex max-w-screen-xl flex-col gap-12 p-10">
				<div className="flex flex-col gap-8">
					<PageHeading
						title="Fixtures"
						rightSection={
							<Button
								color="dark"
								radius="md"
								onClick={() => {
									setMode(MODE.add)
									handleModal.open()
								}}
								leftIcon={<Plus size={18} />}
							>
								Create
							</Button>
						}
					/>

					{fixtures.length > 0 ? (
						<div className="flow-root">
							<div className="inline-block min-w-full py-2 align-middle">
								<Table>
									<TableThead>
										<TableTr>
											<TableTh pos="first">Fixtures</TableTh>
											<TableTh>Details</TableTh>
											<TableTh>Match Status</TableTh>
											<TableTh pos="last">
												<span className="sr-only">Actions</span>
											</TableTh>
										</TableTr>
									</TableThead>
									<TableBody>
										{fixtures.map((fixture, idx) => {
											const isLastIndex = idx === fixtures.length - 1

											const isCancelled =
												fixture.status === ScheduleStatus.CANCELLED

											return (
												<TableTr hasBorder={!isLastIndex}>
													<TableTd pos="first">
														<div className="flex flex-col">
															<div className="font-medium text-gray-900">
																{fixture.teamOne.name} vs {fixture.teamTwo.name}
															</div>
															<div className="font-medium text-gray-500">
																{fixture.stadium.name}
															</div>
														</div>
													</TableTd>

													<TableTd>
														<div className="flex flex-col">
															<div className="font-medium text-gray-900">
																{formatDate(
																	fixture.timeSlot?.date ?? new Date()
																)}
															</div>
															<div className="text-gray-500">
																{formatTime(
																	fixture.timeSlot?.start ?? new Date()
																)}{' '}
																-{' '}
																{formatTime(
																	fixture.timeSlot?.end ?? new Date()
																)}
															</div>
														</div>
													</TableTd>

													<TableTd>
														<Badge
															className="max-w-min"
															variant="dot"
															fullWidth={false}
															color={
																fixture.status === ScheduleStatus.CONFIRMED
																	? 'green'
																	: 'red'
															}
														>
															{titleCase(fixture.status)}
														</Badge>
													</TableTd>

													<TableTd>
														<div className="flex items-center justify-end gap-4">
															<Button
																loading={isSubmitting}
																variant="subtle"
																color="gray"
																compact
																loaderPosition="right"
																disabled={isCancelled}
																onClick={() => {
																	setSelectedFixtureId(fixture.id)
																	setMode(MODE.edit)
																}}
															>
																Edit
															</Button>

															<Button
																variant="subtle"
																color="red"
																compact
																loaderPosition="right"
																loading={isSubmitting}
																disabled={isCancelled}
																onClick={() =>
																	fetcher.submit(
																		{
																			fixtureId: fixture.id,
																		},
																		{
																			method: 'post',
																			replace: true,
																			action: '/api/cancel-fixture',
																		}
																	)
																}
															>
																Cancel Fixture
															</Button>
														</div>
													</TableTd>
												</TableTr>
											)
										})}
									</TableBody>
								</Table>
							</div>
						</div>
					) : (
						<EmptyState
							label="No fixtures have been added yet"
							icon={<ListXIcon size={70} className="text-gray-600" />}
						/>
					)}
				</div>
			</div>

			<Drawer
				opened={isModalOpen}
				onClose={() => {
					setSelectedFixtureId(null)
					handleModal.close()
				}}
				title={clsx({
					'Edit fixture': mode === MODE.edit,
					'Add fixture': mode === MODE.add,
				})}
				position="right"
				padding="md"
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input hidden name="fixtureId" value={selectedFixture?.id} />

						<NativeSelect
							name="stadiumId"
							label="Stadium"
							value={stadiumId}
							placeholder="Select stadium"
							onChange={e => setStadiumId(e.target.value)}
							error={fetcher.data?.fieldErrors?.stadiumId}
							data={stadiums.map(stadium => ({
								label: stadium.name,
								value: stadium.id,
							}))}
							required
						/>

						<Select
							name="teamOneId"
							label="Team One"
							value={teamOneId}
							onChange={e => setTeamOneId(e)}
							error={fetcher.data?.fieldErrors?.teamOneId}
							data={teams.map(team => ({
								label: team.name,
								value: team.id,
							}))}
							required
						/>

						<Select
							name="teamTwoId"
							label="Team Two"
							value={teamTwoId}
							onChange={e => setTeamTwoId(e)}
							error={fetcher.data?.fieldErrors?.teamTwoId}
							disabled={!teamOneId}
							data={teams.map(team => ({
								label: team.name,
								value: team.id,
								disabled: team.id === teamOneId,
							}))}
							required
						/>

						<DatePicker
							label="Date"
							name="fixtureDate"
							value={fixtureDate}
							placeholder="Select date"
							onChange={setFixtureDate}
							minDate={new Date(new Date().getTime() + 24 * 60 * 60 * 1000)}
							icon={<CalendarDaysIcon className="h-4 w-4" />}
							error={fetcher.data?.fieldErrors?.fixtureDate}
							hideOutsideDates
							withAsterisk
						/>
						<div className="grid grid-cols-2 gap-4">
							<TimeInput
								icon={<ClockIcon className="h-4 w-4" />}
								label="Start Time"
								format="12"
								withAsterisk
								value={fixtureStartTime}
								onChange={setFixtureStartTime}
								error={fetcher.data?.fieldErrors?.fixtureStartTime}
								placeholder="Select start time"
							/>
							<input
								hidden
								name="fixtureStartTime"
								value={fixtureStartTime?.toISOString()}
							/>

							<TimeInput
								icon={<ClockIcon className="h-4 w-4" />}
								label="End Time"
								format="12"
								value={fixtureEndTime}
								onChange={setFixtureEndTime}
								error={fetcher.data?.fieldErrors?.fixtureEndTime}
								placeholder="Select end time"
								withAsterisk
							/>
							<input
								hidden
								name="fixtureEndTime"
								value={fixtureEndTime?.toISOString()}
							/>
						</div>

						<p className="text-sm text-red-500">{error}</p>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setSelectedFixture(null)
									handleModal.close()
								}}
								color="red"
							>
								Cancel
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loaderPosition="right"
								disabled={!enableSubmit}
							>
								{mode === MODE.edit ? 'Save changes' : 'Add fixture'}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Drawer>
		</>
	)
}
