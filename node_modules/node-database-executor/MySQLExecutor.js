var debug = require('debug')('database-executor:database-executor');
var connectionIdentifier = require('node-database-connectors');

if(GLOBAL._connectionPools == null){
  GLOBAL._connectionPools={};
}

function prepareQuery(dbConfig, queryConfig, cb) {
  try {
    var objConnection = connectionIdentifier.identify(dbConfig);
    var query = objConnection.prepareQuery(queryConfig);
    cb({
      status: true,
      content:query
    });
  } catch (ex) {
    debug('exception: ', ex);
    var e = ex;
    //e.exception=ex;
    cb({
      status: false,
      error: e
    });
  }
}

function executeRawQueryWithConnection(dbConfig, rawQuery, cb) {
  try {
    var objConnection = connectionIdentifier.identify(dbConfig);
    objConnection.connect(dbConfig, function(err, connection) {
      if (err != undefined) {
        debug('connection error: ', err);
        var e = err;
        //e.exception=ex;
        cb({
          status: false,
          error: e
        });
      } else {
        //debug('connection opened');
        connection.beginTransaction(function(err) {
          if (err) {
            debug("beginTransaction", err);
            cb({
              status: false,
              error: err
            });
          } else {
            if(rawQuery.length<=100000000){
              debug('query: %s', rawQuery);
            }
            else {
              debug('query: %s', rawQuery.substring(0,500)+"\n...\n"+rawQuery.substring(rawQuery.length-500, rawQuery.length));
            }
            connection.query(rawQuery, function(err, results) {
              if (err) {
                debug("query", err);
                connection.rollback(function() {
                  var e = err;
                  //e.exception = err;
                  cb({
                    status: false,
                    error: e
                  });
                  connection.end();
                });
              } else {
                connection.commit(function(err) {
                  if (err) {
                    debug("commit", err);
                    connection.rollback(function() {
                      var e = err;
                      //e.exception = err;
                      cb({
                        status: false,
                        error: e
                      });
                      connection.end();
                    });
                  } else {
                    //debug('connection closed');
                    cb({
                      status: true,
                      content:results
                    });
                    connection.end();
                  }
                });
              }
            });
          }
        });
      }
    });
  } catch (ex) {
    debug('exception: ', ex);
    var e = ex;
    //e.exception=ex;
    cb({
      status: false,
      error: e
    });
  }
}

exports.executeRawQuery = function(requestData, cb) {
  debug('dbcon req:\nrequestData: %s', JSON.stringify(requestData));
  var dbConfig = requestData.dbConfig;
  var rawQuery = requestData.query;
  executeRawQuery(dbConfig, rawQuery, cb);
}

exports.executeQuery = function(requestData, cb) {
  //debug('dbcon req:\nrequestData: %s', JSON.stringify(requestData));
  var dbConfig = requestData.dbConfig;
  var queryConfig = requestData.query;
  prepareQuery(dbConfig, queryConfig, function(data) {
    debug('executeQuery',data);
    if (data.status == true) {
      executeRawQuery(dbConfig, data.content, cb);
    } else {
      cb(data);
    }
  });
}

exports.executeQueryStream = function(requestData, onResultFunction, cb) {
  var dbConfig = requestData.dbConfig;
  var query = requestData.rawQuery;
  debug(dbConfig);
  var objConnection = connectionIdentifier.identify(dbConfig);
  objConnection.connect(dbConfig, function(err, connection) {
    if (err != undefined) {
      debug('connection error: ', err);
      var e = err;
      //e.exception=ex;
      cb({
        status: false,
        error: e
      });
    } else {
      var queryExecutor = connection.query(query);
      queryExecutor
              .on('error', function (err) {
                  cb({
                    status:false,
                    error:err
                  });
                  // Handle error, an 'end' event will be emitted after this as well
              })
              .on('fields', function (fields) {
                  // the field packets for the rows to follow
              })
              .on('result', function (row) {
                  // Pausing the connnection is useful if your processing involves I/O
                  connection.pause();

                  onResultFunction(row, function () {
                      connection.resume();
                  });
              })
              .on('end', function () {
                cb({
                  status:true
                });

              });
    }
  });
}


// DS : Handle Multiple Queries with same connection similar to batch queries;

function executeRawQueryWithConnectionPool(dbConfig, rawQuery, cb) {
  try {
    var startTime=new Date();
    getConnectionFromPool(dbConfig, function(result){
      if (result.status === false) {
        cb(result);
      } else {
        var connection = result.content;
        if(rawQuery.length<=100000000){
          debug('query: %s', rawQuery);
        }
        else {
          debug('query: %s', rawQuery.substring(0,500)+"\n...\n"+rawQuery.substring(rawQuery.length-500, rawQuery.length));
        }
        var queryStartTime=new Date();
        connection.query(rawQuery, function(err, results) {
          if (err) {
            debug("query", err);
            var e = err;
            cb({
              status: false,
              error: e
            });
          } else {
            debug("Total Time:", (new Date().getTime() - startTime.getTime())/1000, "Query Time:", (new Date().getTime() - queryStartTime.getTime())/1000);
            cb({
              status: true,
              content:results
            });
          }
        });
      }
    });
  } catch (ex) {
    debug('exception: ', ex);
    var e = ex;
    //e.exception=ex;
    cb({
      status: false,
      error: e
    });
  }
}


function executeRawQuery(dbConfig, rawQuery, cb){
  if(dbConfig.hasOwnProperty('connectionLimit') && dbConfig.connectionLimit == 0){
    debug("With New Connection");
    executeRawQueryWithConnection(dbConfig, rawQuery, cb);
  }
  else {
    debug("With Connection Pool");
    executeRawQueryWithConnectionPool(dbConfig, rawQuery, cb);
  }
}


function getConnectionFromPool(dbConfig, cb){
  try {
    var connectionString = (dbConfig.databaseType+'://'+dbConfig.user+':'+dbConfig.password+'@'+dbConfig.host+':'+dbConfig.port+'/'+dbConfig.database);
    if(GLOBAL._connectionPools.hasOwnProperty(connectionString)){
      cb({
        status: true,
        content: GLOBAL._connectionPools[connectionString]
      });
      return;
    }
    else {
      var objConnection = connectionIdentifier.identify(dbConfig);
      objConnection.connectPool(dbConfig, function(err, pool) {
        if (err != undefined) {
          debug('connection error: ', err);
          var e = err;
          //e.exception=ex;
          cb({
            status: false,
            error: e
          });
        } else {
          GLOBAL._connectionPools[connectionString]=pool;
          cb({
            status: true,
            content: pool
          });
        }
      });
    }
  } catch (ex) {
    debug('exception: ', ex);
    var e = ex;
    //e.exception=ex;
    cb({
      status: false,
      error: e
    });
  }
}
