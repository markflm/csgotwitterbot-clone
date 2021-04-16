const scrape = require('./scrape')
const bot = require('./bot')

// turn on twitter bot to listen for mentions
bot();

// call hltv scrape function ever 5 minutes
setInterval(() => { 
    console.log('scraping...');
    scrape();
}, 300000);