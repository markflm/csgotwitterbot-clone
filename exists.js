const request = require('request');
const cheerio = require('cheerio');

console.log(exists('liquid'));

function exists(team) {
	let result = 'Boolean';
	request(
		`https://www.hltv.org/search?query=${team}`,
		(error, response, html) => {
			if (!error && response.statusCode === 200) {
				const $ = cheerio.load(html);
				const teamsDiv = $('.team-logo');
				if (
					teamsDiv[0].attribs.title.toString().toUpperCase() ===
					team.toString().toUpperCase()
				) {
					result = true;
				} else {
					result = false;
				}
			}
		}
	);
}

module.exports = exists;
