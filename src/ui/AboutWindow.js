import isObject from 'd2-utilizr/lib/isObject';

export var AboutWindow;

AboutWindow = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,

        i18n = c.i18nManager.get(),
        apiPath = appManager.getApiPath();

    return Ext.create('Ext.window.Window', {
        title: i18n.about,
        bodyStyle: 'background:#fff; padding:6px',
        modal: true,
        resizable: false,
        destroyOnBlur: true,
        getData: function() {
            var t = this;

            Ext.Ajax.request({
                url: encodeURI(apiPath + '/system/info.json'),
                success: function(r) {
                    var info = Ext.decode(r.responseText),
                        divStyle = 'padding:3px',
                        html = '<div class="user-select">';

                    if (isObject(info)) {
                        html += '<div style="' + divStyle + '"><b>' + i18n.time_since_last_data_update + ': </b>' + info.intervalSinceLastAnalyticsTableSuccess + '</div>';
                        html += '<div style="' + divStyle + '"><b>' + i18n.version + ': </b>' + info.version + '</div>';
                        html += '<div style="' + divStyle + '"><b>' + i18n.revision + ': </b>' + info.revision + '</div>';
                        html += '<div style="' + divStyle + '"><b>' + i18n.username + ': </b>' + appManager.userAccount.username + '</div>';
                        html += '</div>';
                    }
                    else {
                        html += 'No system info found';
                    }

                    t.update(html);
                },
                failure: function(r) {
                    t.update(r.status + '\n' + r.statusText + '\n' + r.responseText);
                },
                callback: function() {
                    t.show();

                    uiManager.enableRightClick();

                    var aboutButton = uiManager.get('aboutButton') || {};

                    if (aboutButton.rendered) {
                        uiManager.setAnchorPosition(t, aboutButton);

                        if (!t.hasDestroyOnBlurHandler) {
                            uiManager.addDestroyOnBlurHandler(t);
                        }
                    }
                }
            });
        },
        listeners: {
            hide: function() {
                uiManager.disableRightClick();
            },
            destroy: function() {
                uiManager.disableRightClick();
            }
        }
    });
};
