const puppeteer = require('puppeteer');
const scrap = async (stage) => {
    let results = []

    await console.log('Scrapping face:',stage);
    const browser = await puppeteer.launch({ headless: false});
    let page = await browser.newPage();
    await page.setViewport({
        width: 1366,
        height: 640
      });
    await page.goto('https://www.chedraui.com.mx/Departamentos/Familia/Beb%C3%A9s/Pa%C3%B1ales/c/MC250607?q=%3Arelevance%3Acategory_l_4%3AMC25060702%3Afeature-stage%3AEtapa+1&toggleView=grid', { waitUntil: 'load' });
    
    await page.screenshot({path: 'chedraui.png'});
    await console.log(results)
    //await browser.close();
}
module.exports = { scrap }
