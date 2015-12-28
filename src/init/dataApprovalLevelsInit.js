export var dataApprovalLevelsInit;

dataApprovalLevelsInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        path = appManager.getPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: path + '/api/dataApprovalLevels.json',
        params: [
            'order=level:asc',
            'fields=id,' + displayPropertyUrl + ',level',
            'paging=false'
        ],
        success: function(r) {
            appManager.addDataApprovalLevels(r.dataApprovalLevels);
            requestManager.ok(this);
        }
    };
};
