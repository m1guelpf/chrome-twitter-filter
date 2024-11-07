export type BaseTweet = {
	author: {
		name: string
		username: string
	}
	text: string
	link?: {
		url: string
		label?: string
	}
	photos: string[]
	hasMoreText: boolean
	video: { poster: string } | null
	metrics: {
		likes: number
		replies: number
		quoteTweets?: number
		retweets: number
		bookmarks?: number
	}
	published_at: Date
	is_quote_tweet: boolean
}

export type Tweet = BaseTweet & {
	id: string
	quoting_tweet: BaseTweet | null
}
