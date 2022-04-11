import {isObject} from 'd2-utilizr';

export var CenterRegion;

CenterRegion = function(config) {
    var t = this,
        i18nManager = CenterRegion.i18nManager;

    config = isObject(config) ? config : {};

    // constructor
    $.extend(this, Ext.create('Ext.panel.Panel', {
        region: 'center',
        bodyStyle: 'padding:1px',
        autoScroll: true,
        fullSize: true,
        tbar: {},
        listeners: {
            afterrender: function(p) {
                var html = '';

                html += '<div class="ns-viewport-text" style="padding:20px">';
                html += '<h3>' + i18nManager.get('example1') + '</h3>';
                html += '<div>- ' + i18nManager.get('example2') + '</div>';
                html += '<div>- ' + i18nManager.get('example3') + '</div>';
                html += '<div>- ' + i18nManager.get('example4') + '</div>';
                html += '<h3 style="padding-top:20px">' + i18nManager.get('example5') + '</h3>';
                html += '<div>- ' + i18nManager.get('example6') + '</div>';
                html += '<div>- ' + i18nManager.get('example7') + '</div>';
                html += '<div>- ' + i18nManager.get('example8') + '</div>';
                html += '</div>';

                p.update(html);
            }
        }
    }));
};
