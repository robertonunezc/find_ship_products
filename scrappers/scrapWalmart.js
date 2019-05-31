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
    await page.goto('https://super.walmart.com.mx/bebes-y-ninos/panales/cat120038', { waitUntil: 'load' });
    switch (stage) {
        case 0:
            await page.click('div.configurable-page_module__pq93m > div > div:nth-child(5) > div > a')
            await page.waitFor(2000);                        
            const allProducts = await page.evaluate(() => {
                let products = []
                let itemsCount = document.querySelectorAll('.grid_container__1A8bw > .flex_noMargin__2PPrE > div')
                for (let index = 1; index < itemsCount.length; index++) {
                    const productTitle = document.querySelector(`div.grid_container__1A8bw > div > div:nth-child(${index}) > div > div > div.product_name__1669g > a > p`);                    
                    const productPrice = document.querySelector(`div.grid_container__1A8bw > div > div:nth-child(${index}) > div > div > div.price-and-promotions_price__2imJs > p`);                                        
                    let productItem = {
                        'title': productTitle.innerHTML,
                        'price': productPrice.innerHTML,
                        'realPrice': parseFloat(productPrice.innerHTML.split('$')[1])
                    }
                    products.push(productItem)
                }
                return products
              })          
              const orderedProducts = allProducts.sort((productA,productB) => productA.realPrice > productB.realPrice ? 1: -1 )
              console.log('PRODUCTOS', orderedProducts)
            break;
    
        default:
            break;
    }
    await page.screenshot({path: 'walmart.png'});
    await console.log(results)
    //await browser.close();
}
module.exports = { scrap }
