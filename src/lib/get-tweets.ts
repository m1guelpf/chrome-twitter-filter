import type { BaseTweet, Tweet } from '@/types/tweet'

export const getTweetsInPage = (container: Element): Array<{ element: HTMLDivElement; tweet: Tweet }> => {
	return [...container.querySelectorAll('[data-testid="tweet"]')].map(element => ({
		element: element as HTMLDivElement,
		tweet: parseTweet({ element }) as Tweet,
	}))
}

export const waitForTweetContainer = (): Promise<Element> => {
	return new Promise(resolve => {
		const interval = setInterval(() => {
			const tweetContainer = document.querySelector('[aria-label^="Timeline:"]')
			if (!tweetContainer) return

			clearInterval(interval)
			resolve(tweetContainer)
		}, 500)
	})
}

export const parseTweet = ({
	element: el,
	isQuoteTweet = false,
}: {
	element: Element
	isQuoteTweet?: boolean
}): BaseTweet | Tweet => ({
	id: isQuoteTweet ? undefined : parseID(el),
	is_quote_tweet: isQuoteTweet,
	quoting_tweet: isQuoteTweet ? null : parseQuoteTweet(el),
	author: {
		name: el.querySelector('[data-testid="User-Name"] > div')!.textContent as string,
		username: el.querySelector('[data-testid="User-Name"] > div:nth-child(2) span')!.textContent!.substring(1),
	},
	text: el.querySelector('[data-testid="tweetText"]')?.textContent ?? '',
	hasMoreText: el.querySelector('[data-testid="tweet-text-show-more-link"]') !== null,
	link: parseLink(el.querySelector('[data-testid="card.wrapper"] a') as HTMLAnchorElement | null),
	photos: [...el.querySelectorAll('[data-testid="tweetPhoto"] img')].map(el => (el as HTMLImageElement).src),
	video: parseVideo(el.querySelector('video') as HTMLVideoElement | null),
	metrics: {
		likes: parseMetric(
			el.querySelector('[data-testid="like"]')?.textContent ??
				el.querySelector('[data-testid="unlike"]')?.textContent ??
				null
		),
		replies: parseMetric(el.querySelector('[data-testid="reply"]')?.textContent ?? null),
		quoteTweets: parseMetric(el.querySelector('#tntQuoteTweetCount')?.textContent ?? null),
		retweets: parseMetric(el.querySelector('[data-testid="retweet"]')?.textContent ?? null),
		bookmarks: parseMetric(el.querySelector('[data-testid="bookmark"]')?.textContent ?? null),
	},
	published_at: new Date((el.querySelector('time') as HTMLTimeElement)!.dateTime),
})

const parseLink = (el: HTMLAnchorElement | null) => {
	if (!el) return null

	return { url: el.href, label: el.getAttribute('aria-label') }
}

const parseID = (el: Element): string => {
	if (!el.querySelector('time')?.parentElement) {
		console.log(el)
		window.alert("Couldn't find ID!")
	}

	const url = (el.querySelector('time')!.parentElement as HTMLAnchorElement).href

	return url.split('/').pop()!
}

const parseQuoteTweet = (el: Element): BaseTweet | null => {
	const usernameEls = [...el.querySelectorAll('[data-testid="User-Name"]')]
	if (usernameEls.length < 2) return null

	return parseTweet({ element: usernameEls[1].closest('[role="link"]') as HTMLDivElement, isQuoteTweet: true })
}

const parseVideo = (video: HTMLVideoElement | null) => {
	if (!video) return null

	return {
		poster: video.poster,
	}
}

const parseMetric = (metric: string | null): number => {
	if (!metric || metric == '') return 0
	if (metric.includes('K')) return parseInt(metric.replace('K', '')) * 1000
	if (metric.includes('M')) return parseInt(metric.replace('M', '')) * 1000000
	return parseInt(metric)
}
