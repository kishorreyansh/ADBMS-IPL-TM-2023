import * as bcrypt from 'bcryptjs'
import {db} from '~/db.server'
import {Role} from '~/utils/constants'

export async function getUserById(id: string, role = Role.AUDIENCE) {
	if (role === Role.AUDIENCE) {
		return db.audience.findUnique({
			where: {id},
			select: {
				id: true,
				name: true,
				email: true,
			},
		})
	}

	return db.admin.findUnique({
		where: {id},
		select: {
			id: true,
			name: true,
			email: true,
		},
	})
}

export async function getUserByEmail(email: string, role = Role.AUDIENCE) {
	if (role === Role.AUDIENCE) {
		return db.audience.findUnique({
			where: {email},
			select: {
				name: true,
				email: true,
			},
		})
	}

	return db.admin.findUnique({
		where: {email},
		select: {
			name: true,
			email: true,
		},
	})
}

export async function verifyLogin({
	email,
	password,
	role = Role.AUDIENCE,
}: {
	email: string
	password: string
	role?: Role
}) {
	let userWithPassword
	if (role === Role.AUDIENCE) {
		userWithPassword = await db.audience.findUnique({
			where: {email},
		})
	} else if (role === Role.ADMIN) {
		userWithPassword = await db.admin.findUnique({
			where: {email},
		})
	}

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password)

	if (!isValid) {
		return null
	}

	const {password: _password, ...userWithoutPassword} = userWithPassword

	return userWithoutPassword
}
