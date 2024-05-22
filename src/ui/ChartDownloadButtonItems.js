export var ChartDownloadButtonItems;

ChartDownloadButtonItems = function(refs) {
    var uiManager = refs.uiManager,
        instanceManager = refs.instanceManager,
        i18n = refs.i18nManager.get();

    var getFilename = function() {
        return instanceManager.getStateFavoriteName() || instanceManager.getStateCurrent().title || i18n.untitled;
    };

    return [
        {
            xtype: 'label',
            text: i18n.graphics,
            style: 'padding:7px 5px 5px 7px; font-weight:bold'
        },
        {
            text: i18n.image_png + ' (.png)',
            cls: 'push-analytics-download-as-png-menu-item',
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
