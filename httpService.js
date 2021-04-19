const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const URL = global.process.env.API_URL; //have to specify global because function below also named "process"
const apiHeaders = require('./apiHeaders.js');
const { post } = require('request');

const addTeamsPost = (URL, username, teamsToAdd, skipValidation) => {
	let validationBit = skipValidation ? 1 : 0; //if 1 - teams have been validated and confirmed to exist; skip right to insert
	apiHeaders.headers.skipValidation = validationBit;

	return axios
		.post(
			`${URL}/user/${username}/addteams`,
			{
				teamsToAdd: teamsToAdd,
			},
			apiHeaders
		)
		.then(function (response) {
			console.log(`API addTeams response: ${JSON.stringify(response.data)}`);
			return response;
		})
		.catch(function (error) {
			console.log(error);
			return error;
		});
};

const getTeamsForUser = (URL, username) => {
	return axios
		.get(`${URL}/user/${username}/getteams`, apiHeaders)
		.then(function (response) {
			// handle success
			return response;
		})
		.catch(function (error) {
			console.log(error);
			return error;
		});
};

const removeTeamsPost = (URL, username, teamsToRemove) => {
	let removeJsonBody = teamsToRemove[0] === '*' ? null : { teamsToRemove: teamsToRemove };
	return axios
		.post(`${URL}/user/${username}/removeteams`, removeJsonBody, apiHeaders)
		.then((response) => {
			console.log(`API addTeams response: ${JSON.stringify(response.data)}`);
			return response;
		})
		.catch((error) => {
			console.log(error);
			return error;
		});
};

const getUsersForTeamMatch = (URL, teams) =>{

	return axios.get(`${URL}/teams/${teams[0]}/${teams[1]}/getusers`, apiHeaders)
	
}
const checkHltv = (team) => {
	return new Promise((resolve, reject) => {
		request(`https://www.hltv.org/search?query=${team}`, (error, response, html) => {
			if (!error && response.statusCode === 200) {
				const $ = cheerio.load(html);
				const teamsDiv = $('.team-logo');
				let hltvLink = teamsDiv[0]?.parentNode?.attribs?.href;
				let hltvId = hltvLink?.replace(/(^.+\D)(\d+)(\D.+$)/i, '$2'); //pull first sequence of numbers from link - will always be hltv team ID
				console.log(`Request made to https://www.hltv.org/search?query=${team}`);

				if (
					teamsDiv &&
					teamsDiv.length &&
					teamsDiv[0].attribs &&
					teamsDiv[0].attribs.title &&
					teamsDiv[0].attribs.title.toString().toUpperCase() === team.toString().toUpperCase()
				) {
					console.log(`This is a valid team name: ${team}`);
					resolve({ Team: team, HltvTeamId: hltvId, Exists: true });
					return;
				} else {
					console.log(`This is not a valid team name: ${team}`);
					resolve({ Team: team, Exists: false });
					return;
				}
			} else {
				console.log(`Could not make a request to https://www.hltv.org/search?query=${team}`);
				reject('hltv error');
			}
		});
	});
};

exports.addTeamsPost = addTeamsPost;
exports.checkHltv = checkHltv;
exports.getTeamsForUser = getTeamsForUser;
exports.removeTeamsPost = removeTeamsPost;
exports.getUsersForTeamMatch = getUsersForTeamMatch;