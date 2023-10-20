import {Button, Modal, TextInput, clsx} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {Stadium} from '@prisma/client'
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
import {createOrUpdateStadium} from '~/lib/stadium.server'
import {ManageStadiumSchema} from '~/lib/zod.schema'
import {useAdminData} from '~/utils/hooks'
import {badRequest} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

enum MODE {
	edit,
	add,
}

interface ActionData {
	success: boolean
	fieldErrors?: inferErrors<typeof ManageStadiumSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(
		request,
		ManageStadiumSchema
	)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	await createOrUpdateStadium(fields)
	return json({success: true})
}

export default function ManageStadiums() {
	const fetcher = useFetcher<ActionData>()
	const {stadiums} = useAdminData()

	const [selectedStadiumId, setSelectedStadiumId] = React.useState<
		Stadium['id'] | null
	>(null)
	const [selectedStadium, setSelectedStadium] = React.useState<Stadium | null>(
		null
	)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedStadiumId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	React.useEffect(() => {
		if (!selectedStadiumId) {
			setSelectedStadium(null)
			return
		}

		const stadium = stadiums.find(stadium => stadium.id === selectedStadiumId)
		if (!stadium) return

		setSelectedStadium(stadium)
		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stadiums, selectedStadiumId])

	return (
		<>
			<div className="flex max-w-screen-xl flex-col gap-12 p-10">
				<div className="flex flex-col gap-8">
					<PageHeading
						title="Stadiums"
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

					{stadiums.length > 0 ? (
						<div className="flow-root">
							<div className="inline-block min-w-full py-2 align-middle">
								<Table>
									<TableThead>
										<TableTr>
											<TableTh pos="first">Name</TableTh>
											<TableTh>Abbreviation</TableTh>
											<TableTh pos="last">
												<span className="sr-only">Actions</span>
											</TableTh>
										</TableTr>
									</TableThead>
									<TableBody>
										{stadiums.map((stadium, idx) => {
											const isLastIndex = idx === stadiums.length - 1

											return (
												<TableTr hasBorder={!isLastIndex}>
													<TableTd pos="first">{stadium.name}</TableTd>

													<TableTd>{stadium.abbr}</TableTd>

													<TableTd>
														<div className="flex items-center justify-end gap-4">
															<Button
																loading={isSubmitting}
																variant="subtle"
																color="gray"
																compact
																loaderPosition="right"
																onClick={() => {
																	setSelectedStadiumId(stadium.id)
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
							label="No stadiums have been added yet"
							icon={<ListXIcon size={70} className="text-gray-600" />}
						/>
					)}
				</div>
			</div>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					setSelectedStadiumId(null)
					handleModal.close()
				}}
				title={clsx({
					'Edit stadium': mode === MODE.edit,
					'Add stadium': mode === MODE.add,
				})}
				centered
				overlayBlur={1.2}
				overlayOpacity={0.6}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="stadiumId" value={selectedStadium?.id} />

						<TextInput
							name="name"
							label="Name"
							defaultValue={selectedStadium?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<TextInput
							name="abbr"
							label="Abbreviation"
							defaultValue={selectedStadium?.abbr}
							error={fetcher.data?.fieldErrors?.abbr}
							required
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setSelectedStadium(null)
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
							>
								{mode === MODE.edit ? 'Save changes' : 'Add stadium'}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
