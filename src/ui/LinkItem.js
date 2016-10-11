export var LinkItem;

LinkItem = function(c) {
    var appManager = c.appManager,
        instanceManager = c.instanceManager,
        uiManager = c.uiManager,
        i18nManager = c.i18nManager,

        i18n = c.i18nManager.get(),
        path = appManager.getPath(),
        apiResource = instanceManager.apiResource,
        apiEndpoint = instanceManager.apiEndpoint;

    return Ext.create('Ext.menu.Item', {
        text: i18n.favorite_link + '&nbsp;&nbsp;',
        iconCls: 'ns-menu-item-datasource',
        disabled: true,
        xable: function() {
            this.setDisabled(!instanceManager.isStateSaved());
        },
        handler: function() {
            var layout = instanceManager.getStateFavorite(),
                appUrl = path + '/dhis-web-pivot/index.html?id=' + layout.id,
                apiUrl = path + '/api/' + apiEndpoint + '/' + layout.id + '/data.html',
                html = '',
                window;

            html += 'App link: <a class="user-select td-nobreak" target="_blank" href="' + appUrl + '">' + appUrl + '</a>';
            html += '<br/><br/>';
            html += 'Api link: <a class="user-select td-nobreak" target="_blank" href="' + apiUrl + '">' + apiUrl + '</a>';

            window = Ext.create('Ext.window.Window', {
                title: i18n.favorite_link + '<span style="font-weight:normal">&nbsp;|&nbsp;&nbsp;' + ns.app.layout.name + '</span>',
                layout: 'fit',
                modal: true,
                resizable: false,
                destroyOnBlur: true,
                bodyStyle: 'padding: 12px 18px; background-color: #fff; font-size: 11px',
                html: html,
                listeners: {
                    show: function(w) {
                        uiManager.setAnchorPosition(w, shareButton);

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

            window.show();
        }
    });
};
