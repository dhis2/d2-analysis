export var dataApprovalLevelsInit;

dataApprovalLevelsInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        apiPath = appManager.getApiPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: apiPath + '/dataApprovalLevels.json',
        params: [
            'order=level:asc',
            'fields=id,displayName~rename(name),level',
            'paging=false'
        ],
        success: function(r) {
            appManager.addDataApprovalLevels(r.dataApprovalLevels);
            requestManager.ok(this);
        }
    };
};
