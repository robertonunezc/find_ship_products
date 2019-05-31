const puppeteer = require('puppeteer');
const scrapWalmart = require('./scrappers/scrapWalmart');
const scrapChedraui= require('./scrappers/scrapChedraui');
(async () => {
    //await scrapWalmart.scrap(0);
    await scrapChedraui.scrap(0);
})();
