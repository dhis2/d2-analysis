export var legendSetsInit;

legendSetsInit = function() {
    var t = legendSetsInit,
        appManager = t.appManager,
        requestManager = t.requestManager,

        path = appManager.getPath(),
        displayProperty = appManager.getDisplayProperty();

    return {
        baseUrl: path + '/api/legendSets.json',
        params: [
            'fields=id,' + displayProperty + ',legends[id,' + displayProperty + ',startValue,endValue,color]',
            'paging=false'
        ],
        success: function(r) {
            appManager.addLegendSets(r.legendSets);
            requestManager.ok(this);
        }
    };
};
