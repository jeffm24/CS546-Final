//For search bar pixles from top
$('#searchBar').data("offset-top", $('#searchBar').offset().top);

//dynamic search suggestions
$('#searchBarInput').on('input propertychange paste', function() {

    if ($('#searchBarInput').val()) {
        $.ajax({
            url: '/getTickerSearchSuggestions',
            type: 'POST',
            data: {
                search: $('#searchBarInput').val()
            },
            success: function(data) {
                if (data) {
                    var listOfSymbols = [];

                    for (ticker of data.suggestions) {
                        listOfSymbols.push(ticker.symbol);
                    }

                    $('#searchBarInput').autocomplete({
                        source: listOfSymbols
                    });
                }
            },
            error: function(xhr, status, error) {
                console.log(xhr.responseText + ' (' + xhr.status + ')');
            }
        });
    }

});

//Search submit handler
$('#searchForm').submit(function(e) {
    $.ajax({
        url: '/search',
        type: 'POST',
        data: {
            search: $('#searchBarInput').val().toUpperCase()
        },
        success: function(data) {
            if (data.notFound) {
                swal({
                    title: "Error!",
                    text: data.result,
                    type: "error",
                    confirmButtonText: "OK"
                });
            } else {

                // Create the render data object to be passed to the renderer
                var renderData = {
                    tickerSymbol: data.result.symbol,
                    changeInPercent: data.result.ChangeinPercent,
                    open: data.result.Open,
                    todayHigh: data.result.DaysHigh,
                    todayLow: data.result.DaysLow,
                    wkHigh: data.result.YearHigh,
                    wkLow: data.result.YearLow,
                    volume: data.result.Volume,
                    avgVolume: data.result.AverageDailyVolume,
                    marketCap: data.result.MarketCapitalization,
                    peRatio: data.result.PERatio,
                    divYield: data.result.DividendYield,
                    change: data.result.change,
                    userSavedTickers: data.result.userSavedTickers
                };

                // Get the contents of the searchTickerItem ejs file to pass to the renderer
                $.ajax({
                    url: '/assets/templates/searchTickerItem.ejs',
                    type: 'GET',
                    success: function(searchTickerItemEJS) {

                        // Render the searchTickerItem and insert it
                        var html = ejs.render(searchTickerItemEJS, renderData);
                        $('#searchResult').html(html);
                        makeGraph(data.result.symbol,"Search");

                    }
                });
            }
        },
        error: function(xhr, status, error) {
            swal({
                title: "Error!",
                text: xhr.responseJSON.error,
                type: "error",
                confirmButtonText: "OK"
            });
        }
    });

    return false;
});
