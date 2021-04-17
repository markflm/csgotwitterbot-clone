//format incoming commands into the Team/HltvId object format
const jsonifyTeamsDetailed = item => {
	team = {
		Team: (item.Team ?? item).trim(),
		HltvId: item.HltvTeamId ?? 0,
	};

	return team;
};

const returnTestTweet = () => {
	let tweet = {
		text: `@csgomatchbot

    +  HAVU`,
		user: {
			name: 'mark kflm',
			screen_name: 'KiFFLoM',
		},
	};
	return tweet;
};
exports.formatAsTeamObj = jsonifyTeamsDetailed;
exports.returnTestTweet = returnTestTweet;
