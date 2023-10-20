import {Badge} from '@mantine/core'
import {PaymentStatus} from '@prisma/client'
import {ReceiptIcon} from 'lucide-react'
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
import {useAppData} from '~/utils/hooks'
import {formatCurrency, formatDate, formatTime, titleCase} from '~/utils/misc'
export default function OrderHistory() {
	const {payments} = useAppData()

	return (
		<>
			<div className="flex max-w-screen-xl flex-col gap-12 p-10">
				<div className="flex flex-col gap-8">
					<PageHeading title="Payment History" />

					{payments.length > 0 ? (
						<div className="flow-root">
							<div className="inline-block min-w-full py-2 align-middle">
								<Table>
									<TableThead>
										<TableTr>
											<TableTh pos="first">ID</TableTh>
											<TableTh>Amount</TableTh>
											<TableTh>Date</TableTh>
											<TableTh>Status</TableTh>
											<TableTh>Schedule</TableTh>
											<TableTh pos="last">
												<span className="sr-only">Actions</span>
											</TableTh>
										</TableTr>
									</TableThead>
									<TableBody>
										{payments.map((payment, idx) => {
											const isLastIndex = idx === payments.length - 1

											return (
												<TableTr hasBorder={!isLastIndex}>
													<TableTd pos="first">
														{payment.id.slice(-10).toUpperCase()}
													</TableTd>

													<TableTd>{formatCurrency(payment.amount)}</TableTd>
													<TableTd>{formatDate(payment.createdAt)}</TableTd>
													<TableTd>
														<Badge
															color={
																payment.status === PaymentStatus.PAID
																	? 'green'
																	: 'red'
															}
															radius="xs"
														>
															{titleCase(payment.status)}
														</Badge>
													</TableTd>
													<TableTd>
														<div>
															<p className="truncate text-sm font-medium text-blue-600">
																{payment.order.schedule.teamOne.name} vs{' '}
																{payment.order.schedule.teamTwo.name}
															</p>
															<p className="flex items-center text-sm text-gray-500">
																{payment.order.schedule.stadium.name}
															</p>
															<p className="flex items-center text-sm text-gray-500">
																{formatDate(
																	payment.order.schedule.timeSlot?.date ??
																		new Date('2021-01-01')
																)}{' '}
																(
																{formatTime(
																	payment.order.schedule.timeSlot?.start ?? ''
																)}{' '}
																-{' '}
																{formatTime(
																	payment.order.schedule.timeSlot?.end ?? ''
																)}
																)
															</p>
														</div>
													</TableTd>
													<TableTd pos="last"></TableTd>
												</TableTr>
											)
										})}
									</TableBody>
								</Table>
							</div>
						</div>
					) : (
						<EmptyState
							label="No purchases yet"
							icon={<ReceiptIcon size={70} className="text-gray-600" />}
						/>
					)}
				</div>
			</div>
		</>
	)
}
