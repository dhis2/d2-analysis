import {isString, isNumber, isObject, arrayContains, arrayFrom} from 'd2-utilizr';

export var PeriodTab;

PeriodTab = function() {
    var t = PeriodTab,
        appManager = t.appManager,
        calendarManager = t.calendarManager,
        uiManager = t.uiManager,
        i18nManager = t.i18nManager,
        dimensionConfig = t.dimensionConfig,
        periodConfig = t.periodConfig,
        uiConfig = t.uiConfig,

        i18n = i18nManager.get(),
        thisObjectName = dimensionConfig.get('period').objectName;

    var checkboxes = [];

    // components
    var periodTypeStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        data: periodConfig.getPeriodTypeRecords()
    });

    var fixedPeriodAvailableStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'index'],
        data: [],
        setIndex: function(periods) {
            for (var i = 0; i < periods.length; i++) {
                periods[i].index = i;
            }
        },
        sortStore: function() {
            this.sort('index', 'ASC');
        }
    });

    var fixedPeriodSelectedStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        data: []
    });

    var rewind = Ext.create('Ext.form.field.Checkbox', {
        relativePeriodId: 'rewind',
        boxLabel: i18n['rewind_one_period'],
        xable: function() {
            this.setDisabled(period.isNoRelativePeriods());
        }
    });

    var relativePeriodDefaults = {
        labelSeparator: '',
        style: 'margin-bottom:0',
        listeners: {
            added: function(chb) {
                if (chb.xtype === 'checkbox') {
                    checkboxes.push(chb);
                    relativePeriod.valueComponentMap[chb.relativePeriodId] = chb;

                    if (chb.relativePeriodId === appManager.getRelativePeriod()) {
                        chb.setValue(true);
                    }
                }
            }
        }
    };

    var relativePeriod = {
        xtype: 'panel',
        layout: 'column',
        hideCollapseTool: true,
        autoScroll: true,
        bodyStyle: 'border:0 none',
        valueComponentMap: {},
        items: [
            {
                xtype: 'container',
                columnWidth: 0.34,
                bodyStyle: 'border-style:none',
                items: [
                    {
                        xtype: 'panel',
                        //columnWidth: 0.34,
                        bodyStyle: 'border-style:none; padding:0 0 0 8px',
                        defaults: relativePeriodDefaults,
                        items: [
                            {
                                xtype: 'label',
                                text: i18n['weeks'],
                                cls: 'ns-label-period-heading'
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'THIS_WEEK',
                                boxLabel: i18n['this_week']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_WEEK',
                                boxLabel: i18n['last_week']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_4_WEEKS',
                                boxLabel: i18n['last_4_weeks']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_12_WEEKS',
                                boxLabel: i18n['last_12_weeks']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_52_WEEKS',
                                boxLabel: i18n['last_52_weeks']
                            }
                        ]
                    },
                    {
                        xtype: 'panel',
                        //columnWidth: 0.34,
                        bodyStyle: 'border-style:none; padding:5px 0 0 8px',
                        defaults: relativePeriodDefaults,
                        items: [
                            {
                                xtype: 'label',
                                text: i18n['quarters'],
                                cls: 'ns-label-period-heading'
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'THIS_QUARTER',
                                boxLabel: i18n['this_quarter']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_QUARTER',
                                boxLabel: i18n['last_quarter']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_4_QUARTERS',
                                boxLabel: i18n['last_4_quarters']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'QUARTERS_THIS_YEAR',
                                boxLabel: i18n['quarters_this_year']
                            }
                        ]
                    },
                    {
                        xtype: 'panel',
                        //columnWidth: 0.35,
                        bodyStyle: 'border-style:none; padding:5px 0 0 8px',
                        defaults: relativePeriodDefaults,
                        items: [
                            {
                                xtype: 'label',
                                text: i18n['years'],
                                cls: 'ns-label-period-heading'
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'THIS_YEAR',
                                boxLabel: i18n['this_year']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_YEAR',
                                boxLabel: i18n['last_year']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_5_YEARS',
                                boxLabel: i18n['last_5_years']
                            }
                        ]
                    }
                ]
            },
            {
                xtype: 'container',
                columnWidth: 0.33,
                bodyStyle: 'border-style:none',
                items: [
                    {
                        xtype: 'panel',
                        //columnWidth: 0.33,
                        bodyStyle: 'border-style:none',
                        defaults: relativePeriodDefaults,
                        items: [
                            {
                                xtype: 'label',
                                text: i18n['months'],
                                cls: 'ns-label-period-heading'
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'THIS_MONTH',
                                boxLabel: i18n['this_month']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_MONTH',
                                boxLabel: i18n['last_month']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_3_MONTHS',
                                boxLabel: i18n['last_3_months']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_6_MONTHS',
                                boxLabel: i18n['last_6_months']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_12_MONTHS',
                                boxLabel: i18n['last_12_months']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'MONTHS_THIS_YEAR',
                                boxLabel: i18n['months_this_year']
                            }
                        ]
                    },
                    {
                        xtype: 'panel',
                        //columnWidth: 0.33,
                        bodyStyle: 'border-style:none; padding:5px 0 0',
                        defaults: relativePeriodDefaults,
                        items: [
                            {
                                xtype: 'label',
                                text: i18n['sixmonths'],
                                cls: 'ns-label-period-heading'
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'THIS_SIX_MONTH',
                                boxLabel: i18n['this_sixmonth']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_SIX_MONTH',
                                boxLabel: i18n['last_sixmonth']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_2_SIXMONTHS',
                                boxLabel: i18n['last_2_sixmonths']
                            }
                        ]
                    }
                ]
            },
            {
                xtype: 'container',
                columnWidth: 0.33,
                bodyStyle: 'border-style:none',
                items: [
                    {
                        xtype: 'panel',
                        //columnWidth: 0.33,
                        bodyStyle: 'border-style:none',
                        style: 'margin-bottom: 32px',
                        defaults: relativePeriodDefaults,
                        items: [
                            {
                                xtype: 'label',
                                text: i18n['bimonths'],
                                cls: 'ns-label-period-heading'
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'THIS_BIMONTH',
                                boxLabel: i18n['this_bimonth']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_BIMONTH',
                                boxLabel: i18n['last_bimonth']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_6_BIMONTHS',
                                boxLabel: i18n['last_6_bimonths']
                            }
                        ]
                    },
                    {
                        xtype: 'panel',
                        //columnWidth: 0.33,
                        bodyStyle: 'border-style:none; padding:5px 0 0',
                        defaults: relativePeriodDefaults,
                        items: [
                            {
                                xtype: 'label',
                                text: i18n['financial_years'],
                                cls: 'ns-label-period-heading'
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'THIS_FINANCIAL_YEAR',
                                boxLabel: i18n['this_financial_year']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_FINANCIAL_YEAR',
                                boxLabel: i18n['last_financial_year']
                            },
                            {
                                xtype: 'checkbox',
                                relativePeriodId: 'LAST_5_FINANCIAL_YEARS',
                                boxLabel: i18n['last_5_financial_years']
                            }
                        ]
                    }
                ]
            }
        ]
    };

    var fixedPeriodAvailable = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-left',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        height: 180,
        valueField: 'id',
        displayField: 'name',
        store: fixedPeriodAvailableStore,
        tbar: [
            {
                xtype: 'label',
                text: i18n['available'],
                cls: 'ns-toolbar-multiselect-left-label'
            },
            '->',
            {
                xtype: 'button',
                icon: 'images/arrowright.png',
                width: 22,
                handler: function() {
                    uiManager.msSelect(fixedPeriodAvailable, fixedPeriodSelected);
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowrightdouble.png',
                width: 22,
                handler: function() {
                    uiManager.msSelectAll(fixedPeriodAvailable, fixedPeriodSelected, true);
                }
            },
            ' '
        ],
        listeners: {
            afterrender: function() {
                this.boundList.on('itemdblclick', function() {
                    uiManager.msSelect(fixedPeriodAvailable, fixedPeriodSelected);
                }, this);
            }
        }
    });

    var fixedPeriodSelected = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-right',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        height: 180,
        valueField: 'id',
        displayField: 'name',
        ddReorder: true,
        store: fixedPeriodSelectedStore,
        tbar: [
            ' ',
            {
                xtype: 'button',
                icon: 'images/arrowleftdouble.png',
                width: 22,
                handler: function() {
                    uiManager.msUnselectAll(fixedPeriodAvailable, fixedPeriodSelected);
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowleft.png',
                width: 22,
                handler: function() {
                    uiManager.msUnselect(fixedPeriodAvailable, fixedPeriodSelected);
                }
            },
            '->',
            {
                xtype: 'label',
                text: i18n['selected'],
                cls: 'ns-toolbar-multiselect-right-label'
            }
        ],
        listeners: {
            afterrender: function() {
                this.boundList.on('itemdblclick', function() {
                    uiManager.msUnselect(fixedPeriodAvailable, fixedPeriodSelected);
                }, this);
            }
        }
    });

    var onPeriodTypeSelect = function() {
        var type = periodType.getValue(),
            periodOffset = periodType.periodOffset,
            gen = calendarManager.periodGenerator,
            periods = gen.generateReversedPeriods(type, type === 'Yearly' ? periodOffset - 5 : periodOffset);

        for (var i = 0; i < periods.length; i++) {
            periods[i].id = periods[i].iso;
        }

        fixedPeriodAvailableStore.setIndex(periods);
        fixedPeriodAvailableStore.loadData(periods);
        uiManager.msFilterAvailable(fixedPeriodAvailable, fixedPeriodSelected);
    };

    var periodType = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:1px',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding - 62 - 62 - 2,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n['select_period_type'],
        editable: false,
        queryMode: 'remote',
        store: periodTypeStore,
        periodOffset: 0,
        listeners: {
            select: function() {
                periodType.periodOffset = 0;
                onPeriodTypeSelect();
            }
        }
    });

    $.extend(this, Ext.create('Ext.panel.Panel', {
        title: '<div class="ns-panel-title-period">Periods</div>',
        hideCollapseTool: true,
        dimension: thisObjectName,
        checkboxes: checkboxes,
        getDimension: function() {
            var config = {
                    dimension: thisObjectName,
                    items: []
                };

            fixedPeriodSelectedStore.each( function(r) {
                config.items.push({
                    id: r.data.id,
                    name: r.data.name
                });
            });

            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].getValue()) {
                    config.items.push({
                        id: checkboxes[i].relativePeriodId,
                        name: ''
                    });
                }
            }

            return config.items.length ? config : null;
        },
        onExpand: function() {
            var ui = uiManager.getUi(),
                accordionHeight = ui.westRegion.hasScrollbar ? uiConfig.west_scrollbarheight_accordion_indicator : uiConfig.west_maxheight_accordion_indicator;

            ui.menuAccordion.setThisHeight(accordionHeight);

            uiManager.msSetHeight(
                [fixedPeriodAvailable, fixedPeriodSelected],
                this,
                uiConfig.west_fill_accordion_period
            );
        },
        resetRelativePeriods: function() {
            var a = checkboxes;
            for (var i = 0; i < a.length; i++) {
                a[i].setValue(false);
            }
        },
        isNoRelativePeriods: function() {
            var a = checkboxes;
            for (var i = 0; i < a.length; i++) {
                if (a[i].getValue()) {
                    return false;
                }
            }
            return true;
        },
        items: [
            {
                xtype: 'panel',
                layout: 'column',
                bodyStyle: 'border-style:none',
                style: 'margin-top:0px',
                items: [
                    periodType,
                    {
                        xtype: 'button',
                        text: i18n['prev_year'],
                        style: 'margin-left:1px; border-radius:2px',
                        height: 24,
                        width: 62,
                        handler: function() {
                            if (periodType.getValue()) {
                                periodType.periodOffset--;
                                onPeriodTypeSelect();
                            }
                        }
                    },
                    {
                        xtype: 'button',
                        text: i18n['next_year'],
                        style: 'margin-left:1px; border-radius:2px',
                        height: 24,
                        width: 62,
                        handler: function() {
                            if (periodType.getValue()) {
                                periodType.periodOffset++;
                                onPeriodTypeSelect();
                            }
                        }
                    }
                ]
            },
            {
                xtype: 'panel',
                layout: 'column',
                bodyStyle: 'border-style:none; padding-bottom:2px',
                items: [
                    fixedPeriodAvailable,
                    fixedPeriodSelected
                ]
            },
            relativePeriod
        ],
        listeners: {
            added: function() {
                //accordionPanels.push(this);
            },
            expand: function(p) {
                p.onExpand();
            }
        }
    }));
};
