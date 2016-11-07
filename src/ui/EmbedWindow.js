export var EmbedWindow;

EmbedWindow = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,

        i18n = c.i18nManager.get();

    var textArea = Ext.create('Ext.form.field.TextArea', {
        width: 700,
        height: 400,
        readOnly: true,
        cls: 'ns-textarea monospaced',
        value: uiManager.getEmbedHtml()
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
                text: i18n.select,
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
