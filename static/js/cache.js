//For signout
var cache = [];

function getFromCache(ticker){

    var data = cache.filter(function (stock) {
        return stock.ticker === ticker;
    }).shift();

    if(!data) {
        data = null;
    }
    return data;
};

function isCacheUpToDate(ticker,range) {
    console.log("CHECKING IF " + ticker + " FOR " + range + " IS UP TO DATE ");

    var data = getFromCache(ticker);

    if(data){
        console.log(ticker + " IS IN CACHE");
        var now = new Date();
        var lastRange = data.range;
        var lastUpdate = data.lastUpdate;
        var hoursPassed = Math.abs(now - lastUpdate) / 36e5;

        if(lastRange !== range){
            console.log("BUT NOT IN THE RIGHT RANGE");
            data = null;
        } else{
            console.log("AND IS IN THE RIGHT RANGE");
            if(hoursPassed > 5){
                console.log("BUT HASNT BEEN UPDATED IN A WHILE");
                data = null;
            }
        }
    } else {
        data = null;
    }
    return data;

};

function updateCache(ticker,data,range){
    console.log("UPDATED CACHE")
    var stock = getFromCache(ticker);
    var now = Date();

    if(stock){
        stock.data = data;
        stock.range = range;
        stock.lastUpdate = now;
    } else {

        cache.push({ticker: ticker, data: data, range: range, lastUpdate: new Date()})
        stock = getFromCache(ticker);
    }

    return stock;
};

function removeFromCache(ticker){
    var stock = getFromCache(ticker);
    var indexOfStock = cache.indexOf(stock);

    // remove the question
    cache.splice(indexOfStock, 1);
};
