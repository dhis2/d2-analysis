import { SharingWindow } from './SharingWindow';

export var InterpretationWindow;

InterpretationWindow = function(c, sharing) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,

        i18n = c.i18nManager.get(),
        path = appManager.getPath(),
        apiResource = instanceManager.apiResource,
        apiEndpoint = instanceManager.apiEndpoint;

    var textArea = Ext.create('Ext.form.field.TextArea', {
        cls: 'ns-textarea',
        height: 130,
        width: 407,
        fieldStyle: 'padding-left:3px; padding-top:3px',
        emptyText: i18n.write_your_interpretation + '..',
        enableKeyEvents: true,
        listeners: {
            keyup: function() {
                shareButton.xable();
            }
        }
    });

    var sharingCmp = new SharingWindow(c, sharing, true);

    var sharingCt = Ext.create('Ext.container.Container', {
        style: 'padding-top:10px',
        items: sharingCmp.items
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
                    success: function(obj) {
                        var interpretationId = (obj.getResponseHeader('location') || '').split('/').pop(),
                            sharingId = sharing.object.id,
                            sharingBody = sharingCmp.getBody();

                        Ext.Ajax.request({
                            url: encodeURI(path + '/api/sharing?type=interpretation&id=' + interpretationId),
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            params: Ext.encode(sharingBody)
                        });

                        Ext.Ajax.request({
                            url: encodeURI(path + '/api/sharing?type=' + apiResource + '&id=' + sharingId),
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            params: Ext.encode(sharingBody)
                        });

                        textArea.reset();
                        window.destroy();
                    }
                });
            }
        }
    });

    var window = Ext.create('Ext.window.Window', {
        title: i18n.write_interpretation,
        layout: 'fit',
        bodyStyle: 'padding:4px; background-color:#fff',
        resizable: false,
        destroyOnBlur: true,
        modal: true,
        items: [
            textArea,
            sharingCt
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
