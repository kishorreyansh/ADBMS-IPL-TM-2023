import type {Schedule, TimeSlot} from '@prisma/client'
import {OrderStatus, ScheduleStatus} from '@prisma/client'
import {ObjectId} from 'bson'
import {db} from '~/db.server'
import {cancelOrder} from './order.server'

export function getAllFixtures() {
	return db.schedule.findMany({
		orderBy: [
			{
				status: 'desc',
			},
			{
				timeSlot: {
					date: 'desc',
				},
			},
		],
		include: {
			stadium: {
				include: {
					zones: true,
				},
			},
			teamOne: true,
			teamTwo: true,
			timeSlot: true,
			orders: {
				include: {
					tickets: true,
				},
			},
		},
	})
}

export function getAllUpcomingFixtures() {
	return db.schedule.findMany({
		where: {
			AND: [
				{
					status: ScheduleStatus.CONFIRMED,
				},
			],
		},
		orderBy: [
			{
				status: 'desc',
			},
			{
				timeSlot: {
					date: 'desc',
				},
			},
		],
		include: {
			stadium: {
				include: {
					zones: true,
				},
			},
			teamOne: true,
			teamTwo: true,
			timeSlot: true,
			orders: {
				include: {
					tickets: true,
				},
			},
		},
	})
}

export function cancelFixture(fixtureId: Schedule['id']) {
	return db.$transaction(async tx => {
		const fixture = await tx.schedule.findUnique({
			where: {id: fixtureId},
			include: {
				timeSlot: true,
				orders: true,
			},
		})

		if (!fixture) {
			throw new Error('Fixture not found')
		}

		await tx.schedule.update({
			where: {id: fixtureId},
			data: {
				status: ScheduleStatus.CANCELLED,
			},
		})

		// cancel orders
		const orderIds = fixture.orders.map(order => order.id)
		for (const orderId of orderIds) {
			await cancelOrder(orderId, OrderStatus.MATCH_CANCELLED)
		}
	})
}

export function createOrUpdateFixture(
	data: Omit<Schedule, 'id' | 'status' | 'createdAt'> & {
		fixtureId?: Schedule['id']
		fixtureDate: TimeSlot['date']
		fixtureStartTime: TimeSlot['start']
		fixtureEndTime: TimeSlot['end']
	}
) {
	const id = new ObjectId()
	return db.schedule.upsert({
		where: {
			id: data.fixtureId || id.toString(),
		},
		update: {
			teamOneId: data.teamOneId,
			teamTwoId: data.teamTwoId,
			stadiumId: data.stadiumId,
			timeSlot: {
				update: {
					date: data.fixtureDate,
					start: data.fixtureStartTime,
					end: data.fixtureEndTime,
				},
			},
		},
		create: {
			teamOneId: data.teamOneId,
			teamTwoId: data.teamTwoId,
			stadiumId: data.stadiumId,
			timeSlot: {
				create: {
					date: data.fixtureDate,
					start: data.fixtureStartTime,
					end: data.fixtureEndTime,
				},
			},
		},
	})
}
