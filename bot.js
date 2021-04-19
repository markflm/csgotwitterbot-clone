const twit = require('twit');
const config = require('./config.js');
const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const URL = global.process.env.API_URL; //have to specify global because function below also named "process"
const T = new twit(config);
const apiHeaders = require('./apiHeaders.js');
const { post } = require('request');
const helpers = require('./helpers.js');
const httpSvc = require('./httpService.js');

function bot() {
	console.log('bot running...');
	const mentionStream = T.stream('statuses/filter', {
		track: ['@CSGOMatchbot'],
	});

	// on incoming tweet
	mentionStream.on('tweet', function (tweet) {
		process(tweet);
	});
	// tweet = {
	// 	text: `@csgomatchbot !teams`,
	// 	user: {
	// 		name: 'mark kflm',
	// 		screen_name: 'KiFFLoM'
	// 	},
	// };
	// process(tweet) //simulates one run of the bot script with a hardcoded tweet. uncomment this & comment out mentionStream to use


}

function process(tweet) {
	let username = tweet.user.screen_name;
	let postText = tweet.text.replace('@csgomatchbot', '');
	postText = postText.trim();
	postText = postText.replace(/ {1,}/g, ' ');
	console.log(`Recieved the tweet [${postText}] from ${username}`);

	let getMyTeams = postText === '!teams';
	let addTeams = postText[0] === '+';
	let removeTeams = postText[0] === '-';

	console.log(`Get my teams: ${getMyTeams}`);
	console.log(`Adding Teams: ${addTeams}`);
	console.log(`Removing Teams: ${removeTeams}`);
	console.log(`Invalid Syntax: ${!addTeams && !removeTeams && !getMyTeams}`);

	let replyString = ''; //holds outgoing reply tweet
	if (!addTeams && !removeTeams && !getMyTeams) {
		// if the first character isn't +, -, or the "!teams" command
		console.log(`Found Invalid Syntax`);
		setTimeout(function () {
			T.post('statuses/update', {
				status: `@${tweet.user.screen_name} Invalid command. Please read the documentation in my bio`,
			});
		}, 5000);
	} else if (getMyTeams) {
		// get this user's subscribed teams
		console.log(`Getting all teams for ${username} `);

		const myTeams = [];

		httpSvc
			.getTeamsForUser(URL, username)
			.then((result) => {
				const teams = result?.data?.teams;
				console.log(`These are the teams that ${username} is subscribed to: ${JSON.stringify(teams)}`);
				replyString = helpers.formatReply(username, 'getTeamsForUser', teams);
				setTimeout(function () {
					T.post('statuses/update', {
						status: replyString,
					});
				}, 5000);
			})
			.catch(function (error) {
				// handle error
				console.log(`Error getting all teams for user ${username}`);
				console.log(error);
			});
	} else if (addTeams) {
		//if any teams are to be added
		postText = postText.substring(1, postText.length);
		let teams = postText.split(',');
		teams = teams.map((x) => x.trim());
		if (postText.length == 0) {
			//will be true for a tweet like "@csgomatchbot + "
			let teams = []; //generate empty teams object to comply with formatReply standards. 'real' teams object has a length of 1 no matter what
			replyString = helpers.formatReply(username, 'add', teams);
			console.log(`sending tweet: ${replyString}`);
			setTimeout(function () {
				T.post('statuses/update', {
					status: replyString,
				});
			}, 5000);
			return;
		}

		console.log(`These are the teams to be added: ${JSON.stringify(teams)}`);

		let formattedTeams = teams.map(helpers.formatAsTeamObj);

		const hltvPromises = []; //promises for hltv team existence checks
		let confirmedTeams = []; //stores any team(s) that require and pass an hltv check

		httpSvc
			.addTeamsPost(URL, username, formattedTeams, false) //first pass; call returns any unconfirmed teams
			.then((result) => {
				let unconfirmedTeams = result.data.teamsUnconfirmed;

				if (unconfirmedTeams.length <= 0) {
					//skip hltv check & return if no unconfirmed teams
					replyString = helpers.formatReply(username, 'add', teams);
					console.log(`sending tweet: ${replyString}`);
					setTimeout(function () {
						T.post('statuses/update', {
							status: replyString,
						});
					}, 5000);
					return;
				}

				for (let x = 0; x < unconfirmedTeams.length; x++) {
					var team = unconfirmedTeams[x].Team;
					team = team.trim();

					console.log(`Checking if ${team} exists`);

					hltvPromises.push(httpSvc.checkHltv(team));
				}
			})
			.then((_) => {
				if (hltvPromises.length <= 0) return; //if no promises, there's no unconfirmed teams. exit;
				confirmedTeams = Promise.all(hltvPromises).then((result) => {
					let confirmedTeams = result.filter((x) => x.Exists == true);
					console.log(`Confirmed new team(s) exist: + ${JSON.stringify(confirmedTeams)}`);
					if (confirmedTeams.length > 0) {
						//don't
						httpSvc.addTeamsPost(URL, username, confirmedTeams, true);
					}
					replyString = helpers.formatReply(username, 'add', confirmedTeams);
					console.log(`sending tweet: ${replyString}`);
					// setTimeout(function () {
					// 	T.post('statuses/update', {
					// 		status: replyString,
					// 	});
					// }, 5000);
				});
			});
	} else if (removeTeams) {
		//if any teams are to be removed
		postText = postText.substring(1, postText.length);
		let teams = postText.split(',');
		teams = teams.map((x) => x.trim());

		if (postText.length == 0) {
			//will be true for a tweet like "@csgomatchbot + "
			let teams = []; //generate empty teams object to comply with formatReply standards. 'real' teams object has a length of 1 no matter what
			replyString = helpers.formatReply(username, 'remove', teams);
			console.log(`sending tweet: ${replyString}`);
			setTimeout(function () {
				T.post('statuses/update', {
					status: replyString,
				});
			}, 5000);
			return;
		}

		console.log(`These are the teams to be removed: ${JSON.stringify(teams)}`);
		httpSvc.removeTeamsPost(URL, username, teams).then((_) => {
			replyString = helpers.formatReply(username, 'remove', teams);
			console.log(`sending tweet: ${replyString}`);
			setTimeout(function () {
				T.post('statuses/update', {
					status: replyString,
				});
			}, 5000);
			return;
		});
	}
	console.log('---------------------------');
}

module.exports = bot;
