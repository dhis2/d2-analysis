export var categoryOptionGroupSetsInit;

categoryOptionGroupSetsInit = function(c, extraParams = []) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,
        dimensionConfig = c.dimensionConfig,

        apiPath = appManager.getApiPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: apiPath + '/categoryOptionGroupSets.json',
        params: [
            'fields=id,' + displayPropertyUrl + ',dataDimensionType',
            'paging=false'
        ].concat(extraParams),
        success: function(r) {
            appManager.addCategoryOptionGroupSets(r.categoryOptionGroupSets);

            requestManager.ok(this);
        }
    };
};
