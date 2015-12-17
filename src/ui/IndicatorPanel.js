import {isString, isNumber, arrayContains, arrayFrom} from 'd2-utilizr';

export var IndicatorPanel;

IndicatorPanel = function(config) {
    var t = this
        appManager = IndicatorPanel.appManager,
        i18nManager = IndicatorPanel.i18nManager,
        dimensionConfig = IndicatorPanel.dimensionConfig,
        uiConfig = IndicatorPanel.uiConfig;

    config = isObject(config) ? config : {};

    var tab = config.tab,
        path = appManager.getPath(),
        i18n = i18nManager.get(),
        objectName = dimensionConfig.get('indicator').objectName,
        selectedStore = parentTab.getSelectedStore();

    var indicatorAvailableStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        lastPage: null,
        nextPage: 1,
        isPending: false,
        reset: function() {
            this.removeAll();
            this.lastPage = null;
            this.nextPage = 1;
            this.isPending = false;
            indicatorSearch.hideFilter();
        },
        loadDataAndUpdate: function(data, append) {
            this.clearFilter(); // work around
            this.loadData(data, append);
            this.updateFilter();
        },
        getRecordsByIds: function(ids) {
            var records = [];

            ids = arrayFrom(ids);

            for (var i = 0, index; i < ids.length; i++) {
                index = this.findExact('id', ids[i]);

                if (index !== -1) {
                    records.push(this.getAt(index));
                }
            }

            return records;
        },
        updateFilter: function() {
            var selectedStoreIds = selectedStore.getIds();

            this.clearFilter();

            this.filterBy(function(record) {
                return !arrayContains(selectedStoreIds, record.data.id);
            });
        },
        loadPage: function(uid, filter, append, noPaging, fn) {
            var store = this,
                params = {},
                url;

            uid = (isString(uid) || isNumber(uid)) ? uid : indicatorGroup.getValue();
            filter = filter || indicatorFilter.getValue() || null;

            if (!append) {
                this.lastPage = null;
                this.nextPage = 1;
            }

            if (store.nextPage === store.lastPage) {
                return;
            }

            if (isString(uid)) {
                url = '/indicators.json?fields=dimensionItem|rename(id),' + namePropertyUrl + '&filter=indicatorGroups.id:eq:' + uid + (filter ? '&filter=' + nameProperty + ':ilike:' + filter : '');
            }
            else if (uid === 0) {
                url = '/indicators.json?fields=dimensionItem|rename(id),' + namePropertyUrl + '' + (filter ? '&filter=' + nameProperty + ':ilike:' + filter : '');
            }

            if (!url) {
                return;
            }

            if (noPaging) {
                params.paging = false;
            }
            else {
                params.page = store.nextPage;
                params.pageSize = 50;
            }

            store.isPending = true;
            ns.core.web.mask.show(indicatorAvailable.boundList);

            $.getJSON(path + '/api' + url, params, function(response) {
                var data = response.indicators || [],
                    pager = response.pager;

                store.loadStore(data, pager, append, fn);
            }).complete(function() {
                store.isPending = false;
                ns.core.web.mask.hide(indicatorAvailable.boundList);
            });
        },
        loadStore: function(data, pager, append, fn) {
            pager = pager || {};

            this.loadDataAndUpdate(data, append);
            this.sortStore();

            this.lastPage = this.nextPage;

            if (pager.pageCount > this.nextPage) {
                this.nextPage++;
            }

            this.isPending = false;

            //ns.core.web.multiSelect.filterAvailable({store: indicatorAvailableStore}, {store: indicatorSelectedStore});

            if (fn) {
                fn();
            }
        },
        storage: {},
        parent: null,
        sortStore: function() {
            this.sort('name', 'ASC');
        }
    });

    var indicatorGroupStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'index'],
        proxy: {
            type: 'ajax',
            url: path + '/api/indicatorGroups.json?fields=id,displayName|rename(name)&paging=false',
            reader: {
                type: 'json',
                root: 'indicatorGroups'
            },
            pageParam: false,
            startParam: false,
            limitParam: false
        },
        listeners: {
            load: function(s) {
                s.add({
                    id: 0,
                    name: '[ ' + i18n['all_indicators'] + ' ]',
                    index: -1
                });
                s.sort([
                    {
                        property: 'index',
                        direction: 'ASC'
                    },
                    {
                        property: 'name',
                        direction: 'ASC'
                    }
                ]);
            }
        }
    });

    var indicatorLabel = Ext.create('Ext.form.Label', {
        text: i18n['available'],
        cls: 'ns-toolbar-multiselect-left-label',
        style: 'margin-right:5px'
    });

    var indicatorSearch = Ext.create('Ext.button.Button', {
        width: 22,
        height: 22,
        cls: 'ns-button-icon',
        disabled: true,
        style: 'background: url(images/search_14.png) 3px 3px no-repeat',
        showFilter: function() {
            indicatorLabel.hide();
            this.hide();
            indicatorFilter.show();
            indicatorFilter.reset();
        },
        hideFilter: function() {
            indicatorLabel.show();
            this.show();
            indicatorFilter.hide();
            indicatorFilter.reset();
        },
        handler: function() {
            this.showFilter();
        }
    });

    var indicatorFilter = Ext.create('Ext.form.field.Trigger', {
        cls: 'ns-trigger-filter',
        emptyText: 'Filter available..',
        height: 22,
        hidden: true,
        enableKeyEvents: true,
        fieldStyle: 'height:22px; border-right:0 none',
        style: 'height:22px',
        onTriggerClick: function() {
            if (this.getValue()) {
                this.reset();
                this.onKeyUpHandler();
            }
        },
        onKeyUpHandler: function() {
            var value = indicatorGroup.getValue(),
                store = indicatorAvailableStore;

            if (isString(value) || isNumber(value)) {
                store.loadPage(null, this.getValue(), false);
            }
        },
        listeners: {
            keyup: {
                fn: function(cmp) {
                    cmp.onKeyUpHandler();
                },
                buffer: 100
            },
            show: function(cmp) {
                cmp.focus(false, 50);
            },
            focus: function(cmp) {
                cmp.addCls('ns-trigger-filter-focused');
            },
            blur: function(cmp) {
                cmp.removeCls('ns-trigger-filter-focused');
            }
        }
    });

    var indicatorGroup = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:1px; margin-top:0px',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n['select_indicator_group'],
        editable: false,
        store: indicatorGroupStore,
        loadAvailable: function(reset) {
            var store = indicatorAvailableStore,
                id = this.getValue();

            if (id !== null) {
                if (reset) {
                    store.reset();
                }

                store.loadPage(id, null, false);
            }
        },
        listeners: {
            select: function(cb) {
                cb.loadAvailable(true);

                indicatorSearch.enable();
            }
        }
    });

    var indicatorAvailable = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-left',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        store: indicatorAvailableStore,
        tbar: [
            indicatorLabel,
            indicatorSearch,
            indicatorFilter,
            '->',
            {
                xtype: 'button',
                icon: 'images/arrowright.png',
                width: 22,
                handler: function() {
                    if (indicatorAvailable.getValue().length) {
                        var records = indicatorAvailableStore.getRecordsByIds(indicatorAvailable.getValue());
                        selectedStore.addRecords(records, 'in');
                    }
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowrightdouble.png',
                width: 22,
                handler: function() {
                    indicatorAvailableStore.loadPage(null, null, null, true, function() {
                        selectedStore.addRecords(indicatorAvailableStore.getRange(), 'in');
                    });
                }
            }
        ],
        listeners: {
            render: function(ms) {
                var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                el.addEventListener('scroll', function(e) {
                    if (isScrolled(e) && !indicatorAvailableStore.isPending) {
                        indicatorAvailableStore.loadPage(null, null, true);
                    }
                });

                ms.boundList.on('itemdblclick', function(bl, record) {
                    selectedStore.addRecords(record, 'in');
                }, ms);
            }
        }
    });

    var indicatorSelected = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-right',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        ddReorder: true,
        store: selectedStore,
        tbar: [
            {
                xtype: 'button',
                icon: 'images/arrowleftdouble.png',
                width: 22,
                handler: function() {
                    if (selectedStore.getRange().length) {
                        selectedStore.removeAll();
                    }
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowleft.png',
                width: 22,
                handler: function() {
                    if (indicatorSelected.getValue().length) {
                        selectedStore.removeByIds(indicatorSelected.getValue());
                    }
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
                this.boundList.on('itemdblclick', function(bl, record) {
                    selectedStore.removeByIds(record.data.id);
                }, this);
            }
        }
    });

    $.extend(t, Ext.create('Ext.panel.Panel', {
        xtype: 'panel',
        preventHeader: true,
        hideCollapseTool: true,
        dimension: objectName,
        bodyStyle: 'border:0 none',
        items: [
            indicatorGroup,
            {
                xtype: 'panel',
                layout: 'column',
                bodyStyle: 'border-style:none',
                items: [
                    indicatorAvailable,
                    indicatorSelected
                ]
            }
        ],
        listeners: {
            added: function() {
                //accordionPanels.push(this);
            },
            expand: function(p) {
                //p.onExpand();
            }
        }
    }));
};
