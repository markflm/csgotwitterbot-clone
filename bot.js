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
	//process(helpers.returnTestTweet()) //simulates one run of the bot script with a hardcoded tweet.
	//uncomment this & comment out mentionStream to use
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
	console.log(`Invalid Syntax: ${!addTeams && !removeTeams}`);

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

		axios
			.get(`${URL}/user/${username}/getteams`, apiHeaders)
			.then(function (response) {
				// handle success
				console.log(response.data);

				response.data.teams.forEach(team => {
					myTeams.push(team);
				});
				console.log(
					`These are the teams that ${username} is subscribed to: ${JSON.stringify(
						myTeams
					)}`
				);

				setTimeout(function () {
					T.post('statuses/update', {
						status: `@${
							tweet.user.screen_name
						} you are subscribed to ${myTeams.join(', ')}`,
					});
				}, 5000);
			})
			.catch(function (error) {
				// handle error
				console.log(`Error getting all users subscribed to ${team1}`);
				console.log(error);
			});
	} else if (addTeams) {
		//if any teams are to be added
		postText = postText.substring(1, postText.length);
		let teams = postText.split(',');

		console.log(`These are the teams to be added: ${JSON.stringify(teams)}`);

		let formattedTeams = teams.map(helpers.formatAsTeamObj);

		const hltvPromises = [];
		let confirmedTeams = []; //stores any team(s) that require and pass an hltv check

		httpSvc
			.addTeamsPost(URL, username, formattedTeams, false) //first pass; call returns any unconfirmed teams
			.then(result => {
				let unconfirmedTeams = result.data.teamsUnconfirmed;

				if (unconfirmedTeams?.length <= 0) return; //skip hltv check if no unconfirmed teams

				for (let x = 0; x < unconfirmedTeams.length; x++) {
					var team = unconfirmedTeams[x].Team;
					team = team.trim();

					console.log(`Checking if ${team} exists`);

					hltvPromises.push(httpSvc.checkHltv(team));
				}
			})
			.then(_ => {
				if (hltvPromises.length <= 0) return; //if no promises, there's no unconfirmed teams. exit;
				confirmedTeams = Promise.all(hltvPromises).then(result => {
					console.log(
						`Confirmed new team(s) exist: + ${JSON.stringify(result)}`
					);
					httpSvc.addTeamsPost(URL, username, result, true);
				});
			});
	} else if (removeTeams) {
		//if any teams are to be removed
		postText = postText.substring(1, postText.length);
		let teams = postText.split(',');

		console.log(`These are the teams to be removed: ${JSON.stringify(teams)}`);

		// check for wildcard delete
		if (teams[0].trim() === '*') {
			console.log(`Deleting all subscriptions for ${username}`);

			axios
				.post(`${URL}/user/${username}/removeTeams`, {}, apiHeaders)
				.then(function (response) {
					console.log(response.data);
					console.log(`Successfully unsubscribed ${username} from all teams`);

					setTimeout(function () {
						T.post('statuses/update', {
							status: `@${tweet.user.screen_name} you are unsubscribed to all teams.`,
						});
					}, 5000);
				})
				.catch(function (error) {
					console.log(`Could not unsubscribe ${username} from ${teams[x]}`);

					console.log(error);
					setTimeout(function () {
						T.post('statuses/update', {
							status: `@${tweet.user.screen_name} there was an error unsubscribing you to all teams`,
						});
					}, 5000);
				});
		} else {
			for (let x = 0; x < teams.length; x++) {
				teams[x] = teams[x].trim();

				console.log(`Unsubscribing ${username} from ${teams[x]}`);

				axios
					.post(
						`${URL}/user/${username}/removeTeams`,
						{
							teamsToRemove: [teams[x]],
						},
						apiHeaders
					)
					.then(function (response) {
						console.log(response.data);
						console.log(
							`Successfully unsubscribed ${username} from ${teams[x]}`
						);

						setTimeout(function () {
							T.post('statuses/update', {
								status: `@${tweet.user.screen_name} you are unsubscribed to ${teams[x]}`,
							});
						}, 5000);
					})
					.catch(function (error) {
						console.log(`Could not unsubscribe ${username} from ${teams[x]}`);

						console.log(error);
						setTimeout(function () {
							T.post('statuses/update', {
								status: `@${tweet.user.screen_name} there was an error unsubscribing you to ${teams[x]}`,
							});
						}, 5000);
					});
			}
		}
	}
	console.log('---------------------------');
}

module.exports = bot;
