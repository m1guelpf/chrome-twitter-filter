export enum Page {
	Home,
	Other,
	Tweet,
	Search,
	Profile,
}

export const parseURL = (url: Location): Page => {
	const path = url.pathname.substring(1)

	if (path === '') return Page.Other
	if (path === 'home') return Page.Home
	if (path === 'search') return Page.Search
	if (path === 'explore') return Page.Other
	if (path.includes('/status/')) return Page.Tweet
	if (path.startsWith('i/') || path.startsWith('settings/')) return Page.Other

	return Page.Profile
}
