const puppeteer = require('puppeteer');
const fs = require('fs');
const xlsx = require('xlsx');
const log = require('simple-node-logger').createSimpleLogger('project_web_scrap.log');
const manageData = require('./manageXlsFiles')
let argv = require('yargs')
.command('run', 'Execute TELCEL scrap to process clients details call', function (yargs) {
  yargs.options({
    month: {
      demand: true,
      alias: 'm',
      description: 'Enter the month: Format: mm',
      type: 'number'
    },
    year: {
      demand: true,
      alias: 'y',
      description: 'Enter the year: Format: yyyy',
      type: 'number'
    },
    account: {
      demand: true,
      alias: 'a',
      description: 'Account number between 0-6',
      type: 'number'
    }
  }).help('help');
})
.help('help')
.argv;
const command = argv._[0];

if (command !== "run") {
  process.exit(1);
}

let month = argv.month;
const year = argv.year;
const account = argv.account

if (month < 1 || month > 12) {
  process.exit(1);
}

if (account < 0 || month > 6) {
  process.exit(1);
}

if (month < 10) {
  month = `0${month}`
}

if (year != new Date().getFullYear()) {
  process.exit(1);
}
let keepRunning = true;

(async () => {
  let accountParentNumber;
  while(keepRunning){

    try{
      const browser = await puppeteer.launch();

      const page = await browser.newPage();

      await page.setViewport({
        width: 1366,
        height: 640
      });

      await page.goto('https://www.corporativo.telcel.com/pcorporativo/login.jsf', { waitUntil: 'load' });

    //await page.click('input[id*=j_username]');

      await page.type('input[id*=j_username]', 'DTMSOLU');
      await page.keyboard.press('Tab');

      await page.type('input[id*=j_passwordAdmn]', 'DTMSOLU');
      //await page.keyboard.press('Tab');

      await page.type('#j_spring_security_check\\:j_alias', 'R06DTMSOLU');

      // await page.keyboard.press('Tab');

      //await page.keyboard.press('Enter');
      await page.click('#j_spring_security_check\\:j_idt78');
      //await page.waitFor(5000);

      //aqui ya se hizo el login
      await page.waitForNavigation({ waitUntil: 'networkidle2' })

      //click para seleccionar la cuenta 1... esto se tiene q hacer por cada cuenta 
      const accountsCounts = await page.$$eval('#tree\\:tree-d-rt-c .iceTreeRow', accounts => accounts.length);
      //for (var i = 0; i < accountsCounts; i++) {
        accountParentNumber =  await page.$eval(`#tree\\:tree\\:n-${account}\\:j_idt37 > span`, account => account.innerHTML)

        await page.click(`#tree\\:tree\\:n-${account}\\:j_idt37`);
        await page.waitFor(5000);
        
        log.info('Opening page', accountParentNumber)
        // //hover a menu consulta en linea
        await page.hover('#encabezadoCorporativo\\:menubar > div > div > ul > li:nth-child(3) > a')
        await page.waitFor(2000);
        //  //click clic en detalle de llamadas
        await page.click('#encabezadoCorporativo\\:menubar > div > div > ul > li:nth-child(3) > ul > li:nth-child(3) > a')
        await page.waitFor(2000);
        log.info('Detalle de llamadas')

        //  //seleccionar el periodo...
        //TODO el periodo debo traerlo de la linea de comandos como argunmet --month=04 --year=2019
        await page.select('#formDetalle\\:crpDetallePeriodo', `01/${month}/${year}`)
        await page.waitFor(2000)
        await log.info('Selecciono periodo', `01/${month}/${year}`)

        //  //seleccionar cuenta  .... estoy hay q hacerlo dinamico pq son muchas cuentas
        //Obteniendo los numeros de cuenta del select 
        const accountsNumbers = await page.evaluate(() => {
          const childAccounts = Array.from(document.querySelectorAll("#formDetalle\\:crpDetalleCtasHija > option"))
          return childAccounts.map(account => {
            return account.value
          })
        })
        log.info("Accounts", accountsNumbers.length)

        for (let accountNumber of accountsNumbers) {
          log.info("leyendo accounts")     
          await page.select('#formDetalle\\:crpDetalleCtasHija', accountNumber);
          await page.waitFor(2000)
          await log.info('Sel Cuenta', accountNumber)
          //clic en consultar llamadas
          await page.click('#formDetalle\\:btn3 > span > span > button')
          await page.waitFor(40000)
          await log.info('Clic en consultar')
          //obtener el numero de telefono
          const phoneNumber = await page.$eval('#formDetalle\\:txtTelefonoDetalleCrp', phoneInput => phoneInput.value)
          await log.info('Phone', phoneNumber)
          
            //  //await page.setRequestInterception(true);
            await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: `./files/${accountParentNumber}/${phoneNumber}` });

            try {

              //clic en download xsl
              await page.click('#formDetalle\\:detDataExpCorp')
              await page.waitFor(5000)
              await log.info('Click en descargar')

            } catch (error) {
              log.error(error)
              let path = `./files/${accountParentNumber}/${phoneNumber}/`
              //TODO revisar esto para poner un file con info de que no hay datos
              if (!fs.existsSync(path)){
                fs.mkdirSync(path);
                fs.writeFileSync(`${path}nodata.txt`, "NO HAY DATOS VE Y REVISA PQ ESE CLIENTE NO ESTÄ LLAMANDO :( !", function(err) {
                  if(err) {
                    log.info("NO DATA File created")
                    return log.info(err);
                  }
                  
                }); 
              }

              continue;
            }
            
          }

        //}
      log.info("COMPLETED ALL SCRAP")
      await browser.close();
      keepRunning = false;
      log.info("COMPLETED ALL SCRAP browser CLOSED")
    }catch(error) {
      log.error(error)
      continue;
    }
  }

     try{
     const fullPeriod = {year,month}
      log.info("START INSERT DATA")
      await manageData.processFilesData(fullPeriod, account)
      await log.info('Completed insert script')
      await process.exit(1); 
    }catch(error){
      log.error(error)
      console.log(error)
    }

 
  
})();




        //guardarlo en bd*/


/*
DTMSOLU
DTMSOLU
R06DTMSOLU
https://www.corporativo.telcel.com/pcorporativo/login.jsf
*/
