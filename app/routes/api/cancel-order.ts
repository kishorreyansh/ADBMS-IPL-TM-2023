import {OrderStatus} from '@prisma/client'
import type {ActionArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import invariant from 'tiny-invariant'
import {cancelOrder} from '~/lib/order.server'

export const action = async ({request}: ActionArgs) => {
	const formData = await request.formData()

	const intent = formData.get('intent')?.toString()
	invariant(intent, 'Invalid intent')

	switch (intent) {
		case 'cancel-order': {
			const orderId = formData.get('orderId')?.toString()
			invariant(orderId, 'Invalid order id')

			return cancelOrder(orderId, OrderStatus.CANCELLED_BY_USER)
				.then(() => json({success: true}))
				.catch(e => {
					console.error(e)
					return json({success: false, error: e.message})
				})
		}

		default:
			return json({success: false, message: 'Invalid intent'}, {status: 400})
	}
}
