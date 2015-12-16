export var rootNodesInit;

rootNodesInit = function() {
    var t = rootNodesInit,
        appManager = t.appManager,
        requestManager = t.requestManager,

        path = appManager.getPath(),
        displayProperty = appManager.getDisplayProperty();

    return {
        baseUrl: path + '/api/organisationUnits.json',
        params: [
            'userDataViewFallback=true',
            'fields=id,' + displayProperty + ',children[id,' + displayProperty + ']',
            'paging=false'
        ],
        success: function(r) {
            appManager.addRootNodes(r.organisationUnits);
            requestManager.ok(this);
        }
    };
};
