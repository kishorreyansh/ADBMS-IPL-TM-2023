import {Avatar} from '@mantine/core'
import type {LoaderFunction} from '@remix-run/node'
import {redirect} from '@remix-run/node'
import {Outlet} from '@remix-run/react'
import {getUser} from '~/session.server'

export const loader: LoaderFunction = async ({request}) => {
	const user = await getUser(request)
	if (user) return redirect('/')

	return null
}

export default function AuthLayout() {
	return (
		<>
			<main className="h-screen bg-white">
				<div className="container relative h-full flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
					<div className="relative hidden h-full flex-col p-10 text-gray-200 lg:flex">
						<div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
							<img
								src="https://images.unsplash.com/photo-1578575436955-ef29da568c6c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80"
								alt="IPM Ticket Master"
								className="block w-full object-contain"
							/>
						</div>
						<div className="relative z-20 flex items-center gap-4 text-lg font-medium">
							<Avatar
								src={null}
								alt="IPM Ticket Master"
								size="md"
								classNames={{
									placeholder: '!text-xl !text-stone-700',
									root: '!h-8 !flex !items-center !justify-center',
								}}
							>
								TM
							</Avatar>

							<span className="font-cal text-xl text-gray-200">
								IPL Ticket Master
							</span>
						</div>
					</div>

					<div className="p-8">
						<Outlet />
					</div>
				</div>
			</main>
		</>
	)
}
