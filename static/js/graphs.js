function makeGraph(s, tag) {
    //var margin = {top: 1, right: 0, bottom: 20, left: 0};
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = $("#d3" + tag + "-" + s).outerWidth() - margin.left - margin.right,
        height = $("#d3" + tag + "-" + s).outerHeight() - margin.top - margin.bottom;

    var svg = d3.select("#d3" + tag + "-" + s)
        .append("svg")
        // .attr("viewBox", "0 0 500 400")
        // .attr("preserveAspectRatio", "xMinYMin slice")
        // .classed("svg-content-responsive", true)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate("
            + margin.left
            + "," + margin.top + ")");

    svg.append("path")        // Add the valueline path.
        .attr("class", "line");
    $('#buttons' + tag + '-' + s + ' .week').click();
}

function updateGraph(t,s,e,tag,range) {

    var stock = t;
    var start = s;
    var end = e;
    var DATA;

    DATA = isCacheUpToDate(stock,range);

    // if(DATA){
    //   console.log("UPDATE GRAPH - FOUND IN CACHE");
    //   console.log("UPDATE GARPH " + DATA.data);
    //   // console.log(DATA.range);
    //   // console.log(DATA.lastUpdate);
    // }
    if(!DATA){
        //console.log("UPDATE GRAPH - CACHE NEEDS UPDATING");
        var requestConfig = {
            method: "PUT",
            url: "/searchHistory",
            contentType: 'application/json',
            data: JSON.stringify({
                ticker: stock,
                start: start,
                end: end
            })
        };
        $.ajax(requestConfig).then(function(data) {
            DATA = updateCache(stock,data,range);
            drawGraph(t,s,e,tag,DATA.data);
        });
    }

    if(DATA){
        drawGraph(t,s,e,tag,DATA.data);
    }

};

function drawGraph(t,s,e,tag,DATA){
    var stock = t;
    var start = s;
    var end = e;
    var values = [];
    var margin = {top: 0, right: 0, bottom: 0, left: 0},
        width = $("#d3" + tag + "-" + stock).outerWidth() - margin.left - margin.right,
        height = $("#d3" + tag + "-" + stock).outerHeight() - margin.top - margin.bottom;


    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    //console.log("#d3" + stock);
    var parseDate = d3.time.format("%Y-%m-%d").parse;
    var valueline = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.high); });


    DATA.result.forEach(function(d) {
        d.date = parseDate(d.Date);
        d.high = +d.High;
        d.low = +d.Low;
        values.push(d.Open);
    });

    x.domain(d3.extent(DATA.result, function(d) {
        return d.date; }));
    y.domain([
        d3.min(DATA.result, function(d) {
            return d.low; }),
        d3.max(DATA.result, function(d) {
            return d.high; })
    ]);

    var svg = d3.select("#d3" + tag + "-" + stock).transition();

    // Make the changes
    svg.select(".line")    // change the line
        .transition()
        .duration(500)
        .attr("d", valueline(DATA.result));

    var ret = (ubique.mean(ubique.tick2ret(values.reverse())) * 100).toFixed(4);
    var varc = (ubique.varc(ubique.tick2ret(values.reverse())) * 100).toFixed(4);
    $('#title' + tag + '-' + stock).text(parseFloat(DATA.result[0].Open).toLocaleString('en-US', { style: 'currency', currency: 'USD' }));
    $('#return' + tag + '-' + stock).text(ret + "%");
    $('#variance' + tag + '-' + stock).text(varc + "%");

}


$(document).ready(function () {
    $(".d3-wrapper").each(function() {
        var symbol = $(this).data("symbol");

        makeGraph(symbol,"");
    });
});

$(window).resize(function() {
    if($('.searchButtons'))
        $('.searchButtons' + ' .active').click();

    $(".d3-wrapper").each(function() {
        var s = $(this).data("symbol");
        $('#buttons' + "" + '-' + s + ' .active').click();
    });
});
