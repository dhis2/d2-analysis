export var ChartDownloadButtonItems;

ChartDownloadButtonItems = function(refs, filename) {
    var uiManager = refs.uiManager,
        instanceManager = refs.instanceManager,
        i18n = refs.i18nManager.get();

    var getFilename = function() {
        return filename || instanceManager.getStateFavoriteName() || instanceManager.getStateCurrent().title;
    };

    return [
        {
            xtype: 'label',
            text: i18n.graphics,
            style: 'padding:7px 5px 5px 7px; font-weight:bold'
        },
        {
            text: i18n.image_png + ' (.png)',
            iconCls: 'ns-menu-item-image',
            handler: function() {
                uiManager.submitSvgForm('png', getFilename());
            }
        },
        {
            text: 'PDF (.pdf)',
            iconCls: 'ns-menu-item-image',
            handler: function() {
                uiManager.submitSvgForm('pdf', getFilename());
            }
        }
    ];
};
