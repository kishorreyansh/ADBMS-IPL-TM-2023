import type {Audience} from '@prisma/client'
import {db} from '~/db.server'

export function getAudiencePayments(audienceId: Audience['id']) {
	return db.payment.findMany({
		where: {
			audienceId,
		},
		include: {
			order: {
				include: {
					schedule: {
						include: {
							teamOne: true,
							teamTwo: true,
							stadium: true,
							timeSlot: true,
						},
					},
				},
			},
		},
	})
}
