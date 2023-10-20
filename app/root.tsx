import {createEmotionCache, MantineProvider} from '@mantine/core'
import {ModalsProvider} from '@mantine/modals'
import {StylesPlaceholder} from '@mantine/remix'
import type {
	LinksFunction,
	LoaderArgs,
	MetaFunction,
	SerializeFrom,
} from '@remix-run/node'
import {json} from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react'
import appConfig from 'app.config'
import {getUser} from './session.server'
import fontStylestylesheetUrl from '~/styles/font.css'
import tailwindStylesheetUrl from '~/styles/tailwind.css'
import {Toaster} from 'sonner'

const appendCache = createEmotionCache({key: 'mantine', prepend: false})

export const links: LinksFunction = () => {
	return [
		{rel: 'stylesheet', href: fontStylestylesheetUrl},
		{rel: 'stylesheet', href: tailwindStylesheetUrl},
	]
}

export type RootLoaderData = SerializeFrom<typeof loader>
export const loader = async ({request}: LoaderArgs) => {
	const user = await getUser(request)
	return json({user})
}

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: appConfig.name,
	viewport: 'width=device-width,initial-scale=1',
})

export function Document({
	title,
	children,
}: {
	title?: string
	children: React.ReactNode
}) {
	return (
		<MantineProvider
			withNormalizeCSS
			emotionCache={appendCache}
			theme={{
				primaryColor: 'dark',
			}}
		>
			<html lang="en" className="h-full">
				<head>
					{title ? <title>{title}</title> : null}
					<Meta />
					<Links />
					<StylesPlaceholder />
				</head>
				<body className="h-full">
					{children}
					<ScrollRestoration />
					<Scripts />
					<LiveReload />
				</body>
			</html>
		</MantineProvider>
	)
}

export default function App() {
	return (
		<Document>
			<Toaster richColors closeButton duration={4000} position="top-right" />
			<ModalsProvider>
				<Outlet />
			</ModalsProvider>
		</Document>
	)
}
