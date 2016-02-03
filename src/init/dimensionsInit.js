export var dimensionsInit;

dimensionsInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,
        dimensionConfig = c.dimensionConfig,

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
            dimensionConfig.add(r.dimensions);

            requestManager.ok(this);
        }
    };
};
