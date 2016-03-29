export var InterpretationWindow;

InterpretationWindow = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,

        i18n = c.i18nManager.get(),
        path = appManager.getPath(),
        apiResource = instanceManager.getApiResource();

    var textArea = Ext.create('Ext.form.field.TextArea', {
        cls: 'ns-textarea',
        height: 130,
        fieldStyle: 'padding-left: 3px; padding-top: 3px',
        emptyText: i18n.write_your_interpretation + '..',
        enableKeyEvents: true,
        listeners: {
            keyup: function() {
                shareButton.xable();
            }
        }
    });

    var shareButton = Ext.create('Ext.button.Button', {
        text: i18n.share,
        disabled: true,
        xable: function() {
            this.setDisabled(!textArea.getValue());
        },
        handler: function() {
            if (textArea.getValue()) {
                Ext.Ajax.request({
                    url: encodeURI(path + '/api/interpretations/' + apiResource + '/' + instanceManager.getStateFavoriteId()),
                    method: 'POST',
                    params: textArea.getValue(),
                    headers: {'Content-Type': 'text/html'},
                    success: function() {
                        textArea.reset();
                        window.hide();
                    }
                });
            }
        }
    });

    var window = Ext.create('Ext.window.Window', {
        title: i18n.write_interpretation,
        layout: 'fit',
        width: 550,
        bodyStyle: 'padding:1px; background-color:#fff',
        resizable: false,
        destroyOnBlur: true,
        modal: true,
        items: [
            textArea
        ],
        bbar: {
            cls: 'ns-toolbar-bbar',
            defaults: {
                height: 24
            },
            items: [
                '->',
                shareButton
            ]
        },
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
    uiManager.reg(window, 'interpretationWindow');

    return window;
};
