const mysql = require('mysql');
const config = require('../../config.json');

const connection = mysql.createConnection({
  host: config.aws.mysql.host,
  user: config.aws.mysql.user,
  password: config.aws.mysql.password,
  database: config.aws.mysql.database,
  dateStrings: true,
});

const Query = (query) => {
  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) {
        reject('DB service is down');
      } else {
        resolve(results);
      }
    });
  });
};

const DB = {
  select: async (query) => {
    try {
      const results = await Query(query);
      return results;
    } catch (err) {
      throw err;
    }
  },

  insert: async (query) => {
    try {
      await Query(query);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = DB;
