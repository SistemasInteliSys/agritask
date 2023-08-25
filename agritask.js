// import
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const querys = require('./querys')
let cron = require('node-cron');
const ObjectsToCsv = require('objects-to-csv')
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs')

// cria app herdando express
const app = express()

// carrega variaveis de ambientes
require("dotenv-safe").config();

// Adicionando
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*')
    res.header('Access-Control-Allow-Credentials', 'true')
    next();
});

app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors({ origin: ['https://www.intelisys.com.br/', 'https://intelisys.com.br/', 'http://localhost:8080', 'http://192.168.0.114:8080'] }))

cron.schedule('0 0 * * *', () => {
    generateAndSendCsv();
}, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
}
);

Date.prototype.formated = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [(dd>9 ? '' : '0') + dd,
          (mm>9 ? '' : '0') + mm,
          this.getFullYear()
         ].join('/');
};

const generateAndSendCsv = async () => {
    try{
        let dtFin = new Date(Date.now());
        dtFin.setHours(-3,0,0,0);
        let dtIni = new Date(dtFin - (24 * 60 * 60 * 1000));
        let dados = await querys.listarQuimicos(dtIni.formated(), dtFin.formated())
        let csv = new ObjectsToCsv(dados);
        // let dtFinStr = dtFin.toLocaleString('pt-br', {
        //     day: 'numeric',
        //     year: 'numeric',
        //     month: 'numeric',
        //     hour: 'numeric',
        //     minute: 'numeric',
        //     second: 'numeric',
        // }).replace(/\//g, '_')
        await csv.toDisk(`./csv/quimicos.csv`)
        let formQuimicos = new FormData();
        formQuimicos.append('file', fs.createReadStream(`./csv/quimicos.csv`));
        formQuimicos.append('wskey', '11f89fe4d9ac808734671c3338e1c6cc');
        formQuimicos.append('class', 'com.scantask.tms.importdata.ScriptImportActivities_WithChemicalsMaterials');
        formQuimicos.append('project', '72162695857438726')
        console.log('enviando');
        let response = await axios.post('https://za.agritask.com/s/import/do', formQuimicos, {
            headers: {
                ...formQuimicos.getHeaders()
            }
        })
        setLog(getTodayDateHour(), response.data);
        setLog(getTodayDateHour(), '---------------------------------------------------');
        dados = await querys.listarProducao(dtIni.formated(), dtFin.formated())
        csv = new ObjectsToCsv(dados)
        await csv.toDisk(`./csv/producao.csv`)
        let formProducao = new FormData();
        formProducao.append('file', fs.createReadStream(`./csv/producao.csv`));
        formProducao.append('wskey', '11f89fe4d9ac808734671c3338e1c6cc');
        formProducao.append('class', 'com.scantask.tms.importdata.ScriptImportModelMeasurements_General');
        formProducao.append('project', '72162695857438726');
        response = await axios.post('https://za.agritask.com/s/import/do', formProducao, {
            headers: {
                ...formProducao.getHeaders()
            }
        })
        console.log(response.data)
        setLog(getTodayDateHour(), response.data);
        setLog(getTodayDateHour(), '---------------------------------------------------');
    } catch (err) {
        console.log(err)
    }
}

function getTodayDateHour() {
    const today = new Date()
    const todayStr = today.toLocaleString('pt-br', {
        day: 'numeric',
        year: 'numeric',
        month: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    })
    const todayParts = todayStr.split(' ')
    const todayDate = todayParts[0]
    const todayHour = todayParts[1]
    const todayDateHour = `${todayDate.substring(6, 10)}-${todayDate.substring(
        3,
        5
    )}-${todayDate.substring(0, 2)}T${todayHour}`

    return todayDateHour
}

async function setLog(logDateHour, logText) {
    fs.writeFileSync('./logs/log.txt', `${logDateHour}: ${logText}\n`, { flag: 'a' })
}

// Abre porta para escutar requisições
app.listen(3011, () => {
    console.log('Express started at http://localhost:3011')
})
