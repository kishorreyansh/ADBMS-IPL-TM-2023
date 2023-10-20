import type {ActionArgs} from '@remix-run/node'
import {json} from '@remix-run/node'
import invariant from 'tiny-invariant'
import {cancelFixture} from '~/lib/fixture.server'
import {requireUser} from '~/session.server'

export const action = async ({request}: ActionArgs) => {
	requireUser(request)

	const formData = await request.formData()

	const fixtureId = formData.get('fixtureId')?.toString()
	invariant(fixtureId, 'Invalid fixtureId')

	return cancelFixture(fixtureId)
		.then(() => json({success: true}))
		.catch(e => {
			console.error(e)
			return json({success: false, error: e.message})
		})
}
