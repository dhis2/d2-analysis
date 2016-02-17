export var GridHeaders;

GridHeaders = function(config) {
    return Ext.create('Ext.toolbar.Toolbar', $.extend(config, {
        cls: 'd2analysis-gridheaders'
    }));
};
