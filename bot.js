const twit = require('twit');
const config = require('./config.js');
const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const URL = 'https://ancient-badlands-06104.herokuapp.com';
const T = new twit(config)

function bot () {

    console.log('bot running...');
    const mentionStream = T.stream('statuses/filter', {track: ['@CSGOMatchbot']});

    // on incoming tweet
    mentionStream.on('tweet', function(tweet){
        process(tweet);
    })
}

function process(tweet){
    let username = tweet.user.screen_name;
    let postText = tweet.text.replace('@csgomatchbot', '');
    postText = postText.trim();
    postText = postText.replace(/ {1,}/g," ");
    console.log(postText);

    let addTeams = (postText[0] === '+');
    let removeTeams = (postText[0] === '-');
    let replyText = "";

    if (!addTeams && !removeTeams) { // if the first character isn't + or -
        replyText = 'Invalid Syntax';
    }
    else if (addTeams) //if any teams are to be added
    {
        postText = postText.substring(1, postText.length);
        let teams = postText.split(',');
        
        for (let x = 0; x < teams.length; x++) {
            teams[x] = teams[x].trim();
            request(`https://www.hltv.org/search?query=${teams[x]}`, (error, response, html) => {
                if (!error && response.statusCode === 200) {
                    const $ = cheerio.load(html);
                    const teamsDiv = $('.team-logo');
                    if (teamsDiv[0].attribs.title.toString().toUpperCase() === teams[x].toString().toUpperCase()) {
                        axios.post(`${URL}/user/${username}/addteams`, {
                            'teamsToAdd': [teams[x]],
                          })
                          .then(function (response) {
                            setTimeout(function() {T.post('statuses/update',{status: `@${tweet.user.screen_name} you are now subscribed to ${teams[x]}`});}, 5000);
                        })
                          .catch(function (error) {
                            console.log(error);
                            setTimeout(function() {T.post('statuses/update',{status: `@${tweet.user.screen_name} there was an error subscribing you to ${teams[x]}`});}, 5000)
                        });
                    }
                }
            })
        }
    }
    else if (removeTeams) //if any teams are to be removed
    {
        postText = postText.substring(1, postText.length);
        let teams = postText.split(',');
        
        for (let x = 0; x < teams.length; x++) {
            teams[x] = teams[x].trim();
            axios.post(`${URL}/user/${username}/removeTeams`, {
                'teamsToRemove': [teams[x]],
              })
              .then(function (response) {
                setTimeout(function() {T.post('statuses/update',{status: `@${tweet.user.screen_name} you are unsubscribed to ${teams[x]}`});}, 5000);
            })
              .catch(function (error) {
                  console.log(error);
                setTimeout(function() {T.post('statuses/update',{status: `@${tweet.user.screen_name} there was an error unsubscribing you to ${teams[x]}`});}, 5000)
            });
        }
    }
    else {
        setTimeout(function() {T.post('statuses/update',{status: `@${tweet.user.screen_name} Invalid command. Please read the documentation in my bio`});}, 5000)

    }
}

module.exports = bot;