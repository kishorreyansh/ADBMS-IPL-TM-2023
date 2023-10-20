import type {Audience} from '@prisma/client'
import {db} from '~/db.server'
import {createPasswordHash} from '~/utils/misc.server'

export async function createAudience({
	email,
	password,
	name,
	address,
	phoneNo,
}: {
	email: Audience['email']
	password: string
	name: Audience['name']
	address: Audience['address']
	phoneNo: Audience['phoneNo']
}) {
	return db.audience.create({
		data: {
			name,
			email,
			address,
			phoneNo,
			password: await createPasswordHash(password),
		},
	})
}

export function getAudienceDetails(id: Audience['id']) {
	return db.audience.findUnique({
		where: {id},
		include: {},
	})
}
