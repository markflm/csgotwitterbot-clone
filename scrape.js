const request = require('request');
const cheerio = require('cheerio');

function scrape () {
    let matchesToTweet = [];
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
            let  hoursLeft = 0;
            let minutesLeft = 0;

            if (hours >= nowHours)
                hoursLeft = (Number(hours) - Number(nowHours)).toString();
            else hoursLeft = (24 - Number(nowHours) + Number(hours)).toString(); 

            if (minutes >= minutesLeft)
                minutesLeft = (Number(minutes) - Number(nowMinutes)).toString();
            else  minutesLeft = (60 - Number(nowMinutes) + Number(minutes)).toString();

            if (minutesLeft > 5 || hoursLeft > 0) { // if there are no matches in the next 5 minutes
                console.log(`The next match does not start for ${hoursLeft} hours and ${minutesLeft} minutes. Re-scrape in 5 minutes`)
            } else {
            // get team names
            let teams = [];
            nextMatch.find('.team').each((i, el) => {
                teams.push($(el).text());
            });

            const team1 = teams[0];
            const team2 = teams[1];

            const link = `hltv.org/${nextMatch.find('a').attr('href')}`;

            console.log(`${team1} vs ${team2} starts at ${convertedTime} (${hoursLeft} hours & ${minutesLeft} minutes)`);
            console.log(link);

            matchesToTweet += {
                team1: team1,
                team2: team2,
                convertedTime: convertedTime,
                hoursLeft: hoursLeft,
                minutesLeft: minutesLeft,
                link: link,
            }
        }
        return matchesToTweet;
        }
    })
}

module.exports = scrape;