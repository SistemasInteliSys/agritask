const oracledb = require('oracledb');

oracledb.initOracleClient();

// carrega variaveis de ambientes
require("dotenv-safe").config();

const dbConfig = {
  user : process.env.user,
  password : process.env.password,
  connectString : process.env.connectString
}

function createDefaultPool() {
  return new Promise(async function(resolve, reject) {
    try {
      await oracledb.createPool(dbConfig);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports.createDefaultPool = createDefaultPool;

function executeResultSet(sql, binds, options) {
  // Note the 'async' in front of the annonymous function below, it let's us 
  // use await within the funtion
  return new Promise(async function(resolve, reject) {
    let conn; // Declared here for scoping purposes.

    if (options.resultSet !== true) {
      reject(new Error('This API is for Result Sets only'));
      return;
    }

    try {
      conn = await oracledb.getConnection(); // This is await, it's awesome!
      console.log(binds)
      const result = await conn.execute(sql, binds, options);

      const columnNames = result.metaData

      const retval = [];

      // pega a primeira linha
      let row = await result.resultSet.getRow();
   
      while (row) {
        // cria um objeto vazio
        let registro = {}
        // para cada coluna (e = elemento atual, i = indice)
        columnNames.forEach(
          (e,i) => {
            registro[e.name] = row[i]
          }
        ) 

        retval.push(registro);
        
        // Práxima linha
        row = await result.resultSet.getRow();
      }

      resolve(retval);
    } catch (err) {
      console.log('Error occurred', err);

      reject(err);
    } finally {
      // If conn assignment worked, need to close.
      if (conn) {
        try {
          await conn.close();
        } catch (err) {
          console.log('Error closing connection', err);
        }
      }
    }
  });
}

module.exports.executeResultSet = executeResultSet;
