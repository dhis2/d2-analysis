export var organisationUnitLevelsInit;

organisationUnitLevelsInit = function() {
    var t = organisationUnitLevelsInit,
        appManager = t.appManager,
        requestManager = t.requestManager,

        path = appManager.getPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl();

    return {
        baseUrl: path + '/api/organisationUnitLevels.json',
        params: [
            'fields=id,' + displayPropertyUrl + 'level',
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
