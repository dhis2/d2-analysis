import clone from 'd2-utilizr/lib/clone';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arraySort from 'd2-utilizr/lib/arraySort';
import isArray from 'd2-utilizr/lib/isArray';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isNumber from 'd2-utilizr/lib/isNumber';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';

export var WestRegionTrackerItems;

WestRegionTrackerItems = function(c) {
    var t = this,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        appManager = c.appManager,
        i18nManager = c.i18nManager,
        sessionStorageManager = refs.sessionStorageManager,
        calendarManager = refs.calendarManager,
        dimensionConfig = refs.dimensionConfig,
        periodConfig = refs.periodConfig,
        uiConfig = refs.uiConfig,
        optionConfig = refs.optionConfig,
        api = refs.api;

    var dataObjectName = dimensionConfig.get('data').objectName,
        indicatorObjectName = dimensionConfig.get('indicator').objectName,
        dataElementObjectName = dimensionConfig.get('dataElement').objectName,
        operandObjectName = dimensionConfig.get('operand').objectName,
        dataSetObjectName = dimensionConfig.get('dataSet').objectName,
        eventDataItemObjectName = dimensionConfig.get('eventDataItem').objectName,
        programIndicatorObjectName = dimensionConfig.get('programIndicator').objectName,
        periodObjectName = dimensionConfig.get('period').objectName,
        organisationUnitObjectName = dimensionConfig.get('organisationUnit').objectName,

        i18n = i18nManager.get(),
        path = appManager.getPath(),
        apiPath = appManager.getApiPath(),

        displayProperty = appManager.getDisplayProperty(),
        displayPropertyUrl = appManager.getDisplayPropertyUrl(),

        dimensionPanelMap = {};

    // stores

    var programStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        proxy: {
            type: 'ajax',
            url: encodeURI(apiPath + '/api/programs.json?fields=id,' + displayPropertyUrl + '&paging=false'),
            reader: {
                type: 'json',
                root: 'programs'
            },
            pageParam: false,
            startParam: false,
            limitParam: false
        },
        sortInfo: {field: 'name', direction: 'ASC'},
        isLoaded: false,
        listeners: {
            load: function() {
                if (!this.isLoaded) {
                    this.isLoaded = true;
                }
            }
        }
    });

    var stagesByProgramStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        isLoaded: false,
        listeners: {
            load: function() {
                if (!this.isLoaded) {
                    this.isLoaded = true;
                }
                this.sort('name', 'ASC');
            }
        }
    });

    var dataElementsByStageStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'isAttribute', 'isProgramIndicator'],
        data: [],
        sorters: [{
            property: 'name',
            direction: 'ASC'
        }],
        onLoadData: function() {

            // layout window
            var layoutWindow = uiManager.get('aggregateLayoutWindow');

            this.each(function(record) {
                if (arrayContains(dimensionConfig.valueType['numericTypes'], record.data.valueType)) {
                    layoutWindow.valueStore.add(record.data);
                }
            });

            //this.toggleProgramIndicators();
        },
        toggleProgramIndicators: function(type) {
            type = type || uiManager.get('dataTypeToolbar').getType();

            this.clearFilter();

            if (type === finalsDataTypeConf.aggregated_values) {
                this.filterBy(function(record) {
                    return !record.data.isProgramIndicator;
                });
            }
        }
    });

    var organisationUnitGroupStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        proxy: {
            type: 'ajax',
            url: encodeURI(apiPath + '/api/organisationUnitGroups.json?fields=id,' + ns.core.init.displayPropertyUrl + '&paging=false'),
            reader: {
                type: 'json',
                root: 'organisationUnitGroups'
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

    // components

        // data element
    var onTypeClick = function(type) {

        // available
        dataElementsByStageStore.toggleProgramIndicators(type);

        // selected
        dataElementSelected.toggleProgramIndicators(type);
    };

    var setLayout = function(layout) {
        var recMap = layout.getDimensionNameRecordIdsMap();

        var fixedPeriodRecords = [],
            peRecords = recMap[periodObjectName] || [],
            ouRecords = recMap[organisationUnitObjectName] || [],
            graphMap = layout.parentGraphMap,
            isOu = false,
            isOuc = false,
            isOugc = false,
            levels = [],
            groups = [],
            winMap = {},
            optionsWindow;

        winMap[dimensionConfig.dataType['aggregated_values']] = uiManager.get('aggregateOptionsWindow');
        winMap[dimensionConfig.dataType['individual_cases']] = uiManager.get('queryOptionsWindow');

        optionsWindow = winMap[layout.dataType];

        // set layout

        reset();

        uiManager.get('typeToolbar').setType(layout.dataType);
        uiManager.get('aggregateLayoutWindow').reset();
        uiManager.get('queryLayoutWindow').reset();

        // data
        programStore.add(layout.program);
        program.setValue(layout.program.id);

        // periods
        period.reset();

        if (layout.startDate && layout.endDate) {
            onPeriodModeSelect('dates');
            startDate.setValue(layout.startDate);
            endDate.setValue(layout.endDate);
        }
        else {
            onPeriodModeSelect('periods');
        }

        peRecords.forEach(function(peRecord) {
            var checkbox = relativePeriodCmpMap[peRecord.id];

            if (checkbox) {
                checkbox.setValue(true);
            }
            else {
                fixedPeriodRecords.push(peRecord);
            }
        });

        fixedPeriodSelectedStore.add(fixedPeriodRecords);

        // organisation units
        if (ouRecords) {
            for (var i = 0; i < ouRecords.length; i++) {
                if (ouRecords[i].id === 'USER_ORGUNIT') {
                    isOu = true;
                }
                else if (ouRecords[i].id === 'USER_ORGUNIT_CHILDREN') {
                    isOuc = true;
                }
                else if (ouRecords[i].id === 'USER_ORGUNIT_GRANDCHILDREN') {
                    isOugc = true;
                }
                else if (ouRecords[i].id.substr(0,5) === 'LEVEL') {
                    levels.push(parseInt(ouRecords[i].id.split('-')[1]));
                }
                else if (ouRecords[i].id.substr(0,8) === 'OU_GROUP') {
                    groups.push(ouRecords[i].id.split('-')[1]);
                }
            }

            if (levels.length) {
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
                if (isObject(graphMap)) {
                    treePanel.selectGraphMap(graphMap);
                }
            }
        }
        else {
            treePanel.reset();
        }

        // dimensions
        for (var key in dimensionIdSelectedStoreMap) {
            if (dimensionIdSelectedStoreMap.hasOwnProperty(key)) {
                var a = dimensionIdAvailableStoreMap[key],
                    s = dimensionIdSelectedStoreMap[key];

                if (s.getCount() > 0) {
                    a.reset();
                    s.removeAll();
                }

                if (recMap[key]) {
                    s.add(recMap[key]);
                    ns.core.web.multiSelect.filterAvailable({store: a}, {store: s});
                }
            }
        }

        // options
        if (optionsWindow) {
            optionsWindow.setOptions(layout);
        }

        // data items
        onProgramSelect(layout.program.id, layout);
    };

    var program = Ext.create('Ext.form.field.ComboBox', {
        editable: false,
        valueField: 'id',
        displayField: 'name',
        fieldLabel: 'Program',
        labelAlign: 'top',
        labelCls: 'ns-form-item-label-top',
        labelSeparator: '',
        emptyText: 'Select program',
        forceSelection: true,
        queryMode: 'remote',
        columnWidth: 0.5,
        style: 'margin:1px 1px 1px 0',
        storage: {},
        store: programStore,
        getRecord: function() {
            return this.getValue ? {
                id: this.getValue(),
                name: this.getRawValue()
            } : null;
        },
        listeners: {
            select: function(cb) {
                onProgramSelect(cb.getValue());
            }
        }
    });

    var onProgramSelect = function(programId, layout) {
        var load,
            getCategories;

        programId = layout ? layout.program.id : programId;

        // reset
        stage.clearValue();
        dataElementsByStageStore.removeAll();
        dataElementSelected.removeAllDataElements(true);
        ns.app.aggregateLayoutWindow.value.resetData();

        getCategories = function(categoryCombo) {
            if (!(isObject(categoryCombo) && isArray(categoryCombo.categories) && categoryCombo.categories.length)) {
                return;
            }

            var cats = categoryCombo.categories;

            if (cats.length === 1 && cats[0].name === 'default') {
                return;
            }

            var arraySort = ns.core.support.prototype.array.sort;

            // sort categories
            arraySort(cats);

            // sort category options
            cats.forEach(cat => {
                cat.items = cat.categoryOptions;

                if (isArray(cat.items)) {
                    arraySort(cat.items);
                }
            });

            return cats;
        };

        load = function(stages, categories) {

            // categories
            if (categories) {
                accordionBody.addItems(categories);
            }

            // stages
            stage.enable();
            stage.clearValue();

            stagesByProgramStore.removeAll();
            stagesByProgramStore.loadData(stages);

            stageId = (layout ? layout.programStage.id : null) || (stages.length === 1 ? stages[0].id : null);

            if (stageId) {
                stage.setValue(stageId);
                onStageSelect(stageId, layout);
            }
        };

        if (stageStorage.hasOwnProperty(programId)) {
            load(stageStorage[programId]);
        }
        else {
            Ext.Ajax.request({
                url: [
                    ns.core.init.contextPath + '/api/programs.json',
                    '?filter=id:eq:' + programId,
                    '&fields=programStages[id,displayName|rename(name)]',
                    ',programIndicators[id,' + namePropertyUrl + ']',
                    ',programTrackedEntityAttributes[trackedEntityAttribute[id,' + namePropertyUrl +',valueType,confidential,optionSet[id,displayName|rename(name)],legendSet[id,displayName|rename(name)]]]',
                    ',categoryCombo[id,' + namePropertyUrl + ',categories[id,' + namePropertyUrl + ',categoryOptions[id,' + namePropertyUrl + ']]]',
                    '&paging=false'
                ].join(''),
                success: function(r) {
                    var program = Ext.decode(r.responseText).programs[0],
                        stages,
                        attributes,
                        programIndicators,
                        categoryCombo,
                        stageId;

                    if (!program) {
                        return;
                    }

                    stages = program.programStages;
                    attributes = arrayPluck(program.programTrackedEntityAttributes, 'trackedEntityAttribute');
                    programIndicators = program.programIndicators;
                    categoryCombo = program.categoryCombo;

                    // filter confidential, mark as attribute
                    attributes.filter(function(item) {
                        item.isAttribute = true;
                        return !item.confidential;
                    });

                    // attributes cache
                    if (isArray(attributes) && attributes.length) {
                        attributeStorage[programId] = attributes;
                    }

                    // mark as program indicator
                    programIndicators.forEach(function(item) {
                        item.isProgramIndicator = true;
                    });

                    // program indicator cache
                    if (isArray(programIndicators) && programIndicators.length) {
                        programIndicatorStorage[programId] = programIndicators;
                    }

                    if (isArray(stages) && stages.length) {

                        // stages cache
                        stageStorage[programId] = stages;

                        load(stages, getCategories(categoryCombo));
                    }
                }
            });
        }
    };

    var stage = Ext.create('Ext.form.field.ComboBox', {
        editable: false,
        valueField: 'id',
        displayField: 'name',
        fieldLabel: 'Stage',
        labelAlign: 'top',
        labelCls: 'ns-form-item-label-top',
        labelSeparator: '',
        emptyText: 'Select stage',
        queryMode: 'local',
        forceSelection: true,
        columnWidth: 0.5,
        style: 'margin:1px 0 1px 0',
        disabled: true,
        listConfig: {loadMask: false},
        store: stagesByProgramStore,
        getRecord: function() {
            return this.getValue() ? {
                id: this.getValue(),
                name: this.getRawValue()
            } : null;
        },
        listeners: {
            select: function(cb) {
                onStageSelect(cb.getValue());
            }
        }
    });

    var onStageSelect = function(stageId, layout) {
        if (!layout) {
            dataElementSelected.removeAllDataElements(true);
            ns.app.aggregateLayoutWindow.value.resetData();
        }

        dataElementSearch.enable();
        dataElementSearch.hideFilter();

        loadDataElements(stageId, layout);
    };

    var loadDataElements = function(stageId, layout) {
        var programId = layout ? layout.program.id : (program.getValue() || null),
            load;

        stageId = stageId || layout.programStage.id;

        load = function(dataElements) {
            var attributes = attributeStorage[programId],
                programIndicators = programIndicatorStorage[programId],
                data = arrayClean([].concat(attributes || [], programIndicators || [], dataElements || []));

            dataElementsByStageStore.loadData(data);
            dataElementsByStageStore.onLoadData();

            if (layout) {
                var dataDimensions = ns.core.service.layout.getDataDimensionsFromLayout(layout),
                    records = [];

                for (var i = 0, dim, row; i < dataDimensions.length; i++) {
                    dim = dataDimensions[i];
                    row = dataElementsByStageStore.getById(dim.dimension);

                    if (row) {
                        records.push(Ext.applyIf(dim, row.data));
                    }
                }

                selectDataElements(records, layout);
            }
        };

        // data elements
        if (dataElementStorage.hasOwnProperty(stageId)) {
            load(dataElementStorage[stageId]);
        }
        else {
            Ext.Ajax.request({
                url: ns.core.init.contextPath + '/api/programStages.json?filter=id:eq:' + stageId + '&fields=programStageDataElements[dataElement[id,' + namePropertyUrl + ',valueType,optionSet[id,displayName|rename(name)],legendSet|rename(storageLegendSet)[id,displayName|rename(name)]]]',
                success: function(r) {
                    var objects = Ext.decode(r.responseText).programStages,
                        types = ns.core.conf.valueType.tAggregateTypes,
                        dataElements;

                    if (!objects.length) {
                        load();
                        return;
                    }

                    dataElements = arrayPluck(objects[0].programStageDataElements, 'dataElement');

                    // filter non-aggregatable types
                    dataElements.filter(function(item) {
                        item.isDataElement = true;
                        return arrayContains(types, item.valueType);
                    });

                    // data elements cache
                    dataElementStorage[stageId] = dataElements;

                    load(dataElements);
                }
            });
        }
    };

    var dataElementLabel = Ext.create('Ext.form.Label', {
        text: i18n.available,
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
        width: 170,
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
            var store = dataElementsByStageStore,
                value = this.getValue(),
                name;

            if (value === '') {
                store.clearFilter();
                return;
            }

            store.filterBy(function(r) {
                name = r.data.name || '';
                return name.toLowerCase().indexOf(value.toLowerCase()) !== -1;
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

    var dataElementAvailable = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-left',
        width: accBaseWidth,
        height: 180,
        valueField: 'id',
        displayField: 'name',
        style: 'margin-bottom:1px',
        store: dataElementsByStageStore,
        tbar: [
            dataElementLabel,
            dataElementSearch,
            dataElementFilter,
            '->',
            {
                xtype: 'button',
                icon: 'images/arrowdown.png',
                width: 22,
                height: 22,
                handler: function() {
                    if (dataElementAvailable.getValue().length) {
                        selectDataElements(dataElementAvailable.getValue());
                    }
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowdowndouble.png',
                width: 22,
                height: 22,
                handler: function() {
                    if (dataElementsByStageStore.getRange().length) {
                        selectDataElements(dataElementsByStageStore.getRange());
                    }
                }
            }
        ],
        listeners: {
            afterrender: function(ms) {
                this.boundList.on('itemdblclick', function() {
                    if (ms.getValue().length) {
                        selectDataElements(ms.getValue());
                    }
                });
            }
        }
    });

    var dataElementSelected = Ext.create('Ext.panel.Panel', {
        width: accBaseWidth,
        height: 242,
        bodyStyle: 'padding-left:1px',
        autoScroll: true,
        tbar: [
            {
                xtype: 'label',
                text: 'Selected data items',
                style: 'padding-left:6px; color:#333',
                cls: 'ns-toolbar-multiselect-left-label'
            },
            '->',
            {
                xtype: 'button',
                icon: 'images/arrowupdouble.png',
                width: 22,
                height: 22,
                handler: function() {
                    dataElementSelected.removeAllDataElements();
                }
            }
        ],
        getChildIndex: function(child) {
            var items = this.items.items;

            for (var i = 0; i < items.length; i++) {
                if (items[i].id === child.id) {
                    return i;
                }
            }

            return items.length;
        },
        hasDataElement: function(dataElementId) {
            var hasDataElement = false;

            this.items.each(function(item) {
                if (item.dataElement.id === dataElementId) {
                    hasDataElement = true;
                }
            });

            return hasDataElement;
        },
        getUxArrayById: function(dataElementId) {
            var uxArray = [];

            this.items.each(function(item) {
                if (item.dataElement.id === dataElementId) {
                    uxArray.push(item);
                }
            });

            return uxArray;
        },
        removeAllDataElements: function(reset) {
            var items = this.items.items,
                len = items.length;

            for (var i = 0; i < len; i++) {
                items[0].removeDataElement(reset);
            }
        },
        toggleProgramIndicators: function(type) {
            var items = this.items.items,
                len = items.length;

            for (var i = 0, item; i < len; i++) {
                item = items[i];

                if (type === finalsDataTypeConf.aggregated_values && item.isProgramIndicator) {
                    item.disable();
                }
                else {
                    item.enable();
                }
            }
        }
    });

    var addUxFromDataElement = function(element, index) {
        var getUxType,
            ux;

        index = index || dataElementSelected.items.items.length;

        getUxType = function(element) {

            if (isObject(element.optionSet) && isString(element.optionSet.id)) {
                return 'Ext.ux.panel.OrganisationUnitGroupSetContainer';
            }

            if (arrayContains(ns.core.conf.valueType.numericTypes, element.valueType)) {
                return 'Ext.ux.panel.DataElementIntegerContainer';
            }

            if (arrayContains(ns.core.conf.valueType.textTypes, element.valueType)) {
                return 'Ext.ux.panel.DataElementStringContainer';
            }

            if (arrayContains(ns.core.conf.valueType.dateTypes, element.valueType)) {
                return 'Ext.ux.panel.DataElementDateContainer';
            }

            if (arrayContains(ns.core.conf.valueType.booleanTypes, element.valueType)) {
                return 'Ext.ux.panel.DataElementBooleanContainer';
            }

            return 'Ext.ux.panel.DataElementIntegerContainer';
        };

        // add
        ux = dataElementSelected.insert(index, Ext.create(getUxType(element), {
            dataElement: element
        }));

        ux.isAttribute = element.isAttribute;
        ux.isProgramIndicator = element.isProgramIndicator;

        ux.removeDataElement = function(reset) {
            dataElementSelected.remove(ux);

            if (!dataElementSelected.hasDataElement(element.id)) {
                if (!reset) {
                    dataElementsByStageStore.add(element);
                    dataElementsByStageStore.sort();
                }

                ns.app.aggregateLayoutWindow.removeDimension(element.id, ns.app.aggregateLayoutWindow.valueStore);
                ns.app.queryLayoutWindow.removeDimension(element.id);
            }
        };

        ux.duplicateDataElement = function() {
            var index = dataElementSelected.getChildIndex(ux) + 1;
            addUxFromDataElement(element, index);
        };

        dataElementsByStageStore.removeAt(dataElementsByStageStore.findExact('id', element.id));

        return ux;
    };

    var selectDataElements = function(items, layout) {
        var dataElements = [],
            allElements = [],
            aggWindow = ns.app.aggregateLayoutWindow,
            queryWindow = ns.app.queryLayoutWindow,
            includeKeys = ns.core.conf.valueType.tAggregateTypes,
            ignoreKeys = ['pe', 'ou'],
            recordMap = {
                'pe': {id: 'pe', name: 'Periods'},
                'ou': {id: 'ou', name: 'Organisation units'}
            },
            extendDim = function(dim) {
                var md = ns.app.response.metaData,
                    dimConf = ns.core.conf.finals.dimension;

                dim.id = dim.id || dim.dimension;
                dim.name = dim.name || md.names[dim.dimension] || dimConf.objectNameMap[dim.dimension].name;

                return dim;
            };

        // data element objects
        for (var i = 0, item; i < items.length; i++) {
            item = items[i];

            if (isString(item)) {
                dataElements.push(dataElementsByStageStore.getById(item).data);
            }
            else if (isObject(item)) {
                if (item.data) {
                    dataElements.push(item.data);
                }
                else {
                    dataElements.push(item);
                }
            }
        }

        // expand if multiple filter
        for (var i = 0, element, a, numberOfElements; i < dataElements.length; i++) {
            element = dataElements[i];
            allElements.push(element);

            if (arrayContains(ns.core.conf.valueType.numericTypes, element.valueType) && element.filter) {
                a = element.filter.split(':');
                numberOfElements = a.length / 2;

                if (numberOfElements > 1) {
                    a.shift();
                    a.shift();

                    for (var j = 1, newElement; j < numberOfElements; j++) {
                        newElement = Ext.clone(element);
                        newElement.filter = a.shift();
                        newElement.filter += ':' + a.shift();

                        allElements.push(newElement);
                    }
                }
            }
        }

        // panel, store
        for (var i = 0, element, ux, store; i < allElements.length; i++) {
            element = allElements[i];
            element.name = element.name || element.displayName;
            recordMap[element.id] = element;

            // dont create ux if dim is selected as value
            if (element.id !== aggWindow.value.getValue()) {
                ux = addUxFromDataElement(element);

                if (layout) {
                    ux.setRecord(element);
                }
            }

            store = arrayContains(includeKeys, element.valueType) || element.optionSet ? aggWindow.rowStore : aggWindow.fixedFilterStore;

            aggWindow.addDimension(element, store, valueStore);
            queryWindow.colStore.add(element);
        }

        // favorite
        if (layout && layout.dataType === finalsDataTypeConf.aggregated_values) {

            aggWindow.reset(true, true);

            // start end dates
            if (layout.startDate && layout.endDate) {
                aggWindow.fixedFilterStore.add({id: dimConf.startEndDate.value, name: dimConf.startEndDate.name});
            }

            // columns
            if (layout.columns) {
                for (var i = 0, record, dim; i < layout.columns.length; i++) {
                    dim = layout.columns[i];
                    record = recordMap[dim.dimension];

                    //aggWindow.addDimension(record || extendDim(Ext.clone(dim)), aggWindow.colStore, null, true);
                    aggWindow.colStore.add(record || extendDim(Ext.clone(dim)));
                }
            }

            // rows
            if (layout.rows) {
                for (var i = 0, record, dim; i < layout.rows.length; i++) {
                    dim = layout.rows[i];
                    record = recordMap[dim.dimension];

                    //aggWindow.addDimension(record || extendDim(Ext.clone(dim)), aggWindow.rowStore, null, true);
                    aggWindow.rowStore.add(record || extendDim(Ext.clone(dim)));
                }
            }

            // filters
            if (layout.filters) {
                for (var i = 0, store, record, dim; i < layout.filters.length; i++) {
                    dim = layout.filters[i];
                    record = recordMap[dim.dimension];
                    store = arrayContains(includeKeys, element.valueType) || element.optionSet ? aggWindow.filterStore : aggWindow.fixedFilterStore;

                    //aggWindow.addDimension(record || extendDim(Ext.clone(dim)), store, null, true);
                    store.add(record || extendDim(Ext.clone(dim)));
                }
            }

            // value
            if (layout.value && layout.aggregationType) {
                aggWindow.setValueConfig(layout.value.id, layout.aggregationType);
            }

            // collapse data dimensions
            aggWindow.collapseDataDimensions.setValue(layout.collapseDataDimensions);
            aggWindow.onCollapseDataDimensionsChange(layout.collapseDataDimensions);
        }
    };

    var programStagePanel = Ext.create('Ext.panel.Panel', {
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin-top:2px',
        items: [
            program,
            stage
        ]
    });

    var data = Ext.create('Ext.panel.Panel', {
        title: '<div class="ns-panel-title-data">Data</div>',
        cls: 'ns-accordion-first',
        bodyStyle: 'padding:1px',
        hideCollapseTool: true,
        items: [
            programStagePanel,
            dataElementAvailable,
            dataElementSelected
        ],
        getHeightValue: function() {
            return ns.app.westRegion.hasScrollbar ?
                ns.core.conf.layout.west_scrollbarheight_accordion_indicator :
                ns.core.conf.layout.west_maxheight_accordion_indicator;
        },
        onExpand: function() {
            accordion.setThisHeight(this.getHeightValue());

            var msHeight = this.getHeight() - 28 - programStagePanel.getHeight() - 6;

            dataElementAvailable.setHeight(msHeight * 0.4);
            dataElementSelected.setHeight(msHeight * 0.6 - 1);
        },
        listeners: {
            added: function(cmp) {
                accordionPanels.push(cmp);
            },
            expand: function(cmp) {
                cmp.onExpand();
            }
        }
    });

        // dates
    var periodMode = Ext.create('Ext.form.field.ComboBox', {
        editable: false,
        valueField: 'id',
        displayField: 'name',
        queryMode: 'local',
        width: accBaseWidth,
        listConfig: {loadMask: false},
        style: 'padding-bottom:1px; border-bottom:1px solid #ddd; margin-bottom:1px',
        value: 'periods',
        store: {
            fields: ['id', 'name'],
            data: [
                {id: 'periods', name: 'Fixed and relative periods'},
                {id: 'dates', name: 'Start/end dates'}
            ]
        },
        reset: function() {
            onPeriodModeSelect('periods');
        },
        listeners: {
            select: function(cmp) {
                onPeriodModeSelect(cmp.getValue());
            }
        }
    });

    var onPeriodModeSelect = function(mode) {
        periodMode.setValue(mode);

        if (mode === 'dates') {
            startEndDate.show();
            periods.hide();

            ns.app.aggregateLayoutWindow.addDimension({id: dimConf.startEndDate.value, name: dimConf.startEndDate.name}, ns.app.aggregateLayoutWindow.fixedFilterStore);
            ns.app.aggregateLayoutWindow.removeDimension(dimConf.period.dimensionName);
        }
        else if (mode === 'periods') {
            startEndDate.hide();
            periods.show();

            ns.app.aggregateLayoutWindow.addDimension({id: dimConf.period.dimensionName, name: dimConf.period.name}, ns.app.aggregateLayoutWindow.colStore);
            ns.app.aggregateLayoutWindow.removeDimension(dimConf.startEndDate.value);
        }
    };

    var getDateLink = function(text, fn, style) {
        return Ext.create('Ext.form.Label', {
            text: text,
            style: 'padding-left: 5px; width: 100%; ' + style || '',
            cls: 'ns-label-date',
            updateValue: fn,
            listeners: {
                render: function(cmp) {
                    cmp.getEl().on('click', function() {
                        cmp.updateValue();
                    });
                }
            }
        });
    };

    var onDateFieldRender = function(c) {
        $('#' + c.inputEl.id).calendarsPicker({
            calendar: ns.core.init.calendar,
            dateFormat: ns.core.init.systemInfo.dateFormat
        });
    };

    var startDate = Ext.create('Ext.form.field.Text', {
        fieldLabel: 'Start date',
        labelAlign: 'top',
        labelCls: 'ns-form-item-label-top ns-form-item-label-top-padding',
        labelSeparator: '',
        columnWidth: 0.5,
        height: 44,
        value: ns.core.init.calendar.formatDate(ns.core.init.systemInfo.dateFormat, ns.core.init.calendar.today().add(-3, 'm')),
        listeners: {
            render: function(c) {
                onDateFieldRender(c);
            }
        }
    });

    var endDate = Ext.create('Ext.form.field.Text', {
        fieldLabel: 'End date',
        labelAlign: 'top',
        labelCls: 'ns-form-item-label-top ns-form-item-label-top-padding',
        labelSeparator: '',
        columnWidth: 0.5,
        height: 44,
        style: 'margin-left: 1px',
        value: ns.core.init.calendar.formatDate(ns.core.init.systemInfo.dateFormat, ns.core.init.calendar.today()),
        listeners: {
            render: function(c) {
                onDateFieldRender(c);
            }
        }
    });

    var startEndDate = Ext.create('Ext.container.Container', {
        cls: 'ns-container-default',
        layout: 'column',
        hidden: true,
        items: [
            startDate,
            endDate
        ]
    });

        // relative periods
    var onPeriodChange = function() {
        var window = uiManager.get('aggregateLayoutWindow'),
            peDimensionConfig = dimensionConfig.get('period');

        if ((period.isRelativePeriods() || fixedPeriodSelectedStore.getRange().length)) {
            window.addDimension({
                id: peDimensionConfig.dimensionName,
                name: peDimensionConfig.name
            }, window.colStore);
        }
        else {
            window.removeDimension(peDimensionConfig.dimensionName);
        }
    };

    var onCheckboxAdd = function(cmp) {
        if (cmp.xtype === 'checkbox') {
            uiManager.reg(cmp, cmp.relativePeriodId, null, 'relativePeriod');
        }
    };

    var intervalListeners = {
        added: function(cmp) {
            onCheckboxAdd(cmp);
        },
        change: function() {
            if (relativePeriod.getRecords().length < 2) {
                onPeriodChange();
            }
        }
    };

    var weeks = Ext.create('Ext.container.Container', {
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners
        },
        items: [
            {
                xtype: 'label',
                text: i18n.weeks,
                cls: 'ns-label-period-heading'
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_WEEK',
                boxLabel: i18n.this_week
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_WEEK',
                boxLabel: i18n.last_week
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_4_WEEKS',
                boxLabel: i18n.last_4_weeks
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_12_WEEKS',
                boxLabel: i18n.last_12_weeks
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_52_WEEKS',
                boxLabel: i18n.last_52_weeks
            }
        ]
    });

    var months = Ext.create('Ext.container.Container', {
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners
        },
        items: [
            {
                xtype: 'label',
                text: i18n.months,
                cls: 'ns-label-period-heading'
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_MONTH',
                boxLabel: i18n.this_month
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_MONTH',
                boxLabel: i18n.last_month
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_3_MONTHS',
                boxLabel: i18n.last_3_months
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_6_MONTHS',
                boxLabel: i18n.last_6_months
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_12_MONTHS',
                boxLabel: i18n.last_12_months,
                checked: true
            }
        ]
    });

    var biMonths = Ext.create('Ext.container.Container', {
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners
        },
        items: [
            {
                xtype: 'label',
                text: i18n.bimonths,
                cls: 'ns-label-period-heading'
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_BIMONTH',
                boxLabel: i18n.this_bimonth
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_BIMONTH',
                boxLabel: i18n.last_bimonth
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_6_BIMONTHS',
                boxLabel: i18n.last_6_bimonths
            }
        ]
    });

    var quarters = Ext.create('Ext.container.Container', {
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners
        },
        items: [
            {
                xtype: 'label',
                text: i18n.quarters,
                cls: 'ns-label-period-heading'
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_QUARTER',
                boxLabel: i18n.this_quarter
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_QUARTER',
                boxLabel: i18n.last_quarter
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_4_QUARTERS',
                boxLabel: i18n.last_4_quarters
            }
        ]
    });

    var sixMonths = Ext.create('Ext.container.Container', {
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners
        },
        items: [
            {
                xtype: 'label',
                text: i18n.sixmonths,
                cls: 'ns-label-period-heading'
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_SIX_MONTH',
                boxLabel: i18n.this_sixmonth
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_SIX_MONTH',
                boxLabel: i18n.last_sixmonth
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_2_SIXMONTHS',
                boxLabel: i18n.last_2_sixmonths
            }
        ]
    });

    var financialYears = Ext.create('Ext.container.Container', {
        style: 'margin-top: 36px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners
        },
        items: [
            {
                xtype: 'label',
                text: i18n.financial_years,
                cls: 'ns-label-period-heading'
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_FINANCIAL_YEAR',
                boxLabel: i18n.this_financial_year
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_FINANCIAL_YEAR',
                boxLabel: i18n.last_financial_year
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_5_FINANCIAL_YEARS',
                boxLabel: i18n.last_5_financial_years
            }
        ]
    });

    var years = Ext.create('Ext.container.Container', {
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners
        },
        items: [
            {
                xtype: 'label',
                text: i18n.years,
                cls: 'ns-label-period-heading'
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_YEAR',
                boxLabel: i18n.this_year
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_YEAR',
                boxLabel: i18n.last_year
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_5_YEARS',
                boxLabel: i18n.last_5_years
            }
        ]
    });

    var relativePeriod = Ext.create('Ext.container.Container', {
        layout: 'column',
        hideCollapseTool: true,
        autoScroll: true,
        style: 'border:0 none',
        items: [
            {
                xtype: 'container',
                columnWidth: 0.34,
                style: 'margin-left: 8px',
                defaults: {
                    style: 'margin-top: 4px'
                },
                items: [
                    weeks,
                    quarters,
                    years
                ]
            },
            {
                xtype: 'container',
                columnWidth: 0.33,
                defaults: {
                    style: 'margin-top: 4px'
                },
                items: [
                    months,
                    sixMonths
                ]
            },
            {
                xtype: 'container',
                columnWidth: 0.33,
                defaults: {
                    style: 'margin-top: 4px'
                },
                items: [
                    biMonths,
                    financialYears
                ]
            }
        ],
        getRecords: function() {
            return uiManager.getByGroup('relativePeriod')
                .filter(cmp => cmp.getValue())
                .map(cmp => cmp.relativePeriodId);
        }
    });

        // fixed periods
    var fixedPeriodAvailable = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-left',
        width: accBaseWidth / 2,
        height: 160,
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
                icon: 'images/arrowright.png',
                width: 22,
                handler: function() {
                    ns.core.web.multiSelect.select(fixedPeriodAvailable, fixedPeriodSelected);
                    onPeriodChange();
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowrightdouble.png',
                width: 22,
                handler: function() {
                    ns.core.web.multiSelect.selectAll(fixedPeriodAvailable, fixedPeriodSelected, true);
                    onPeriodChange();
                }
            },
            ' '
        ],
        listeners: {
            afterrender: function() {
                this.boundList.on('itemdblclick', function() {
                    ns.core.web.multiSelect.select(fixedPeriodAvailable, fixedPeriodSelected);
                    onPeriodChange();
                }, this);
            }
        }
    });

    var fixedPeriodSelected = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-right',
        width: accBaseWidth / 2,
        height: 160,
        valueField: 'id',
        displayField: 'name',
        ddReorder: false,
        store: fixedPeriodSelectedStore,
        tbar: [
            ' ',
            {
                xtype: 'button',
                icon: 'images/arrowleftdouble.png',
                width: 22,
                handler: function() {
                    ns.core.web.multiSelect.unselectAll(fixedPeriodAvailable, fixedPeriodSelected);
                    onPeriodChange();
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowleft.png',
                width: 22,
                handler: function() {
                    ns.core.web.multiSelect.unselect(fixedPeriodAvailable, fixedPeriodSelected);
                    onPeriodChange();
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
                    ns.core.web.multiSelect.unselect(fixedPeriodAvailable, fixedPeriodSelected);
                    onPeriodChange();
                }, this);
            }
        }
    });

    var onPeriodTypeSelect = function() {
        var type = periodType.getValue(),
            periodOffset = periodType.periodOffset,
            generator = ns.core.init.periodGenerator,
            periods = generator.generateReversedPeriods(type, type === 'Yearly' ? periodOffset - 5 : periodOffset);

        periods.forEach(period => period.id = period.iso);

        fixedPeriodAvailableStore.setIndex(periods);
        fixedPeriodAvailableStore.loadData(periods);
        uiManager.msFilterAvailable(fixedPeriodAvailable, fixedPeriodSelected);
    };

    var periodType = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-right:1px; margin-bottom:1px',
        width: accBaseWidth - 62 - 62 - 2,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n.select_period_type,
        editable: false,
        queryMode: 'remote',
        store: periodTypeStore,
        periodOffset: 0,
        listeners: {
            select: function(cmp) {
                periodType.periodOffset = 0;
                onPeriodTypeSelect();
            }
        }
    });

    var prevYear = Ext.create('Ext.button.Button', {
        text: i18n.prev_year,
        style: 'border-radius:1px; margin-right:1px',
        height: 24,
        width: 62,
        handler: function() {
            if (periodType.getValue()) {
                periodType.periodOffset--;
                onPeriodTypeSelect();
            }
        }
    });

    var nextYear = Ext.create('Ext.button.Button', {
        text: i18n.next_year,
        style: 'border-radius:1px',
        height: 24,
        width: 62,
        handler: function() {
            if (periodType.getValue()) {
                periodType.periodOffset++;
                onPeriodTypeSelect();
            }
        }
    });

    var fixedPeriodSettings = Ext.create('Ext.container.Container', {
        layout: 'column',
        bodyStyle: 'border-style:none',
        style: 'margin-top:0px',
        items: [
            periodType,
            prevYear,
            nextYear
        ]
    });

    var fixedPeriodAvailableSelected = Ext.create('Ext.container.Container', {
        layout: 'column',
        bodyStyle: 'border-style:none; padding-bottom:2px',
        items: [
            fixedPeriodAvailable,
            fixedPeriodSelected
        ]
    });

    var periods = Ext.create('Ext.container.Container', {
        bodyStyle: 'border-style:none',
        getRecords: function() {
            var map = relativePeriodCmpMap,
                selectedPeriods = [],
                records = [];

            fixedPeriodSelectedStore.each( function(r) {
                selectedPeriods.push(r.data.id);
            });

            for (var i = 0; i < selectedPeriods.length; i++) {
                records.push({id: selectedPeriods[i]});
            }

            for (var rp in map) {
                if (map.hasOwnProperty(rp) && map[rp].getValue()) {
                    records.push({id: map[rp].relativePeriodId});
                }
            }

            return records.length ? records : null;
        },
        getDimension: function() {
            return {
                dimension: 'pe',
                items: this.getRecords()
            };
        },
        items: [
            fixedPeriodSettings,
            fixedPeriodAvailableSelected,
            relativePeriod
        ]
    });

    var period = Ext.create('Ext.panel.Panel', {
        title: '<div class="ns-panel-title-period">Periods</div>',
        bodyStyle: 'padding:1px',
        hideCollapseTool: true,
        width: accBaseWidth,
        getHeightValue: function() {
            var westRegion = uiManager.get('westRegion');
            var accordion = uiManager.get('accordion');

            return westRegion.hasScrollbar ?
                uiConfig.west_scrollbarheight_accordion_period :
                uiConfig.west_maxheight_accordion_period;
        },
        onExpand: function() {
            accordion.setThisHeight(this.getHeightValue());

            uiManager.msSetHeight(
                [fixedPeriodAvailable, fixedPeriodSelected],
                this,
                uiConfig.west_fill_accordion_period
            );
        },
        reset: function() {
            this.resetRelativePeriods();
            this.resetFixedPeriods();
            this.resetStartEndDates();

            periodMode.reset();
        },
        isRelativePeriods: function() {
            var a = checkboxes;
            for (var i = 0; i < a.length; i++) {
                if (a[i].getValue()) {
                    return true;
                }
            }
            return false;
        },
        getDimension: function() {
            var config = {
                    dimension: dimConf.period.objectName,
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
        resetRelativePeriods: function() {
            uiManager.getByGroup('relativePeriod').forEach(cmp => cmp.setValue(false));
        },
        isNoRelativePeriods: function() {
            return !uiManager.getByGroup('relativePeriod').some(cmp => cmp.getValue());
        },
        resetFixedPeriods: function() {
            fixedPeriodAvailableStore.removeAll();
            fixedPeriodSelectedStore.removeAll();
            periodType.clearValue();
        },
        resetStartEndDates: function() {
            startDate.reset();
            endDate.reset();
        },
        items: [
            periodMode,
            startEndDate,
            periods
        ],
        listeners: {
            added: function() {
                accordionPanels.push(this);
            },
            expand: function(cmp) {
                cmp.onExpand();
            }
        }
    });

        // organisation unit
    var treePanel = Ext.create('Ext.tree.Panel', {
        cls: 'ns-tree',
        height: 436,
        width: accBaseWidth,
        bodyStyle: 'border:0 none',
        style: 'border-top: 1px solid #ddd; padding-top: 1px',
        displayField: 'name',
        rootVisible: false,
        autoScroll: true,
        multiSelect: true,
        rendered: false,
        reset: function() {
            var rootNode = this.getRootNode().findChild('id', ns.core.init.rootNodes[0].id);
            this.collapseAll();
            this.expandPath(rootNode.getPath());
            this.getSelectionModel().select(rootNode);
        },
        selectRootIf: function() {
            if (this.getSelectionModel().getSelection().length < 1) {
                var node = this.getRootNode().findChild('id', ns.core.init.rootNodes[0].id);
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
            this.recordsToSelect = arrayClean(this.recordsToSelect);

            if (this.recordsToSelect.length === ns.core.support.prototype.object.getLength(map)) {
                this.getSelectionModel().select(this.recordsToSelect);
                this.recordsToSelect = [];
                this.isPending = false;

                if (doUpdate) {
                    update();
                }
            }
        },
        multipleExpand: function(id, map, doUpdate) {
            var that = this,
                rootId = ns.core.conf.finals.root.id,
                path = map[id];

            if (path.substr(0, rootId.length + 1) !== ('/' + rootId)) {
                path = '/' + rootId + path;
            }

            that.expandPath(path, 'id', '/', function() {
                record = Ext.clone(that.getRootNode().findChild('id', id, true));
                that.recordsToSelect.push(record);
                that.multipleSelectIf(map, doUpdate);
            });
        },
        select: function(url, params) {
            if (!params) {
                params = {};
            }
            Ext.Ajax.request({
                url: url,
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

            if (isArray(selection) && selection.length) {
                for (var i = 0, pathArray, key; i < selection.length; i++) {
                    pathArray = selection[i].getPath().split('/');
                    map[pathArray.pop()] = pathArray.join('/');
                }
            }

            return map;
        },
        selectGraphMap: function(map, update) {
            if (!ns.core.support.prototype.object.getLength(map)) {
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
                    fields: 'children[id,' + ns.core.init.namePropertyUrl + ',children::isNotEmpty|rename(hasChildren)&paging=false'
                },
                url: ns.core.init.contextPath + '/api/organisationUnits',
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
                id: ns.core.conf.finals.root.id,
                expanded: true,
                children: ns.core.init.rootNodes
            },
            listeners: {
                load: function(store, node, records) {
                    records.forEach(function(record) {
                        if (isBoolean(record.data.hasChildren)) {
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
        getDimension: function() {
            var r = treePanel.getSelectionModel().getSelection(),
                config = {
                    dimension: ns.core.conf.finals.dimension.organisationUnit.objectName,
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
        listeners: {
            beforeitemexpand: function() {
                var rts = treePanel.recordsToSelect;

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

                Ext.defer(function() {
                    data.expand();
                }, 20);
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
                        icon: 'images/node-select-child.png',
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
        boxLabel: 'User org unit',
        labelWidth: ns.core.conf.layout.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([checked, userOrganisationUnitChildren.getValue(), userOrganisationUnitGrandChildren.getValue()]);
        }
    });

    var userOrganisationUnitChildren = Ext.create('Ext.form.field.Checkbox', {
        columnWidth: 0.26,
        style: 'padding-top: 3px; margin-bottom: 0',
        boxLabel: i18n.user_sub_units,
        labelWidth: ns.core.conf.layout.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([checked, userOrganisationUnit.getValue(), userOrganisationUnitGrandChildren.getValue()]);
        }
    });

    var userOrganisationUnitGrandChildren = Ext.create('Ext.form.field.Checkbox', {
        columnWidth: 0.4,
        style: 'padding-top: 3px; margin-bottom: 0',
        boxLabel: i18n.user_sub_x2_units,
        labelWidth: ns.core.conf.layout.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([checked, userOrganisationUnit.getValue(), userOrganisationUnitChildren.getValue()]);
        }
    });

    var organisationUnitLevel = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        multiSelect: true,
        style: 'margin-bottom:0',
        width: accBaseWidth - toolWidth - 1,
        valueField: 'level',
        displayField: 'name',
        emptyText: i18n.select_organisation_unit_levels,
        editable: false,
        hidden: true,
        store: {
            fields: ['id', 'name', 'level'],
            data: ns.core.init.organisationUnitLevels
        }
    });

    var organisationUnitGroup = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        multiSelect: true,
        style: 'margin-bottom:0',
        width: accBaseWidth - toolWidth - 1,
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n.select_organisation_unit_groups,
        editable: false,
        hidden: true,
        store: organisationUnitGroupStore
    });

    var organisationUnitPanel = Ext.create('Ext.panel.Panel', {
        width: accBaseWidth - toolWidth - 1,
        layout: 'column',
        bodyStyle: 'border:0 none',
        items: [
            userOrganisationUnit,
            userOrganisationUnitChildren,
            userOrganisationUnitGrandChildren,
            organisationUnitLevel,
            organisationUnitGroup
        ]
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
        width: toolWidth,
        height: 24,
        menu: toolMenu
    });

    var toolPanel = Ext.create('Ext.panel.Panel', {
        width: toolWidth,
        bodyStyle: 'border:0 none; text-align:right',
        style: 'margin-right:1px',
        items: tool
    });

    var organisationUnit = Ext.create('Ext.panel.Panel', {
        title: '<div class="ns-panel-title-organisationunit">' + i18n.organisation_units + '</div>',
        bodyStyle: 'padding:1px',
        hideCollapseTool: true,
        items: [
            {
                layout: 'column',
                bodyStyle: 'border:0 none;',
                style: 'padding-bottom:1px',
                items: [
                    toolPanel,
                    organisationUnitPanel
                ]
            },
            treePanel
        ],
        getHeightValue: function() {
            return ns.app.westRegion.hasScrollbar ?
                ns.core.conf.layout.west_scrollbarheight_accordion_organisationunit :
                ns.core.conf.layout.west_maxheight_accordion_organisationunit;
        },
        onExpand: function() {
            accordion.setThisHeight(this.getHeightValue());

            treePanel.setHeight(this.getHeight() - ns.core.conf.layout.west_fill_accordion_organisationunit);
        },
        listeners: {
            added: function(cmp) {
                accordionPanels.push(cmp);
            },
            expand: function(cmp) {
                cmp.onExpand();
            }
        }
    });

    // dimensions

    var getDimensionPanel = function(dimension, iconCls) {
        var	onSelect,
            availableStore,
            selectedStore,
            available,
            selected,
            panel,

            createPanel,
            getPanels;

        onSelect = function() {
            var aggWin = ns.app.aggregateLayoutWindow,
                queryWin = ns.app.queryLayoutWindow;

            if (selectedStore.getRange().length) {
                aggWin.addDimension({id: dimension.id, name: dimension.name}, aggWin.rowStore);
                queryWin.addDimension({id: dimension.id, name: dimension.name}, queryWin.colStore);
            }
            else if (!selectedStore.getRange().length && aggWin.hasDimension(dimension.id)) {
                aggWin.removeDimension(dimension.id);
            }
            else if (!selectedStore.getRange().length && queryWin.hasDimension(dimension.id)) {
                queryWin.removeDimension(dimension.id);
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
                //indicatorSearch.hideFilter();
            },
            loadPage: function(filter, append) {
                var store = this,
                    path;

                filter = filter || null;

                if (!append) {
                    this.lastPage = null;
                    this.nextPage = 1;
                }

                if (store.nextPage === store.lastPage) {
                    return;
                }

                path = '/organisationUnitGroups.json?fields=id,' + ns.core.init.namePropertyUrl + '&filter=organisationUnitGroupSet.id:eq:' + dimension.id + (filter ? '&filter=name:ilike:' + filter : '');

                store.isPending = true;

                Ext.Ajax.request({
                    url: ns.core.init.contextPath + '/api' + path,
                    params: {
                        page: store.nextPage,
                        pageSize: 50
                    },
                    failure: function() {
                        store.isPending = false;
                    },
                    success: function(r) {
                        var response = Ext.decode(r.responseText),
                            data = response.organisationUnitGroups || [],
                            pager = response.pager;

                        store.loadStore(data, pager, append);
                    }
                });
            },
            loadStore: function(data, pager, append) {
                this.loadData(data, append);
                this.lastPage = this.nextPage;

                if (pager.pageCount > this.nextPage) {
                    this.nextPage++;
                }

                this.isPending = false;
                ns.core.web.multiSelect.filterAvailable({store: availableStore}, {store: selectedStore});
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

        available = Ext.create('Ext.ux.form.MultiSelect', {
            cls: 'ns-toolbar-multiselect-left',
            width: accBaseWidth / 2,
            valueField: 'id',
            displayField: 'name',
            store: availableStore,
            tbar: [
                {
                    xtype: 'label',
                    text: i18n.available,
                    cls: 'ns-toolbar-multiselect-left-label'
                },
                '->',
                {
                    xtype: 'button',
                    icon: 'images/arrowright.png',
                    width: 22,
                    handler: function() {
                        ns.core.web.multiSelect.select(available, selected);
                    }
                },
                {
                    xtype: 'button',
                    icon: 'images/arrowrightdouble.png',
                    width: 22,
                    handler: function() {
                        ns.core.web.multiSelect.selectAll(available, selected);
                    }
                }
            ],
            listeners: {
                render: function(ms) {
                    var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                    el.addEventListener('scroll', function(e) {
                        if (isScrolled(e) && !availableStore.isPending) {
                            availableStore.loadPage(null, true);
                        }
                    });

                    ms.boundList.on('itemdblclick', function() {
                        ns.core.web.multiSelect.select(available, selected);
                    }, ms);
                }
            }
        });

        selected = Ext.create('Ext.ux.form.MultiSelect', {
            cls: 'ns-toolbar-multiselect-right',
            width: accBaseWidth / 2,
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
                        ns.core.web.multiSelect.unselectAll(available, selected);
                    }
                },
                {
                    xtype: 'button',
                    icon: 'images/arrowleft.png',
                    width: 22,
                    handler: function() {
                        ns.core.web.multiSelect.unselect(available, selected);
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
                        ns.core.web.multiSelect.unselect(available, selected);
                    }, this);
                }
            }
        });

        dimensionIdAvailableStoreMap[dimension.id] = availableStore;
        dimensionIdSelectedStoreMap[dimension.id] = selectedStore;

        //availableStore.on('load', function() {
            //ns.core.web.multiSelect.filterAvailable(available, selected);
        //});

        panel = {
            itemId: dimension.itemId,
            xtype: 'panel',
            title: '<div class="' + iconCls + '">' + dimension.name + '</div>',
            hideCollapseTool: true,
            availableStore: availableStore,
            selectedStore: selectedStore,
            getDimension: function() {
                var config = {
                    dimension: dimension.id,
                    items: []
                };

                selectedStore.each( function(r) {
                    config.items.push({id: r.data.id});
                });

                return config.items.length ? config : null;
            },
            getHeightValue: function() {
                return ns.app.westRegion.hasScrollbar ?
                    ns.core.conf.layout.west_scrollbarheight_accordion_indicator :
                    ns.core.conf.layout.west_maxheight_accordion_indicator;
            },
            onExpand: function() {
                if (!availableStore.isLoaded) {
                    if (isArray(dimension.items) && dimension.items.length) {
                        availableStore.loadData(dimension.items);
                        availableStore.isLoaded = true;
                    }
                    else {
                        availableStore.loadPage();
                    }
                }

                accordion.setThisHeight(this.getHeightValue());

                ns.core.web.multiSelect.setHeight(
                    [available, selected],
                    this,
                    ns.core.conf.layout.west_fill_accordion_dataset
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

        // accordion
    var defaultItems = [
        data,
        period,
        organisationUnit,
        ...ns.core.init.dimensions.map(panel => getDimensionPanel(panel, 'ns-panel-title-dimension'))
    ];

    var getItems = function(dimensions = []) {
        return dimensions.map(dimension => getDimensionPanel(dimension, 'ns-panel-title-dimension'));
    };

    //var accordionBody = Ext.create('Ext.panel.Panel', {
    var accordionBody = Ext.create('Ext.panel.Panel', {
        layout: 'accordion',
        activeOnTop: true,
        cls: 'ns-accordion',
        bodyStyle: 'border:0 none',
        height: 700,
        toBeRemoved: [],
        addItems: function(dimensions) {
            this.removeItems();
            this.add(getItems(dimensions));
            this.toBeRemoved = dimensions.map(dimension => dimension.itemId);

            accordion.setThisHeight();
        },
        removeItems: function() {
            this.toBeRemoved.forEach(id => {
                accordionBody.remove(id);
            });

            this.toBeRemoved = [];
        },
        items: defaultItems
    });

    // functions

    var reset = function(skipTree) {

        // components
        program.clearValue();
        stage.clearValue();

        dataElementsByStageStore.removeAll();
        dataElementSelected.removeAll();

        dataElementSearch.hideFilter();

        startDate.reset();
        endDate.reset();

        toolMenu.clickHandler(toolMenu.menuValue);

        if (!skipTree) {
            treePanel.reset();
        }

        userOrganisationUnit.setValue(false);
        userOrganisationUnitChildren.setValue(false);
        userOrganisationUnitGrandChildren.setValue(false);

        organisationUnitLevel.clearValue();
        organisationUnitGroup.clearValue();

        // layer options
        //if (layer.labelWindow) {
            //layer.labelWindow.destroy();
            //layer.labelWindow = null;
        //}
    };

    var setGui = function(layout, response, updateGui) {

        // state
        ns.app.downloadButton.enable();

        if (layout.id) {
            ns.app.shareButton.enable();
        }

        ns.app.statusBar.setStatus(layout, response);

        // set gui
        if (updateGui) {
            setLayout(layout);
        }
    };

    var getView = function(config) {
        var panels = ns.app.accordion.panels,
            view = {},
            dataType = ns.app.typeToolbar.getType(),
            layoutWindow = ns.app.viewport.getLayoutWindow(dataType),
            map = {},
            columns = [],
            rows = [],
            filters = [],
            values = [],
            addAxisDimension,
            store,
            data,
            a;

        view.dataType = dataType;
        view.program = program.getRecord();
        view.programStage = stage.getRecord();

        if (!(view.dataType && view.program && view.programStage)) {
            return;
        }

        // dy
        map['dy'] = [{dimension: 'dy'}];

        // pe
        if (periodMode.getValue() === 'dates') {
            view.startDate = startDate.getSubmitValue();
            view.endDate = endDate.getSubmitValue();

            if (!(view.startDate && view.endDate)) {
                return;
            }

            map['pe'] = [{dimension: 'pe'}];
        }
        else if (periodMode.getValue() === 'periods') {
            map['pe'] = [periods.getDimension()];
        }

        // ou
        map['ou'] = [treePanel.getDimension()];

        // data items
        for (var i = 0, record; i < dataElementSelected.items.items.length; i++) {
            record = dataElementSelected.items.items[i].getRecord();

            map[record.dimension] = map[record.dimension] || [];

            map[record.dimension].push(record);
        }

        // dynamic dimensions data
        for (var i = 0, panel, dim, dimName; i < panels.length; i++) {
            panel = panels[i];

            if (panel.getDimension) {
                dim = panel.getDimension();

                if (dim && !map.hasOwnProperty(dim.dimension)) {
                    map[dim.dimension] = [dim];
                }
            }
        }

        // other
        map['longitude'] = [{dimension: 'longitude'}];
        map['latitude'] = [{dimension: 'latitude'}];

        addAxisDimension = function(a, axis) {
            if (a.length) {
                if (a.length === 1) {
                    axis.push(a[0]);
                }
                else {
                    var dim;

                    for (var i = 0; i < a.length; i++) {
                        if (!dim) { //todo ??
                            dim = a[i];
                        }
                        else {
                            dim.filter += ':' + a[i].filter;
                        }
                    }

                    axis.push(dim);
                }
            }
        };

        // columns
        store = layoutWindow.colStore;

        if (store) {
            data = store.snapshot || store.data;

            data.each(function(item) {
                addAxisDimension(map[item.data.id] || [], columns);
            });
        }

        // rows
        store = layoutWindow.rowStore;

        if (store) {
            data = store.snapshot || store.data;

            data.each(function(item) {
                addAxisDimension(map[item.data.id] || [], rows);
            });
        }

        // filters
        store = layoutWindow.filterStore;

        if (store) {
            data = store.snapshot || store.data;

            data.each(function(item) {
                addAxisDimension(map[item.data.id] || [], filters);
            });
        }

        // fixed filters
        store = layoutWindow.fixedFilterStore;

        if (store) {
            data = store.snapshot || store.data;

            data.each(function(item) {
                addAxisDimension(map[item.data.id] || [], filters);
            });
        }

        if (columns.length) {
            view.columns = columns;
        }
        if (rows.length) {
            view.rows = rows;
        }
        if (filters.length) {
            view.filters = filters;
        }

        // value, aggregation type
        Ext.apply(view, layoutWindow.getValueConfig());

        return view;
    };

    var validateView = function(view) {
        if (!(isArray(view.rows) && view.rows.length && isString(view.rows[0].dimension) && isArray(view.rows[0].items) && view.rows[0].items.length)) {
            ns.alert('No organisation units selected');
            return false;
        }

        return view;
    };

    var accordion = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:1px; padding-bottom:0; overflow-y:scroll;',
        accordionBody: accordionBody,
        items: accordionBody,
        panels: accordionPanels,
        expandInitPanels: function() {
            organisationUnit.expand();
        },
        map: layer ? layer.map : null,
        layer: layer ? layer : null,
        menu: layer ? layer.menu : null,
        setThisHeight: function(mx) {
            mx = mx || this.getExpandedPanel().getHeightValue();

            var settingsHeight = 41;

            var containerHeight = settingsHeight + (accordionBody.items.items.length * 28) + mx,
                accordionHeight = ns.app.westRegion.getHeight() - settingsHeight - ns.core.conf.layout.west_fill,
                accordionBodyHeight;

            if (ns.app.westRegion.hasScrollbar) {
                accordionBodyHeight = containerHeight - settingsHeight - ns.core.conf.layout.west_fill;
            }
            else {
                accordionBodyHeight = (accordionHeight > containerHeight ? containerHeight : accordionHeight) - ns.core.conf.layout.west_fill;
            }

            this.setHeight(accordionHeight);
            accordionBody.setHeight(accordionBodyHeight);
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
        },
        getParentGraphMap: function() {
            return treePanel.getParentGraphMap();
        },

        accordionBody: accordionBody,
        panels: accordionPanels,
        treePanel: treePanel,

        reset: reset,
        setGui: setGui,
        getView: getView,

        onTypeClick: onTypeClick,

        getUxArray: function(id) {
            return dataElementSelected.getUxArrayById(id);
        }
    });
    uiManager.reg(accordion, 'accordion');

    return accordion;
};




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
