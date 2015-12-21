export var legendSetsInit;

legendSetsInit = function() {
    var t = legendSetsInit,
        appManager = t.appManager,
        requestManager = t.requestManager,

        path = appManager.getPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: path + '/api/legendSets.json',
        params: [
            'fields=id,' + displayPropertyUrl + ',legends[id,' + displayPropertyUrl + ',startValue,endValue,color]',
            'paging=false'
        ],
        success: function(r) {
            appManager.addLegendSets(r.legendSets);
            requestManager.ok(this);
        }
    };
};
