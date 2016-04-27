var exports = module.exports = {
    buildSearchTickerItem
};

function buildSearchTickerItem (info) {
    if (!info || typeof info !== 'object') {
        Promise.reject("Argument not correct type.");
    }

    // replace all null fields with "--"
    for (field in info) {
        if (!info[field]) {
            info[field] = "--";
        }
    }

    var tickerDataHtml = '<div class="panel panel-default tickerItem">' +
        '<a data-toggle="collapse" data-parent="#accordion" href="#collapse' + info.symbol + '">' +
            '<div class="panel-heading">' +
                '<h3 class="panel-title">' + info.symbol + ': $' + info.Ask + ' <span id="change-' + info.symbol + '">(' + info.ChangeinPercent + ')</span></h3>' +
            '</div>' +
        '</a>' +
        '<div id="collapse' + info.symbol + '" class="panel-collapse collapse in">' +
            '<div class="panel-body">' +
                '<div class="row">' +
                    '<div class="col-xs-12 col-sm-6">' +
                        '<div class="sub-panel graph-panel">' +
                            '<div class="d3-wrapper" id="d3-' + info.symbol + '">' +
                                '<img src="/assets/images/graph.png" />' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="col-xs-12 col-sm-6">' +
                        '<div class="sub-panel stat-panel">' +
                            '<h4>Statistics</h4>' +
                            '<hr />' +
                            '<div class="row">' +
                                '<div class="col-xs-6">' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">$' + info.Open + '</p>' +
                                        '<p class="stat-name">Open</p>' +
                                    '</div>' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">$' + info.DaysHigh + '</p>' +
                                        '<p class="stat-name">Today\'s High</p>' +
                                    '</div>' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">$' + info.DaysLow + '</p>' +
                                        '<p class="stat-name">Today\'s Low</p>' +
                                    '</div>' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">$' + info.YearHigh + '</p>' +
                                        '<p class="stat-name">52 Wk High</p>' +
                                    '</div>' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">$' + info.YearLow + '</p>' +
                                        '<p class="stat-name">52 Wk Low</p>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="col-xs-6">' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">' + info.Volume + '</p>' +
                                        '<p class="stat-name">Volume</p>' +
                                    '</div>' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">' + info.AverageDailyVolume + '</p>' +
                                        '<p class="stat-name">Average Volume</p>' +
                                    '</div>' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">$' + info.MarketCapitalization + '</p>' +
                                        '<p class="stat-name">Market Cap</p>' +
                                    '</div>' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">' + info.PERatio + '</p>' +
                                        '<p class="stat-name">P/E Ratio</p>' +
                                    '</div>' +
                                    '<div class="stat-item">' +
                                        '<p class="stat-val">' + info.DividendYield + '</p>' +
                                        '<p class="stat-name">Div/Yield</p>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';

    return tickerDataHtml;
}
