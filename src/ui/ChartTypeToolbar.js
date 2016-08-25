export var ChartTypeToolbar;

ChartTypeToolbar = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,

        i18n = c.i18nManager.get(),
        dimensionConfig = c.dimensionConfig,

        confData = dimensionConfig.get('data'),
        confPeriod = dimensionConfig.get('period'),
        confOrganisationUnit = dimensionConfig.get('organisationUnit'),
        confCategory = dimensionConfig.get('category'),

        chartConf = c.chartConfig,

        i18n = c.i18nManager.get(),
        path = appManager.getPath(),

        buttons = [];


    var buttonAddedListener = function(b) {
            buttons.push(b);
        };

    var column = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.column,
        icon: 'src/images/column.png',
        name: chartConf.client.column,
        tooltipText: i18n.column_chart,
        pressed: true,
        listeners: {
            added: buttonAddedListener
        }
    });

    var stackedcolumn = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.stackedcolumn,
        icon: 'src/images/column-stacked.png',
        name: chartConf.client.stackedcolumn,
        tooltipText: i18n.stacked_column_chart,
        listeners: {
            added: buttonAddedListener
        }
    });

    var bar = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.bar,
        icon: 'src/images/bar.png',
        name: chartConf.client.bar,
        tooltipText: i18n.bar_chart,
        listeners: {
            added: buttonAddedListener
        }
    });

    var stackedbar = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.stackedbar,
        icon: 'src/images/bar-stacked.png',
        name: chartConf.client.stackedbar,
        tooltipText: i18n.stacked_bar_chart,
        listeners: {
            added: buttonAddedListener
        }
    });

    var line = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.line,
        icon: 'src/images/line.png',
        name: chartConf.client.line,
        tooltipText: i18n.line_chart,
        listeners: {
            added: buttonAddedListener
        }
    });

    var area = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.area,
        icon: 'src/images/area.png',
        name: chartConf.client.area,
        tooltipText: i18n.area_chart,
        listeners: {
            added: buttonAddedListener
        }
    });

    var pie = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.pie,
        icon: 'src/images/pie.png',
        name: chartConf.client.pie,
        tooltipText: i18n.pie_chart,
        listeners: {
            added: buttonAddedListener
        }
    });

    var radar = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.radar,
        icon: 'src/images/radar.png',
        name: chartConf.client.radar,
        tooltipText: i18n.radar_chart,
        listeners: {
            added: buttonAddedListener
        }
    });

    var gauge = Ext.create('Ext.button.Button', {
        xtype: 'button',
        chartType: chartConf.client.gauge,
        icon: 'src/images/gauge.png',
        name: chartConf.client.gauge,
        tooltipText: i18n.meter_chart,
        listeners: {
            added: buttonAddedListener
        }
    });

    var chartType = Ext.create('Ext.toolbar.Toolbar', {
        height: 45,
        style: 'padding-top:1px; border:0 none; border-top:1px solid #dadada',
        reset: function() {
            this.setChartType();
        },
        getChartType: function() {
            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].pressed) {
                    return buttons[i].chartType;
                }
            }
        },
        setChartType: function(type) {
            if (!type) {
                buttons[0].toggle(true);
                return;
            }

            for (var i = 0; i < buttons.length; i++) {
                if (buttons[i].chartType === type) {
                    buttons[i].toggle(true);
                }
            }
        },
        defaults: {
            height: 40,
            toggleGroup: 'charttype',
            handler: function(b) {
                if (!b.pressed) {
                    b.toggle();
                }
            },
            listeners: {
                afterrender: function(b) {
                    if (b.xtype === 'button') {
                        Ext.create('Ext.tip.ToolTip', {
                            target: b.getEl(),
                            html: b.tooltipText,
                            'anchor': 'bottom'
                        });
                    }
                }
            }
        },
        items: [
            {
                xtype: 'label',
                text: i18n.type,
                style: 'font-size:11px; font-weight:bold; padding:13px 8px 0 6px'
            },
            column,
            stackedcolumn,
            bar,
            stackedbar,
            line,
            area,
            pie,
            radar,
            gauge
        ]
    });

    return chartType;
};
