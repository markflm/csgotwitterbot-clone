const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
var twit = require('twit');
var config = require('./config.js');
const URL = 'https://ancient-badlands-06104.herokuapp.com';

// setInterval(() => {
//     console.log('scraping...');
//     scrape();
// }, 300000);



function scrape () {
    let iteration = 0;

    request('https://www.hltv.org/matches', (error, response, html) => {
        if (!error && response.statusCode === 200) {
            const $ = cheerio.load(html);

            // get entire div of today's matches
            const todaysMatches = $('.match-day:first-child');
            
            let numMatches = todaysMatches.find('.standard-box').length;

            while (numMatches > iteration) {
                // get only the first match up today
                let firstMatch = todaysMatches.find('.upcoming-match').first();

                    let nextMatch = firstMatch;
                    let count = iteration;
                    while (count > 0) {
                        try {
                            nextMatch = nextMatch.next();
                        } catch (error) {
                            console.log(error);
                        }
                        count -= 1;
                    }
                    iteration += 1;

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

                    if (minutesLeft > 5 ||  hoursLeft > 0) { // if there are no matches in the next 5 minutes
                        console.log(`The next match (${team1} vs ${team2}) does not start for ${hoursLeft} hours and ${minutesLeft} minutes. Re-scrape in 5 minutes`);
                        iteration = numMatches;
                    } else {

                    console.log(`${team1} vs ${team2} starts at ${convertedTime} (${hoursLeft} hours & ${minutesLeft} minutes)`);
                    console.log(link);
                    
                    let users = [];
                    axios.get(`URL/teams/${team1}/getusers`)
                        .then(function (response) {
                            // handle success
                            response.data.users.forEach((user) => {
                                users.push(user);
                            })
                        })
                        .catch(function (error) {
                            // handle error
                            console.log(error);
                        });
                        axios.get(`URL/teams/${team2}/getusers`)
                        .then(function (response) {
                            // handle success
                            response.data.users.forEach((user) => {
                                    if (!users.includes(user))
                                     users.push(user);
                                })
                                var T = new twit(config)
                                users.forEach((user) => {
                                    try {
                                        T.post('statuses/update', { status: `@${user} ${team1} vs ${team2} starts in ${minutesLeft} minutes. ${link}` }, function(err, data, response) {
                                            if (err){
                                             console.log(err);
                                            }
                                        })
                                    } catch (error) {
                                        console.log(error);
                                    }
                                })
                        })
                        .catch(function (error) {
                            // handle error
                            console.log(error);
                        });
                }
            }
        }
    });
}

module.exports = scrape;