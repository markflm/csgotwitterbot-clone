const request = require('request');
const cheerio = require('cheerio');
var twit = require('twit');
var config = require('./config.js');

let iteration = 0;
let status = true;

do {
    scrape(iteration);
    iteration += 1;
}
while (iteration < 5);



function scrape (child) {
    let iteration = child;
    request('https://www.hltv.org/matches', (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html);

            // get entire div of today's matches
            const todaysMatches = $('.match-day:first-child');

            // get only the next match up today
            let nextMatch = todaysMatches.find('.upcoming-match').first();

             while (iteration > 0) {
                 try {
                    nextMatch = nextMatch.next();
                 } catch (error) {
                     console.log(error);
                 }
                 iteration -= 1;
             }

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

            if (minutes >= nowMinutes)
                minutesLeft = (Number(minutes) - Number(nowMinutes)).toString();
            else  {
                minutesLeft = (60 - Number(nowMinutes) + Number(minutes)).toString();
                hoursLeft -= 1;
            }

            // get team names
            let teams = [];
            nextMatch.find('.team').each((i, el) => {
                teams.push($(el).text());
            });

            const team1 = teams[0];
            const team2 = teams[1];

            const link = `hltv.org${nextMatch.find('a').attr('href')}`;

            if (minutesLeft > 5 || hoursLeft > 0) { // if there are no matches in the next 5 minutes
                console.log(`The next match (${team1} vs ${team2}) does not start for ${hoursLeft} hours and ${minutesLeft} minutes. Re-scrape in 5 minutes`);
                status = false;
                return;
            } else {

            console.log(`${team1} vs ${team2} starts at ${convertedTime} (${hoursLeft} hours & ${minutesLeft} minutes)`);
            console.log(link);
            
            status = true;
            return;

            // var T = new twit(config)
            // T.post('statuses/update', { status: `@keithbrosch ${team1} vs ${team2} starts in ${minutesLeft} minutes. ${link}` }, function(err, data, response) {
            //     if (err){
            //       console.log(err);
            //     }
            //   })
        }
        }
    })
}

module.exports = scrape;