var twit = require('twit');
var config = require('./config.js');



var T = new twit(config)

var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

//console.log(date + ' ' + time);

/*
function getPosts(){
  T.get('search/tweets',{ q:"@CSGOMatchBot since:2020-01-10", count: 20}, function(err,data,response){
    console.log(data)
  })
}
getPosts()
/* function subscribe(username, team){
    T.post('statuses/update', { status: '@' + username + ' You are now subscribed to ' + team + '!'}, function(err, data, response) {
        console.log(data)
      })
}

function unsubscribe(username, team){
    T.post('statuses/update', { status: '@' + username + ' You are now unsubscribed to ' + team + '.'}, function(err, data, response) {
        console.log(data)
      })
} */

//subscribe('Kifflom', 'Team Liquid');

 //stream to pick up incoming tweets
  //declare what the stream is monitoring
 var mentionStream = T.stream('statuses/filter', {track: ['@CSGOMatchbot']})

 mentionStream.on('tweet', function(tweet){
   var replyPost = mentionReply(tweet)
  // console.log(replyPost)
  // console.log(tweet.user.screen_name);
   T.post('statuses/update',{status: '@' + tweet.user.screen_name + ' - ' + replyPost})
 })


//takes in a tweet object, returns a string in format "Team(s) added: []. Teams(s) removed: "
function mentionReply(tweet){
 //todo: turn hardcoded regex's into regex objects.

var postText = tweet.text;
 
 
var addTeams = postText.match(/\+\w*/g);
var removeTeams = postText.match(/\-\w*/g);

//declare reply string which will have things concatted onto it.
var replyText = "";

if (addTeams != null) //if any teams are to be added
{
    replyText = "Team(s): "

    for (i in addTeams) {
        addTeams[i] = addTeams[i].replace("+", "")
        replyText += addTeams[i].toUpperCase() + ", "

    }

    replyText = replyText.substr(0, (replyText.length - 2)) + " added." //substr to remove the ", " on the final team.
}
if (removeTeams != null) //if any teams are to be removed
{
    replyText += " Team(s): "
    for (i in removeTeams) {
        removeTeams[i] = removeTeams[i].replace("-", "")
        replyText += removeTeams[i].toUpperCase() + ", "

    }
    replyText = replyText.substr(0, (replyText.length - 2)) + " removed."
}

return replyText;

}
//get vs stream
  //ongoing connect; 'socket'. can assign events to it
      //i.e. when you're @'d
//reply function