import type {Stadium} from '@prisma/client'
import {ObjectId} from 'bson'
import {db} from '~/db.server'

export function getAllStadiums() {
	return db.stadium.findMany({
		include: {
			schedules: true,
			zones: true,
		},
	})
}

export function createOrUpdateStadium(data: {
	stadiumId?: Stadium['id']
	name: Stadium['name']
	abbr: Stadium['abbr']
}) {
	const {stadiumId, ...rest} = data
	const id = new ObjectId()

	return db.stadium.upsert({
		where: {
			id: stadiumId || id.toString(),
		},
		update: {...rest},
		create: {...rest},
	})
}
