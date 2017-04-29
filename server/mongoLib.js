//MONGO
var mongoose = require('mongoose'),
    mongodb = mongoose.connection;
var mongo = function(){
    this.collection = "";
};
mongo.prototype = {
    setCollection : function(collection){
        this.collection = mongodb.collection(collection);
    },
    error: function(error){

    },
    find : function(collection, callback){
        collection.find().toArray(function(err, result){
            if(err) this.error(err);
            else return callback(result);
        });
    },
    findIfExists : function(searchKey, searchValue, callback){
        var self = this;
        this.find(this.collection, function(result){
            var exists = false;
            for(var i=0; i<result.length; i++)
                if(result[i][searchKey] == searchValue) exists = true;
            return callback(exists);
        });
    },
    findOne : function(searchKey, searchValue, searchFor, callback){
        var self = this;
        this.find(this.collection, function(result){
            var res = "";
            if(searchFor){
                for(var i=0; i<result.length; i++)
                    if(result[i][searchKey] == searchValue)
                        res = result[i][searchFor];
            }else{
                for(var i=0; i<result.length; i++)
                    if(result[i][searchKey] == searchValue)
                        res = result[i];
            }
            return callback(res);
        });
    },
    findWhere : function(searchKey, searchValue, callback){
        var self = this;
        this.find(this.collection, function(result){
            var res = [];
            if(result){
                for(var i=0; i<result.length; i++)
                    if(result[i][searchKey] == searchValue)
                        res.push(result[i]);
            }
            return callback(res);
        });
    },
    findAll : function(callback){
        this.collection.find().toArray(function(err, result){
            if(err) this.error(err);
            else return callback(result);
        });
    },
    insert : function(params, callback){
        this.collection.insert(params);
        return callback(true);
    },
    update : function(searchKey, searchValue, params, callback){
        this.collection.update(
            { "title" : searchValue },
            { $set : params },
            function(err){ 
                if(err) console.log(err); 
                else return callback(true);
            }
        );
    },
    remove : function(deleteKey, deleteValue, callback){
        this.collection.remove({ "title" : deleteValue }, 1, function(err){
            if(err) console.log(err);
            else return callback(true);
        });
    }
};

module.exports = mongo;