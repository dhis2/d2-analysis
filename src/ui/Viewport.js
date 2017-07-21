import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isObject from 'd2-utilizr/lib/isObject';
import isIE from 'd2-utilizr/lib/isIE';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arraySort from 'd2-utilizr/lib/arraySort';
import clone from 'd2-utilizr/lib/clone';

import {FavoriteWindow} from './FavoriteWindow.js';
import {InterpretationItem} from './InterpretationItem.js';
import {PluginItem} from './PluginItem.js';
import {FavoriteButton} from './FavoriteButton.js';
import {EmbedButton} from './EmbedButton.js';
import {EastRegion} from './EastRegion.js';
import {LayoutButton} from './LayoutButton.js';
import {OptionsButton} from './OptionsButton.js';

export var Viewport;

Viewport = function(refs, cmp, config) {
    var uiManager = refs.uiManager,
        appManager = refs.appManager,
        i18nManager = refs.i18nManager,
        sessionStorageManager = refs.sessionStorageManager,
        instanceManager = refs.instanceManager,
        calendarManager = refs.calendarManager,
        dimensionConfig = refs.dimensionConfig,
        periodConfig = refs.periodConfig,
        uiConfig = refs.uiConfig,
        optionConfig = refs.optionConfig,
        api = refs.api,

        apiPath = appManager.getApiPath(),
        i18n = i18nManager.get(),

        dataObjectName = dimensionConfig.get('data').objectName,
        indicatorObjectName = dimensionConfig.get('indicator').objectName,
        dataElementObjectName = dimensionConfig.get('dataElement').objectName,
        operandObjectName = dimensionConfig.get('operand').objectName,
        dataSetObjectName = dimensionConfig.get('dataSet').objectName,
        eventDataItemObjectName = dimensionConfig.get('eventDataItem').objectName,
        programIndicatorObjectName = dimensionConfig.get('programIndicator').objectName,
        periodObjectName = dimensionConfig.get('period').objectName,
        organisationUnitObjectName = dimensionConfig.get('organisationUnit').objectName,

        treePanel = uiManager.get('treePanel'),
        layoutWindow = uiManager.get('layoutWindow'),
        optionsWindow = uiManager.get('optionsWindow'),
        favoriteWindow = uiManager.get('favoriteWindow'),

        displayProperty = appManager.getDisplayProperty(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl(),

        dimensionPanelMap = {};

    cmp = cmp || {};

    var northRegion = cmp.northRegion;

    var eastRegion = cmp.eastRegion;

    var westRegionItems = cmp.westRegionItems;

    var chartTypeToolbar = cmp.chartTypeToolbar;

    var getChartType = () => chartTypeToolbar ? chartTypeToolbar.getChartType() : null;

    var dataTypeToolbar = cmp.dataTypeToolbar;

    var getDataType = () => dataTypeToolbar ? dataTypeToolbar.getDataType() : null;

    var statusBar = cmp.statusBar;

    var favoriteButton = uiManager.reg(FavoriteButton(refs), 'favoriteButton');

    var layoutButton = uiManager.reg(LayoutButton(refs), 'layoutButton');

    var optionsButton = uiManager.reg(OptionsButton(refs), 'optionsButton');

    var embedButton = uiManager.reg(EmbedButton(refs), 'embedButton', 'onCurrent');

    var integrationButtons = cmp.integrationButtons;

    var DownloadButtonItems = cmp.DownloadButtonItems;

    // viewport

    //var accordionBody = Ext.create('Ext.panel.Panel', {
        //layout: 'accordion',
        //activeOnTop: true,
        //cls: 'ns-accordion',
        //bodyStyle: 'border:0 none; margin-bottom:2px',
        //height: 700,
        //dimensionPanels: null,
        //items: westRegionItems
    //});
    //uiManager.reg(accordionBody, 'accordionBody');

    //var accordion = Ext.create('Ext.panel.Panel', {
        //bodyStyle: 'border-style:none; border-top:1px solid #d6d6d6; padding:1px; padding-bottom:0; overflow-y:scroll;',
        //items: accordionBody,
        //setThisHeight: function(mx) {
            //var panelHeight = westRegionItems.length * 28,
                //height;

            //if (westRegion.hasScrollbar) {
                //height = panelHeight + mx;
                //this.setHeight(westRegion.getHeight() - 2);
                //accordionBody.setHeight(height - 2);
            //}
            //else {
                //height = westRegion.getHeight() - uiConfig.west_fill;
                //mx += panelHeight;
                //accordion.setHeight((height > mx ? mx : height) - 2);
                //accordionBody.setHeight((height > mx ? mx : height) - 4);
            //}
        //},
        //getExpandedPanel: function() {
            //for (var i = 0, panel; i < westRegionItems.length; i++) {
                //if (!westRegionItems[i].collapsed) {
                    //return westRegionItems[i];
                //}
            //}

            //return null;
        //},
        //getFirstPanel: function() {
            //return accordionBody.items.items[0];
        //}
    //});
    //uiManager.reg(accordion, 'accordion');

    var westRegion = Ext.create('Ext.panel.Panel', {
        region: 'west',
        preventHeader: true,
        collapsible: true,
        collapseMode: 'mini',
        border: false,
        hasScrollbar: false,
        hasChartTypeToolbar: function() {
            return !!chartTypeToolbar;
        },
        width: uiConfig.west_width + uiManager.getScrollbarSize().width,
        items: arrayClean([chartTypeToolbar, dataTypeToolbar, westRegionItems]),
        onScrollbar: function() {
            this.hasScrollbar = true;

            if (dataTypeToolbar) {
                dataTypeToolbar.setButtonWidth(uiManager.getScrollbarSize().width, true);
            }
        },
        setState: function(layout) {
            westRegionItems.setUiState(layout);
        }
    });
    uiManager.reg(westRegion, 'westRegion');

    var updateButton = Ext.create('Ext.button.Split', {
        text: '<b>' + i18n.update + '</b>&nbsp;',
        handler: function() {
            instanceManager.getReport();
        },
        arrowHandler: function(b) {
            b.menu = Ext.create('Ext.menu.Menu', {
                closeAction: 'destroy',
                shadow: false,
                showSeparator: false,
                items: [
                    {
                        xtype: 'label',
                        text: i18n.download_data,
                        style: 'padding:7px 40px 5px 7px; font-weight:bold; color:#111; border:0 none'
                    },
                    {
                        text: 'CSV',
                        iconCls: 'ns-menu-item-datasource',
                        handler: function() {
                            uiManager.openDataDump(null, 'csv');
                        }
                    }
                ],
                listeners: {
                    show: function() {
                        uiManager.setAnchorPosition(b.menu, b);
                    },
                    hide: function() {
                        b.menu.destroy();
                    },
                    destroy: function(m) {
                        b.menu = null;
                    }
                }
            });

            this.menu.show();
        }
    });
    uiManager.reg(updateButton, 'updateButton');

    var downloadButton = Ext.create('Ext.button.Button', {
        text: i18n.download,
        disabled: true,
        menu: {},
        handler: function(b) {
            b.menu = Ext.create('Ext.menu.Menu', {
                closeAction: 'destroy',
                shadow: false,
                showSeparator: false,
                items: function() {
                    var layout = instanceManager.getStateCurrent();

                    var jsonReq = layout.req();
                    var xmlReq = layout.req(null, 'xml');
                    var xlsReq = layout.req(null, 'xls');
                    var csvReq = layout.req(null, 'csv');
                    var jrxmlReq = layout.req(null, 'jrxml');
                    var sqlReq = layout.req('/analytics/debug/sql', 'sql');
                    var dataValueSetJsonReq = layout.req('/analytics/dataValueSet', 'json', null, null, true);
                    var dataValueSetXmlReq = layout.req('/analytics/dataValueSet', 'xml', null, null, true);

                    var items = [
                        ...DownloadButtonItems(refs),
                        {
                            xtype: 'menuseparator'
                        },
                        {
                            xtype: 'label',
                            text: i18n.plain_data_sources,
                            style: 'padding:7px 5px 5px 7px; font-weight:bold'
                        },
                        {
                            text: 'JSON',
                            iconCls: 'ns-menu-item-datasource',
                            handler: function() {
                                uiManager.openPlainDataSource(jsonReq, null, true);
                            },
                            menu: [
                                {
                                    xtype: 'label',
                                    text: i18n.metadata_id_scheme,
                                    style: 'padding:7px 18px 5px 7px; font-weight:bold; color:#333'
                                },
                                {
                                    text: 'ID',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(jsonReq, '&outputIdScheme=UID', true);
                                    }
                                },
                                {
                                    text: 'Code',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(jsonReq, '&outputIdScheme=CODE', true);
                                    }
                                },
                                {
                                    text: 'Name',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(jsonReq, '&outputIdScheme=NAME', true);
                                    }
                                }
                            ]
                        },
                        {
                            text: 'XML',
                            iconCls: 'ns-menu-item-datasource',
                            handler: function() {
                                uiManager.openPlainDataSource(xmlReq, null, true);
                            },
                            menu: [
                                {
                                    xtype: 'label',
                                    text: i18n.metadata_id_scheme,
                                    style: 'padding:7px 18px 5px 7px; font-weight:bold; color:#333'
                                },
                                {
                                    text: 'ID',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(xmlReq, '&outputIdScheme=UID', true);
                                    }
                                },
                                {
                                    text: 'Code',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(xmlReq, '&outputIdScheme=CODE', true);
                                    }
                                },
                                {
                                    text: 'Name',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(xmlReq, '&outputIdScheme=NAME', true);
                                    }
                                }
                            ]
                        },
                        {
                            text: 'Microsoft Excel',
                            iconCls: 'ns-menu-item-datasource',
                            handler: function() {
                                uiManager.openPlainDataSource(xlsReq);
                            },
                            menu: [
                                {
                                    xtype: 'label',
                                    text: i18n.metadata_id_scheme,
                                    style: 'padding:7px 18px 5px 7px; font-weight:bold; color:#333'
                                },
                                {
                                    text: 'ID',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(xlsReq, '&outputIdScheme=UID');
                                    }
                                },
                                {
                                    text: 'Code',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(xlsReq, '&outputIdScheme=CODE');
                                    }
                                },
                                {
                                    text: 'Name',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(xlsReq, '&outputIdScheme=NAME');
                                    }
                                }
                            ]
                        },
                        {
                            text: 'CSV',
                            iconCls: 'ns-menu-item-datasource',
                            handler: function() {
                                uiManager.openPlainDataSource(csvReq);
                            },
                            menu: [
                                {
                                    xtype: 'label',
                                    text: i18n.metadata_id_scheme,
                                    style: 'padding:7px 18px 5px 7px; font-weight:bold; color:#333'
                                },
                                {
                                    text: 'ID',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(csvReq, '&outputIdScheme=UID');
                                    }
                                },
                                {
                                    text: 'Code',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(csvReq, '&outputIdScheme=CODE');
                                    }
                                },
                                {
                                    text: 'Name',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        uiManager.openPlainDataSource(csvReq, '&outputIdScheme=NAME');
                                    }
                                }
                            ]
                        },
                        {
                            text: i18n.advanced,
                            iconCls: 'ns-menu-item-advanced',
                            menu: [
                                {
                                    xtype: 'label',
                                    text: i18n.data_value_set,
                                    style: 'padding:7px 18px 5px 7px; font-weight:bold; color:#333'
                                },
                                {
                                    text: 'JSON',
                                    iconCls: 'ns-menu-item-datasource',
                                    handler: function() {
                                        uiManager.openPlainDataSource(dataValueSetJsonReq, null, true);
                                    }
                                },
                                {
                                    text: 'XML',
                                    iconCls: 'ns-menu-item-datasource',
                                    handler: function() {
                                        uiManager.openPlainDataSource(dataValueSetXmlReq, null, true);
                                    }
                                },
                                {
                                    xtype: 'menuseparator'
                                },
                                {
                                    xtype: 'label',
                                    text: i18n.other_formats,
                                    style: 'padding:7px 18px 5px 7px; font-weight:bold; color:#333'
                                },
                                {
                                    text: 'JRXML',
                                    iconCls: 'ns-menu-item-datasource',
                                    handler: function() {
                                        uiManager.openPlainDataSource(jrxmlReq, null, true);
                                    }
                                },
                                {
                                    text: i18n.raw_data + ' SQL',
                                    iconCls: 'ns-menu-item-datasource',
                                    handler: function() {
                                        uiManager.openPlainDataSource(sqlReq, null, true);
                                    }
                                }
                            ]
                        }
                    ];

                    if (layout && !!layout.showHierarchy && layout.hasDimension('ou')) {
                        items.push({
                            xtype: 'label',
                            text: i18n.plain_data_sources + ' w/ hierarchy',
                            style: 'padding:7px 8px 5px 7px; font-weight:bold'
                        });

                        items.push({
                            text: 'CSV',
                            iconCls: 'ns-menu-item-datasource',
                            handler: function() {
                                layout.getResponse().clone().addOuHierarchyDimensions().printResponseCSV();
                            }
                        });
                    }

                    return items;
                }(),
                listeners: {
                    show: function() {
                        uiManager.setAnchorPosition(b.menu, b);
                    },
                    hide: function() {
                        b.menu.destroy();
                    },
                    destroy: function(m) {
                        b.menu = null;
                    }
                }
            });

            this.menu.show();
        }
    });
    uiManager.reg(downloadButton, 'downloadButton', 'onCurrent');

    var defaultButton = Ext.create('Ext.button.Button', {
        text: i18n.table,
        iconCls: 'ns-button-icon-table',
        toggleGroup: 'module',
        pressed: true
    });

    var centerRegion = Ext.create('Ext.panel.Panel', {
        region: 'center',
        bodyStyle: 'padding:1px',
        autoScroll: true,
        fullSize: true,
        cmp: [defaultButton],
        toggleCmp: function(show) {
            integrationButtons.forEach(function(cmp) {
                if (cmp && cmp.show && cmp.hide) {
                    if (show) {
                        cmp.show();
                    }
                    else {
                        cmp.hide();
                    }
                }
            });
        },
        subscribed: [],
        subscribe: function(fn) {
            this.subscribed.push(fn);
        },
        renew: function(html) {
            this.update(html);
            this.subscribed.forEach(fn => {
                fn();
            });
        },
        setScroll: function(fn) {
            this.onScroll = fn;
        },
        setSidePanelsUIState: function(favoriteId, interpretationId) {
            // If there is an interpretation loaded, collapse left panel and expand right panel
            if (interpretationId) {
                Ext.getCmp('toggleEastRegionButton').handler();
                Ext.getCmp('toggleWestRegionButton').handler();

                if (favoriteId && interpretationId == "new") {
                    eastRegion.openInterpretationWindow(favoriteId);
                }
            }
        },
        scrollTo: function(x, y) {
            this.body.scrollTo(x, y);
        },
        onScroll: Function.prototype,
        tbar: {
            defaults: {
                height: 26
            },
            items: [
                {
                    id: "toggleWestRegionButton",
                    text: ' ',
                    width: 26,
                    padding: '3',
                    iconCls: 'ns-button-icon-arrowlefttriple',
                    iconClsLeft: 'ns-button-icon-arrowlefttriple',
                    iconClsRight: 'ns-button-icon-arrowrighttriple',
                    iconState: 0,
                    setIconState: function() {
                        this.setIconCls(this.iconState++ % 2 ? this.iconClsLeft : this.iconClsRight);
                    },
                    handler: function(b) {
                        westRegion.toggleCollapse();
                        this.setIconState();
                    }
                },
                ' ',
                updateButton,
                favoriteButton,
                {
                    xtype: 'tbseparator',
                    height: 24,
                    style: 'border-color:transparent; border-right-color:#d1d1d1; margin-right:4px',
                },
                layoutButton,
                optionsButton,
                {
                    xtype: 'tbseparator',
                    height: 24,
                    style: 'border-color:transparent; border-right-color:#d1d1d1; margin-right:4px',
                },
                downloadButton,
                embedButton,
                '->',
                ...integrationButtons,
                {
                    id: "toggleEastRegionButton",
                    text: ' ',
                    width: 26,
                    padding: '3',
                    iconCls: 'ns-button-icon-arrowlefttriple',
                    iconClsLeft: 'ns-button-icon-arrowlefttriple',
                    iconClsRight: 'ns-button-icon-arrowrighttriple',
                    iconState: 1,
                    setIconState: function() {
                        this.setIconCls(this.iconState++ % 2 ? this.iconClsRight : this.iconClsLeft);
                    },
                    handler: function(b) {
                        eastRegion.toggleCollapse();
                        this.setIconState();
                    }
                }
            ]
        },
        bbar: statusBar,
        listeners: {
            afterrender: function(p) {
                p.update(uiManager.getIntroHtml());
            },
            render: function(p) {
                p.body.on('scroll', function(e){
                    this.onScroll(e.target.scrollLeft, e.target.scrollTop);
                }, p);
            }
        }
    });
    uiManager.reg(centerRegion, 'centerRegion');

    var setUiState = function(layout) {
        westRegion.setUiState(layout);
    };

    var getUiState = function() {
        var viewport = uiManager.get('viewport'),
            accordion = uiManager.get('accordion');

        var layoutWindow = viewport.getLayoutWindow(),
            optionsWindow = viewport.getOptionsWindow(),
            chartType = getChartType(),
            dataType = getDataType();

        var config = Object.assign({}, accordion.getUiState(layoutWindow, optionsWindow), optionsWindow.getOptions());

        if (chartType) {
            config.type = chartType;
        }

        if (dataType) {
            config.dataType = dataType;
        }

        return config;
    };

    var viewport = Ext.create('Ext.container.Viewport', {
        layout: 'border',
        getUiState: getUiState,
        setUiState: setUiState,
        westRegion: westRegion,
        eastRegion: eastRegion,
        centerRegion: centerRegion,
        northRegion: northRegion,
        items: arrayClean([eastRegion, westRegion, centerRegion, northRegion]),
        getLayoutWindow: null,
        getOptionsWindow: null,
        ...config,
        listeners: {
            afterrender: function() {

                // west resize
                westRegion.on('resize', function() {
                    var panel = westRegionItems.getExpandedPanel();

                    if (panel) {
                        panel.onExpand();
                    }
                });

                // update cmp resize
                uiManager.getUpdateComponent().on('resize', function(cmp, width, height, eOpts) {
                    uiManager.resize({
                        cmp: cmp,
                        width: width,
                        height: height,
                        eOpts: eOpts
                    });
                });

                uiManager.onResize(function(cmp, width) {
                    if (width < 700 && cmp.fullSize) {
                        cmp.toggleCmp();
                        cmp.fullSize = false;
                    }
                    else if (width >= 700 && !cmp.fullSize) {
                        cmp.toggleCmp(true);
                        cmp.fullSize = true;
                    }
                });

                // left gui
                var viewportHeight = uiManager.getHeight(),
                    numberOfTabs = appManager.dimensions.length + 3,
                    tabHeight = 28,
                    minPeriodHeight = 380;

                if (viewportHeight > numberOfTabs * tabHeight + minPeriodHeight) {
                    if (!isIE) {
                        accordion.setAutoScroll(false);
                        //westRegion.setWidth(uiConfig.west_width + 100);
                        accordion.doLayout();
                    }
                }
                else {
                    westRegion.onScrollbar();
                }

                // north
                if (northRegion) {
                    northRegion.setLogoWidth(centerRegion.getPosition()[0]);
                }

                // expand to make sure treepanel is rendered
                uiManager.get('organisationUnit').expand();
                uiManager.get('data').expand();

                // look for url params
                var id = appManager.getUrlParam('id'),
                    session = appManager.getUrlParam('s'),
                    interpretationId = appManager.getUrlParam('interpretationid'),
                    layout;

                if (id) {
                    if (interpretationId && interpretationId != "new") {
                        instanceManager.getById(id, function(layout) {
                            instanceManager.getInterpretationById(interpretationId, function(interpretation) {
                                uiManager.updateInterpretation(interpretation, layout);
                            });
                        });
                    }
                    else {
                        instanceManager.getById(id);
                    }
                }
                else if (isString(session) && sessionStorageManager.get(session)) {
                    layout = new api.Layout(refs, sessionStorageManager.get(session)).val();

                    if (layout) {
                        instanceManager.getReport(layout, false, false, true);
                    }
                }

                var initEl = document.getElementById('init');
                initEl.parentNode.removeChild(initEl);

                Ext.getBody().setStyle('background', '#fff');
                Ext.getBody().setStyle('opacity', 0);

                centerRegion.setSidePanelsUIState(id, interpretationId);

                // fade in
                Ext.defer( function() {
                    Ext.getBody().fadeIn({
                        duration: 600
                    });
                }, 300 );
            }
        }
    });

    return viewport;
};
