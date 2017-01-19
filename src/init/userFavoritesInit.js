export var userFavoritesInit;

userFavoritesInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        apiPath = appManager.getApiPath(),
        username = appManager.userAccount.username,
        eventType = instanceManager.dataStatisticsEventType;

    return {
        baseUrl: apiPath + '/dataStatistics/favorites.json',
        params: [
            'eventType=' + eventType,
            'username=' + username,
            'pageSize=10'
        ],
        success: function(response) {
            appManager.userFavorites = response;
            requestManager.ok(this);
        }
    }
};
