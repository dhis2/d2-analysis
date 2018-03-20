export var PluginItem;

PluginItem = function(c) {
    var appManager = c.appManager,
        instanceManager = c.instanceManager,
        uiManager = c.uiManager,
        i18nManager = c.i18nManager,
        i18n = c.i18nManager.get();

    return Ext.create('Ext.menu.Item', {
        text: i18n.embed_in_web_page + '&nbsp;&nbsp;',
        iconCls: 'ns-menu-item-datasource',
        disabled: true,
        xable: function() {
            this.setDisabled(!instanceManager.isStateCurrent());
        },
        handler: function() {
            var textArea,
                window,
                text = '',
                version = 'v' + parseFloat(appManager.systemInfo.version.split('.').join('')),
                layout = instanceManager.getStateCurrent();

            text += '<html>\n<head>\n';
            text +=
                '<link rel="stylesheet" href="//dhis2-cdn.org/' +
                version +
                '/ext/resources/css/ext-plugin-gray.css" />\n';
            text += '<script src="//dhis2-cdn.org/' + version + '/ext/ext-all.js"></script>\n';
            text += '<script src="//dhis2-cdn.org/' + version + '/plugin/table.js"></script>\n';
            text += '</head>\n\n<body>\n';
            text += '<div id="table1"></div>\n\n';
            text += '<script>\n\n';
            text += 'Ext.onReady(function() {\n\n';
            text +=
                'DHIS.getTable(' + JSON.stringify(layout.toPlugin('table1'), null, 2) + ');\n\n';
            text += '});\n\n';
            text += '</script>\n\n';
            text += '</body>\n</html>';

            textArea = Ext.create('Ext.form.field.TextArea', {
                width: 700,
                height: 400,
                readOnly: true,
                cls: 'ns-textarea monospaced',
                value: text,
            });

            window = Ext.create('Ext.window.Window', {
                title:
                    i18n.embed_in_web_page +
                    (layout.displayName
                        ? '<span style="font-weight:normal">&nbsp;|&nbsp;&nbsp;' +
                          layout +
                          '</span>'
                        : ''),
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
                        },
                    },
                ],
                listeners: {
                    show: function(w) {
                        uiManager.setAnchorPosition(w, 'shareButton');

                        uiManager.enableRightClick();

                        if (!w.hasDestroyOnBlurHandler) {
                            uiManager.addDestroyOnBlurHandler(w);
                        }
                    },
                    hide: function() {
                        uiManager.disableRightClick();
                    },
                },
            });

            window.show();
        },
    });
};
