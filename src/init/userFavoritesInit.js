export var userFavoritesInit;

userFavoritesInit = function(refs, pageSize = 10) {
    var t = this;

    var appManager = refs.appManager,
        requestManager = refs.requestManager,
        instanceManager = refs.instanceManager;

    var apiPath = appManager.getApiPath(),
        username = appManager.userAccount.userCredentials.username,
        eventType = instanceManager.dataStatisticsEventType;

    return {
        baseUrl: apiPath + '/dataStatistics/favorites.json',
        params: [
            'eventType=' + eventType,
            'username=' + username,
            'pageSize=' + pageSize
        ],
        success: function(response) {
            appManager.userFavorites = response;
            requestManager.ok(this);
        }
    }
};
