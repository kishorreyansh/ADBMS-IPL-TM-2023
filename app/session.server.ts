import type {Admin, Audience} from '@prisma/client'
import {createCookieSessionStorage, redirect} from '@remix-run/node'
import invariant from 'tiny-invariant'
import {getUserById} from '~/lib/user.server'
import {Role} from './utils/constants'

invariant(process.env.SESSION_SECRET, 'SESSION_SECRET must be set')

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: '__session',
		httpOnly: true,
		maxAge: 0,
		path: '/',
		sameSite: 'lax',
		secrets: [process.env.SESSION_SECRET],
		secure: process.env.NODE_ENV === 'production',
	},
})

const USER_SESSION_KEY = 'userId'
const USER_ROLE_KEY = 'userRole'
const fourteenDaysInSeconds = 60 * 60 * 24 * 14
const thirtyDaysInSeconds = 60 * 60 * 24 * 30

export async function getSession(request: Request) {
	const cookie = request.headers.get('Cookie')
	return sessionStorage.getSession(cookie)
}

/**
 * Returns the userId from the session.
 */
export async function getUserId(request: Request): Promise<string | undefined> {
	const session = await getSession(request)
	const userId = session.get(USER_SESSION_KEY)
	return userId
}

/**
 * Returns the userRole from the session.
 */
export async function getUserRole(
	request: Request
): Promise<string | undefined> {
	const session = await getSession(request)
	const userRole = session.get(USER_ROLE_KEY)
	return userRole
}

export async function getUser(request: Request) {
	const userId = await getUserId(request)
	const userRole = (await getUserRole(request)) as Role | undefined
	if (userId === undefined || userRole === undefined) {
		return null
	}

	const user = await getUserById(userId, userRole)
	if (user) return user

	throw await logout(request)
}

export async function requireUserId(
	request: Request,
	redirectTo: string = new URL(request.url).pathname
) {
	const userId = await getUserId(request)
	if (!userId) {
		const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
		throw redirect(`/login?${searchParams}`)
	}

	return userId
}

export async function requireUser(
	request: Request,
	redirectTo: string = new URL(request.url).pathname
) {
	const userId = await requireUserId(request, redirectTo)
	const userRole = await getUserRole(request)

	if (userRole === 'audience') {
		const user = await getUserById(userId, Role.AUDIENCE)
		if (user) return user
	}

	if (userRole === 'admin') {
		const user = await getUserById(userId, Role.ADMIN)
		if (user) return user
	}

	throw await logout(request)
}

export async function createUserSession({
	request,
	userId,
	remember = false,
	redirectTo,
	role = Role.AUDIENCE,
}: {
	request: Request
	userId: Audience['id'] | Admin['id']
	remember?: boolean
	redirectTo: string
	role: Role
}) {
	const session = await getSession(request)
	session.set(USER_SESSION_KEY, userId)
	session.set(USER_ROLE_KEY, role)

	return redirect(redirectTo, {
		headers: {
			'Set-Cookie': await sessionStorage.commitSession(session, {
				maxAge: remember ? fourteenDaysInSeconds : thirtyDaysInSeconds,
			}),
		},
	})
}

export async function logout(request: Request) {
	const session = await getSession(request)

	// For some reason destroySession isn't removing session keys
	// So, unsetting the keys manually
	session.unset(USER_SESSION_KEY)

	return redirect('/login', {
		headers: {
			'Set-Cookie': await sessionStorage.destroySession(session),
		},
	})
}

export async function isAudience(request: Request) {
	const session = await getSession(request)
	return session.get(USER_ROLE_KEY) === Role.AUDIENCE
}

export async function isAdmin(request: Request) {
	const session = await getSession(request)
	return session.get(USER_ROLE_KEY) === Role.ADMIN
}
