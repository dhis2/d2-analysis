export var authViewUnapprovedDataInit;

authViewUnapprovedDataInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        path = appManager.getPath();

    return {
        baseUrl: path + '/api/me/authorization/F_VIEW_UNAPPROVED_DATA',
        success: function(r) {
            appManager.viewUnapprovedData = r;
            requestManager.ok(this);
        }
    };
};
