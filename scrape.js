const request = require('request');
const cheerio = require('cheerio');

request('https://www.hltv.org/matches', (error, response, html) => {
    if (!error && response.statusCode === 200) {
        const $ = cheerio.load(html);

        // get entire div of today's matches
        const todaysMatches = $('.match-day:first-child');

        // get only the next match up today
        const nextMatch = todaysMatches.find('.match').first();

        // get the start time and convert it to EST
        const time = nextMatch.find('.time').text().trim(); // time returned is Central European Standard Time (6 hours ahead)
        let hours = (parseInt(time.substring(0,2)) - 6).toString(); // this needs to be adjusted to account for games that start between 00:00 and 05:59 cest, because converted hours would be a negative number
        let minutes = time.substring(3,5);
        const convertedTime = `${hours}:${minutes}`;

        // compare start time to current time
        const now = new Date();
        const nowHours = now.getHours();
        const nowMinutes = now.getMinutes();
        const hoursLeft = hours - nowHours;
        const minutesLeft = minutes - nowMinutes;

        // get team names
        let teams = [];
        nextMatch.find('.team').each((i, el) => {
            teams.push($(el).text());
        });

        const team1 = teams[0];
        const team2 = teams[1];

        console.log(`${team1} vs ${team2} starts at ${convertedTime} (${hoursLeft} hours & ${minutesLeft} minutes)`);
    }
})