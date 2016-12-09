export var userFavoritesInit;

userFavoritesInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        apiPath = appManager.getApiPath(),
        username = c.appManager.userAccount.username;

    return {
        baseUrl: apiPath + '/dataStatistics/favorites.json',
        params: [
            'eventType=REPORT_TABLE_VIEW',
            'username=' + username,
            'pageSize=5'
        ],
        success: function(response) {
            appManager.userFavorites = response;
            requestManager.ok(this);
        }
    }
};