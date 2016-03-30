import {EmbedWindow} from './EmbedWindow.js';

export var EmbedButton;

EmbedButton = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get(),
        uiConfig = c.uiConfig,

        path = appManager.getPath(),
        apiResource = instanceManager.apiResource;

    return Ext.create('Ext.button.Button', {
        text: i18n.embed,
        disabled: true,
        menu: {},
        handler: function(b) {
            EmbedWindow(c).show();
        }
    });
};
