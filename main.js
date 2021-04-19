const scrape = require('./scrape');
const bot = require('./bot');

// turn on twitter bot to listen for mentions
bot();

var coeff = 1000 * 60 * 5; //300000 milliseconds. interval to run scrape script
var date = new Date();
var rounded = new Date(Math.ceil(date.getTime() / coeff) * coeff);

let unixTCNow = Math.floor(Date.now() / 1000);
let unixTCNext5 = Math.floor(rounded / 1000); //next 5 min interval

console.log(`current Unix Timestamp: ${unixTCNow}`);

let millisecondsTilNext5 = (unixTCNext5 - unixTCNow) * 1000;
setTimeout(() => {

	console.log('first scrape run');
	scrape();

	setInterval(() => {
		// call hltv scrape function every 5 minutes
		console.log('scraping... from setInterval');
		scrape();
	}, coeff);
}, millisecondsTilNext5);	//run first scrape on the next 5 min interval

//uncomment this for a single run of the scrape function
// var i = 0
// if(i === 0){
//     scrape();

// i++
// }

