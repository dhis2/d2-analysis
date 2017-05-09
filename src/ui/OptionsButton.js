export var OptionsButton;

OptionsButton = function(refs) {
    var uiManager = refs.uiManager;

    var i18n = refs.i18nManager.get();

    return Ext.create('Ext.button.Button', {
        text: i18n.options,
        menu: {},
        handler: function() {
            uiManager.get('viewport').getOptionsWindow().show();
        }
    });
};
