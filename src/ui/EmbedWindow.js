export var EmbedWindow;

EmbedWindow = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,

        i18n = c.i18nManager.get(),
        path = appManager.getPath(),
        apiResource = instanceManager.apiResource,
        apiEndpoint = instanceManager.apiEndpoint;

    var textArea = Ext.create('Ext.form.field.TextArea', {
        width: 700,
        height: 400,
        readOnly: true,
        cls: 'ns-textarea monospaced',
        value: function() {
            var text = '',
                version = 'v' + parseFloat(appManager.systemInfo.version.split('.').join('')),
                layout = instanceManager.getStateCurrent();

            text += '<html>\n<head>\n';
            text += '<link rel="stylesheet" href="//dhis2-cdn.org/' + version + '/ext/resources/css/ext-plugin-gray.css" />\n';
            text += '<script src="//dhis2-cdn.org/' + version + '/ext/ext-all.js"></script>\n';
            text += '<script src="//dhis2-cdn.org/' + version + '/plugin/table.js"></script>\n';
            text += '</head>\n\n<body>\n';
            text += '<div id="table1"></div>\n\n';
            text += '<script>\n\n';
            text += 'Ext.onReady(function() {\n\n';
            text += 'DHIS.getTable(' + JSON.stringify(layout.toPlugin('table1'), null, 2) + ');\n\n';
            text += '});\n\n';
            text += '</script>\n\n';
            text += '</body>\n</html>';

            return text;
        }()
    });

    var window = Ext.create('Ext.window.Window', {
        title: i18n.embed_in_web_page,
        layout: 'fit',
        modal: true,
        resizable: false,
        items: textArea,
        destroyOnBlur: true,
        bbar: [
            '->',
            {
                text: 'Select',
                handler: function() {
                    textArea.selectText();
                }
            }
        ],
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
    uiManager.reg(window, 'embedWindow');

    return window;
};
