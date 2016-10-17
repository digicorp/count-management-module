var debug = require('debug')('count-management-module:count-management-module');
var queryExecutor = require('node-database-executor');
var dbConfig = null;
var key = {};

//CBT:This method is used to get unique number
//It takes arguments as id e.g id="AO_3001_15_12_15"
//and second database configuration
exports.getUniqueNumber = function(data, connection, cb) {
  var id = data.id;
  var count = data.count || 1;
  dbConfig = data.dbConfig;
  debug("Inside getUniqueNumber");
  if (key[id] == undefined) {
    key[id] = 1;
    // var tblValue = 1;

    getNumberFromTable(id, connection, function(tblData) {
      if (tblData.status === false) {
        createNumberIntoTable({
          "tblKey": id,
          "tblValue": count
        }, connection, function(data) {
          if (data.status === false) {
            cb(data);
            return;
          }

          delete key[id];
          cb({
            status: true,
            content: 1
          });
          return;
        });
      } else {
        var originalValue = parseInt(tblData.content);
        var tblValue = originalValue + count;
        updateNumberIntoTable({
          "tblKey": id,
          "tblValue": tblValue
        }, connection, function(data) {

          if (data.status === false) {
            cb(data);
            return;
          }

          delete key[id];
          cb({
            status: true,
            content: originalValue + 1
          });
          return;
        });
      }
    });
  } else {
    setTimeout(function() {
      exports.getUniqueNumber(data, connection, cb);
    }, 200);
  }
}

//CBT:This method is used for getting unique number from database table for specific KEY
getNumberFromTable = function(tblKey, connection, cb) {
    var query = {
      table: "tbl_uniquekey",
      select: [{
        field: 'UK_value'
      }],
      filter: {
        field: 'UK_key',
        operator: 'eq',
        value: tblKey
      }
    };
    var requestData = {
      "query": query,
      "dbConfig": dbConfig
    };
    //CBT:when connection requires pass it and also change related method in node-database-executor
    // queryExecutor.executeQuery(requestData, connection, function(data) {
    queryExecutor.executeQuery(requestData,  function(data) {
      if ((data.content).length >= 1) {
        cb({
          status: true,
          content: data.content[0]["UK_value"]
        });
        return;
      } else {
        cb({
          status: false,
          error: data.error
        });
        return;
      }
    });
  }
  //CBT: This method is used to insert Unique number into Table with specific KEY
createNumberIntoTable = function(tblData, connection, cb) {
  var insertData = {
    "field": ["UK_key", "UK_value"],
    "fValue": [tblData.tblKey, tblData.tblValue]
  };
  var query = {
    table: "tbl_uniquekey",
    insert: insertData,
  };
  var requestData = {
    "query": query,
    "dbConfig": dbConfig
  };
  //CBT:when connection requires pass it and also change related method in node-database-executor
  // queryExecutor.executeQuery(requestData, connection, function(data) {
  queryExecutor.executeQuery(requestData,  function(data) {
    if (data.status === true) {
      cb({
        status: true,
        content: data.content
      });
      return;
    } else {
      cb({
        status: false,
        error: data.error
      });
      return;
    }
  });
}

//CBT:This method is used to update newly generated unique number to specific KEY
updateNumberIntoTable = function(tblData, connection, cb) {
  var tblKey = tblData.tblKey;
  var tblValue = tblData.tblValue;

  var query = {
    table: "tbl_uniquekey",
    update: [{
      field: 'UK_value',
      fValue: tblValue
    }],
    filter: {
      field: 'UK_key',
      operator: 'eq',
      value: tblKey
    }
  };
  var requestData = {
    "query": query,
    "dbConfig": dbConfig
  };
  //CBT:when connection requires pass it and also change related method in node-database-executor
  // queryExecutor.executeQuery(requestData, connection, function(data) {
  queryExecutor.executeQuery(requestData,  function(data) {
    if (data.status === true) {
      cb({
        status: true,
        content: data.content
      });
      return;
    } else {
      cb({
        status: false,
        error: data.error
      });
      return;
    }
  });
}
