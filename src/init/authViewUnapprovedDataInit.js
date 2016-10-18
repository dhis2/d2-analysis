export var authViewUnapprovedDataInit;

authViewUnapprovedDataInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        apiPath = appManager.getApiPath();

    return {
        baseUrl: appManager.getPath() + '/api/me/authorization/F_VIEW_UNAPPROVED_DATA', //TODO fix versioning +when supported by api
        success: function(r) {
            appManager.viewUnapprovedData = r;
            requestManager.ok(this);
        }
    };
};
