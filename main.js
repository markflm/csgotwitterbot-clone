const scrape = require('./scrape')
const bot = require('./bot')

bot();
setInterval(() => {
    console.log('scraping...');
    scrape();
}, 300000);