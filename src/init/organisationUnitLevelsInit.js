export var organisationUnitLevelsInit;

organisationUnitLevelsInit = function(c) {
    var t = this,
        appManager = c.appManager,
        requestManager = c.requestManager,

        apiPath = appManager.getApiPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: apiPath + '/organisationUnitLevels.json',
        params: [
            'fields=id,displayName~rename(name),level',
            'paging=false'
        ],
        success: function(r) {
            appManager.addOrganisationUnitLevels(r.organisationUnitLevels);

            if (!r.organisationUnitLevels.length) {
                alert('No organisation unit levels found');
            }

            requestManager.ok(this);
        }
    };
};
