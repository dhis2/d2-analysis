export var LinkWindow;

LinkWindow = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,

        i18n = c.i18nManager.get(),
        path = appManager.getPath(),
        apiPath = appManager.getApiPath(),
        apiEndpoint = instanceManager.apiEndpoint,
        apiModule = instanceManager.apiModule;

    var window = Ext.create('Ext.window.Window', {
        title: i18n.favorite_link,
        layout: 'fit',
        modal: true,
        resizable: false,
        destroyOnBlur: true,
        bodyStyle: 'padding:12px 12px 15px; background-color:#fff; font-size:11px',
        html: function() {
            var layout = instanceManager.getStateFavorite(),
                appUrl = path + '/' + apiModule + '/index.html?id=' + layout.id,
                apiUrl = apiPath + '/' + apiEndpoint + '/' + layout.id + '/data.html+css',
                hStyle = 'padding-bottom:10px; font-weight:bold; color:#444',
                html = '';

            html += '<div style="' + hStyle + '">Open in this app</div>';
            html += '<a class="user-select td-nobreak" target="_blank" href="' + appUrl + '">' + appUrl + '</a>';
            html += '<br/><br/><br/>';
            html += '<div style="' + hStyle + '">Open in web api</div>';
            html += '<a class="user-select td-nobreak" target="_blank" href="' + apiUrl + '">' + apiUrl + '</a>';

            return html;
        }(),
        listeners: {
            show: function(w) {
                uiManager.setAnchorPosition(w, 'favoriteButton');

                uiManager.enableRightClick();

                if (!w.hasDestroyOnBlurHandler) {
                    uiManager.addDestroyOnBlurHandler(w);
                }
            },
            hide: function() {
                uiManager.disableRightClick();
            }
        }
    });
    uiManager.reg(window, 'linkWindow');

    return window;
};


