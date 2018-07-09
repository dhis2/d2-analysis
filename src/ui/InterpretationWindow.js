import { SharingWindow } from './SharingWindow';
import { MentionToolbar } from './MentionToolbar.js';
import { validateSharing } from '../util/permissions';

export var InterpretationWindow;

InterpretationWindow = function(c, sharing, interpretation, success, options) {
    var { renderText = true, renderSharing = true } = options || {};

    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get(),
        apiPath = appManager.getApiPath(),
        apiResource = instanceManager.apiResource,
        apiEndpoint = instanceManager.apiEndpoint;

    var textArea = Ext.create('Ext.form.field.TextArea', {
        cls: 'ns-textarea',
        height: 130,
        width: 407,
        fieldStyle: 'padding-left:3px; padding-top:3px',
        emptyText: i18n.write_your_interpretation + '...',
        enableKeyEvents: true,
        value: interpretation ? interpretation.text : undefined,
        mentionToolbar: MentionToolbar(c),
        listeners: {
            keyup: function(f, e) {
                shareButton.xable();
                this.mentionToolbar.displayMentionSuggestion(f, e);
            }
        }
    });

    var getSharingWithModel = sharing => ({
        ...sharing,
        object: {...sharing.object, modelName: "interpretation", name: ""},
    });

    var sharingCmp = renderSharing && sharing
        ? new SharingWindow(c, getSharingWithModel(sharing), true)
        : null;

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

    var updateSharing = function(response, text) {
        var interpretationId = interpretation
                ? interpretation.id
                : (response.getResponseHeader('location') || '').split('/').pop(),
            sharingId = sharing.object.id,
            sharingBody = sharingCmp.getBody();

        Ext.Ajax.request({
            url: encodeURI(apiPath + '/sharing?type=interpretation&id=' + interpretationId),
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            params: Ext.encode(sharingBody),
            success: function() {
                // Reload favorite to update interpretation sharings in the global object
                instanceManager.getById(null, function(layout, isFavorite) {
                    instanceManager.getReport(layout, isFavorite, false, false, function() {
                        uiManager.unmask();
                    });
                });
            },
            callback: function() {
                if (text) {
                    interpretationSuccess(text);
                }
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
            if (sharingCmp) {
                var showSharingError = function() {
                    var errorMessage = i18n.validation_error_interpretation_sharing;
                    uiManager.alert(errorMessage);
                };
                var favorite = instanceManager.getStateFavorite();
                var newSharing = sharingCmp.getBody().object;

                if (!validateSharing("interpretation", favorite, newSharing, showSharingError)) {
                    return;
                }
            }

            var text = textArea.getValue();
            var interpretationPath = interpretation
                ? '/interpretations/' + interpretation.id
                : '/interpretations/' + apiResource + '/' + instanceManager.getStateFavoriteId();

            if (renderText) {
                Ext.Ajax.request({
                    url: encodeURI(apiPath + interpretationPath),
                    method: method,
                    params: text,
                    headers: { 'Content-Type': 'text/html' },
                    success: function(response) {
                        sharing ? updateSharing(response, text) : interpretationSuccess(text);
                        textArea.reset();
                        window.destroy();
                    },
                });
            } else if (renderSharing && sharing) {
                updateSharing();
                window.destroy();
            }
        },
    });

    var window = Ext.create('Ext.window.Window', {
        title: renderText ? i18n.write_interpretation : i18n.sharing_settings,
        layout: 'fit',
        bodyStyle: 'padding:4px; background-color:#fff',
        resizable: false,
        destroyOnBlur: true,
        modal: true,
        items: [renderText && textArea, renderSharing && sharingCt].filter(item => item),
        bbar: {
            cls: 'ns-toolbar-bbar',
            defaults: {
                height: 24,
            },
            items: ['->', shareButton],
        },
        listeners: {
            show: function(w) {
                uiManager.setAnchorPosition(w, 'favoriteButton', {y: 130});
                
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
