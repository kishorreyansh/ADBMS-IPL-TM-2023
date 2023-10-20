import {ClientProvider} from '@mantine/remix'
import {RemixBrowser} from '@remix-run/react'
import {startTransition, StrictMode} from 'react'
import {hydrateRoot} from 'react-dom/client'
import {emotionCache} from '~/utils/mantine'

const hydrate = () => {
	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<ClientProvider emotionCache={emotionCache}>
					<RemixBrowser />
				</ClientProvider>
			</StrictMode>
		)
	})
}

if (typeof requestIdleCallback === 'function') {
	requestIdleCallback(hydrate)
} else {
	// Safari doesn't support requestIdleCallback
	// https://caniuse.com/requestidlecallback
	setTimeout(hydrate, 1)
}
