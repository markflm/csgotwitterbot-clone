const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');
const URL = 'https://ancient-badlands-06104.herokuapp.com';

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
        let valid = [];
        let invalid = [];
        
        for (let x = 0; x < teams.length; x++) {
            teams[x] = teams[x].trim();
            request(`https://www.hltv.org/search?query=${teams[x]}`, (error, response, html) => {
                if (!error && response.statusCode === 200) {
                    const $ = cheerio.load(html);
                    const teamsDiv = $('.team-logo');
                    if (teamsDiv[0].attribs.title.toString().toUpperCase() === teams[x].toString().toUpperCase()) {
                        valid.push(teams[x]);
                        axios.post(`${URL}/user/${username}/addteams`, {
                            'teamsToAdd': [teams[x]],
                          })
                          .then(function (response) {
                            console.log(response);
                          })
                          .catch(function (error) {
                            console.log(error);
                          });
                          setTimeout(function() {console.log(teams[x])}, 5000);
                    } else {
                        invalid.push(teams[x]);
                        console.log("invalid: " + invalid);
                    }
                }
            })
        }
    }
    else if (removeTeams) //if any teams are to be removed
    {
        replyText += " Team(s): "
        for (i in removeTeams) {
            removeTeams[i] = removeTeams[i].replace("-", "")
            replyText += removeTeams[i].toUpperCase() + ", "

        }
        replyText = replyText.substr(0, (replyText.length - 2)) + " removed."
    }

    // console.log(replyText);
    return replyText;

}

module.exports = process;