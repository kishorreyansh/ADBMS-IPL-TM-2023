import {json} from '@remix-run/node'
import * as bcrypt from 'bcryptjs'
import {getUserById} from '~/lib/user.server'
import {getUserId} from '~/session.server'

const DEFAULT_REDIRECT = '/'

export const badRequest = <T = any>(data: T) => json<T>(data, {status: 400})
export const unauthorized = <T = any>(data: T) => json<T>(data, {status: 401})
export const forbidden = <T = any>(data: T) => json<T>(data, {status: 403})
export const notFound = <T = any>(data: T) => json<T>(data, {status: 404})

export function validateEmail(email: unknown): email is string {
	return typeof email === 'string' && email.length > 3 && email.includes('@')
}

export function validateName(name: unknown): name is string {
	return typeof name === 'string' && name.length > 1
}

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
	to: FormDataEntryValue | string | null | undefined,
	defaultRedirect: string = DEFAULT_REDIRECT
) {
	if (!to || typeof to !== 'string') {
		return defaultRedirect
	}

	if (!to.startsWith('/') || to.startsWith('//')) {
		return defaultRedirect
	}

	return to
}

export async function getOptionalUser(
	request: Request
): Promise<Awaited<ReturnType<typeof getUserById>> | null> {
	const userId = await getUserId(request)
	if (userId === undefined) return null

	const user = await getUserById(userId)
	if (user) return user

	return null
}

export function createPasswordHash(password: string) {
	return bcrypt.hash(password, 10)
}
