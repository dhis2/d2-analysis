export var dataApprovalLevelsInit;

dataApprovalLevelsInit = function() {
    var t = dataApprovalLevelsInit,
        appManager = t.appManager,
        requestManager = t.requestManager,

        path = appManager.getPath(),
        displayProperty = appManager.getDisplayProperty();

    return {
        baseUrl: path + '/api/dataApprovalLevels.json',
        params: [
            'order=level:asc',
            'fields=id,' + displayProperty + ',level',
            'paging=false'
        ],
        success: function(r) {
            appManager.addDataApprovalLevels(r.dataApprovalLevels);
            requestManager.ok(this);
        }
    };
};
