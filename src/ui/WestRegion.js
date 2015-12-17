import {isObject} from 'd2-utilizr';

export var WestRegion;

WestRegion = function(config) {
    var t = this,
        uiManager = WestRegion.uiManager;

    config = isObject(config) ? config : {};

    // constants
    var width = config.width || 424;

    // constructor
    $.extend(this, Ext.create('Ext.panel.Panel', {
        region: 'west',
        preventHeader: true,
        collapsible: true,
        collapseMode: 'mini',
        border: false,
        width: width + uiManager.getScrollbarSize().width,
        //items: config.accordion
        html: 'west'
    }));
};
