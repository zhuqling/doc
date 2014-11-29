var db = require("./db");

function baseDao (name){
    this.name=name;
}

//insert语句-转换vo字段
function convertInsertFields(vo){
    var i,fields=[],marks=[],values=[];
    for(i in vo){
        if(typeof vo[i] !="undefined"){
            fields.push(i);
            marks.push('?');
            values.push(vo[i]);
        }
    }
    return {
        fields:fields,
        marks:marks,
        values:values
    };
};

//update语句-转换vo字段
function convertUpdateFields(vo){
    var i,val,fields=[],values=[];
    for(i in vo){
        val=vo[i];
        if(typeof val !="undefined"&& i !=="id"){
            fields.push(i+"=?");
            values.push(val);
        }
    }
    return {
        fields:fields,
        values:values
    };
};


//find语句-转换where字段
function convertWhere(wheres){
    return wheres?" where "+wheres:" ";
};

//转换orderby字段
function convertOrderby(orderby){
    if(orderby===null){
        return " ";
    }else if(typeof orderby=="undefined"){
        return " order by id desc ";
    }else{
        return " order by "+orderby+" ";
    }
};

//page分页对象
function Page(opts){
    opts={
        pageIndex:parseInt(opts.pageIndex)
        ,pageSize:parseInt(opts.pageSize)
        ,total:parseInt(opts.total)
    };

    opts.pageTotal=Math.ceil(opts.total/opts.pageSize);
    opts.start=Math.max(0,(opts.pageIndex-1))*opts.pageSize;
    opts.end=Math.min(opts.total,(opts.pageIndex)*opts.pageSize);
    opts.data=null;
    return opts;
}

baseDao.prototype.getVo= function () {
    return require("../vo/"+this.name+"Vo")();
};


/**
 * DAO: findPage
 */
baseDao.prototype.findListByPage = function(args, callback) {
    var that=this;
    that.getTotal(args, function (err, total) {
        if(err){
            callback&&callback(err);
        }else{
            page=Page({
                pageIndex:args.pageIndex
                ,pageSize:args.pageSize
                ,total:total
            });
            db.execQuery({
                "sql": "SELECT " + args.fields + " FROM "+that.name+convertWhere(args.wheres)+convertOrderby(args.orderby)+" LIMIT ?,?",
                "args": [page.start, page.pageSize],
                "callback": function (error,results) {
                    if(err){
                        callback&&callback(err);
                    }else{
                        page.data=results;
                        delete page.start;
                        delete page.end;
                        callback(null,page);
                    }
                }
            });
        }
    })
};


/**
 * DAO: insert
 */
baseDao.prototype.insert = function (vo, callback) {
    var that=this,r=convertInsertFields(vo);
    db.execQuery({
        "sql": "INSERT INTO "+that.name+"("+r.fields.join(',')+") VALUES("+r.marks.join(',')+")",
        "args": r.values,
        "callback": callback
    });
};


/**
 * DAO: update
 */
baseDao.prototype.updateById = function(vo,callback) {
    var that=this,r=convertUpdateFields(vo);
    db.execQuery({
        "sql": "UPDATE "+that.name+" SET "+r.fields.join(',')+" WHERE id="+vo.id,
        "args": r.values,
        "callback": callback
    });
};


/**
 * DAO: findById
 */
baseDao.prototype.findById = function(id, callback) {
    var that=this;
    db.execQuery({
        "sql": "SELECT * FROM " + that.name + " WHERE id=?",
        "args": [parseInt(id)],
        "callback":function(err,results){
            callback&&callback(err,results.length>0?results[0]:{});
        }
    });
};

/**
 * DAO: deleteById
 */
baseDao.prototype.deleteById = function(id, callback) {
    var that=this;
    db.execQuery({
        "sql": "DELETE FROM " + that.name + " WHERE id=?",
        "args": [parseInt(id)],
        "callback": callback
    });
};

/**
 * DAO: findAll
 */
baseDao.prototype.findAll = function(args,callback) {
    var that=this;
    db.execQuery({
        "sql": "SELECT * FROM " + that.name +convertWhere(args.wheres)+convertOrderby(args.orderby),
        "callback": callback
    });
};


/**
 * DAO: count
 */
baseDao.prototype.getTotal = function(args, callback) {
    var that=this;
    db.execQuery({
        "sql": "SELECT COUNT(1) AS count FROM " + that.name+convertWhere(args.wheres),
        "callback": function(error,results) {
            callback(error,parseInt(results.length>0?results[0].count:0));
        }
    });
};

/**
 * DAO: excute
 */
baseDao.prototype.excute = function(sql, callback) {
    db.execQuery({
        "sql": sql,
        "callback": callback
    });
};

module.exports=baseDao;