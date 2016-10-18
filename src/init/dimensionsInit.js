export var dimensionsInit;

dimensionsInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,
        dimensionConfig = c.dimensionConfig,

        apiPath = appManager.getApiPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: apiPath + '/dimensions.json',
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
