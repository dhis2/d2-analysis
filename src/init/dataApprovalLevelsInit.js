export var dataApprovalLevelsInit;

dataApprovalLevelsInit = function() {
    var t = dataApprovalLevelsInit,
        appManager = t.appManager,
        requestManager = t.requestManager,

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
