export const ExperimentalButton = function(refs) {
    var uiManager = refs.uiManager;

    var i18n = refs.i18nManager.get();

    return Ext.create('Ext.button.Button', {
        text: i18n.experimental,
        menu: {},
        handler: function() {
            uiManager.get('viewport').getExperimentalWindow().show();
        }
    });
};
