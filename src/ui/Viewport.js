import isString from 'd2-utilizr/lib/isString';
import isNumber from 'd2-utilizr/lib/isNumber';
import isObject from 'd2-utilizr/lib/isObject';
import isIE from 'd2-utilizr/lib/isIE';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arraySort from 'd2-utilizr/lib/arraySort';
import clone from 'd2-utilizr/lib/clone';

import {Record} from '../api/Record.js';
import {Dimension} from '../api/Dimension.js';
import {Axis} from '../api/Axis.js';
import {Layout} from '../api/Layout.js';
import {FavoriteWindow} from './FavoriteWindow.js';
import {InterpretationItem} from './InterpretationItem.js';
import {PluginItem} from './PluginItem.js';
import {LinkItem} from './LinkItem.js';
import {FavoriteButton} from './FavoriteButton.js';
import {EmbedButton} from './EmbedButton.js';

export var Viewport;

Viewport = function(c, cmp) {
    var uiManager = c.uiManager,
        appManager = c.appManager,
        i18nManager = c.i18nManager,
        sessionStorageManager = c.sessionStorageManager,
        instanceManager = c.instanceManager,
        calendarManager = c.calendarManager,
        dimensionConfig = c.dimensionConfig,
        periodConfig = c.periodConfig,
        uiConfig = c.uiConfig,
        optionConfig = c.optionConfig,

        path = appManager.getPath(),
        i18n = i18nManager.get(),
        apiResource = instanceManager.apiResource,
        displayProperty = appManager.getDisplayProperty(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl(),

        dataObjectName = dimensionConfig.get('data').objectName,
        indicatorObjectName = dimensionConfig.get('indicator').objectName,
        dataElementObjectName = dimensionConfig.get('dataElement').objectName,
        operandObjectName = dimensionConfig.get('operand').objectName,
        dataSetObjectName = dimensionConfig.get('dataSet').objectName,
        eventDataItemObjectName = dimensionConfig.get('eventDataItem').objectName,
        programIndicatorObjectName = dimensionConfig.get('programIndicator').objectName,
        periodObjectName = dimensionConfig.get('period').objectName,
        organisationUnitObjectName = dimensionConfig.get('organisationUnit').objectName,
        categoryObjectName = dimensionConfig.get('category').objectName,

        layoutWindow = uiManager.get('layoutWindow'),
        optionsWindow = uiManager.get('optionsWindow'),
        favoriteWindow = uiManager.get('favoriteWindow'),

        accordionPanels = [],
        displayProperty = appManager.getDisplayProperty(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl(),

        dimensionPanelMap = {};

    cmp = cmp || {};

    var northRegion = cmp.northRegion;

    var favoriteButton = uiManager.reg(FavoriteButton(c), 'favoriteButton');
    var embedButton = uiManager.reg(EmbedButton(c), 'embedButton', 'onCurrent');

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

                if (!append) {
                    this.removeAll();
                }

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
            var selectedStoreIds = dataSelectedStore.getIds();

            this.clearFilter();

            this.filterBy(function(record) {
                return !arrayContains(selectedStoreIds, record.data.id);
            });
        },
        loadPage: function(uid, filter, append, noPaging, fn) {
            var store = this,
                params = {},
                baseUrl = path + '/api/indicators.json?',
                fieldsUrl = 'fields=dimensionItem|rename(id),' + displayPropertyUrl,
                filterUrl = filter ? '&filter=' + displayProperty + ':ilike:' + filter : '';

            var url = baseUrl + fieldsUrl + filterUrl;

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
                url += '&filter=indicatorGroups.id:eq:' + uid;
            }

            if (noPaging) {
                params.paging = false;
            }
            else {
                params.page = store.nextPage;
                params.pageSize = 50;
            }

            store.isPending = true;
            uiManager.mask(indicatorAvailable.boundList);

            $.getJSON(encodeURI(url), params, function(response) {
                var data = response.indicators || [],
                    pager = response.pager;

                store.loadStore(data, pager, append, fn);
            }).complete(function() {
                store.isPending = false;
                uiManager.unmask(indicatorAvailable.boundList);
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

            //uiManager.msFilterAvailable({store: this}, {store: indicatorSelectedStore});

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
            url: encodeURI(path + '/api/indicatorGroups.json?fields=id,displayName|rename(name)&paging=false'),
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

                if (!append) {
                    this.removeAll();
                }

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
            var selectedStoreIds = dataSelectedStore.getIds();

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

            if (dataElementDetailLevel.getValue() === dataElementObjectName) {
                this.loadTotalsPage(uid, filter, append, noPaging, fn);
            }
            else if (dataElementDetailLevel.getValue() === operandObjectName) {
                this.loadDetailsPage(uid, filter, append, noPaging, fn);
            }
        },
        loadTotalsPage: function(uid, filter, append, noPaging, fn) {
            var store = this,
                params = {},
                baseUrl = path + '/api/dataElements.json?',
                fieldsUrl = 'fields=dimensionItem|rename(id),' + displayPropertyUrl,
                filterUrl = '&filter=domainType:eq:AGGREGATE' + (filter ? '&filter=' + displayProperty + ':ilike:' + filter : '');

            var url = baseUrl + fieldsUrl + filterUrl;

            if (store.nextPage === store.lastPage) {
                return;
            }

            if (isString(uid)) {
                url += '&filter=dataElementGroups.id:eq:' + uid;
            }

            if (noPaging) {
                params.paging = false;
            }
            else {
                params.page = store.nextPage;
                params.pageSize = 50;
            }

            store.isPending = true;
            uiManager.mask(dataElementAvailable.boundList);

            $.getJSON(encodeURI(url), params, function(response) {
                var data = response.dataElements || [],
                    pager = response.pager;

                store.loadStore(data, pager, append, fn);
            }).complete(function() {
                store.isPending = false;
                uiManager.unmask(dataElementAvailable.boundList);
            });
        },
        loadDetailsPage: function(uid, filter, append, noPaging, fn) {
            var store = this,
                params = {},
                baseUrl = path + '/api/dataElementOperands.json?',
                fieldsUrl = 'fields=dimensionItem|rename(id),' + displayPropertyUrl,
                filterUrl = filter ? '&filter=' + displayProperty + ':ilike:' + filter : '';

            var url = baseUrl + fieldsUrl + filterUrl;

            if (store.nextPage === store.lastPage) {
                return;
            }

            if (isString(uid)) {
                url += '&filter=dataElement.dataElementGroups.id:eq:' + uid;
            }

            if (noPaging) {
                params.paging = false;
            }
            else {
                params.page = store.nextPage;
                params.pageSize = 50;
            }

            store.isPending = true;
            uiManager.mask(dataElementAvailable.boundList);

            $.getJSON(encodeURI(url), params, function(response) {
                var data = response.objects || response.dataElementOperands || [],
                    pager = response.pager;

                store.loadStore(data, pager, append, fn);
            }).complete(function() {
                store.isPending = false;
                uiManager.unmask(dataElementAvailable.boundList);
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

            //uiManager.msFilterAvailable({store: dataElementAvailableStore}, {store: dataElementSelectedStore});

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
            url: encodeURI(path + '/api/dataElementGroups.json?fields=id,' + displayPropertyUrl + '&paging=false'),
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

    var dataSetAvailableStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        lastPage: null,
        nextPage: 1,
        isPending: false,
        reset: function() {
            this.removeAll();
            this.lastPage = null;
            this.nextPage = 1;
            this.isPending = false;
            dataSetSearch.hideFilter();
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
            var selectedStoreIds = dataSelectedStore.getIds();

            this.clearFilter();

            var metric = dataSetMetric.getValue() || '';

            this.filterBy(function(record) {
                return !arrayContains(selectedStoreIds, record.data.id) && (record.data.id.indexOf(metric) !== -1);
            });
        },
        loadPage: function(filter, append, noPaging, fn) {
            var store = this,
                params = {},
                baseUrl = path + '/api/dataSets.json?',
                fieldsUrl = 'fields=dimensionItem|rename(id),' + displayPropertyUrl,
                filterUrl = filter ? '&filter=' + displayProperty + ':ilike:' + filter : '';

            var url = baseUrl + fieldsUrl + filterUrl;

            filter = filter || dataSetFilter.getValue() || null;

            if (!append) {
                this.lastPage = null;
                this.nextPage = 1;
            }

            if (store.nextPage === store.lastPage) {
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
            uiManager.mask(dataSetAvailable.boundList);

            $.getJSON(encodeURI(url), params, function(response) {
                var data = response.dataSets || [],
                    pager = response.pager;

                store.loadStore(data, pager, append, fn);
            }).complete(function() {
                store.isPending = false;
                uiManager.unmask(dataSetAvailable.boundList);
            });
        },
        getProcessedData: function(data) {
            var metricRecords = optionConfig.getDataSetMetricRecords(),
                processedData = [];

            data.forEach(function(item) {
                metricRecords.forEach(function(record) {
                    processedData.push({
                        id: item.id + '.' + record.id,
                        name: item.name + ' (' + record.name + ')'
                    });
                });
            });

            return processedData;
        },
        filterMetric: function(metric) {
            this.clearFilter();
            this.filterBy(function(record) {
                return record.data.id.indexOf(metric) !== -1;
            });
        },
        loadStore: function(data, pager, append, fn) {
            pager = pager || {};

            data = this.getProcessedData(data);

            this.loadDataAndUpdate(data, append);

            this.sortStore();

            this.lastPage = this.nextPage;

            if (pager.pageCount > this.nextPage) {
                this.nextPage++;
            }

            this.isPending = false;

            //uiManager.msFilterAvailable({store: dataSetAvailableStore}, {store: dataSetSelectedStore});

            if (fn) {
                fn();
            }
        },
        storage: {},
        parent: null,
        isLoaded: false,
        sortStore: function() {
            this.sort('name', 'ASC');
        }
    });

    var eventDataItemAvailableStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        data: [],
        sortStore: function() {
            this.sort('name', 'ASC');
        },
        loadDataAndUpdate: function(data, append) {
                this.clearFilter(); // work around

                if (!append) {
                    this.removeAll();
                }

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
            var selectedStoreIds = dataSelectedStore.getIds();

            this.clearFilter();

            this.filterBy(function(record) {
                return !arrayContains(selectedStoreIds, record.data.id);
            });
        }
    });

    var programIndicatorAvailableStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        data: [],
        sortStore: function() {
            this.sort('name', 'ASC');
        },
        loadDataAndUpdate: function(data, append) {
                this.clearFilter(); // work around

                if (!append) {
                    this.removeAll();
                }

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
            var selectedStoreIds = dataSelectedStore.getIds();

            this.clearFilter();

            this.filterBy(function(record) {
                return !arrayContains(selectedStoreIds, record.data.id);
            });
        }
    });

    var programStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        proxy: {
            type: 'ajax',
            url: encodeURI(path + '/api/programs.json?fields=id,displayName|rename(name)&paging=false'),
            reader: {
                type: 'json',
                root: 'programs'
            },
            pageParam: false,
            startParam: false,
            limitParam: false
        }
    });

    var dataSelectedStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        data: [],
        getIds: function() {
            var records = this.getRange(),
                ids = [];

            for (var i = 0; i < records.length; i++) {
                ids.push(records[i].data.id);
            }

            return ids;
        },
        addRecords: function(records, objectName) {
            var prop = 'objectName',
                recordsToAdd = [],
                objectsToAdd = [];

            records = arrayFrom(records);

            if (records.length) {
                for (var i = 0, record; i < records.length; i++) {
                    record = records[i];

                    // record
                    if (record.data) {
                        if (objectName) {
                            record.set(prop, objectName);
                        }
                        recordsToAdd.push(record);
                    }
                    // object
                    else {
                        if (objectName) {
                            record[prop] = objectName;
                        }
                        objectsToAdd.push(record);
                    }
                }

                if (recordsToAdd.length) {
                    this.add(recordsToAdd);
                }

                if (objectsToAdd.length) {
                    this.loadData(objectsToAdd, true);
                }
            }
        },
        removeByIds: function(ids) {
            ids = arrayFrom(ids);

            for (var i = 0, index; i < ids.length; i++) {
                index = this.findExact('id', ids[i]);

                if (index !== -1) {
                    this.removeAt(index);
                }
            }
        },
        removeByProperty: function(property, values) {
            if (!(property && values)) {
                return;
            }

            var recordsToRemove = [];

            values = arrayFrom(values);

            this.each(function(record) {
                if (arrayContains(values, record.data[property])) {
                    recordsToRemove.push(record);
                }
            });

            this.remove(recordsToRemove);
        },
        listeners: {
            add: function() {
                data.updateStoreFilters();
            },
            remove: function() {
                data.updateStoreFilters();
            },
            clear: function() {
                data.updateStoreFilters();
            }
        }
    });

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

    var organisationUnitLevelStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'level'],
        data: appManager.organisationUnitLevels,
        sorters: [{
            property: 'level',
            direction: 'ASC'
        }]
    });

    var organisationUnitGroupStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        proxy: {
            type: 'ajax',
            url: encodeURI(path + '/api/organisationUnitGroups.json?fields=id,' + displayPropertyUrl + '&paging=false'),
            reader: {
                type: 'json',
                root: 'organisationUnitGroups'
            },
            pageParam: false,
            startParam: false,
            limitParam: false
        }
    });

    var legendSetStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'index'],
        data: function() {
            var data = appManager.legendSets;
            data.unshift({id: 0, name: i18n['none'], index: -1});
            return data;
        }(),
        sorters: [
            {property: 'index', direction: 'ASC'},
            {property: 'name', direction: 'ASC'}
        ]
    });

    // data

    var onDataTypeSelect = function(type) {
        type = type || 'in';

        if (type === 'in') {
            indicator.show();
            dataElement.hide();
            dataSet.hide();
            eventDataItem.hide();
            programIndicator.hide();
        }
        else if (type === 'de') {
            indicator.hide();
            dataElement.show();
            dataSet.hide();
            eventDataItem.hide();
            programIndicator.hide();
        }
        else if (type === 'ds') {
            indicator.hide();
            dataElement.hide();
            dataSet.show();
            eventDataItem.hide();
            programIndicator.hide();

            if (!dataSetAvailableStore.isLoaded) {
                dataSetAvailableStore.isLoaded = true;
                dataSetAvailableStore.loadPage();
            }
        }
        else if (type === 'di') {
            indicator.hide();
            dataElement.hide();
            dataSet.hide();
            eventDataItem.show();
            programIndicator.hide();

            if (!programStore.isLoaded) {
                programStore.isLoaded = true;
                programStore.load();
            }
        }
        else if (type === 'pi') {
            indicator.hide();
            dataElement.hide();
            dataSet.hide();
            eventDataItem.hide();
            programIndicator.show();

            if (!programStore.isLoaded) {
                programStore.isLoaded = true;
                programStore.load();
            }
        }
    };

    var dataType = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:1px',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding,
        valueField: 'id',
        displayField: 'name',
        //emptyText: i18n.data_type,
        editable: false,
        queryMode: 'local',
        value: 'in',
        store: {
            fields: ['id', 'name'],
            data: [
                 {id: 'in', name: i18n['indicators']},
                 {id: 'de', name: i18n['data_elements']},
                 {id: 'ds', name: i18n['data_sets']},
                 {id: 'di', name: i18n['event_data_items']},
                 {id: 'pi', name: i18n['program_indicators']}
            ]
        },
        listeners: {
            select: function(cb) {
                onDataTypeSelect(cb.getValue());
            }
        }
    });

    var dataSelected = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-right',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        ddReorder: true,
        store: dataSelectedStore,
        tbar: [
            {
                xtype: 'button',
                text: 'test',
                //iconCls: 'ns-button-icon-arrowleftdouble',
                iconCls: 'ns-button-icon-map',
                width: 22,
                handler: function() {
                    dataSelectedStore.removeAll();
                    data.updateStoreFilters();
                }
            },
            {
                xtype: 'button',
                icon: 'ns-button-icon-arrowleft',
                width: 22,
                handler: function() {
                    dataSelectedStore.removeByIds(dataSelected.getValue());
                    data.updateStoreFilters();
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
                    dataSelectedStore.removeByIds(dataSelected.getValue());
                    data.updateStoreFilters();
                }, this);
            }
        }
    });

    // indicator
    var indicatorLabel = Ext.create('Ext.form.Label', {
        text: i18n['available'],
        cls: 'ns-toolbar-multiselect-left-label',
        style: 'margin-right:5px'
    });

    var indicatorSearch = Ext.create('Ext.button.Button', {
        width: 22,
        height: 22,
        cls: 'ns-button-icon',
        iconCls: 'ns-button-icon-search',
        disabled: true,
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
            this.reset();
            this.onKeyUpHandler();

            indicatorSearch.hideFilter();
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
                iconCls: 'ns-button-icon-arrowright',
                width: 22,
                handler: function() {
                    if (indicatorAvailable.getValue().length) {
                        var records = indicatorAvailableStore.getRecordsByIds(indicatorAvailable.getValue());
                        dataSelectedStore.addRecords(records, 'in');
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowrightdouble',
                width: 22,
                handler: function() {
                    indicatorAvailableStore.loadPage(null, null, null, true, function() {
                        dataSelectedStore.addRecords(indicatorAvailableStore.getRange(), 'in');
                    });
                }
            }
        ],
        listeners: {
            render: function(ms) {
                var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                el.addEventListener('scroll', function(e) {
                    if (uiManager.isScrolled(e) && !indicatorAvailableStore.isPending) {
                        indicatorAvailableStore.loadPage(null, null, true);
                    }
                });

                ms.boundList.on('itemdblclick', function(bl, record) {
                    dataSelectedStore.addRecords(record, 'in');
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
        store: dataSelectedStore,
        tbar: [
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleftdouble',
                width: 22,
                handler: function() {
                    if (dataSelectedStore.getRange().length) {
                        dataSelectedStore.removeAll();
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleft',
                width: 22,
                handler: function() {
                    if (indicatorSelected.getValue().length) {
                        dataSelectedStore.removeByIds(indicatorSelected.getValue());
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
                    dataSelectedStore.removeByIds(record.data.id);
                }, this);
            }
        }
    });

    var indicator = Ext.create('Ext.panel.Panel', {
        xtype: 'panel',
        //title: '<div class="ns-panel-title-data">' + i18n.indicators + '</div>',
        preventHeader: true,
        hideCollapseTool: true,
        dimension: indicatorObjectName,
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
    });

    // data element
    var dataElementLabel = Ext.create('Ext.form.Label', {
        text: i18n['available'],
        cls: 'ns-toolbar-multiselect-left-label',
        style: 'margin-right:5px'
    });

    var dataElementSearch = Ext.create('Ext.button.Button', {
        width: 22,
        height: 22,
        cls: 'ns-button-icon',
        iconCls: 'ns-button-icon-search',
        disabled: true,
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
            this.reset();
            this.onKeyUpHandler();

            dataElementSearch.hideFilter();
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
                iconCls: 'ns-button-icon-arrowright',
                width: 22,
                handler: function() {
                    if (dataElementAvailable.getValue().length) {
                        var records = dataElementAvailableStore.getRecordsByIds(dataElementAvailable.getValue());
                        dataSelectedStore.addRecords(records, 'de');
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowrightdouble',
                width: 22,
                handler: function() {
                    dataElementAvailableStore.loadPage(null, null, null, true, function() {
                        dataSelectedStore.addRecords(dataElementAvailableStore.getRange(), 'de');
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
                    dataSelectedStore.addRecords(record, 'de');
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
        store: dataSelectedStore,
        tbar: [
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleftdouble',
                width: 22,
                handler: function() {
                    if (dataSelectedStore.getRange().length) {
                        dataSelectedStore.removeAll();
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleft',
                width: 22,
                handler: function() {
                    if (dataElementSelected.getValue().length) {
                        dataSelectedStore.removeByIds(dataElementSelected.getValue());
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
                    dataSelectedStore.removeByIds(record.data.id);
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
        value: dataElementObjectName,
        store: {
            fields: ['id', 'text'],
            data: [
                {id: dataElementObjectName, text: i18n['totals']},
                {id: operandObjectName, text: i18n['details']}
            ]
        },
        listeners: {
            select: function(cb) {
                dataElementGroup.loadAvailable(true);
                dataSelectedStore.removeByProperty('objectName', 'de');
            }
        }
    });

    var dataElement = Ext.create('Ext.panel.Panel', {
        xtype: 'panel',
        preventHeader: true,
        hidden: true,
        hideCollapseTool: true,
        bodyStyle: 'border:0 none',
        dimension: dataElementObjectName,
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
    });

    // data set
    var dataSetLabel = Ext.create('Ext.form.Label', {
        text: i18n['available'],
        cls: 'ns-toolbar-multiselect-left-label',
        style: 'margin-right:5px'
    });

    var dataSetSearch = Ext.create('Ext.button.Button', {
        width: 22,
        height: 22,
        cls: 'ns-button-icon',
        iconCls: 'ns-button-icon-search',
        showFilter: function() {
            dataSetLabel.hide();
            this.hide();
            dataSetFilter.show();
            dataSetFilter.reset();
        },
        hideFilter: function() {
            dataSetLabel.show();
            this.show();
            dataSetFilter.hide();
            dataSetFilter.reset();
        },
        handler: function() {
            this.showFilter();
        }
    });

    var dataSetFilter = Ext.create('Ext.form.field.Trigger', {
        cls: 'ns-trigger-filter',
        emptyText: 'Filter available..',
        height: 22,
        hidden: true,
        enableKeyEvents: true,
        fieldStyle: 'height:22px; border-right:0 none',
        style: 'height:22px',
        onTriggerClick: function() {
            this.reset();
            this.onKeyUpHandler();

            dataSetSearch.hideFilter();
        },
        onKeyUpHandler: function() {
            var store = dataSetAvailableStore;
            store.loadPage(this.getValue(), false);
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

    var dataSetAvailable = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-left',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        store: dataSetAvailableStore,
        tbar: [
            dataSetLabel,
            dataSetSearch,
            dataSetFilter,
            '->',
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowright',
                width: 22,
                handler: function() {
                    if (dataSetAvailable.getValue().length) {
                        var records = dataSetAvailableStore.getRecordsByIds(dataSetAvailable.getValue());
                        dataSelectedStore.addRecords(records, 'ds');
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowrightdouble',
                width: 22,
                handler: function() {
                    dataSetAvailableStore.loadPage(null, null, true, function() {
                        dataSelectedStore.addRecords(dataSetAvailableStore.getRange(), 'ds');
                    });
                }
            }
        ],
        listeners: {
            render: function(ms) {
                var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                el.addEventListener('scroll', function(e) {
                    if (uiManager.isScrolled(e) && !dataSetAvailableStore.isPending) {
                        dataSetAvailableStore.loadPage(null, true);
                    }
                });

                ms.boundList.on('itemdblclick', function(bl, record) {
                    dataSelectedStore.addRecords(record, 'ds');
                }, ms);
            }
        }
    });

    var dataSetSelected = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-right',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        ddReorder: true,
        store: dataSelectedStore,
        tbar: [
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleftdouble',
                width: 22,
                handler: function() {
                    if (dataSelectedStore.getRange().length) {
                        dataSelectedStore.removeAll();
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleft',
                width: 22,
                handler: function() {
                    if (dataSetSelected.getValue().length) {
                        dataSelectedStore.removeByIds(dataSetSelected.getValue());
                    }
                }
            },
            '->',
            {
                xtype: 'label',
                text: i18n.selected,
                cls: 'ns-toolbar-multiselect-right-label'
            }
        ],
        listeners: {
            afterrender: function() {
                this.boundList.on('itemdblclick', function(bl, record) {
                    dataSelectedStore.removeByIds(record.data.id);
                }, this);
            }
        }
    });

    var dataSetMetric = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:1px; margin-top:0px',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n['select_indicator_group'],
        editable: false,
        value: optionConfig.getDataSetMetric('reportingRates').id,
        store: {
            fields: ['id', 'name'],
            data: [{id: 0, name: '[ ' + i18n.all_metrics + ' ]'}].concat(optionConfig.getDataSetMetricRecords())
        },
        listeners: {
            select: function(cmp) {
                dataSetAvailableStore.updateFilter();
            }
        }
    });

    var dataSet = Ext.create('Ext.panel.Panel', {
        xtype: 'panel',
        //title: '<div class="ns-panel-title-data">' + i18n.reporting_rates + '</div>',
        preventHeader: true,
        hidden: true,
        hideCollapseTool: true,
        bodyStyle: 'border:0 none',
        dimension: dataSetObjectName,
        items: [
            dataSetMetric,
            {
                xtype: 'panel',
                layout: 'column',
                bodyStyle: 'border-style:none',
                items: [
                    dataSetAvailable,
                    dataSetSelected
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
    });

    // event data item
    var onEventDataItemProgramSelect = function(programId, skipSync) {
        if (!skipSync) {
            //dataSelectedStore.removeByProperty('objectName', ['di','pi']);
            programIndicatorProgram.setValue(programId);
            onProgramIndicatorProgramSelect(programId, true);
        }

        Ext.Ajax.request({
            url: encodeURI(path + '/api/programDataElements.json?program=' + programId + '&fields=dimensionItem|rename(id),name,valueType&paging=false'),
            disableCaching: false,
            success: function(r) {
                var types = appManager.getValueTypesByType('aggregate'),
                    elements = Ext.decode(r.responseText).programDataElements.filter(function(item) {
                        return arrayContains(types, (item || {}).valueType);
                    });

                Ext.Ajax.request({
                    url: encodeURI(path + '/api/programs.json?filter=id:eq:' + programId + '&fields=programTrackedEntityAttributes[dimensionItem|rename(id),' + displayPropertyUrl + '|rename(name),valueType]&paging=false'),
                    disableCaching: false,
                    success: function(r) {
                        var attributes = ((Ext.decode(r.responseText).programs[0] || {}).programTrackedEntityAttributes || []).filter(function(item) {
                                return arrayContains(types, (item || {}).valueType);
                            }),
                            data = arraySort(arrayClean([].concat(elements, attributes))) || [];

                        eventDataItemAvailableStore.loadDataAndUpdate(data);
                    }
                });
            }
        });
    };

    var eventDataItemProgram = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin:0 1px 1px 0',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n.select_program,
        editable: false,
        queryMode: 'local',
        store: programStore,
        listeners: {
            select: function(cb) {
                onEventDataItemProgramSelect(cb.getValue());
            }
        }
    });

    var eventDataItemLabel = Ext.create('Ext.form.Label', {
        text: i18n.available,
        cls: 'ns-toolbar-multiselect-left-label',
        style: 'margin-right:5px'
    });

    var eventDataItemSearch = Ext.create('Ext.button.Button', {
        width: 22,
        height: 22,
        cls: 'ns-button-icon',
        iconCls: 'ns-button-icon-search',
        //disabled: true,
        showFilter: function() {
            eventDataItemLabel.hide();
            this.hide();
            eventDataItemFilter.show();
            eventDataItemFilter.reset();
        },
        hideFilter: function() {
            eventDataItemLabel.show();
            this.show();
            eventDataItemFilter.hide();
            eventDataItemFilter.reset();
        },
        handler: function() {
            this.showFilter();
        }
    });

    var eventDataItemFilter = Ext.create('Ext.form.field.Trigger', {
        cls: 'ns-trigger-filter',
        emptyText: 'Filter available..',
        height: 22,
        hidden: true,
        enableKeyEvents: true,
        fieldStyle: 'height:22px; border-right:0 none',
        style: 'height:22px',
        onTriggerClick: function() {
            this.reset();
            this.onKeyUpHandler();

            eventDataItemSearch.hideFilter();
        },
        onKeyUpHandler: function() {
            var value = this.getValue() || '',
                store = eventDataItemAvailableStore,
                str;

            store.filterBy(function(record) {
                str = record.data.name || '';

                return str.toLowerCase().indexOf(value.toLowerCase()) !== -1;
            });
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

    var eventDataItemAvailable = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-left',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        store: eventDataItemAvailableStore,
        tbar: [
            eventDataItemLabel,
            eventDataItemSearch,
            eventDataItemFilter,
            '->',
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowright',
                width: 22,
                handler: function() {
                    if (eventDataItemAvailable.getValue().length) {
                        var records = eventDataItemAvailableStore.getRecordsByIds(eventDataItemAvailable.getValue());
                        dataSelectedStore.addRecords(records, 'di');
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowrightdouble',
                width: 22,
                handler: function() {
                    //eventDataItemAvailableStore.loadPage(null, null, null, true, function() {
                        dataSelectedStore.addRecords(eventDataItemAvailableStore.getRange(), 'di');
                    //});
                }
            }
        ],
        listeners: {
            render: function(ms) {
                var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                //el.addEventListener('scroll', function(e) {
                    //if (uiManager.isScrolled(e) && !eventDataItemAvailableStore.isPending) {
                        //eventDataItemAvailableStore.loadPage(null, null, true);
                    //}
                //});

                ms.boundList.on('itemdblclick', function(bl, record) {
                    dataSelectedStore.addRecords(record, 'di');
                }, ms);
            }
        }
    });

    var eventDataItemSelected = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-right',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        ddReorder: true,
        store: dataSelectedStore,
        tbar: [
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleftdouble',
                width: 22,
                handler: function() {
                    if (dataSelectedStore.getRange().length) {
                        dataSelectedStore.removeAll();
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleft',
                width: 22,
                handler: function() {
                    if (eventDataItemSelected.getValue().length) {
                        dataSelectedStore.removeByIds(eventDataItemSelected.getValue());
                    }
                }
            },
            '->',
            {
                xtype: 'label',
                text: i18n.selected,
                cls: 'ns-toolbar-multiselect-right-label'
            }
        ],
        listeners: {
            afterrender: function() {
                this.boundList.on('itemdblclick', function(bl, record) {
                    dataSelectedStore.removeByIds(record.data.id);
                }, this);
            }
        }
    });

    var eventDataItem = Ext.create('Ext.panel.Panel', {
        xtype: 'panel',
        //title: '<div class="ns-panel-title-data">' + i18n.eventDataItems + '</div>',
        preventHeader: true,
        hidden: true,
        hideCollapseTool: true,
        dimension: eventDataItemObjectName,
        bodyStyle: 'border:0 none',
        items: [
            eventDataItemProgram,
            {
                xtype: 'panel',
                layout: 'column',
                bodyStyle: 'border-style:none',
                items: [
                    eventDataItemAvailable,
                    eventDataItemSelected
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
    });

    // program indicator
    var onProgramIndicatorProgramSelect = function(programId, skipSync) {
        if (!skipSync) {
            //dataSelectedStore.removeByProperty('objectName', ['di','pi']);
            eventDataItemProgram.setValue(programId);
            onEventDataItemProgramSelect(programId, true);
        }

        Ext.Ajax.request({
            url: encodeURI(path + '/api/programs.json?filter=id:eq:' + programId + '&fields=programIndicators[dimensionItem|rename(id),' + displayPropertyUrl + ']&paging=false'),
            disableCaching: false,
            success: function(r) {
                var indicators = (Ext.decode(r.responseText).programs[0] || {}).programIndicators || [],
                    data = arraySort(indicators);

                programIndicatorAvailableStore.loadDataAndUpdate(data);
            }
        });

    };

    var programIndicatorProgram = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin:0 1px 1px 0',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n.select_program,
        editable: false,
        queryMode: 'local',
        store: programStore,
        listeners: {
            select: function(cb) {
                onProgramIndicatorProgramSelect(cb.getValue());
            }
        }
    });

    var programIndicatorLabel = Ext.create('Ext.form.Label', {
        text: i18n.available,
        cls: 'ns-toolbar-multiselect-left-label',
        style: 'margin-right:5px'
    });

    var programIndicatorSearch = Ext.create('Ext.button.Button', {
        width: 22,
        height: 22,
        cls: 'ns-button-icon',
        iconCls: 'ns-button-icon-search',
        //disabled: true,
        showFilter: function() {
            programIndicatorLabel.hide();
            this.hide();
            programIndicatorFilter.show();
            programIndicatorFilter.reset();
        },
        hideFilter: function() {
            programIndicatorLabel.show();
            this.show();
            programIndicatorFilter.hide();
            programIndicatorFilter.reset();
        },
        handler: function() {
            this.showFilter();
        }
    });

    var programIndicatorFilter = Ext.create('Ext.form.field.Trigger', {
        cls: 'ns-trigger-filter',
        emptyText: 'Filter available..',
        height: 22,
        hidden: true,
        enableKeyEvents: true,
        fieldStyle: 'height:22px; border-right:0 none',
        style: 'height:22px',
        onTriggerClick: function() {
            this.reset();
            this.onKeyUpHandler();

            programIndicatorSearch.hideFilter();
        },
        onKeyUpHandler: function() {
            var value = this.getValue() || '',
                store = programIndicatorAvailableStore,
                str;

            store.filterBy(function(record) {
                str = record.data.name || '';

                return str.toLowerCase().indexOf(value.toLowerCase()) !== -1;
            });
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

    var programIndicatorAvailable = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-left',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        store: programIndicatorAvailableStore,
        tbar: [
            programIndicatorLabel,
            programIndicatorSearch,
            programIndicatorFilter,
            '->',
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowright',
                width: 22,
                handler: function() {
                    if (programIndicatorAvailable.getValue().length) {
                        var records = programIndicatorAvailableStore.getRecordsByIds(programIndicatorAvailable.getValue());
                        dataSelectedStore.addRecords(records, 'pi');
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowrightdouble',
                width: 22,
                handler: function() {
                    //programIndicatorAvailableStore.loadPage(null, null, null, true, function() {
                        dataSelectedStore.addRecords(programIndicatorAvailableStore.getRange(), 'pi');
                    //});
                }
            }
        ],
        listeners: {
            render: function(ms) {
                var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                //el.addEventListener('scroll', function(e) {
                    //if (uiManager.isScrolled(e) && !programIndicatorAvailableStore.isPending) {
                        //programIndicatorAvailableStore.loadPage(null, null, true);
                    //}
                //});

                ms.boundList.on('itemdblclick', function(bl, record) {
                    dataSelectedStore.addRecords(record, 'pi');
                }, ms);
            }
        }
    });

    var programIndicatorSelected = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-right',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        ddReorder: true,
        store: dataSelectedStore,
        tbar: [
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleftdouble',
                width: 22,
                handler: function() {
                    if (dataSelectedStore.getRange().length) {
                        dataSelectedStore.removeAll();
                    }
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleft',
                width: 22,
                handler: function() {
                    if (programIndicatorSelected.getValue().length) {
                        dataSelectedStore.removeByIds(programIndicatorSelected.getValue());
                    }
                }
            },
            '->',
            {
                xtype: 'label',
                text: i18n.selected,
                cls: 'ns-toolbar-multiselect-right-label'
            }
        ],
        listeners: {
            afterrender: function() {
                this.boundList.on('itemdblclick', function(bl, record) {
                    dataSelectedStore.removeByIds(record.data.id);
                }, this);
            }
        }
    });

    var programIndicator = Ext.create('Ext.panel.Panel', {
        xtype: 'panel',
        //title: '<div class="ns-panel-title-data">' + i18n.programIndicators + '</div>',
        preventHeader: true,
        hidden: true,
        hideCollapseTool: true,
        dimension: programIndicatorObjectName,
        bodyStyle: 'border:0 none',
        items: [
            programIndicatorProgram,
            {
                xtype: 'panel',
                layout: 'column',
                bodyStyle: 'border-style:none',
                items: [
                    programIndicatorAvailable,
                    programIndicatorSelected
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
    });

    var data = {
        xtype: 'panel',
        title: '<div class="ns-panel-title-data">' + i18n.data + '</div>',
        hideCollapseTool: true,
        dimension: dataObjectName,
        updateStoreFilters: function() {
            indicatorAvailableStore.updateFilter();
            dataElementAvailableStore.updateFilter();
            dataSetAvailableStore.updateFilter();
            eventDataItemAvailableStore.updateFilter();
            programIndicatorAvailableStore.updateFilter();
        },
        getDimension: function() {
            var config = {
                dimension: dataObjectName,
                items: []
            };

            dataSelectedStore.each( function(r) {
                config.items.push({
                    id: r.data.id,
                    name: r.data.name
                });
            });

            // TODO program
            if (eventDataItemProgram.getValue() || programIndicatorProgram.getValue()) {
                config.program = {id: eventDataItemProgram.getValue() || programIndicatorProgram.getValue()};
            }

            return config.items.length ? config : null;
        },
        clearDimension: function() {
            dataSelectedStore.removeAll();

            indicatorAvailableStore.removeAll();
            indicatorGroup.clearValue();

            dataElementAvailableStore.removeAll();
            dataElementGroup.clearValue();
            dataElementDetailLevel.reset();

            dataSetAvailableStore.removeAll();

            eventDataItemAvailableStore.removeAll();
            programIndicatorAvailableStore.removeAll();
        },
        setDimension: function(layout) {
            if (isObject(layout.program) && isString(layout.program.id)) {
                eventDataItemProgram.setValue(layout.program.id);
                onEventDataItemProgramSelect(layout.program.id)
            }

            if (layout.hasDimension(this.dimension, true)) {
                dataSelectedStore.addRecords(layout.getDimension(this.dimension).getRecords());
            }
        },
        onExpand: function() {
            var accordionHeight = westRegion.hasScrollbar ? uiConfig.west_scrollbarheight_accordion_indicator : uiConfig.west_maxheight_accordion_indicator;

            accordion.setThisHeight(accordionHeight);

            uiManager.msSetHeight([indicatorAvailable, indicatorSelected], this, uiConfig.west_fill_accordion_indicator);
            uiManager.msSetHeight([dataElementAvailable, dataElementSelected], this, uiConfig.west_fill_accordion_dataelement);
            uiManager.msSetHeight([dataSetAvailable, dataSetSelected], this, uiConfig.west_fill_accordion_dataset);
            uiManager.msSetHeight([eventDataItemAvailable, eventDataItemSelected], this, uiConfig.west_fill_accordion_eventdataitem);
            uiManager.msSetHeight([programIndicatorAvailable, programIndicatorSelected], this, uiConfig.west_fill_accordion_programindicator);
        },
        items: [
            dataType,
            indicator,
            dataElement,
            dataSet,
            eventDataItem,
            programIndicator
        ],
        listeners: {
            added: function() {
                accordionPanels.push(this);
            },
            expand: function(p) {
                p.onExpand();
            }
        }
    };

    // period

    var rewind = Ext.create('Ext.form.field.Checkbox', {
        relativePeriodId: 'rewind',
        boxLabel: i18n.rewind_one_period,
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
                    period.checkboxes.push(chb);
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
                text: i18n.available,
                cls: 'ns-toolbar-multiselect-left-label'
            },
            '->',
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowright',
                width: 22,
                handler: function() {
                    uiManager.msSelect(fixedPeriodAvailable, fixedPeriodSelected);
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowrightdouble',
                width: 22,
                handler: function() {
                    uiManager.msSelectAll(fixedPeriodAvailable, fixedPeriodSelected, true);
                }
            }
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
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleftdouble',
                width: 22,
                handler: function() {
                    uiManager.msUnselectAll(fixedPeriodAvailable, fixedPeriodSelected);
                }
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleft',
                width: 22,
                handler: function() {
                    uiManager.msUnselect(fixedPeriodAvailable, fixedPeriodSelected);
                }
            },
            '->',
            {
                xtype: 'label',
                text: i18n.selected,
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
        emptyText: i18n.select_period_type,
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

    var period = {
        xtype: 'panel',
        title: '<div class="ns-panel-title-period">Periods</div>',
        hideCollapseTool: true,
        dimension: periodObjectName,
        checkboxes: [],
        clearDimension: function(all) {
            fixedPeriodSelectedStore.removeAll();
            period.resetRelativePeriods();

            if (!all) {
                relativePeriod.valueComponentMap[appManager.getRelativePeriod()].setValue(true);
            }
        },
        setDimension: function(layout) {
            if (layout.hasDimension(this.dimension, true)) {
                var records = layout.getDimension(this.dimension).getRecords(),
                    fixedRecords = [],
                    checkbox;

                records.forEach(function(record) {
                    checkbox = relativePeriod.valueComponentMap[record.id];

                    if (checkbox) {
                        checkbox.setValue(true);
                    }
                    else {
                        fixedRecords.push(record);
                    }
                });

                fixedPeriodSelectedStore.add(fixedRecords);

                uiManager.msFilterAvailable({store: fixedPeriodAvailableStore}, {store: fixedPeriodSelectedStore});
            }
        },
        getDimension: function() {
            var config = {
                    dimension: periodObjectName,
                    items: []
                };

            fixedPeriodSelectedStore.each( function(r) {
                config.items.push({
                    id: r.data.id,
                    name: r.data.name
                });
            });

            for (var i = 0; i < this.checkboxes.length; i++) {
                if (this.checkboxes[i].getValue()) {
                    config.items.push({
                        id: this.checkboxes[i].relativePeriodId,
                        name: ''
                    });
                }
            }

            return config.items.length ? config : null;
        },
        onExpand: function() {
            var accordionHeight = westRegion.hasScrollbar ? uiConfig.west_scrollbarheight_accordion_period : uiConfig.west_maxheight_accordion_period;

            accordion.setThisHeight(accordionHeight);

            uiManager.msSetHeight(
                [fixedPeriodAvailable, fixedPeriodSelected],
                this,
                uiConfig.west_fill_accordion_period
            );
        },
        resetRelativePeriods: function() {
            var a = this.checkboxes;
            for (var i = 0; i < a.length; i++) {
                a[i].setValue(false);
            }
        },
        isNoRelativePeriods: function() {
            var a = this.checkboxes;
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
                        text: i18n.prev_year,
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
                        text: i18n.next_year,
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
                accordionPanels.push(this);
            },
            expand: function(p) {
                p.onExpand();
            }
        }
    };

    // organisation unit

    var treePanel = Ext.create('Ext.tree.Panel', {
        cls: 'ns-tree',
        style: 'border-top: 1px solid #ddd; padding-top: 1px',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding,
        displayField: 'name',
        rootVisible: false,
        autoScroll: true,
        multiSelect: true,
        rendered: false,
        reset: function() {
            var rootNode = this.getRootNode().findChild('id', appManager.rootNodes[0].id);
            this.collapseAll();
            this.expandPath(rootNode.getPath());
            this.getSelectionModel().select(rootNode);
        },
        selectRootIf: function() {
            if (this.getSelectionModel().getSelection().length < 1) {
                var node = this.getRootNode().findChild('id', appManager.rootNodes[0].id);
                if (this.rendered) {
                    this.getSelectionModel().select(node);
                }
                return node;
            }
        },
        isPending: false,
        recordsToSelect: [],
        recordsToRestore: [],
        multipleSelectIf: function(map, doUpdate) {
            if (this.recordsToSelect.length === Object.keys(map).length) {
                this.getSelectionModel().select(this.recordsToSelect);
                this.recordsToSelect = [];
                this.isPending = false;

                if (doUpdate) {
                    update();
                }
            }
        },
        multipleExpand: function(id, map, doUpdate) {
            var t = this,
                rootId = appManager.rootNodeId,
                path = map[id];

            if (path.substr(0, rootId.length + 1) !== ('/' + rootId)) {
                path = '/' + rootId + path;
            }

            t.expandPath(path, 'id', '/', function() {
                var record = t.getRootNode().findChild('id', id, true);
                t.recordsToSelect.push(record);
                t.multipleSelectIf(map, doUpdate);
            });
        },
        select: function(url, params) {
            if (!params) {
                params = {};
            }
            Ext.Ajax.request({
                url: encodeURI(url),
                method: 'GET',
                params: params,
                scope: this,
                success: function(r) {
                    var a = Ext.decode(r.responseText).organisationUnits;
                    this.numberOfRecords = a.length;
                    for (var i = 0; i < a.length; i++) {
                        this.multipleExpand(a[i].id, a[i].path);
                    }
                }
            });
        },
        getParentGraphMap: function() {
            var selection = this.getSelectionModel().getSelection(),
                map = {};

            if (Ext.isArray(selection) && selection.length) {
                for (var i = 0, pathArray, key; i < selection.length; i++) {
                    pathArray = selection[i].getPath().split('/');
                    map[pathArray.pop()] = pathArray.join('/');
                }
            }

            return map;
        },
        selectGraphMap: function(map, update) {
            if (!Object.keys(map).length) {
                return;
            }

            this.isPending = true;

            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    treePanel.multipleExpand(key, map, update);
                }
            }
        },
        store: Ext.create('Ext.data.TreeStore', {
            fields: ['id', 'name', 'hasChildren'],
            proxy: {
                type: 'rest',
                format: 'json',
                noCache: false,
                extraParams: {
                    fields: 'children[id,' + displayPropertyUrl + ',children::isNotEmpty|rename(hasChildren)&paging=false'
                },
                url: path + '/api/organisationUnits',
                reader: {
                    type: 'json',
                    root: 'children'
                },
                sortParam: false
            },
            sorters: [{
                property: 'name',
                direction: 'ASC'
            }],
            root: {
                id: appManager.rootNodeId,
                expanded: true,
                children: appManager.getRootNodes()
            },
            listeners: {
                beforeload: function(store, operation) {
                    if (!store.proxy._url) {
                        store.proxy._url = store.proxy.url;
                    }

                    store.proxy.url = store.proxy._url + '/' + operation.node.data.id;
                },
                load: function(store, node, records) {
                    Ext.Array.each(records, function(record) {
                        if (Ext.isBoolean(record.data.hasChildren)) {
                            record.set('leaf', !record.data.hasChildren);
                        }
                    });
                }
            }
        }),
        xable: function(values) {
            for (var i = 0; i < values.length; i++) {
                if (!!values[i]) {
                    this.disable();
                    return;
                }
            }

            this.enable();
        },
        listeners: {
            beforeitemexpand: function() {
                if (!treePanel.isPending) {
                    treePanel.recordsToRestore = treePanel.getSelectionModel().getSelection();
                }
            },
            itemexpand: function() {
                if (!treePanel.isPending && treePanel.recordsToRestore.length) {
                    treePanel.getSelectionModel().select(treePanel.recordsToRestore);
                    treePanel.recordsToRestore = [];
                }
            },
            render: function() {
                this.rendered = true;
            },
            afterrender: function() {
                this.getSelectionModel().select(0);
            },
            itemcontextmenu: function(v, r, h, i, e) {
                v.getSelectionModel().select(r, false);

                if (v.menu) {
                    v.menu.destroy();
                }
                v.menu = Ext.create('Ext.menu.Menu', {
                    id: 'treepanel-contextmenu',
                    showSeparator: false,
                    shadow: false
                });
                if (!r.data.leaf) {
                    v.menu.add({
                        id: 'treepanel-contextmenu-item',
                        text: i18n.select_sub_units,
                        iconCls: 'ns-button-icon-nodeselectchild',
                        handler: function() {
                            r.expand(false, function() {
                                v.getSelectionModel().select(r.childNodes, true);
                                v.getSelectionModel().deselect(r);
                            });
                        }
                    });
                }
                else {
                    return;
                }

                v.menu.showAt(e.xy);
            }
        }
    });

    var userOrganisationUnit = Ext.create('Ext.form.field.Checkbox', {
        columnWidth: 0.25,
        style: 'padding-top: 3px; padding-left: 5px; margin-bottom: 0',
        boxLabel: i18n.user_organisation_unit,
        labelWidth: uiConfig.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([checked, userOrganisationUnitChildren.getValue(), userOrganisationUnitGrandChildren.getValue()]);
        }
    });

    var userOrganisationUnitChildren = Ext.create('Ext.form.field.Checkbox', {
        columnWidth: 0.26,
        style: 'padding-top: 3px; margin-bottom: 0',
        boxLabel: i18n.user_sub_units,
        labelWidth: uiConfig.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([checked, userOrganisationUnit.getValue(), userOrganisationUnitGrandChildren.getValue()]);
        }
    });

    var userOrganisationUnitGrandChildren = Ext.create('Ext.form.field.Checkbox', {
        columnWidth: 0.4,
        style: 'padding-top: 3px; margin-bottom: 0',
        boxLabel: i18n.user_sub_x2_units,
        labelWidth: uiConfig.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([checked, userOrganisationUnit.getValue(), userOrganisationUnitChildren.getValue()]);
        }
    });

    var organisationUnitLevel = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        multiSelect: true,
        style: 'margin-bottom:0',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding - 37,
        valueField: 'level',
        displayField: 'name',
        emptyText: i18n.select_organisation_unit_levels,
        editable: false,
        hidden: true,
        store: organisationUnitLevelStore
    });

    var organisationUnitGroup = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        multiSelect: true,
        style: 'margin-bottom:0',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding - 37,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n.select_organisation_unit_groups,
        editable: false,
        hidden: true,
        store: organisationUnitGroupStore
    });

    var toolMenu = Ext.create('Ext.menu.Menu', {
        shadow: false,
        showSeparator: false,
        menuValue: 'orgunit',
        clickHandler: function(param) {
            if (!param) {
                return;
            }

            var items = this.items.items;
            this.menuValue = param;

            // Menu item icon cls
            for (var i = 0; i < items.length; i++) {
                if (items[i].setIconCls) {
                    if (items[i].param === param) {
                        items[i].setIconCls('ns-menu-item-selected');
                    }
                    else {
                        items[i].setIconCls('ns-menu-item-unselected');
                    }
                }
            }

            // Gui
            if (param === 'orgunit') {
                userOrganisationUnit.show();
                userOrganisationUnitChildren.show();
                userOrganisationUnitGrandChildren.show();
                organisationUnitLevel.hide();
                organisationUnitGroup.hide();

                if (userOrganisationUnit.getValue() || userOrganisationUnitChildren.getValue()) {
                    treePanel.disable();
                }
            }
            else if (param === 'level') {
                userOrganisationUnit.hide();
                userOrganisationUnitChildren.hide();
                userOrganisationUnitGrandChildren.hide();
                organisationUnitLevel.show();
                organisationUnitGroup.hide();
                treePanel.enable();
            }
            else if (param === 'group') {
                userOrganisationUnit.hide();
                userOrganisationUnitChildren.hide();
                userOrganisationUnitGrandChildren.hide();
                organisationUnitLevel.hide();
                organisationUnitGroup.show();
                treePanel.enable();
            }
        },
        items: [
            {
                xtype: 'label',
                text: 'Selection mode',
                style: 'padding:7px 5px 5px 7px; font-weight:bold; border:0 none'
            },
            {
                text: i18n.select_organisation_units + '&nbsp;&nbsp;',
                param: 'orgunit',
                iconCls: 'ns-menu-item-selected'
            },
            {
                text: 'Select levels' + '&nbsp;&nbsp;',
                param: 'level',
                iconCls: 'ns-menu-item-unselected'
            },
            {
                text: 'Select groups' + '&nbsp;&nbsp;',
                param: 'group',
                iconCls: 'ns-menu-item-unselected'
            }
        ],
        listeners: {
            afterrender: function() {
                this.getEl().addCls('ns-btn-menu');
            },
            click: function(menu, item) {
                this.clickHandler(item.param);
            }
        }
    });

    var tool = Ext.create('Ext.button.Button', {
        cls: 'ns-button-organisationunitselection',
        iconCls: 'ns-button-icon-gear',
        width: 36,
        height: 24,
        menu: toolMenu
    });

    var toolPanel = Ext.create('Ext.panel.Panel', {
        width: 36,
        bodyStyle: 'border:0 none; text-align:right',
        style: 'margin-right:1px',
        items: tool
    });

    var organisationUnit = {
        xtype: 'panel',
        title: '<div class="ns-panel-title-organisationunit">' + i18n.organisation_units + '</div>',
        bodyStyle: 'padding:1px',
        hideCollapseTool: true,
        dimension: organisationUnitObjectName,
        collapsed: false,
        clearDimension: function(doClear) {
            if (doClear) {
                treePanel.reset();

                userOrganisationUnit.setValue(false);
                userOrganisationUnitChildren.setValue(false);
                userOrganisationUnitGrandChildren.setValue(false);
            }
        },
        setDimension: function(layout) {
            if (layout.hasDimension(this.dimension, true)) {
                var dimension = layout.getDimension(this.dimension, true),
                    parentGraphMap = layout.parentGraphMap;

                var records = dimension.getRecords(),
                    ids = [],
                    levels = [],
                    groups = [],
                    isOu,
                    isOuc,
                    isOugc;

                records.forEach(function(record) {
                    if (record.id === 'USER_ORGUNIT') {
                        isOu = true;
                    }
                    else if (record.id === 'USER_ORGUNIT_CHILDREN') {
                        isOuc = true;
                    }
                    else if (record.id === 'USER_ORGUNIT_GRANDCHILDREN') {
                        isOugc = true;
                    }
                    else if (record.id.substr(0,5) === 'LEVEL') {
                        levels.push(parseInt(record.id.split('-')[1]));
                    }
                    else if (record.id === 'OU_GROUP') {
                        groups.push(record.id.split('-')[1]);
                    }
                    else {
                        ids.push(record.id);
                    }
                });

                if (levels.length) {
                    toolMenu.clickHandler('level');
                    organisationUnitLevel.setValue(levels);
                }
                else if (groups.length) {
                    toolMenu.clickHandler('group');
                    organisationUnitGroup.setValue(groups);
                }
                else {
                    toolMenu.clickHandler('orgunit');
                    userOrganisationUnit.setValue(isOu);
                    userOrganisationUnitChildren.setValue(isOuc);
                    userOrganisationUnitGrandChildren.setValue(isOugc);
                }

                if (!(isOu || isOuc || isOugc)) {
                    if (isObject(parentGraphMap)) {
                        treePanel.selectGraphMap(parentGraphMap);
                    }
                }
            }
            else {
                this.clearDimension(true);
            }
        },
        getDimension: function() {
            var r = treePanel.getSelectionModel().getSelection(),
                config = {
                    dimension: organisationUnitObjectName,
                    items: []
                };

            if (toolMenu.menuValue === 'orgunit') {
                if (userOrganisationUnit.getValue() || userOrganisationUnitChildren.getValue() || userOrganisationUnitGrandChildren.getValue()) {
                    if (userOrganisationUnit.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT',
                            name: ''
                        });
                    }
                    if (userOrganisationUnitChildren.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT_CHILDREN',
                            name: ''
                        });
                    }
                    if (userOrganisationUnitGrandChildren.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT_GRANDCHILDREN',
                            name: ''
                        });
                    }
                }
                else {
                    for (var i = 0; i < r.length; i++) {
                        config.items.push({id: r[i].data.id});
                    }
                }
            }
            else if (toolMenu.menuValue === 'level') {
                var levels = organisationUnitLevel.getValue();

                for (var i = 0; i < levels.length; i++) {
                    config.items.push({
                        id: 'LEVEL-' + levels[i],
                        name: ''
                    });
                }

                for (var i = 0; i < r.length; i++) {
                    config.items.push({
                        id: r[i].data.id,
                        name: ''
                    });
                }
            }
            else if (toolMenu.menuValue === 'group') {
                var groupIds = organisationUnitGroup.getValue();

                for (var i = 0; i < groupIds.length; i++) {
                    config.items.push({
                        id: 'OU_GROUP-' + groupIds[i],
                        name: ''
                    });
                }

                for (var i = 0; i < r.length; i++) {
                    config.items.push({
                        id: r[i].data.id,
                        name: ''
                    });
                }
            }

            return config.items.length ? config : null;
        },
        onExpand: function() {
            var accordionHeight = westRegion.hasScrollbar ? uiConfig.west_scrollbarheight_accordion_organisationunit : uiConfig.west_maxheight_accordion_organisationunit;

            accordion.setThisHeight(accordionHeight);

            treePanel.setHeight(this.getHeight() - uiConfig.west_fill_accordion_organisationunit);
        },
        items: [
            {
                layout: 'column',
                bodyStyle: 'border:0 none',
                style: 'padding-bottom:1px',
                items: [
                    toolPanel,
                    {
                        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding - 37,
                        layout: 'column',
                        bodyStyle: 'border:0 none',
                        items: [
                            userOrganisationUnit,
                            userOrganisationUnitChildren,
                            userOrganisationUnitGrandChildren,
                            organisationUnitLevel,
                            organisationUnitGroup
                        ]
                    }
                ]
            },
            treePanel
        ],
        listeners: {
            added: function() {
                accordionPanels.push(this);
            },
            expand: function(p) {
                p.onExpand();
            }
        }
    };

    // dimensions

    var getDimensionPanel = function(dimension, iconCls) {
        var onSelect,
            availableStore,
            selectedStore,
            dataLabel,
            dataSearch,
            dataFilter,
            selectedAll,
            available,
            selected,
            onSelectAll,
            panel,

            createPanel,
            getPanels;

        onSelect = function() {
            var win = uiManager.get('layoutWindow');

            if (selectedStore.getRange().length || selectedAll.getValue()) {
                win.addDimension({id: dimension.id, name: dimension.name});
            }
            else if (win.hasDimension(dimension.id)) {
                win.removeDimension(dimension.id);
            }
        };

        availableStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            lastPage: null,
            nextPage: 1,
            isPending: false,
            isLoaded: false,
            reset: function() {
                this.removeAll();
                this.lastPage = null;
                this.nextPage = 1;
                this.isPending = false;
                dataSearch.hideFilter();
            },
            storage: {},
            addToStorage: function(dimensionId, filter, data) {
                filter = 'cache_' + (isString(filter) || isNumber(filter) ? filter : '');

                if (!dimensionId) {
                    return;
                }

                if (!this.storage.hasOwnProperty(dimensionId)) {
                    this.storage[dimensionId] = {};
                }

                if (!this.storage[dimensionId][filter]) {
                    this.storage[dimensionId][filter] = data;
                }
            },
            getFromStorage: function(dimensionId, filter) {
                filter = 'cache_' + (isString(filter) || isNumber(filter) ? filter : '');

                if (this.storage.hasOwnProperty(dimensionId)) {
                    if (this.storage[dimensionId].hasOwnProperty(filter)) {
                        return this.storage[dimensionId][filter];
                    }
                }

                return;
            },
            loadPage: function(filter, append, noPaging, fn) {
                var store = this,
                    params = {},
                    url,
                    cacheData;

                filter = filter || dataFilter.getValue() || null;

                // check session cache
                cacheData = store.getFromStorage(dimension.id, filter);

                if (!append && cacheData) {
                    store.loadStore(cacheData, {}, append, fn);
                }
                else {
                    if (!append) {
                        this.lastPage = null;
                        this.nextPage = 1;
                    }

                    if (store.nextPage === store.lastPage) {
                        return;
                    }

                    url = '/dimensions/' + dimension.id + '/items.json?fields=id,' + displayPropertyUrl + (filter ? '&filter=' + displayProperty + ':ilike:' + filter : '');

                    if (noPaging) {
                        params.paging = false;
                    }
                    else {
                        params.page = store.nextPage;
                        params.pageSize = 50;
                    }

                    store.isPending = true;
                    uiManager.mask(available.boundList);

                    Ext.Ajax.request({
                        url: encodeURI(path + '/api' + url),
                        method: 'GET',
                        params: params,
                        success: function(r) {
                            var response = Ext.decode(r.responseText),
                                data = response.items || [],
                                pager = response.pager;

                            // add to session cache
                            store.addToStorage(dimension.id, filter, data);

                            store.loadStore(data, pager, append, fn);
                        },
                        callback: function() {
                            store.isPending = false;
                            uiManager.unmask(available.boundList);
                        }
                    });
                }
            },
            loadStore: function(data, pager, append, fn) {
                pager = pager || {};

                this.loadData(data, append);
                this.lastPage = this.nextPage;

                if (pager.pageCount > this.nextPage) {
                    this.nextPage++;
                }

                this.isPending = false;

                uiManager.msFilterAvailable({store: availableStore}, {store: selectedStore});

                if (fn) {
                    fn();
                }
            },
            sortStore: function() {
                this.sort('name', 'ASC');
            }
        });

        selectedStore = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: [],
            listeners: {
                add: function() {
                    onSelect();
                },
                remove: function() {
                    onSelect();
                },
                clear: function() {
                    onSelect();
                }
            }
        });

        dataLabel = Ext.create('Ext.form.Label', {
            text: i18n.available,
            cls: 'ns-toolbar-multiselect-left-label',
            style: 'margin-right:5px'
        });

        dataSearch = Ext.create('Ext.button.Button', {
            width: 22,
            height: 22,
            cls: 'ns-button-icon',
            iconCls: 'ns-button-icon-search',
            showFilter: function() {
                dataLabel.hide();
                this.hide();
                dataFilter.show();
                dataFilter.reset();
            },
            hideFilter: function() {
                dataLabel.show();
                this.show();
                dataFilter.hide();
                dataFilter.reset();
            },
            handler: function() {
                this.showFilter();
            }
        });

        dataFilter = Ext.create('Ext.form.field.Trigger', {
            cls: 'ns-trigger-filter',
            emptyText: 'Filter available..',
            height: 22,
            hidden: true,
            enableKeyEvents: true,
            fieldStyle: 'height:22px; border-right:0 none',
            style: 'height:22px',
            onTriggerClick: function() {
                this.reset();
                this.onKeyUpHandler();

                dataSearch.hideFilter();
            },
            onKeyUpHandler: function() {
                var value = this.getValue(),
                    store = availableStore;

                if (isString(value) || isNumber(value)) {
                    store.loadPage(value, false, true);
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

        selectedAll = Ext.create('Ext.form.field.Checkbox', {
            cls: 'ns-checkbox',
            style: 'margin-left: 2px; margin-right: 5px',
            boxLabel: 'All',
            listeners: {
                change: function(chb, newVal) {
                    onSelectAll(newVal);
                }
            }
        });

        available = Ext.create('Ext.ux.form.MultiSelect', {
            cls: 'ns-toolbar-multiselect-left',
            width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
            valueField: 'id',
            displayField: 'name',
            store: availableStore,
            tbar: [
                dataLabel,
                dataSearch,
                dataFilter,
                '->',
                {
                    xtype: 'button',
                    iconCls: 'ns-button-icon-arrowright',
                    width: 22,
                    handler: function() {
                        uiManager.msSelect(available, selected);
                    }
                },
                {
                    xtype: 'button',
                    iconCls: 'ns-button-icon-arrowrightdouble',
                    width: 22,
                    handler: function() {
                        availableStore.loadPage(null, null, true, function() {
                            uiManager.msSelectAll(available, selected);
                        });
                    }
                }
            ],
            listeners: {
                render: function(ms) {
                    var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                    el.addEventListener('scroll', function(e) {
                        if (uiManager.isScrolled(e) && !availableStore.isPending) {
                            availableStore.loadPage(null, true);
                        }
                    });

                    ms.boundList.on('itemdblclick', function() {
                        uiManager.msSelect(available, selected);
                    }, ms);
                }
            }
        });

        selected = Ext.create('Ext.ux.form.MultiSelect', {
            cls: 'ns-toolbar-multiselect-right',
            width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
            valueField: 'id',
            displayField: 'name',
            ddReorder: true,
            store: selectedStore,
            tbar: [
                {
                    xtype: 'button',
                    iconCls: 'ns-button-icon-arrowleftdouble',
                    width: 22,
                    handler: function() {
                        uiManager.msUnselectAll(available, selected);
                    }
                },
                {
                    xtype: 'button',
                    iconCls: 'ns-button-icon-arrowleft',
                    width: 22,
                    handler: function() {
                        uiManager.msUnselect(available, selected);
                    }
                },
                '->',
                {
                    xtype: 'label',
                    text: i18n.selected,
                    cls: 'ns-toolbar-multiselect-right-label'
                },
                selectedAll
            ],
            listeners: {
                afterrender: function() {
                    this.boundList.on('itemdblclick', function() {
                        uiManager.msUnselect(available, selected);
                    }, this);
                }
            }
        });

        onSelectAll = function(value) {
            if (available.boundList && selected.boundList) {
                if (value) {
                    available.boundList.disable();
                    selected.boundList.disable();
                }
                else {
                    available.boundList.enable();
                    selected.boundList.enable();
                }
            }

            onSelect();
        };

        panel = {
            xtype: 'panel',
            title: '<div class="' + iconCls + '">' + dimension.name + '</div>',
            hideCollapseTool: true,
            dimension: dimension.id,
            availableStore: availableStore,
            selectedStore: selectedStore,
            selectedAll: selectedAll,
            clearDimension: function() {
                availableStore.reset();
                selectedStore.removeAll();
                selectedAll.setValue(false);
            },
            setDimension: function(layout) {
                if (layout.hasDimension(this.dimension, true)) {
                    var records = layout.getDimension(this.dimension).getRecords();

                    if (records.length) {
                        selectedStore.add(records);
                        uiManager.msFilterAvailable({store: availableStore}, {store: selectedStore});
                    }
                    else {
                        selectedAll.setValue(true);
                    }
                }
            },
            getDimension: function() {
                var config = {};

                if (dimension.id) {
                    config.dimension = dimension.id;
                }

                if (selectedStore.getRange().length) {
                    config.items = [];

                    selectedStore.each( function(r) {
                        config.items.push({id: r.data.id});
                    });
                }

                return config.dimension ? config : null;
            },
            onExpand: function() {

                // load items
                if (!availableStore.isLoaded) {
                    availableStore.loadPage();
                }

                // enable/disable ui
                if (selectedAll.getValue()) {
                    available.boundList.disable();
                    selected.boundList.disable();
                }

                // set height
                var accordionHeight = westRegion.hasScrollbar ? uiConfig.west_scrollbarheight_accordion_group : uiConfig.west_maxheight_accordion_group;

                accordion.setThisHeight(accordionHeight);

                uiManager.msSetHeight(
                    [available, selected],
                    this,
                    uiConfig.west_fill_accordion_group
                );
            },
            items: [
                {
                    xtype: 'panel',
                    layout: 'column',
                    bodyStyle: 'border-style:none',
                    items: [
                        available,
                        selected
                    ]
                }
            ],
            listeners: {
                added: function() {
                    accordionPanels.push(this);
                },
                expand: function(p) {
                    p.onExpand();
                }
            }
        };

        return panel;
    };

    var getDimensionPanels = function(dimensions, iconCls) {
        var panels = [];

        for (var i = 0, panel; i < dimensions.length; i++) {
            panels.push(getDimensionPanel(dimensions[i], iconCls));
        }

        return panels;
    };

    // viewport

    var westRegionPanels = [];

    var accordionBody = Ext.create('Ext.panel.Panel', {
        layout: 'accordion',
        activeOnTop: true,
        cls: 'ns-accordion',
        bodyStyle: 'border:0 none; margin-bottom:2px',
        height: 700,
        dimensionPanels: null,
        items: function() {
            var panels = [
                data,
                period,
                organisationUnit
            ],
            dims = clone(appManager.dimensions),
            dimPanels = getDimensionPanels(dims, 'ns-panel-title-dimension'),
            last;

            // idPanelMap
            for (var i = 0, dimPanel; i < dimPanels.length; i++) {
                dimPanel = dimPanels[i];

                dimensionPanelMap[dimPanel.dimension] = dimPanel;
            }

            // panels
            panels = panels.concat(dimPanels);

            // last cls
            panels[panels.length - 1].cls = 'ns-accordion-last';

            westRegionPanels = panels;

            return panels;
        }()
    });
    uiManager.reg(accordionBody, 'accordionBody');

    var accordion = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; border-top:1px solid #d6d6d6; padding:1px; padding-bottom:0; overflow-y:scroll;',
        items: accordionBody,
        panels: accordionPanels,
        setThisHeight: function(mx) {
            var panelHeight = this.panels.length * 28,
                height;

            if (westRegion.hasScrollbar) {
                height = panelHeight + mx;
                this.setHeight(westRegion.getHeight() - 2);
                accordionBody.setHeight(height - 2);
            }
            else {
                height = westRegion.getHeight() - uiConfig.west_fill;
                mx += panelHeight;
                accordion.setHeight((height > mx ? mx : height) - 2);
                accordionBody.setHeight((height > mx ? mx : height) - 4);
            }
        },
        getExpandedPanel: function() {
            for (var i = 0, panel; i < this.panels.length; i++) {
                if (!this.panels[i].collapsed) {
                    return this.panels[i];
                }
            }

            return null;
        },
        getFirstPanel: function() {
            return this.panels[0];
        }
    });
    uiManager.reg(accordion, 'accordion');

    var westRegion = Ext.create('Ext.panel.Panel', {
        region: 'west',
        preventHeader: true,
        collapsible: true,
        collapseMode: 'mini',
        border: false,
        width: uiConfig.west_width + uiManager.getScrollbarSize().width,
        items: accordion,
        setState: function(layout) {
            setUiState(layout);
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
                            openDataDump('csv', 'ID');
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
                                    openDataDump('csv', 'ID');
                                }
                            },
                            {
                                text: 'Code',
                                iconCls: 'ns-menu-item-scheme',
                                handler: function() {
                                    openDataDump('csv', 'CODE');
                                }
                            },
                            {
                                text: 'Name',
                                iconCls: 'ns-menu-item-scheme',
                                handler: function() {
                                    openDataDump('csv', 'NAME');
                                }
                            }
                        ]
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

    var layoutButton = Ext.create('Ext.button.Button', {
        text: 'Layout',
        menu: {},
        handler: function() {
            var name = 'layoutWindow';
            (uiManager.get(name) || uiManager.reg(LayoutWindow(c), name)).show();
        }
    });
    uiManager.reg(layoutButton, 'layoutButton');

    var optionsButton = Ext.create('Ext.button.Button', {
        text: i18n.options,
        menu: {},
        handler: function() {
            var name = 'optionsWindow';
            (uiManager.get(name) || uiManager.reg(OptionsWindow(c), name)).show();
        }
    });
    uiManager.reg(optionsButton, 'optionsButton');

    var openTableLayoutTab = function(layout, type, isNewTab) {
        type = type || 'xls';

        var url = layout.req(null, type, false, true).url();
        var target = isNewTab ? '_blank' : '_top';

        window.open(url, target);
    };

    var openPlainDataSource = function(url, extraParamString, isNewTab) {
        url = (isString(url) ? url : url.url()) + (extraParamString || '');
        var target = isNewTab ? '_blank' : '_top';

        window.open(url, target);
    };

    var openDataDump = function(format, scheme, isNewTab) {
        var layout = instanceManager.getLayout();

        if (layout) {
            format = format || 'csv';
            scheme = scheme || 'ID';

            var url = layout.req(null, format).url('&outputIdScheme=' + scheme);
            var target = isNewTab ? '_blank' : '_top';

            window.open(url, target);
        }
    };

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
                    var sqlReq = layout.req('/api/analytics/debug/sql', 'sql');

                    var items = [
                        {
                            xtype: 'label',
                            text: i18n.table_layout,
                            style: 'padding:7px 5px 5px 7px; font-weight:bold; border:0 none'
                        },
                        {
                            text: 'Microsoft Excel (.xls)',
                            iconCls: 'ns-menu-item-tablelayout',
                            handler: function() {
                                openTableLayoutTab(layout, 'xls');
                            }
                        },
                        {
                            text: 'CSV (.csv)',
                            iconCls: 'ns-menu-item-tablelayout',
                            handler: function() {
                                openTableLayoutTab(layout, 'csv');
                            }
                        },
                        {
                            text: 'HTML (.html)',
                            iconCls: 'ns-menu-item-tablelayout',
                            handler: function() {
                                openTableLayoutTab(layout, 'html+css', true);
                            }
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
                                openPlainDataSource(jsonReq, null, true);
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
                                        openPlainDataSource(jsonReq, '&outputIdScheme=ID', true);
                                    }
                                },
                                {
                                    text: 'Code',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        openPlainDataSource(jsonReq, '&outputIdScheme=CODE', true);
                                    }
                                },
                                {
                                    text: 'Name',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        openPlainDataSource(jsonReq, '&outputIdScheme=NAME', true);
                                    }
                                }
                            ]
                        },
                        {
                            text: 'XML',
                            iconCls: 'ns-menu-item-datasource',
                            handler: function() {
                                openPlainDataSource(xmlReq, null, true);
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
                                        openPlainDataSource(xmlReq, '&outputIdScheme=ID', true);
                                    }
                                },
                                {
                                    text: 'Code',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        openPlainDataSource(xmlReq, '&outputIdScheme=CODE', true);
                                    }
                                },
                                {
                                    text: 'Name',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        openPlainDataSource(xmlReq, '&outputIdScheme=NAME', true);
                                    }
                                }
                            ]
                        },
                        {
                            text: 'Microsoft Excel',
                            iconCls: 'ns-menu-item-datasource',
                            handler: function() {
                                openPlainDataSource(xlsReq);
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
                                        openPlainDataSource(xlsReq, '&outputIdScheme=ID');
                                    }
                                },
                                {
                                    text: 'Code',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        openPlainDataSource(xlsReq, '&outputIdScheme=CODE');
                                    }
                                },
                                {
                                    text: 'Name',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        openPlainDataSource(xlsReq, '&outputIdScheme=NAME');
                                    }
                                }
                            ]
                        },
                        {
                            text: 'CSV',
                            iconCls: 'ns-menu-item-datasource',
                            handler: function() {
                                openPlainDataSource(csvReq);
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
                                        openPlainDataSource(csvReq, '&outputIdScheme=ID');
                                    }
                                },
                                {
                                    text: 'Code',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        openPlainDataSource(csvReq, '&outputIdScheme=CODE');
                                    }
                                },
                                {
                                    text: 'Name',
                                    iconCls: 'ns-menu-item-scheme',
                                    handler: function() {
                                        openPlainDataSource(csvReq, '&outputIdScheme=NAME');
                                    }
                                }
                            ]
                        },
                        {
                            text: 'Advanced',
                            iconCls: 'ns-menu-item-advanced',
                            menu: [
                                {
                                    text: 'JRXML',
                                    iconCls: 'ns-menu-item-datasource',
                                    handler: function() {
                                        openPlainDataSource(jrxmlReq, null, true);
                                    }
                                },
                                {
                                    text: 'Raw data SQL',
                                    iconCls: 'ns-menu-item-datasource',
                                    handler: function() {
                                        openPlainDataSource(sqlReq, null, true);
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
            for (var i = 0; i < this.cmp.length; i++) {
                if (show) {
                    this.cmp[i].show();
                }
                else {
                    this.cmp[i].hide();
                }
            }
        },
        tbar: {
            defaults: {
                height: 26
            },
            items: [
                {
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
                defaultButton,
                {
                    text: i18n.chart,
                    iconCls: 'ns-button-icon-chart',
                    toggleGroup: 'module',
                    menu: {},
                    handler: function(b) {
                        b.menu = Ext.create('Ext.menu.Menu', {
                            closeAction: 'destroy',
                            shadow: false,
                            showSeparator: false,
                            items: [
                                {
                                    text: i18n.go_to_charts + '&nbsp;&nbsp;',
                                    cls: 'ns-menu-item-noicon',
                                    listeners: {
                                        render: function(b) {
                                            this.getEl().dom.addEventListener('click', function(e) {
                                                if (!b.disabled) {
                                                    uiManager.redirectCtrl(path + '/dhis-web-visualizer', e);
                                                }
                                            });
                                        }
                                    }
                                },
                                '-',
                                {
                                    text: i18n.open_this_table_as_chart + '&nbsp;&nbsp;',
                                    cls: 'ns-menu-item-noicon',
                                    disabled: !(instanceManager.isStateCurrent()),
                                    listeners: {
                                        render: function(b) {
                                            this.getEl().dom.addEventListener('click', function(e) {
                                                if (!b.disabled) {
                                                    var layout = instanceManager.getStateCurrent();
                                                    layout.parentGraphMap = treePanel.getParentGraphMap();

                                                    sessionStorageManager.set(layout, 'analytical');

                                                    if (sessionStorageManager.supported) {
                                                        uiManager.redirectCtrl(path + '/dhis-web-visualizer/index.html?s=analytical', e);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                },
                                {
                                    text: i18n.open_last_chart + '&nbsp;&nbsp;',
                                    cls: 'ns-menu-item-noicon',
                                    disabled: !sessionStorageManager.get('chart'),
                                    listeners: {
                                        render: function(b) {
                                            this.getEl().dom.addEventListener('click', function(e) {
                                                if (!b.disabled) {
                                                    uiManager.redirectCtrl(path + '/dhis-web-visualizer/index.html?s=chart', e);
                                                }
                                            });
                                        }
                                    }
                                }
                            ],
                            listeners: {
                                show: function() {
                                    uiManager.setAnchorPosition(b.menu, b);
                                },
                                hide: function() {
                                    b.menu.destroy();
                                    defaultButton.toggle();
                                },
                                destroy: function(m) {
                                    b.menu = null;
                                }
                            }
                        });

                        b.menu.show();
                    },
                    listeners: {
                        render: function() {
                            centerRegion.cmp.push(this);
                        }
                    }
                },
                {
                    text: i18n.map,
                    iconCls: 'ns-button-icon-map',
                    toggleGroup: 'module',
                    menu: {},
                    handler: function(b) {
                        b.menu = Ext.create('Ext.menu.Menu', {
                            closeAction: 'destroy',
                            shadow: false,
                            showSeparator: false,
                            items: [
                                {
                                    text: i18n.go_to_maps + '&nbsp;&nbsp;',
                                    cls: 'ns-menu-item-noicon',
                                    listeners: {
                                        render: function(b) {
                                            this.getEl().dom.addEventListener('click', function(e) {
                                                if (!b.disabled) {
                                                    uiManager.redirectCtrl(path + '/dhis-web-mapping', e);
                                                }
                                            });
                                        }
                                    }
                                },
                                '-',
                                {
                                    text: i18n.open_this_table_as_map + '&nbsp;&nbsp;',
                                    cls: 'ns-menu-item-noicon',
                                    disabled: !(instanceManager.isStateCurrent()),
                                    listeners: {
                                        render: function(b) {
                                            this.getEl().dom.addEventListener('click', function(e) {
                                                if (!b.disabled) {
                                                    var layout = instanceManager.getStateCurrent();
                                                    layout.parentGraphMap = treePanel.getParentGraphMap();

                                                    sessionStorageManager.set(layout, 'analytical');

                                                    if (sessionStorageManager.supported) {
                                                        uiManager.redirectCtrl(path + '/dhis-web-mapping/index.html?s=analytical', e);
                                                    }
                                                }
                                            });
                                        }
                                    }
                                },
                                {
                                    text: i18n.open_last_map + '&nbsp;&nbsp;',
                                    cls: 'ns-menu-item-noicon',
                                    disabled: !sessionStorageManager.get('chart'),
                                    listeners: {
                                        render: function(b) {
                                            this.getEl().dom.addEventListener('click', function(e) {
                                                if (!b.disabled) {
                                                    uiManager.redirectCtrl(path + '/dhis-web-mapping/index.html?s=chart', e);
                                                }
                                            });
                                        }
                                    }
                                }
                            ],
                            listeners: {
                                show: function() {
                                    uiManager.setAnchorPosition(b.menu, b);
                                },
                                hide: function() {
                                    b.menu.destroy();
                                    defaultButton.toggle();
                                },
                                destroy: function(m) {
                                    b.menu = null;
                                }
                            }
                        });

                        b.menu.show();
                    },
                    listeners: {
                        render: function() {
                            centerRegion.cmp.push(this);
                        }
                    }
                }
            ]
        },
        listeners: {
            afterrender: function(p) {
                p.update(uiManager.getIntroHtml());
            },
            resize: function() {
                var width = this.getWidth();

                if (width < 700 && this.fullSize) {
                    this.toggleCmp(false);
                    this.fullSize = false;
                }
                else if (width >= 700 && !this.fullSize) {
                    this.toggleCmp(true);
                    this.fullSize = true;
                }
            }
        }
    });
    uiManager.reg(centerRegion, 'centerRegion');

    var setUiState = function(layout) {
        var layoutWindow = uiManager.get('layoutWindow'),
            optionsWindow = uiManager.get('optionsWindow');

        // clear panels
        westRegionPanels.forEach(function(panel) {
            panel.clearDimension(!!layout);
        });

        if (layout) {
            var graphMap = layout.parentGraphMap,
                co = dimensionConfig.get('category');

            // panels
            westRegionPanels.forEach(function(panel) {
                panel.setDimension(layout);
            });

            // layout window
            if (layoutWindow) {
                layoutWindow.reset(true);
                layoutWindow.setDimensions(layout);
            }

                // add assigned categories as dimension
            if (!layoutWindow.hasDimension(co.dimensionName)) {
                layoutWindow.addDimension({
                    id: co.dimensionName,
                    name: co.name
                }, layoutWindow.dimensionStore);
            }

            // options window
            if (optionsWindow) {
                optionsWindow.setOptions(layout);
            }
        }
        else {
            layoutWindow.reset();
            optionsWindow.reset();
        }
    };

    var getUiState = function() {
        var layoutWindow = uiManager.get('layoutWindow'),
            optionsWindow = uiManager.get('optionsWindow');

        var columnDimNames = layoutWindow.colStore.getDimensionNames(),
            rowDimNames = layoutWindow.rowStore.getDimensionNames(),
            filterDimNames = layoutWindow.filterStore.getDimensionNames(),
            config = optionsWindow.getOptions(),
            dx = dimensionConfig.get('data').dimensionName,
            co = dimensionConfig.get('category').dimensionName,
            nameDimArrayMap = {};

        config.columns = [];
        config.rows = [];
        config.filters = [];

        // panel data
        for (var i = 0, dim, dimName; i < accordionPanels.length; i++) {
            dim = accordionPanels[i].getDimension();

            if (dim) {
                nameDimArrayMap[dim.dimension] = [dim];
            }
        }

        // columns, rows, filters
        for (var i = 0, nameArrays = [columnDimNames, rowDimNames, filterDimNames], axes = [config.columns, config.rows, config.filters], dimNames; i < nameArrays.length; i++) {
            dimNames = nameArrays[i];

            for (var j = 0, dimName, dim; j < dimNames.length; j++) {
                dimName = dimNames[j];

                if (dimName === co) {
                    axes[i].push({
                        dimension: co,
                        items: []
                    });
                }
                else if (dimName === dx && nameDimArrayMap.hasOwnProperty(dimName) && nameDimArrayMap[dimName]) {
                    for (var k = 0; k < nameDimArrayMap[dx].length; k++) {
                        axes[i].push(Ext.clone(nameDimArrayMap[dx][k]));

                        // TODO program
                        if (nameDimArrayMap[dx][k].program) {
                            config.program = nameDimArrayMap[dx][k].program;
                        }
                    }
                }
                else if (nameDimArrayMap.hasOwnProperty(dimName) && nameDimArrayMap[dimName]) {
                    for (var k = 0; k < nameDimArrayMap[dimName].length; k++) {
                        axes[i].push(Ext.clone(nameDimArrayMap[dimName][k]));
                    }
                }
            }
        }

        config.parentGraphMap = treePanel.getParentGraphMap();

        return config;
    };

    var viewport = Ext.create('Ext.container.Viewport', {
        layout: 'border',
        period: period,
        treePanel: treePanel,
        getUiState: getUiState,
        setUiState: setUiState,
        westRegion: westRegion,
        centerRegion: centerRegion,
        northRegion: northRegion,
        items: arrayClean([westRegion, centerRegion, northRegion]),
        listeners: {
            afterrender: function() {

                // resize event handler
                westRegion.on('resize', function() {
                    var panel = accordion.getExpandedPanel();

                    if (panel) {
                        panel.onExpand();
                    }
                });

                // left gui
                var viewportHeight = uiManager.get('centerRegion').getHeight(),
                    numberOfTabs = appManager.dimensions.length + 3,
                    tabHeight = 28,
                    minPeriodHeight = 380;

                if (viewportHeight > numberOfTabs * tabHeight + minPeriodHeight) {
                    if (!isIE) {
                        accordion.setAutoScroll(false);
                        westRegion.setWidth(uiConfig.west_width);
                        accordion.doLayout();
                    }
                }
                else {
                    westRegion.hasScrollbar = true;
                }

                // north
                if (northRegion) {
                    northRegion.setLogoWidth(centerRegion.getPosition()[0]);
                }

                // expand first panel
                accordion.getFirstPanel().expand();

                // look for url params
                var id = appManager.getUrlParam('id'),
                    session = appManager.getUrlParam('s'),
                    layout;

                if (id) {
                    instanceManager.getById(id);
                }
                else if (isString(session) && sessionStorageManager.get(session)) {
                    layout = new Layout(sessionStorageManager.get(session));

                    if (layout) {
                        instanceManager.getReport(layout);
                    }
                }

                // remove params from url
                if (id || session) {
                    history.pushState(null, null, '.')
                }

                var initEl = document.getElementById('init');
                initEl.parentNode.removeChild(initEl);

                Ext.getBody().setStyle('background', '#fff');
                Ext.getBody().setStyle('opacity', 0);

                // fade in
                Ext.defer( function() {
                    Ext.getBody().fadeIn({
                        duration: 600
                    });
                }, 300 );
            }
        }
    });
    uiManager.reg(viewport, 'viewport');

    // add listeners
    (function() {
        indicatorAvailableStore.on('load', function() {
            uiManager.msFilterAvailable(indicatorAvailable, indicatorSelected);
        });

        dataElementAvailableStore.on('load', function() {
            uiManager.msFilterAvailable(dataElementAvailable, dataElementSelected);
        });

        dataSetAvailableStore.on('load', function(store) {
            uiManager.msFilterAvailable(dataSetAvailable, dataSetSelected);
            store.sort('name', 'ASC');
        });
    }());

    return viewport;
};
