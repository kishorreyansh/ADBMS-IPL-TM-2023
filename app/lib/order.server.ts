import type {Audience, Order, Zone} from '@prisma/client'
import {PaymentMethod} from '@prisma/client'
import {OrderStatus} from '@prisma/client'
import {PaymentStatus} from '@prisma/client'
import {db} from '~/db.server'

export function getAllOrders() {
	return db.order.findMany({
		include: {
			audience: {
				select: {
					name: true,
					email: true,
				},
			},
			payment: true,
			schedule: {
				include: {
					timeSlot: true,
					teamOne: true,
					teamTwo: true,
					stadium: true,
				},
			},
			tickets: true,
		},
	})
}

export function getOrdersById(audienceId: Audience['id']) {
	return db.order.findMany({
		where: {
			audienceId: audienceId,
		},
		orderBy: [
			{
				status: 'desc',
			},
			{
				createdAt: 'desc',
			},
		],
		include: {
			audience: {
				select: {
					name: true,
					email: true,
				},
			},
			payment: true,
			schedule: {
				include: {
					timeSlot: true,
					teamOne: true,
					teamTwo: true,
					stadium: true,
				},
			},
			tickets: true,
		},
	})
}

export function cancelOrder(
	orderId: Order['id'],
	status: OrderStatus = OrderStatus.CANCELLED_BY_ADMIN
) {
	return db.order.update({
		where: {id: orderId},
		data: {
			status,
			tickets: {
				deleteMany: {},
			},
			payment: {
				update: {
					status: PaymentStatus.REFUNDED,
				},
			},
		},
	})
}

const generateSeats = (zone: string, noOfTickets: number, offset = 0) => {
	const seats = []
	const shortZone = zone
		.split(' ')
		.map(word => word.charAt(0))
		.join('')

	// Ensure offset is a number
	const numericOffset = Number.isFinite(offset) ? offset : 0

	for (let i = 1; i <= noOfTickets; i++) {
		seats.push(`${shortZone}${numericOffset + i}`)
	}
	return seats
}

export async function createOrder({
	audienceId,
	fixtureId,
	noOfTickets,
	zoneId,
}: {
	zoneId: Zone['id']
	audienceId: Audience['id']
	fixtureId: Order['scheduleId']
	noOfTickets: Order['noOfTickets']
}) {
	const fixture = await db.schedule.findUnique({
		where: {id: fixtureId},
		select: {
			orders: {
				include: {
					tickets: true,
				},
			},
		},
	})

	if (!fixture) {
		throw new Error('Fixture not found')
	}

	const zone = await db.zone.findUnique({
		where: {id: zoneId},
	})

	if (!zone) {
		throw new Error('Zone not found')
	}

	const totalAmount = zone.pricePerSeat * noOfTickets

	let lastSeat = 0
	const successfulOrders = fixture?.orders.filter(
		o => o.status === OrderStatus.SUCCESS
	)
	if (!successfulOrders || successfulOrders.length === 0) {
		//
	} else {
		const seatsAlloted = successfulOrders
			.map(o => o.tickets.map(t => t.seatNo))
			.flat()
		lastSeat = Math.max(...seatsAlloted.map(seat => Number(seat)))
	}

	const seats = generateSeats(zone.name, noOfTickets, lastSeat)

	return db.order.create({
		data: {
			audienceId,
			scheduleId: fixtureId,
			noOfTickets,
			status: OrderStatus.SUCCESS,
			tickets: {
				createMany: {
					data: seats.map(seat => ({seatNo: seat})),
				},
			},
			payment: {
				create: {
					audienceId,
					status: PaymentStatus.PAID,
					method: PaymentMethod.CREDIT_CARD,
					amount: totalAmount,
				},
			},
		},
	})
}
