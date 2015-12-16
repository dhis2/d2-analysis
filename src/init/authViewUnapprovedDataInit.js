export var authViewUnapprovedDataInit;

authViewUnapprovedDataInit = function() {
    var t = authViewUnapprovedDataInit,
        appManager = t.appManager,
        requestManager = t.requestManager,
        
        path = appManager.getPath();

    return {
        baseUrl: path + '/api/me/authorization/F_VIEW_UNAPPROVED_DATA',
        success: function(r) {
            appManager.viewUnapprovedData = r;
            requestManager.ok(this);
        }
    };
};
