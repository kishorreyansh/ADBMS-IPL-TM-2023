import {Button, Modal, TextInput, clsx} from '@mantine/core'
import {useDisclosure} from '@mantine/hooks'
import type {Team} from '@prisma/client'
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
import {createOrUpdateTeam} from '~/lib/team.server'
import {ManageTeamSchema} from '~/lib/zod.schema'
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
	fieldErrors?: inferErrors<typeof ManageTeamSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fields, fieldErrors} = await validateAction(request, ManageTeamSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({success: false, fieldErrors})
	}

	await createOrUpdateTeam(fields)
	return json({success: true})
}

export default function ManageTeams() {
	const fetcher = useFetcher<ActionData>()
	const {teams} = useAdminData()

	const [selectedTeamId, setSelectedTeamId] = React.useState<Team['id'] | null>(
		null
	)
	const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null)
	const [mode, setMode] = React.useState<MODE>(MODE.edit)
	const [isModalOpen, handleModal] = useDisclosure(false)

	const isSubmitting = fetcher.state !== 'idle'

	React.useEffect(() => {
		if (fetcher.state !== 'idle' && fetcher.submission === undefined) {
			return
		}

		if (fetcher.data?.success) {
			setSelectedTeamId(null)
			handleModal.close()
		}
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetcher.data?.success, fetcher.state, fetcher.submission])

	React.useEffect(() => {
		if (!selectedTeamId) {
			setSelectedTeam(null)
			return
		}

		const team = teams.find(team => team.id === selectedTeamId)
		if (!team) return

		setSelectedTeam(team)
		handleModal.open()
		// handleModal is not meemoized, so we don't need to add it to the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [teams, selectedTeamId])

	return (
		<>
			<div className="flex max-w-screen-xl flex-col gap-12 p-10">
				<div className="flex flex-col gap-8">
					<PageHeading
						title="Teams"
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

					{teams.length > 0 ? (
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
										{teams.map((team, idx) => {
											const isLastIndex = idx === teams.length - 1

											return (
												<TableTr hasBorder={!isLastIndex}>
													<TableTd pos="first">{team.name}</TableTd>

													<TableTd>{team.abbr}</TableTd>

													<TableTd>
														<div className="flex items-center justify-end gap-4">
															<Button
																loading={isSubmitting}
																variant="subtle"
																color="gray"
																compact
																loaderPosition="right"
																onClick={() => {
																	setSelectedTeamId(team.id)
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
							label="No teams have been added yet"
							icon={<ListXIcon size={70} className="text-gray-600" />}
						/>
					)}
				</div>
			</div>

			<Modal
				opened={isModalOpen}
				onClose={() => {
					setSelectedTeamId(null)
					handleModal.close()
				}}
				title={clsx({
					'Edit team': mode === MODE.edit,
					'Add team': mode === MODE.add,
				})}
				centered
				overlayBlur={1.2}
				overlayOpacity={0.6}
			>
				<fetcher.Form method="post" replace>
					<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
						<input type="hidden" name="teamId" value={selectedTeam?.id} />

						<TextInput
							name="name"
							label="Name"
							defaultValue={selectedTeam?.name}
							error={fetcher.data?.fieldErrors?.name}
							required
						/>

						<TextInput
							name="abbr"
							label="Abbreviation"
							defaultValue={selectedTeam?.abbr}
							error={fetcher.data?.fieldErrors?.abbr}
							required
						/>

						<div className="mt-1 flex items-center justify-end gap-4">
							<Button
								variant="subtle"
								disabled={isSubmitting}
								onClick={() => {
									setSelectedTeam(null)
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
								{mode === MODE.edit ? 'Save changes' : 'Add teams'}
							</Button>
						</div>
					</fieldset>
				</fetcher.Form>
			</Modal>
		</>
	)
}
