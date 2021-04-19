//format incoming commands into the Team/HltvId object format
const jsonifyTeamsDetailed = (item) => {
	team = {
		Team: (item.Team ?? item).trim(),
		HltvId: item.HltvTeamId ?? 0,
	};

	return team;
};

const formatReply = (username, action, teams) => {
	var replyString = `@${username}`;
	const myTeams = [];
	teams.forEach((team) => {
		myTeams.push(team);
	});

	if (action == 'getTeamsForUser') {
		if (teams?.length == 0) {
			return (replyString += ` you are not subscribed to any teams`);
		}

		replyString += ' you are subscribed to ';
		return (replyString += populateReply(replyString, myTeams));
	}
	if (action == 'add') {
		if (teams?.length == 0) {
			return (replyString += ` you did not provide any teams to add`);
		}
		replyString += ' you are now subscribed to ';
		return (replyString += populateReply(replyString, myTeams));
	}
	if ((action = 'remove')) {
		if (teams?.length == 0) {
			return (replyString += ' you did not provide any teams to remove');
		}
		if (teams[0] === '*') {
			return (replyString += ` you've been unsubscribed from all teams`);
		}
		replyString += ' you are no longer subscribed to ';

		return (replyString += populateReply(replyString, myTeams));
	}
	if ((action = 'getUsersForTeamMatch')) {
		//generate alert tweet sent to users when a subscribed team's match is coming up
	}
};

const populateReply = (reply, teams, action) => {
	let teamsTxt = `${teams.join(', ')}`;
	if ((reply += teamsTxt).length <= 240) return teamsTxt; //if all teams fit, use this
	//handle picking 3 or fewer teams for user that are under 35 chars
	let teamsTxtTruncated = '';
	var i = 0;
	for (i; i < 3 && i <= teams.length; i++) {
		//i <= teams.length - cover case of a guy having just one team with a name that's a giant string. shouldn't happen
		if (teams[i]?.length <= 25) {
			teamsTxtTruncated += `${teams[i]}, `; //grab first 3 teams under 25 chars
		}
	}
	teamsTxtTruncated = teamsTxtTruncated.substr(0, teamsTxtTruncated.length - 2); //cut off trailing comma & space
	let truncatedTeamsCount = teams.length - i;
	teamsTxtTruncated += ` and ${truncatedTeamsCount} others`; //pastebin link will go here
	//action argument will be used to determine what the pastebin says e.g. "List of all teams subscribed to, added, etc."
	return teamsTxtTruncated;
};


exports.formatAsTeamObj = jsonifyTeamsDetailed;

exports.formatReply = formatReply;
