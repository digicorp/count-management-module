## count-management-module
#### Author: Chandrakant Thakkar
##### Created on: 14th Oct 2016

---
###### count-management-module is used to manage counter for specific key passed by the user. It also manage past state of counter for all key through database entry.

- To use this module, It requires 'tbl_uniquekey' table into database.'tbl_uniquekey' table defination is as following.

| Field | Type | Key | Default |
| :------------- | :------------- |:------------- |:------------- |
| UK_key | varchar(30) | NO | PRI |
| UK_value | int(11) | YES | - |

- mysql script for table 'tbl_uniquekey'
```javascript
CREATE TABLE `tbl_uniquekey` (
  `UK_key` varchar(30) NOT NULL,
  `UK_value` int(11) DEFAULT NULL,
  PRIMARY KEY (`UK_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

---
#### Function

 * _getUniqueNumber :_

 - _Sample 1_
 ```javascript  
 var generateNextCounter = require('count-management-module');  
 var sendData = {
   "id": "UNIQUEKEY",//id: unique key for which it create unique counter
   "count": 1,//count: update counter value to plus 1 in 'tbl_uniquekey' table at a time
   "dbConfig": sampleConfig
 };
 generateNextCounter.getUniqueNumber(sendData, {}, function(data) {
 var nextCounter=data.content;
 });
 ```



 - _sampleConfig_ : Configuration for database connection. (As given below)
 ```javascript
 var sampleConfig = {
   type: "database",
   engine: 'MyISAM',
   databaseType: 'mysql',
   database: 'database',
   host: "hostname",
   port: "port",
   user: "user",
   password: "password",
   cacheResponse: false
 };
 ```

 - In Sample 1 it creates one entry into table 'tbl_uniquekey' with UK_key as 'UNIQUEKEY' and UK_value as 1 and return 1 value as next counter in 'data.content' variable. while calling same method again it update entry into table 'tbl_uniquekey' for UK_key 'UNIQUEKEY' with UK_value as 2 and return next counter value as 2 in 'data.content' variable.


 - _Sample 2_
 ```javascript  
 var generateNextCounter = require('count-management-module');  
 var sendData = {
   "id": "UNIQUEKEY",//id: unique key for which it create unique counter
   "count": 5,//count: update counter value to plus 5 in 'tbl_uniquekey' table at a time
   "dbConfig": sampleConfig
 };
 generateNextCounter.getUniqueNumber(sendData, {}, function(data) {
   var counterStart=data.content;
   for(i=0;i<5;i++){
    console.log("counter value:"+counterStart);
    counterStart=counterStart+1;
   }
 });
   ```
 - In Sample 2 we require 5 counters at a same time, it creates one entry into table 'tbl_uniquekey' with UK_key as 'UNIQUEKEY' and UK_value as 5 and return 1 value as next counter in 'data.content' variable. now we can generate all five counter for key 'UNIQUEKEY' with starting value as 1 and go till 5 using loop.

 - while calling same method again it update entry into table 'tbl_uniquekey' for UK_key 'UNIQUEKEY' with UK_value as 10 and return next counter value as 6 in 'data.content' variable.now we can generate all five counter for key 'UNIQUEKEY' with starting value as 6 and go till 10 using loop.
