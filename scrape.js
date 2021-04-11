const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const moment = require('moment');
var twit = require('twit');
var config = require('./config.js');
const URL = 'https://ancient-badlands-06104.herokuapp.com';

function scrape () {
    let iteration = 0;

    console.log('Making request to https://www.hltv.org/matches');

    request('https://www.hltv.org/matches', (error, response, html) => {
        if (!error && response.statusCode === 200) {

            console.log('Successful Request');

            const $ = cheerio.load(html);

            // get entire div of soonest match day (may not necessarily be today)
            let soonestMatchDay = $('.upcomingMatchesSection:first-child');  

            // get todays date
            const x = new Date();
            x.setHours(x.getHours() + 6);
            const todaysDate = moment(x).format("YYYY-MM-DD");
            console.log(`Today's date (CEST) is ${todaysDate}`);

            // check if the soonest match day is today
            const y = soonestMatchDay.find('.matchDayHeadline').text().split(' ');
            const soonestMatchDate = y[y.length - 1];
            console.log(`Soonest Match date (CEST) is ${soonestMatchDate}`);

            // if the soonest match day is not today, disregard all matches
            let numMatches = 0;
            if (todaysDate === soonestMatchDate) {
                // if soonest match day IS today, get the number of remaining matches today
                numMatches = soonestMatchDay.find('.upcomingMatch').length;
            }

            console.log(`There are ${numMatches} matches remaining today`);

            // we use an iterator here so that, as soon as we find a match that is more than 5 minutes away, we don't bother looping through any later matches
            while (numMatches > iteration) {
                // get only the first match up today
                let firstMatch = soonestMatchDay.find('.upcomingMatch').first();

                    let nextMatch = firstMatch;
                    let count = iteration;

                    // i don't remember what this does
                    while (count > 0) {
                        try {
                            nextMatch = nextMatch.next();
                        } catch (error) {
                            console.log(error);
                        }
                        count -= 1;
                    }
                    iteration += 1;

                     // get team names
                    let teams = [];
                    nextMatch.find('.matchTeamName').each((i, el) => {
                        teams.push($(el).text());
                    });

                    const team1 = teams[0];
                    const team2 = teams[1];

                    console.log(`The next match is between ${team1} and ${team2}`);


                    // compare start time to current time
                    const now = new Date();
                    now.setHours(now.getHours() + 6);
                    console.log(`It is currently ${moment(now).format('HH:mm')}  CEST`);
                    const nowHours = now.getHours();
                    const nowMinutes = now.getMinutes();
                    let  hoursLeft = 0;
                    let minutesLeft = 0;

                    // get the start time (CEST)
                    const time = nextMatch.find('.matchTime').text().trim(); // time returned is Central European Standard Time
                    let hours = (parseInt(time.substring(0,2))).toString();
                    let minutes = time.substring(3,5);
                    const convertedTime = `${hours}:${minutes}`;

                    console.log(`The match begins at ${convertedTime} CEST`);

                    if (hours >= nowHours)
                        hoursLeft = (Number(hours) - Number(nowHours)).toString();
                    else hoursLeft = (24 - Number(nowHours) + Number(hours)).toString(); 

                    if (minutes >= nowMinutes)
                        minutesLeft = (Number(minutes) - Number(nowMinutes)).toString();
                    else  {
                        minutesLeft = (60 - (Number(nowMinutes) - Number(minutes)).toString());
                        hoursLeft -= 1;
                    }

                    console.log(`Or, in ${hoursLeft} hours and ${minutesLeft} minutes`);

                    const link = `hltv.org${nextMatch.find('a').attr('href')}`;

                    console.log(`The HLTV link for the match is ${link}`);

                    if (minutesLeft > 5 ||  hoursLeft > 0) { // if there are no matches in the next 5 minutes, exit the loop
                        console.log('Because this match starts in more than 5 minutes, stop and scrape again in 5 minutes');
                        iteration = numMatches;
                    } else {

                    console.log('This match begins in less than 5 minutes!');
                    
                    console.log(`Getting all users who are subscribed to ${team1}`);

                    let users = [];
                    axios.get(`${URL}/teams/${team1}/getusers`)
                        .then(function (response) {
                            // handle success
                            response.data.users.forEach((user) => {
                                users.push(user);
                            })
                            console.log(`These are the users subscribed to ${team1}: ${JSON.stringify(users)}`);
                        })
                        .catch(function (error) {
                            // handle error
                            console.log(`Error getting all users subscribed to ${team1}`);
                            console.log(error);
                        });

                        console.log(`Getting all users who are subscribed to ${team2}`);

                        axios.get(`${URL}/teams/${team2}/getusers`)
                        .then(function (response) {
                            // handle success
                            response.data.users.forEach((user) => {
                                    if (!users.includes(user))
                                     users.push(user);
                                })
                                console.log(`These are the users subscribed to ${team1} and ${team2}: ${JSON.stringify(users)}`);
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
        else {
            console.log('Request Failed');
        }
    });
}

module.exports = scrape;