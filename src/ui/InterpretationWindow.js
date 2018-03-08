import { SharingWindow } from './SharingWindow';

export var InterpretationWindow;

InterpretationWindow = function(c, sharing, interpretation, success) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get(),
        apiPath = appManager.getApiPath(),
        apiResource = instanceManager.apiResource,
        apiEndpoint = instanceManager.apiEndpoint;

    var textArea = Ext.create('Ext.ux.CKEditor', {
        cls: 'ns-textarea',
        height: 130,
        width: 407,
        fieldStyle: 'padding-left:3px; padding-top:3px',
        emptyText: i18n.write_your_interpretation + '..',
        enableKeyEvents: true,
        value: interpretation ? interpretation.text : undefined,
        listeners: {
            keyup: function() {
                shareButton.xable();
            },
        },
    });

    var sharingCmp = sharing ? new SharingWindow(c, sharing, true) : null;

    var sharingCt = Ext.create('Ext.container.Container', {
        style: 'padding-top:10px; padding-bottom:25px',
        items: sharingCmp ? sharingCmp.items : [],
    });

    var method = interpretation ? 'PUT' : 'POST';

    var interpretationSuccess = function(text) {
        if (interpretation) {
            interpretation.text = text;
        }
        if (success) {
            success();
        } else {
            instanceManager.getById(null, function(layout, isFavorite) {
                instanceManager.getReport(layout, isFavorite, false, false, function() {
                    uiManager.unmask();
                });
            });
        }
    };

    var updateSharing = function(obj, text) {
        var interpretationId = interpretation
                ? interpretation.id
                : (obj.getResponseHeader('location') || '').split('/').pop(),
            sharingId = sharing.object.id,
            sharingBody = sharingCmp.getBody();

        Ext.Ajax.request({
            url: encodeURI(apiPath + '/sharing?type=interpretation&id=' + interpretationId),
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            params: Ext.encode(sharingBody),
            callback: function() {
                interpretationSuccess(text);
            },
        });
    };

    var shareButton = Ext.create('Ext.button.Button', {
        text: interpretation ? i18n.update : i18n.share,
        disabled: !interpretation,
        xable: function() {
            this.setDisabled(!textArea.getValue());
        },
        handler: function() {
            var text = textArea.getValue();
            var interpretationPath = interpretation
                ? '/interpretations/' + interpretation.id
                : '/interpretations/' + apiResource + '/' + instanceManager.getStateFavoriteId();

            if (text) {
                Ext.Ajax.request({
                    url: encodeURI(apiPath + interpretationPath),
                    method: method,
                    params: text,
                    headers: { 'Content-Type': 'text/html' },
                    success: function(obj) {
                        sharing ? updateSharing(obj, text) : interpretationSuccess(text);
                        textArea.reset();
                        window.destroy();
                    },
                });
            }
        },
    });

    var window = Ext.create('Ext.window.Window', {
        title: i18n.write_interpretation,
        layout: 'fit',
        bodyStyle: 'padding:4px; background-color:#fff',
        resizable: false,
        destroyOnBlur: true,
        modal: true,
        items: [textArea, sharingCt],
        bbar: {
            cls: 'ns-toolbar-bbar',
            defaults: {
                height: 24,
            },
            items: ['->', shareButton],
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
            },
        },
    });
    uiManager.reg(window, 'interpretationWindow');

    return window;
};
