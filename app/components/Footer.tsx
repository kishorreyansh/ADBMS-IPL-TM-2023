import {Footer as FooterMantine} from '@mantine/core'
import appConfig from 'app.config'

export function Footer() {
	return (
		<FooterMantine
			height={44}
			p="md"
			className="flex items-center justify-center py-1 text-center text-sm"
		>
			<span className="text-gray-400">
				©{new Date().getFullYear()} {appConfig.name}, Inc. All rights reserved.
			</span>
		</FooterMantine>
	)
}
