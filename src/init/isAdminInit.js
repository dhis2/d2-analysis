export var isAdminInit;

isAdminInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,
        apiPath = appManager.getApiPath();

    return {
        baseUrl: appManager.getPath() + '/api/me/authorization/ALL', 
        success: function(r) {
            appManager.isAdmin = r;
            requestManager.ok(this);
        }
    };
};
