export var dimensionsInit;

dimensionsInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        path = appManager.getPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: path + '/api/dimensions.json',
        params: [
            'fields=id,' + displayPropertyUrl,
            'paging=false'
        ],
        success: function(r) {
            appManager.addDimensions(r.dimensions);
            requestManager.ok(this);
        }
    };
};
