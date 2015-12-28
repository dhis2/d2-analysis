export var rootNodesInit;

rootNodesInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        path = appManager.getPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: path + '/api/organisationUnits.json',
        params: [
            'userDataViewFallback=true',
            'fields=id,' + displayPropertyUrl + ',children[id,' + displayPropertyUrl + ']',
            'paging=false'
        ],
        success: function(r) {
            appManager.addRootNodes(r.organisationUnits);
            requestManager.ok(this);
        }
    };
};
