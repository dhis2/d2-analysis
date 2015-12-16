export var dimensionsInit;

dimensionsInit = function() {
    var t = dimensionsInit,
        appManager = t.appManager,
        requestManager = t.requestManager,

        path = appManager.getPath(),
        displayProperty = appManager.getDisplayProperty();

    return {
        baseUrl: path + '/api/dimensions.json',
        params: [
            'fields=id,' + displayProperty,
            'paging=false'
        ],
        success: function(r) {
            appManager.addDimensions(r.dimensions);
            requestManager.ok(this);
        }
    };
};
