import {isString, isNumber, isObject, arrayContains, arrayFrom} from 'd2-utilizr';

export var DataElementPanel;

DataElementPanel = function(config) {
    var t = DataElementPanel,
        appManager = t.appManager,
        i18nManager = t.i18nManager,
        dimensionConfig = t.dimensionConfig,
        uiConfig = t.uiConfig;

    var tab = t.parentTab,
        path = appManager.getPath(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl(),
        i18n = i18nManager.get(),
        thisObjectName = dimensionConfig.get('dataElement').objectName,
        operandObjectName = dimensionConfig.get('operand').objectName,
        selectedStore = tab.getSelectedStore();

    this.getAvailableView = function() {
        return dataElementAvailable;
    };

    this.getSelectedView = function() {
        return dataElementSelected;
    };

    var dataElementAvailableStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        lastPage: null,
        nextPage: 1,
        isPending: false,
        reset: function() {
            this.removeAll();
            this.lastPage = null;
            this.nextPage = 1;
            this.isPending = false;
            dataElementSearch.hideFilter();
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

            if (selectedStoreIds.length) {
                this.filterBy(function(record) {
                    return !arrayContains(selectedStoreIds, record.data.id);
                });
            }
        },
        loadPage: function(uid, filter, append, noPaging, fn) {
            uid = (isString(uid) || isNumber(uid)) ? uid : dataElementGroup.getValue();
            filter = filter || dataElementFilter.getValue() || null;

            if (!append) {
                this.lastPage = null;
                this.nextPage = 1;
            }

            if (dataElementDetailLevel.getValue() === thisObjectName) {
                this.loadTotalsPage(uid, filter, append, noPaging, fn);
            }
            else if (dataElementDetailLevel.getValue() === operandObjectName) {
                this.loadDetailsPage(uid, filter, append, noPaging, fn);
            }
        },
        loadTotalsPage: function(uid, filter, append, noPaging, fn) {
            var store = this,
                params = {},
                url;

            if (store.nextPage === store.lastPage) {
                return;
            }

            if (isString(uid)) {
                url = '/dataElements.json?fields=dimensionItem|rename(id),' + displayPropertyUrl + '&filter=dataElementGroups.id:eq:' + uid + (filter ? '&filter=' + nameProperty + ':ilike:' + filter : '');
            }
            else if (uid === 0) {
                url = '/dataElements.json?fields=dimensionItem|rename(id),' + displayPropertyUrl + '&filter=domainType:eq:AGGREGATE' + '' + (filter ? '&filter=' + nameProperty + ':ilike:' + filter : '');
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
            ns.core.web.mask.show(dataElementAvailable.boundList);

            $.getJSON(path + '/api' + url, params, function(response) {
                var data = response.dataElements || [],
                    pager = response.pager;

                store.loadStore(data, pager, append, fn);
            }).complete(function() {
                store.isPending = false;
                //TODO ns.core.web.mask.hide(dataElementAvailable.boundList);
            });
        },
        loadDetailsPage: function(uid, filter, append, noPaging, fn) {
            var store = this,
                params = {},
                url;

            if (store.nextPage === store.lastPage) {
                return;
            }

            if (isString(uid)) {
                url = '/dataElementOperands.json?fields=dimensionItem|rename(id),' + displayPropertyUrl + '&filter=dataElement.dataElementGroups.id:eq:' + uid + (filter ? '&filter=' + nameProperty + ':ilike:' + filter : '');
            }
            else if (uid === 0) {
                url = '/dataElementOperands.json?fields=dimensionItem|rename(id),' + displayPropertyUrl + '' + (filter ? '&filter=' + nameProperty + ':ilike:' + filter : '');
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
            //TODO ns.core.web.mask.show(dataElementAvailable.boundList);

            $.getJSON(path + '/api' + url, params, function(response) {
                var data = response.objects || response.dataElementOperands || [],
                    pager = response.pager;

                store.loadStore(data, pager, append, fn);
            }).complete(function() {
                store.isPending = false;
                //TODO ns.core.web.mask.hide(dataElementAvailable.boundList);
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

            uiManager.msFilterAvailable({store: dataElementAvailableStore}, {store: dataElementSelectedStore});

            if (fn) {
                fn();
            }
        },
        sortStore: function() {
            this.sort('name', 'ASC');
        }
    });

    var dataElementGroupStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'index'],
        proxy: {
            type: 'ajax',
            url: path + '/api/dataElementGroups.json?fields=id,' + displayPropertyUrl + '&paging=false',
            reader: {
                type: 'json',
                root: 'dataElementGroups'
            },
            pageParam: false,
            startParam: false,
            limitParam: false
        },
        listeners: {
            load: function(s) {
                s.add({
                    id: 0,
                    name: '[ ' + i18n['all_data_elements'] + ' ]',
                    index: -1
                });

                s.sort([
                    {property: 'index', direction: 'ASC'},
                    {property: 'name', direction: 'ASC'}
                ]);
            }
        }
    });

    var dataElementLabel = Ext.create('Ext.form.Label', {
        text: i18n['available'],
        cls: 'ns-toolbar-multiselect-left-label',
        style: 'margin-right:5px'
    });

    var dataElementSearch = Ext.create('Ext.button.Button', {
        width: 22,
        height: 22,
        cls: 'ns-button-icon',
        disabled: true,
        style: 'background: url(images/search_14.png) 3px 3px no-repeat',
        showFilter: function() {
            dataElementLabel.hide();
            this.hide();
            dataElementFilter.show();
            dataElementFilter.reset();
        },
        hideFilter: function() {
            dataElementLabel.show();
            this.show();
            dataElementFilter.hide();
            dataElementFilter.reset();
        },
        handler: function() {
            this.showFilter();
        }
    });

    var dataElementFilter = Ext.create('Ext.form.field.Trigger', {
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
            var value = dataElementGroup.getValue(),
                store = dataElementAvailableStore;

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

    var dataElementAvailable = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-left',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        isPending: false,
        page: 1,
        store: dataElementAvailableStore,
        tbar: [
            dataElementLabel,
            dataElementSearch,
            dataElementFilter,
            '->',
            {
                xtype: 'button',
                icon: 'images/arrowright.png',
                width: 22,
                handler: function() {
                    if (dataElementAvailable.getValue().length) {
                        var records = dataElementAvailableStore.getRecordsByIds(dataElementAvailable.getValue());
                        selectedStore.addRecords(records, 'de');
                    }
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowrightdouble.png',
                width: 22,
                handler: function() {
                    dataElementAvailableStore.loadPage(null, null, null, true, function() {
                        selectedStore.addRecords(dataElementAvailableStore.getRange(), 'de');
                    });
                }
            }
        ],
        listeners: {
            render: function(ms) {
                var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                el.addEventListener('scroll', function(e) {
                    if (uiManager.isScrolled(e) && !dataElementAvailableStore.isPending) {
                        dataElementAvailableStore.loadPage(null, null, true);
                    }
                });

                ms.boundList.on('itemdblclick', function(bl, record) {
                    selectedStore.addRecords(record, 'de');
                }, ms);
            }
        }
    });

    var dataElementSelected = Ext.create('Ext.ux.form.MultiSelect', {
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
                    if (dataElementSelected.getValue().length) {
                        selectedStore.removeByIds(dataElementSelected.getValue());
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

    var dataElementGroup = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin:0 1px 1px 0',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding - 90,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n['select_data_element_group'],
        editable: false,
        store: dataElementGroupStore,
        loadAvailable: function(reset) {
            var store = dataElementAvailableStore,
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

                dataElementSearch.enable();
            }
        }
    });

    var dataElementDetailLevel = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:1px',
        baseBodyCls: 'small',
        queryMode: 'local',
        editable: false,
        valueField: 'id',
        displayField: 'text',
        width: 90 - 1,
        value: thisObjectName,
        store: {
            fields: ['id', 'text'],
            data: [
                {id: thisObjectName, text: i18n['totals']},
                {id: operandObjectName, text: i18n['details']}
            ]
        },
        listeners: {
            select: function(cb) {
                dataElementGroup.loadAvailable(true);
                selectedStore.removeByProperty('objectName', 'de');
            }
        }
    });

    $.extend(t, Ext.create('Ext.panel.Panel', {
        xtype: 'panel',
        preventHeader: true,
        hidden: true,
        hideCollapseTool: true,
        bodyStyle: 'border:0 none',
        dimension: thisObjectName,
        items: [
            {
                xtype: 'container',
                layout: 'column',
                items: [
                    dataElementGroup,
                    dataElementDetailLevel
                ]
            },
            {
                xtype: 'panel',
                layout: 'column',
                bodyStyle: 'border-style:none',
                items: [
                    dataElementAvailable,
                    dataElementSelected
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
