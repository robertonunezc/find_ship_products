    const fs = require('fs')
    const xlsx = require('xlsx')
    const log = require('simple-node-logger').createSimpleLogger('project_insert_files.log');
    let baseDir = './files/'
    const knex = require('knex')({
        client: 'mysql2',
        connection: {
            host: '10.0.0.154',
            user: 'root',
            password: 'passw0rd',
            database: 'customer_consumed_data'
        }
    });
    const knexCallpicker = require('knex')({
        client: 'mysql2',
        connection: {
            host: '10.0.0.154',
            user: 'root',
            password: 'passw0rd',
            database: 'callpicker'
        }
    });
    // the file structure are /files/telephoneNumber/accountMaster_childAccount_period.xls

    const processFilesData = async (period, accountNumber) => {
        //reading the folders inside ./files/
        baseDir = `${baseDir}${accountNumber}/`
        const telephoneNumbersFolders = fs.readdirSync(baseDir)
        log.info(`ALL TELEPHONES ${telephoneNumbersFolders}`)

        for(let telephone of telephoneNumbersFolders){
            if (telephoneNumbersFolders.includes(telephone)) {

                await processTelephoneDir(telephone, period)
            }
        }
        log.info(`COMPLETE INSERT for ${accountNumber}`)
        return
    }

    const processTelephoneDir = async (telephone, period) => {
                // if not a number exit 
                if (isNaN(telephone) || telephone == 0) {
                    log.error("the files is not a telephoneNumber")
                    return
                }               
                // parse the xls inside telephoneNumber folder
                try {
                    log.info(`PROCESS TELEPHONE ${telephone}`)
                    let customerData = await getConsumedData(telephone, period)
                    let customersId = await getCustomerId(telephone)
                    let customerDataToInsert = await createDataToInsert(customerData, customersId, telephone, period)
                    await insertData(customerDataToInsert)
                }catch (error) {
                    log.error(error)
                    return
                }   
            }

    const createDataToInsert = async (customerData, customersId, telephoneNumber, period)=>{
        log.info('GET CUSTOMER INFO FROM DB', telephoneNumber)
        customerData.customersId = customersId
        customerData.telephoneNumber = telephoneNumber
        customerData.period = `${period.year}-${period.month}-01`
        return customerData
    }

    const insertData = async (customerData) => {
        log.info('INSERT CUSTOMER DATA IN BD', customerData.telephoneNumber)
        try {
            const customerDataId = await knex('customerData').insert({
                telephone_number: customerData.telephoneNumber,
                min_consumed: customerData.minutosConsumidos,
                mega_consumed: customerData.megasConsumidos,
                sms_consumed: customerData.smsConsumidos,            
                period: customerData.period
            })

            log.info("CuDID",customerDataId)
            
            if(customerData.customersId.length > 0){
              for(let customer of customerData.customersId){
                await knex('customerId_customerData').insert({
                    customer_id: customer.customer_id,
                    customer_data_id:customerDataId
                })
            }  
            }else{
                await knex('customerId_customerData').insert({
                    customer_data_id:customerDataId
                })
            }
            
            await log.info('Data inserted')
        } catch (error) {
            log.error(error)
            return
        }

    }
    const getCustomerId = async (telephoneNumber) => {
        //here we need to access DB and query for the customer id by telephoneNumber
        try {
            let customersId = await knexCallpicker('telephone_numbers').where('number', 'like', `%${telephoneNumber}%`).select('customer_id')
            log.info("GET CUSTOMER ID",customersId)
            return customersId      
        } catch (error) {
            log.error(error)
            return
        }

    }

    const getConsumedData = async (telephoneNumber, period) => {
        let filePath = `${baseDir}${telephoneNumber}/`
        let fileName;
        let data;
        //get the xls file inside filePath (/files/xxxxxxxxxx/)
         try{
        log.info(`GET CUSTOMER DATA FROM FILE${filePath}/${fileName}` )
       

       
        filesName = await fs.readdirSync(filePath, (error, files) => {
            if (error) {
                log.error(error)
                return
            }
            // files.forEach(file => {
            //    return file
            // })
        })
        for(let file of filesName){
            if (file.includes(`${period.month}_${period.year}.xls`)) {        
                //reading the xls loaded
                let wb = xlsx.readFile(`${filePath}${file}`);
                const sheetsName = wb.SheetNames;
                //get data int json format
                const xlsxData = xlsx.utils.sheet_to_json(wb.Sheets[sheetsName[0]])
                //parse the document information to get the needed values
                data = await processXlsData(xlsxData)
                break
            }else{
                if(file.includes('.txt')){
                     data = {
                        minutosConsumidos:0,
                        megasConsumidos: 0,
                        smsConsumidos:0,
                    }  
                }
            }
        }

        if(data == undefined){
          data = {
                        minutosConsumidos:0,
                        megasConsumidos: 0,
                        smsConsumidos:0,
                    }   
        }

        }catch(error){
            log.error(error)

        }
        return data

    }
    const processXlsData = async (data) => {
        log.info('PROCESS XLS')
        let minutosConsumidos = 0
        let megasConsumidos = 0
        let smsConsumidos = 0
        let dataTypes = ['MENSAJE2VIAS', 'CONEXIONGPRS','']
        for (const row of data) {
            if (row.__EMPTY == undefined) continue
            if (row.__EMPTY.includes("Ciudad")) continue 

            if(row.__EMPTY.includes("CONEXIONGPRS") ||                 
                row.__EMPTY_2.includes("CONEXIONGPRS")){
                megasConsumidos += row.Minutos
            }else{
                minutosConsumidos += row.Minutos 
           }
                
        }
        
        totalData = {
            minutosConsumidos: minutosConsumidos,
            megasConsumidos: megasConsumidos.toFixed(1),
            smsConsumidos: smsConsumidos,
        }
        return totalData
    }
   /*(async () => {
     await processFilesData({month:'03', year:'2019'},11822727 )

   })()*/
   
    module.exports = { processFilesData }