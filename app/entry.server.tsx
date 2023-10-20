import {createStylesServer, injectStyles} from '@mantine/remix'
import {EntryContext, HandleDataRequestFunction} from '@remix-run/node'
import {RemixServer} from '@remix-run/react'
import {cacheHeader} from 'pretty-cache-header'
import {renderToString} from 'react-dom/server'
import {emotionCache} from '~/utils/mantine'

const server = createStylesServer(emotionCache)

export const handleDataRequest: HandleDataRequestFunction = async (
	response: Response,
	{request}
) => {
	const isGet = request.method.toLowerCase() === 'get'
	const purpose =
		request.headers.get('Purpose') ||
		request.headers.get('X-Purpose') ||
		request.headers.get('Sec-Purpose') ||
		request.headers.get('Sec-Fetch-Purpose') ||
		request.headers.get('Moz-Purpose')
	const isPrefetch = purpose === 'prefetch'

	// If it's a GET request and it's a prefetch request and it doesn't have a Cache-Control header
	if (isGet && isPrefetch && !response.headers.has('Cache-Control')) {
		// we will cache for 10 seconds only on the browser
		response.headers.set(
			'Cache-Control',
			cacheHeader({
				private: true,
				maxAge: '10s',
				sMaxage: '0s',
			})
		)
	}

	return response
}

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	const markup = renderToString(
		<RemixServer context={remixContext} url={request.url} />
	)
	responseHeaders.set('Content-Type', 'text/html')

	return new Response(`<!DOCTYPE html>${injectStyles(markup, server)}`, {
		status: responseStatusCode,
		headers: responseHeaders,
	})
}
