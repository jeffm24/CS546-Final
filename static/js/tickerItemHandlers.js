// Calls the server-side route for updating the ticker with the given symbol
function updateTicker(tickerSymbol, showSuccessAlert) {
    $.ajax({
        url: '/updateTicker',
        type: 'PUT',
        data: {
            symbol: tickerSymbol
        },
        success: function(data) {

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
                change: data.result.change
            };

            // check the current state of the panel associated with this ticker to set collapsed or not
            if ($('#collapse' + renderData.tickerSymbol).hasClass('in')) {
                renderData.collapsed = false;
            } else {
                renderData.collapsed = true;
            }

            // Get the contents of the openTickerItem ejs file to pass to the renderer
            $.ajax({
                url: '/assets/templates/savedTickerItem.ejs',
                type: 'GET',
                success: function(openTickerItemEJS) {
                    // Replace the current ticker item with the rendered openTickerItem
                    var html = ejs.render(openTickerItemEJS, renderData);

                    // Graph panel doesn't change at all so grab the html from there to be re-inserted (so we don't have to remake it)
                    $graphPanelHtml = $('#d3-' + renderData.tickerSymbol).parent().html();

                    $('#panel-' + renderData.tickerSymbol).replaceWith(html);
                    $('#d3-' + renderData.tickerSymbol).parent().html($graphPanelHtml);

                    // Enable all refresh ticker buttons once ajax request has finished
                    $('.refresh-ticker-btn').each(function() {
                        $(this).prop('disabled', false);
                    });

                    // Display success message to the user
                    if (showSuccessAlert) {
                        swal({
                            title: "Success!",
                            text: renderData.tickerSymbol + " is now up to date.",
                            type: "success",
                            confirmButtonText: "OK"
                        });
                    }
                }
            });
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
}

// Save Ticker Button click handler
$(document).on('click', '#saveTickerBtn', function(event){
    $.ajax({
        url: '/saveTicker',
        type: 'POST',
        data: {
            symbol: $('#saveTickerBtn').data('symbol')
        },
        success: function(data) {
            location.reload();
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
});

// Remove Ticker Button click handler
$(document).on('click', '.remove-ticker-btn', function(event){
    $.ajax({
        url: '/removeTicker',
        type: 'DELETE',
        data: {
            symbol: $(event.target).data('symbol')
        },
        success: function(data) {
            if (data.result.length) {
                // If there are still any tickers left, just remove the removed one from the UI
                $('#panel-' + $(event.target).data('symbol')).remove();
            } else {
                // If there are none left, replace with the "You have no saved tickers" message
                $('#accordion').html('<div class="noSavedTickers text-center"><h4>You Have no Saved Tickers</h4></div>');
            }

            removeFromCache($(event.target).data('symbol'));
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
});

// Refresh Ticker Button click handler
$(document).on('click', '.refresh-ticker-btn', function(event){
    // Disable all refresh ticker buttons while ajax request is running
    $('.refresh-ticker-btn').each(function() {
        $(this).prop('disabled', true);
    });
    updateTicker($(this).data('symbol'), true);
});


// Click handler for the graph time period buttons
$(document).on('click','.btn-graph', function(e) {
    $(e.target).addClass('active').siblings().removeClass('active');
    //console.log($(e.target).data("symbol"));
    var stock = $(e.target).data("symbol");
    var search = $(e.target).data("search");
    var end = new Date();
    var start = new Date();
    var range;

    if ($(this).hasClass('week')) {
        start.setDate(end.getDate() - 7);
        range = "1W";
    } else if ($(this).hasClass('month')) {
        start.setMonth(end.getMonth() - 1);
        range = "1M";
    } else if ($(this).hasClass('3month')) {
        start.setMonth(end.getMonth() - 3);
        range = "3M";
    } else if ($(this).hasClass('year')) {
        start.setFullYear(end.getFullYear() - 1);
        range = "1Y";
    }

    start = start.toISOString().split('T')[0];
    end = end.toISOString().split('T')[0];
    if(search){
        updateGraph(stock,start,end,"Search",range);
    } else {
        updateGraph(stock,start,end,"",range);
    }
});

// Clicks the last active button on expand of each panel (to redraw the graph)
$(document).on('shown.bs.collapse', '.panel', function (e) {
    $('#' + e.target.id + ' .active').click();
});
