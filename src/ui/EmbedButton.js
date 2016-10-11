import {EmbedWindow} from './EmbedWindow.js';

export var EmbedButton;

EmbedButton = function(c) {
    var i18n = c.i18nManager.get();

    return Ext.create('Ext.button.Button', {
        text: i18n.embed,
        disabled: true,
        menu: {},
        handler: function(b) {
            EmbedWindow(c).show();
        }
    });
};
