import type { Tweet } from './types/tweet'
import type { PlasmoCSConfig } from 'plasmo'
import { Page, parseURL } from './lib/parse-url'
import { sendToBackground } from '@plasmohq/messaging'
import type { TweetResponse } from './background/messages/tweet'
import { getTweetsInPage, waitForTweetContainer } from '@/lib/get-tweets'

const TITLE_REGEX = /<title>(.*)<\/title>/

export const config: PlasmoCSConfig = {
	all_frames: true,
	matches: ['https://x.com/*'],
}

const ENABLED_IN = [Page.Home]

let currentURL = location.href
let previousObserver: MutationObserver | null = null

if (ENABLED_IN.includes(parseURL(location))) setTimeout(() => processTweetsInPage(), 5000)

setInterval(() => {
	if (location.href === currentURL) return
	currentURL = location.href

	previousObserver?.disconnect()
	if (ENABLED_IN.includes(parseURL(location))) processTweetsInPage()
}, 1000)

function processTweetsInPage() {
	console.log('started looking for tweets')
	const tweetIDs: string[] = []

	waitForTweetContainer().then(container => {
		console.log('found container')
		const observer = new MutationObserver(async () => {
			getTweetsInPage(container)
				.filter(({ tweet }) => !tweetIDs.includes(tweet.id))
				.forEach(async ({ element, tweet }) => {
					if (tweet.link) {
						tweet.link =
							(await fetch(tweet.link)
								.then(res => res.text())
								.then(html => html.match(TITLE_REGEX)?.[1])) ?? tweet.link
					}

					tweetIDs.push(tweet.id)
					const response = await sendToBackground<Tweet, TweetResponse>({ name: 'tweet', body: tweet })

					if (response.shouldHide) {
						element.style.opacity = '0.5'
						console.log('hiding tweet', tweet.text)
						console.log('query sel', element.querySelector('[data-testid="tweetText"]'))
						;[...element.querySelectorAll('[data-testid="tweetText"]')].forEach(
							el => (el.textContent = response.summary)
						)
					}
				})

			console.log('got tweets')
		})

		observer.observe(container, { childList: true, subtree: true })
		previousObserver = observer
	})
}
