import {PlusIcon} from '@heroicons/react/24/solid'
import {
	Button,
	Modal,
	NumberInput,
	Select,
	TextInput,
	clsx,
} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {Stadium, Zone} from '@prisma/client'
import type {ActionFunction} from '@remix-run/node'
import {json} from '@remix-run/node'
import {useFetcher} from '@remix-run/react'
import {ObjectId} from 'bson'
import {ListXIcon, SearchIcon} from 'lucide-react'
import * as React from 'react'
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
import {db} from '~/db.server'
import {useAdminData} from '~/utils/hooks'
import {formatCurrency} from '~/utils/misc'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'
enum MODE {
	edit,
	add,
}

const ManageZonesSchema = z.object({
	zoneId: z.string().optional(),
	stadiumId: z.string().min(1, 'Stadium is required'),
	name: z.string().min(1, 'Name is required'),
	pricePerSeat: z.preprocess(
		Number,
		z.number().min(0, 'Price per ticket must be at least 0')
	),
	size: z.preprocess(Number, z.number().min(1, 'Size must be at least 1')),
})

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageZonesSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(request, ManageZonesSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	const id = new ObjectId().toString()
	await db.zone.upsert({
		where: {
			id: fields.zoneId || id,
			stadiumId: fields.stadiumId,
		},
		update: {
			name: fields.name,
			pricePerSeat: fields.pricePerSeat,
			size: fields.size,
		},
		create: {
			id,
			name: fields.name,
			pricePerSeat: fields.pricePerSeat,
			size: fields.size,
			stadiumId: fields.stadiumId,
		},
	})

	return json<ActionData>({success: true})
}

export default function ManageZones() {
	const fetcher = useFetcher<ActionData>()
	const isSubmitting = fetcher.state !== 'idle'

	const {zones, stadiums} = useAdminData()
	const [isModalOpen, handleModal] = useDisclosure(false, {
		onClose: () => {
			setSelectedZoneId(null)
		},
	})

	const [selectedZoneId, setSelectedZoneId] = React.useState<Zone['id'] | null>(
		null
	)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [stadiumId, setStadiumId] = React.useState<Stadium['id'] | null>(null)

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedZoneId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	const selectedStadium = React.useMemo(() => {
		if (!stadiumId) {
			return null
		}

		const stadium = stadiums.find(stadium => stadium.id === stadiumId)

		if (!stadium) {
			return null
		}

		return stadium
	}, [stadiumId, stadiums])

	const selectedZone = React.useMemo(
		() => zones.find(zone => zone.id === selectedZoneId),
		[selectedZoneId, zones]
	)

	return (
		<>
			<div className="flex max-w-screen-xl flex-col gap-12 p-10">
				<div className="flex flex-col gap-8">
					<PageHeading
						title="Zones"
						rightSection={
							<div className="flex items-end gap-4">
								<Select
									label="Stadium"
									value={stadiumId}
									onChange={setStadiumId}
									clearable
									placeholder="Select a stadium"
									data={stadiums.map(stadium => ({
										value: stadium.id,
										label: stadium.name,
									}))}
								/>

								<Button
									loading={isSubmitting}
									loaderPosition="left"
									disabled={!stadiumId}
									onClick={() => {
										setMode(MODE.add)
										handleModal.open()
									}}
								>
									<PlusIcon className="h-4 w-4" />
									<span className="ml-2">Add Zone</span>
								</Button>
							</div>
						}
					/>

					{stadiumId && selectedStadium ? (
						<>
							{selectedStadium.zones.length > 0 ? (
								<div className="flow-root">
									<div className="inline-block min-w-full py-2 align-middle">
										<Table>
											<TableThead>
												<TableTr>
													<TableTh pos="first">Name</TableTh>
													<TableTh>Size</TableTh>
													<TableTh>Price/seat</TableTh>
													<TableTh pos="last">
														<span className="sr-only">Actions</span>
													</TableTh>
												</TableTr>
											</TableThead>
											<TableBody>
												{selectedStadium?.zones.map((zone, idx) => {
													const isLastIndex =
														idx === selectedStadium?.zones.length - 1

													return (
														<TableTr hasBorder={!isLastIndex}>
															<TableTd pos="first">{zone.name}</TableTd>

															<TableTd>{zone.size}</TableTd>
															<TableTd>
																{formatCurrency(zone.pricePerSeat)}
															</TableTd>

															<TableTd>
																<div className="flex items-center justify-end gap-4">
																	<Button
																		loading={isSubmitting}
																		variant="subtle"
																		color="gray"
																		compact
																		loaderPosition="right"
																		onClick={() => {
																			setSelectedZoneId(zone.id)
																			handleModal.open()
																			setMode(MODE.edit)
																		}}
																	>
																		Edit
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
									label="No zones found"
									icon={<ListXIcon size={70} className="text-gray-600" />}
								/>
							)}
						</>
					) : (
						<EmptyState
							label="Select a stadium"
							icon={<SearchIcon size={70} />}
						/>
					)}
				</div>
			</div>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					setSelectedZoneId(null)
					handleModal.close()
				}}
				title={clsx({
					'Edit zone': mode === MODE.edit,
					'Add zone': mode === MODE.add,
				})}
				centered
				overlayBlur={1.2}
				overlayOpacity={0.6}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input hidden name="zoneId" value={selectedZone?.id} />
						<input hidden name="stadiumId" value={stadiumId ?? ''} />

						<TextInput
							name="name"
							label="Name"
							defaultValue={selectedZone?.name ?? ''}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<NumberInput
							name="size"
							label="Size"
							defaultValue={selectedZone?.size ?? 1}
							min={1}
							error={fetcher.data?.fieldErrors?.size}
							required
						/>

						<NumberInput
							name="pricePerSeat"
							label="Price Per Seat"
							icon="$"
							defaultValue={selectedZone?.pricePerSeat ?? 1}
							min={1}
							error={fetcher.data?.fieldErrors?.pricePerSeat}
							required
						/>

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
								{mode === MODE.edit ? 'Save changes' : 'Add Zone'}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
