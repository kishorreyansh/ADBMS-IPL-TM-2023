import {OrderStatus} from '@prisma/client'
import type {ClassValue} from 'clsx'
import clsx from 'clsx'
import {twMerge} from 'tailwind-merge'

export function round(number: number, precision: number) {
	const d = Math.pow(10, precision)
	return Math.round((number + Number.EPSILON) * d) / d
}

export function titleCase(string: string) {
	string = string.toLowerCase()
	const wordsArray = string.split(' ')

	for (var i = 0; i < wordsArray.length; i++) {
		wordsArray[i] =
			wordsArray[i].charAt(0).toUpperCase() + wordsArray[i].slice(1)
	}

	return wordsArray.join(' ')
}

export function formatDate(date: Date | string) {
	return new Intl.DateTimeFormat('en', {
		year: 'numeric',
		month: '2-digit',
		day: 'numeric',
	}).format(new Date(date))
}

export function formatTime(date: Date | string) {
	return new Intl.DateTimeFormat('en', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(date))
}

export function formatList(list: Array<string>) {
	return new Intl.ListFormat('en').format(list)
}

export function formatCurrency(amount: number) {
	return new Intl.NumberFormat('en', {
		style: 'currency',
		currency: 'USD',
	}).format(amount)
}

export function orderStatusLookup(status: OrderStatus) {
	return {
		[OrderStatus.SUCCESS]: 'Success',
		[OrderStatus.MATCH_POSTPONED]: 'Match Postponed',
		[OrderStatus.MATCH_CANCELLED]: 'Match Cancelled',
		[OrderStatus.CANCELLED_BY_ADMIN]: 'Cancelled by Admin',
		[OrderStatus.CANCELLED_BY_USER]: 'Cancelled by User',
	}[status]
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
	const nameParts = name.split(/[^a-zA-Z]+/)
	let initials = ''

	for (const part of nameParts) {
		if (part.length > 0) {
			initials += part[0]
		}

		if (initials.length >= 2) {
			break
		}
	}

	return initials.toUpperCase()
}
