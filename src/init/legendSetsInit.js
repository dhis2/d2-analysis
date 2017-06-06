export var legendSetsInit;

legendSetsInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        apiPath = appManager.getApiPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: apiPath + '/legendSets.json',
        params: [
            'fields=id,displayName~rename(name),legends[id,displayName~rename(name),startValue,endValue,color]',
            'paging=false'
        ],
        success: function(r) {
            appManager.addLegendSets(r.legendSets);
            requestManager.ok(this);
        }
    };
};
