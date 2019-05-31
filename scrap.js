const puppeteer = require('puppeteer');
const scrapWalmart = require('./scrappers/scrapWalmart');
(async () => {
    await scrapWalmart.scrap(0);
})();
