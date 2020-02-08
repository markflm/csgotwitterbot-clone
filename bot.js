var twit = require('twit');
var config = require('./config.js');

var T = new twit(config)

var today = new Date();
var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

console.log(date + ' ' + time);

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

