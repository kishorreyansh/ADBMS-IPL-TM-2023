import {Button, PasswordInput, SegmentedControl, TextInput} from '@mantine/core'
import type {ActionFunction} from '@remix-run/node'
import {Link, useFetcher} from '@remix-run/react'
import {Lock} from 'lucide-react'
import * as React from 'react'
import {verifyLogin} from '~/lib/user.server'
import {LoginSchema} from '~/lib/zod.schema'
import {createUserSession} from '~/session.server'
import {Role} from '~/utils/constants'
import {badRequest, safeRedirect} from '~/utils/misc.server'
import type {inferErrors} from '~/utils/validation'
import {validateAction} from '~/utils/validation'

interface ActionData {
	fieldErrors?: inferErrors<typeof LoginSchema>
}

export const action: ActionFunction = async ({request}) => {
	const {fieldErrors, fields} = await validateAction(request, LoginSchema)

	if (fieldErrors) {
		return badRequest<ActionData>({fieldErrors})
	}

	const {email, password, redirectTo, remember, role} = fields

	const user = await verifyLogin({email, password, role: role as Role})

	if (!user) {
		return badRequest<ActionData>({
			fieldErrors: {
				password: 'Invalid username or password',
			},
		})
	}

	return createUserSession({
		request,
		userId: user.id,
		role: role as unknown as Role,
		remember: remember === 'on' ? true : false,
		redirectTo: safeRedirect(redirectTo),
	})
}

export default function Login() {
	const fetcher = useFetcher<ActionData>()
	const isSubmitting = fetcher.state !== 'idle'

	const [role, setRole] = React.useState<Role>(Role.AUDIENCE)
	return (
		<>
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
				<div className="flex flex-col space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Welcome back!
					</h1>
					<p className="text-muted-foreground text-sm">
						Enter your credentials below to continue
					</p>
				</div>
				<fetcher.Form
					method="post"
					className="w-full rounded bg-white px-6 pb-8 pt-6 text-black"
				>
					<div className="flex flex-col gap-4">
						<SegmentedControl
							fullWidth
							name="role"
							value={role}
							onChange={val => setRole(val as Role)}
							mb={12}
							data={[
								{label: 'Customer', value: 'audience'},
								{label: 'Admin', value: 'admin'},
							]}
						/>

						<TextInput
							type="email"
							name="email"
							label="Email"
							autoFocus={true}
							placeholder="Enter your email"
							error={fetcher.data?.fieldErrors?.email}
							withAsterisk={false}
							required
						/>

						<PasswordInput
							name="password"
							label="Password"
							withAsterisk={false}
							placeholder="Enter your password"
							error={fetcher.data?.fieldErrors?.password}
							required
						/>
					</div>
					<div className="my-4 flex items-center justify-end">
						{role === Role.AUDIENCE && (
							<Link
								to="/register"
								prefetch="intent"
								className="font-roboto text-sm font-semibold text-blue-500 hover:underline"
							>
								Register?
							</Link>
						)}
					</div>
					<Button
						fullWidth
						type="submit"
						loading={isSubmitting}
						leftIcon={<Lock size={16} />}
					>
						Login
					</Button>
				</fetcher.Form>
			</div>
		</>
	)
}
