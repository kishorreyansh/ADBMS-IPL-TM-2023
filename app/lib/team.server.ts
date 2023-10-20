import type {Team} from '@prisma/client'
import {ObjectId} from 'bson'
import {db} from '~/db.server'

export function getAllTeams() {
	return db.team.findMany({
		orderBy: {
			name: 'asc',
		},
		include: {
			teamOneSchedules: true,
			teamTwoSchedules: true,
		},
	})
}

export function createOrUpdateTeam(data: {
	teamId?: Team['id']
	name: Team['name']
	abbr: Team['abbr']
}) {
	const {teamId, ...rest} = data
	const id = new ObjectId()

	return db.team.upsert({
		where: {
			id: teamId || id.toString(),
		},
		update: {...rest},
		create: {...rest},
	})
}
