import {Form} from '@remix-run/react'
import {LogOutIcon} from 'lucide-react'

export function LogoutButton() {
	return (
		<Form method="post" action="/api/auth/logout">
			<button
				type="submit"
				className="rounded-lg p-1.5 text-gray-300 transition-all duration-150 ease-in-out hover:bg-stone-700 active:bg-stone-800"
			>
				<LogOutIcon width={18} />
			</button>
		</Form>
	)
}
