import ollama from 'ollama/browser'
import { Storage } from '@plasmohq/storage'
import type { BaseTweet, Tweet } from '@/types/tweet'
import type { PlasmoMessaging } from '@plasmohq/messaging'

export type TweetResponse = {
	summary: string
	shouldHide: boolean
}

const storage = new Storage({ area: 'local' })

const handler: PlasmoMessaging.MessageHandler<Tweet, TweetResponse> = async ({ body: tweet }, res) => {
	if (!tweet || (await storage.get<boolean>(`tweet-${tweet.id}`))) return

	const req = await ollama.generate({
		model: 'llama3.2:1b',
		format: 'json',
		stream: false,
		prompt: `You are an AI assistant tasked with evaluating tweets to determine if they are "bait". In this context, "bait" is defined as content that is clearly engagement farming, useless viral material, or people being overly negative for no reason. Your goal is to help curate a Twitter feed by identifying and filtering out such content.

Here is the tweet you need to evaluate:

${renderTweet(tweet)}

To evaluate the tweet, consider the following guidelines:
1. Is the tweet designed to generate engagement rather than provide value?
2. Does the tweet contain sensationalized content or exaggerated claims?
3. Is the tweet unnecessarily negative or provocative?
3. Does the tweet mock someone or something in an unkind way?
4. Does the tweet reference politics, gossip or celebrity news?
4. Does the tweet contribute meaningfully to a discussion or share valuable information?
5. Is the tweet part of a viral trend that doesn't add substantial value?

After careful consideration, respond with JSON, like so:

{
  "reasoning": "[Provide a brief explanation of your thought process and why you believe the tweet is or is not bait. Be specific and reference the content of the tweet.]",
  "veredict": "[State your final verdict as either "BAIT" or "NOT_BAIT". If you are unsure, use "INCONCLUSIVE".]",
  "summary": "[A one-line summary of the tweet, which will replace the tweet when marked as BAIT. Make sure it gives enough context about the tweet (and quoted tweet, if applicable) but make it fit inside of the Twitter feed (very informal).]"
}

Remember to be conservative in your judgement. Only mark a tweet as "BAIT" if you are confident it meets the criteria. If you have any doubts or if the tweet's status is ambiguous, err on the side of caution and mark it as "NOT_BAIT" or "INCONCLUSIVE".`,
	})

	const response = JSON.parse(req.response)

	await storage.set(`tweet-${tweet.id}`, true)

	res.send({ shouldHide: response.veredict == 'BAIT', summary: response.summary })
}

const renderTweet = (tweet: Tweet | BaseTweet, header = 'tweet'): string => {
	return `
<${header} author="${tweet.author.name}" author-username="@${tweet.author.username}" ${tweet.video ? 'has-video' : ''} ${tweet.photos ? `photos="${tweet.photos.length}"` : ''} likes="${tweet.metrics.likes}" replies="${tweet.metrics.replies}" retweets="${tweet.metrics.retweets}">
<tweet-text ${tweet.hasMoreText ? 'truncated' : ''}>
${tweet.text}
</tweet-text>

${tweet.link ? `<tweet-link url="${tweet.link.url}">${tweet.link.label}</tweet-link>` : ''}

${'quoting_tweet' in tweet && tweet.quoting_tweet ? renderTweet(tweet.quoting_tweet, 'quoted_tweet') : ''}
</${header}>`
}

export default handler
