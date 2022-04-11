export var i18nInit;

i18nInit = function(refs) {
    var t = this,
        appManager = refs.appManager,
        requestManager = refs.requestManager,
        i18nManager = refs.i18nManager,

        uiLocale = appManager.getUiLocale(),
        isUiLocaleDefault = appManager.isUiLocaleDefault(),
        defaultUiLocale = appManager.defaultUiLocale;

    return {
        baseUrl: 'i18n/i18n_app.properties',
        type: 'ajax',
        dataType: 'text',
        headers: {
            'Accept': 'text/plain; charset=utf-8'
        },
        success: function(r) {
            var t = this;

            i18nManager.add(dhis2.util.parseJavaProperties(r));

            if (isUiLocaleDefault) {
                requestManager.ok(t);
            }
            else {
                $.ajax({
                    url: 'i18n/i18n_app_' + uiLocale + '.properties',
                    success: function(r) {
                        i18nManager.add(dhis2.util.parseJavaProperties(r));
                    },
                    error: function() {
                        console.log('(i18n) No translations found for system locale (' + uiLocale + ')');
                    },
                    complete: function() {
                        requestManager.ok(t);
                    }
                });
            }
        },
        error: function() {
            $.ajax({
                url: 'i18n/i18n_app_' + uiLocale + '.properties',
                success: function(r) {
                    i18nManager.add(dhis2.util.parseJavaProperties(r));
                },
                error: function() {
                    alert('(i18n) No translations found for system locale (' + uiLocale + ') or default locale (' + defaultUiLocale + ')');
                },
                complete: function() {
                    requestManager.ok(this);
                }
            });
        }
    };
};
