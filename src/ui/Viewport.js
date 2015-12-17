import {isObject} from 'd2-utilizr';

export var Viewport;

Viewport = function(config) {
    var t = this;

    config = isObject(config) ? config : {};

    // local
    //var menuRegion = new UiMenuRegion();

    // constructor
    $.extend(this, Ext.create('Ext.container.Viewport', {
        layout: 'border',
        //period: period,
        //treePanel: treePanel,
        //setGui: setGui,
        //westRegion: westRegion,
        //centerRegion: centerRegion,
        items: [
            config.westRegion,
            config.centerRegion
        ],
        listeners: {
            //render: function() {
                //ns.app.viewport = this;

                //ns.app.layoutWindow = LayoutWindow();
                //ns.app.layoutWindow.hide();

                //ns.app.optionsWindow = OptionsWindow();
                //ns.app.optionsWindow.hide();
            //},
            afterrender: function() {

                // resize event handler
                //westRegion.on('resize', function() {
                    //var panel = accordion.getExpandedPanel();

                    //if (panel) {
                        //panel.onExpand();
                    //}
                //});

                // left gui
                //var viewportHeight = westRegion.getHeight(),
                    //numberOfTabs = ns.core.init.dimensions.length + 3,
                    //tabHeight = 28,
                    //minPeriodHeight = 380;

                //if (viewportHeight > numberOfTabs * tabHeight + minPeriodHeight) {
                    //if (!Ext.isIE) {
                        //accordion.setAutoScroll(false);
                        //westRegion.setWidth(ns.core.conf.layout.west_width);
                        //accordion.doLayout();
                    //}
                //}
                //else {
                    //westRegion.hasScrollbar = true;
                //}

                // expand first panel
                //accordion.getFirstPanel().expand();

                // look for url params
                //var id = ns.core.web.url.getParam('id'),
                    //session = ns.core.web.url.getParam('s'),
                    //layout;

                //if (id) {
                    //ns.core.web.pivot.loadTable(id);
                //}
                //else if (Ext.isString(session) && NS.isSessionStorage && Ext.isObject(JSON.parse(sessionStorage.getItem('dhis2'))) && session in JSON.parse(sessionStorage.getItem('dhis2'))) {
                    //layout = ns.core.api.layout.Layout(JSON.parse(sessionStorage.getItem('dhis2'))[session]);

                    //if (layout) {
                        //ns.core.web.pivot.getData(layout, true);
                    //}
                //}

                // remove params from url
                //if (id || session) {
                    //history.pushState(null, null, '.')
                //}

                //var initEl = document.getElementById('init');
                //initEl.parentNode.removeChild(initEl);

                //Ext.getBody().setStyle('background', '#fff');
                //Ext.getBody().setStyle('opacity', 0);

                //// fade in
                //Ext.defer( function() {
                    //Ext.getBody().fadeIn({
                        //duration: 600
                    //});
                //}, 300 );
            }
        }
    }));
};
