const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const moment = require('moment');
var twit = require('twit');
var config = require('./config.js');
const URL = process.env.API_URL;
const apiHeaders = require('./apiHeaders.js');
const httpSvc = require('./httpService');
const fs = require('fs');

function scrape() {
	let iteration = 0;
	//testing block

	//const localHtml = fs.readFileSync('./hltv.html', 'utf8');

	//end testing block
	console.log('Making request to https://www.hltv.org/matches');
	console.log('current unix timestamp (within scrape): ' + Math.floor(Date.now() / 1000));
	let requestUrl = false ? 'https://google.com' : 'https://www.hltv.org/matches'; //for testing with local html file
	request(requestUrl, (error, response, html) => {
		if (!error && response.statusCode === 200) {
			console.log('Successful Request');

			const $ = cheerio.load(html);

			// get entire div of soonest match day (may not necessarily be today)
			let soonestMatchDay = $('.upcomingMatchesSection:first-child');

			// get todays date
			const x = new Date();
			x.setHours(x.getHours() + 6);
			const todaysDate = moment(x).format('YYYY-MM-DD');
			console.log(`Today's date (CEST) is ${todaysDate}`);

			// check if the soonest match day is today
			const y = soonestMatchDay.find('.matchDayHeadline').text().split(' ');
			const soonestMatchDate = y[y.length - 1];
			console.log(`Soonest Match date (CEST) is ${soonestMatchDate}`);

			// if the soonest match day is not today, disregard all matchesSS
			let numMatches = 0;

			numMatches = soonestMatchDay.find('.upcomingMatch').length;

			console.log(`There are ${numMatches} matches remaining today (CET)`);
			var xx = 0;
			// we use an iterator here so that, as soon as we find a match that is more than 5 minutes away, we don't bother looping through any later matches
			var nextMatchWithin5 = true;
			let firstMatch = soonestMatchDay.find('.upcomingMatch').first();
			while (
				iteration < numMatches
			) {
				let match = iteration == 0 ? firstMatch : nextMatch;
				iteration++;

				let unixTCNow = Math.floor(Date.now() / 1000); //recalculate unix time incase http req took awhile

				var nextMatch = match.next(); //nextmatch will actually be the next match.
				//keep going until nextmatch unix time is greater than 5 mins away

				let matchUnixSeconds = match[0].attribs['data-zonedgrouping-entry-unix'] / 1000; //hltv unix in ms
				let within5mins =
					matchUnixSeconds - unixTCNow <= 300 && //match within 5 mins
					unixTCNow < matchUnixSeconds //match not before current time
						? true
						: false;
						console.log(`unix seconds between now and match: ${matchUnixSeconds - unixTCNow}` )
				// get team names
				let teams = [];
				match.find('.matchTeamName').each((i, el) => {
					teams.push($(el).text());
				});
				const team1 = teams[0];
				const team2 = teams[1];

				if (!within5mins) {
					nextMatchWithin5 == false;
					let noMatchesMsg =
						typeof team1 == 'undefined'
							? 'Because this match between yet to be determined opponents starts in more than 5 minutes, or has already started, stop and scrape again in 5 minutes'
							: `Because this match: ${team1} v.s. ${team2} starts in more than 5 minutes, or has already started, stop and scrape again in 5 minutes`;
					console.log(noMatchesMsg);
					break;
				}

				console.log(`The next match is between ${team1} and ${team2}`);


				//console.log(`Or, in ${hoursLeft} hours and ${minutesLeft} minutes`);

				const link = `hltv.org${nextMatch.find('a').attr('href')}`;

				console.log(`The HLTV link for the match is ${link}`);

				// if there are no matches in the next 5 minutes, exit the loop
				// console.log('Because this match starts in more than 5 minutes, stop and scrape again in 5 minutes');

				// console.log('This match begins in less than 5 minutes!');

				console.log(`Getting all users who are subscribed to ${team1} and ${team2}`);

				let users = [];

				httpSvc
					.getUsersForTeamMatch(URL, teams, matchUnixSeconds)
					.then((response) => {
						console.log(`API getUsersForTeamMatch response: ${JSON.stringify(response?.data)}`);
						users = response?.data?.users;
						// if (users?.length == 0 || typeof users === 'undefined') {
						// 	console.log(`API returned no users subscribed to ${team1} or ${team2}`);
						// 	return; //no users; exit
						// }
						unixTCNow = Math.floor(Date.now() / 1000); //recalculate unix time incase http req took awhile
						let minsUntilMatch = Math.ceil((matchUnixSeconds - unixTCNow) / 60)
						var T = new twit(config);
						users.forEach((user) => {
							try {
								console.log(`@${user} ${team1} vs ${team2} starts in ${minsUntilMatch} minutes. ${link}`);
								// T.post(
								// 	'statuses/update',
								// 	{
								// 		status: `@${user} ${team1} vs ${team2} starts in ${minutesLeft} minutes. ${link}`,
								// 	},
								// 	function (err, data, response) {
								// 		if (err) {
								// 			console.log(err);
								// 		}
								// 	}
								// );
							} catch (error) {
								console.log(error);
							}
						});
					})
					.catch((err) => {
						console.log(`Error in API getUsersForTeamMatch response: ${err}`);
					});
			}
		} else {
			console.log('Request Failed');
		}
	});
}

module.exports = scrape;
