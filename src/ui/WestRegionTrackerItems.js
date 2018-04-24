import clone from 'd2-utilizr/lib/clone';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arraySort from 'd2-utilizr/lib/arraySort';
import isArray from 'd2-utilizr/lib/isArray';
import isBoolean from 'd2-utilizr/lib/isBoolean';
import isNumber from 'd2-utilizr/lib/isNumber';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';

export var WestRegionTrackerItems;

WestRegionTrackerItems = function(refs) {
    var t = this,
        uiManager = refs.uiManager,
        instanceManager = refs.instanceManager,
        appManager = refs.appManager,
        i18nManager = refs.i18nManager,
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
        dimensionPanelMap = {},
        dimensionIdAvailableStoreMap = {},
        dimensionIdSelectedStoreMap = {},
        accordionPanels = [],
        programStorage = {},
        stageStorage = {},
        attributeStorage = {},
        programIndicatorStorage = {},
        dataElementStorage = {},
        baseWidth = 448,
        accBaseWidth = baseWidth - 2,
        toolWidth = 36,
        nextButtonWidth = 62;

    // stores

    var programStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        proxy: {
            type: 'ajax',
            url: encodeURI(
                apiPath + '/programs.json?fields=id,' + displayPropertyUrl + '&paging=false'
            ),
            reader: {
                type: 'json',
                root: 'programs',
            },
            pageParam: false,
            startParam: false,
            limitParam: false,
        },
        sortInfo: { field: 'name', direction: 'ASC' },
        isLoaded: false,
        listeners: {
            load: function() {
                if (!this.isLoaded) {
                    this.isLoaded = true;
                }
            },
        },
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
            },
        },
    });

    var dataElementsByStageStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'isAttribute', 'isProgramIndicator'],
        data: [],
        sorters: [
            {
                property: 'name',
                direction: 'ASC',
            },
        ],
        onLoadData: function() {
            var layoutWindow = uiManager.get('aggregateLayoutWindow');
            var numericValueTypes = dimensionConfig.valueType['numeric_types'];

            // add to layout value store
            this.each(function(record) {
                if (arrayContains(numericValueTypes, record.data.valueType)) {
                    layoutWindow.valueStore.add(record.data);
                }
            });

            this.toggleProgramIndicators();
        },
        toggleProgramIndicators: function(type) {
            var dataTypeToolbar = uiManager.get('dataTypeToolbar');

            type = type || (dataTypeToolbar ? dataTypeToolbar.getDataType() : null);

            this.clearFilter();

            if (
                uiManager.disallowProgramIndicators ||
                type === dimensionConfig.dataType['aggregated_values']
            ) {
                // reset to all to avoid the situation where in ER if PI is selected is shown
                // as selected also when switching to the aggregate tab
                dataElementType.select('all');
                dataElementType.store.filterBy(record => record.data.id != 'pi');

                this.filterBy(record => !record.data.isProgramIndicator);
            } else {
                dataElementType.store.clearFilter();
            }
        },
    });

    var organisationUnitGroupStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        proxy: {
            type: 'ajax',
            url: encodeURI(
                apiPath +
                    '/organisationUnitGroups.json?fields=id,' +
                    displayPropertyUrl +
                    '&paging=false'
            ),
            reader: {
                type: 'json',
                root: 'organisationUnitGroups',
            },
        },
    });

    var periodTypeStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        data: periodConfig.getPeriodTypeRecords(),
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
        },
    });

    var fixedPeriodSelectedStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        data: [],
    });

    // components
    var onTypeClick = function(type) {
        // available
        dataElementsByStageStore.toggleProgramIndicators(type);

        // selected
        dataElementSelected.toggleProgramIndicators(type);
    };

    var setData = function(layout) {
        // wait, more dynamic dimensions could be added by program
        //accordion.setDimensions(layout, true);

        // data items
        onProgramSelect(null, layout);
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
            return this.getValue
                ? {
                      id: this.getValue(),
                      name: this.getRawValue(),
                  }
                : null;
        },
        listeners: {
            select: function(cb) {
                onProgramSelect(cb.getValue());
            },
        },
    });

    var onProgramSelect = function(programId, layout) {
        var DEFAULT = 'default';
        var ATTRIBUTE = 'ATTRIBUTE';

        programId = programId || (layout ? layout.program.id : null);

        if (!programId) {
            return;
        }

        // reset
        stage.clearValue();
        dataElementsByStageStore.removeAll();
        dataElementSelected.removeAllDataElements(true);
        uiManager.get('aggregateLayoutWindow').value.resetData();

        var getCategories = function(categoryCombo) {
            if (
                !(
                    isObject(categoryCombo) &&
                    isArray(categoryCombo.categories) &&
                    categoryCombo.categories.length
                )
            ) {
                return;
            }

            var categories = categoryCombo.categories.filter(c => c.name !== DEFAULT);

            categories.forEach(c => {
                c.items = c.categoryOptions;

                if (isArray(c.items)) {
                    arraySort(c.items);
                }
            });

            return categories;
        };

        var load = function(_program) {
            var stages = _program.programStages;
            var dimensions = [];

            // categories
            dimensions = dimensions.concat(getCategories(_program.categoryCombo) || []);

            // categoryOptionGroupSets
            if (_program.categoryCombo.name !== DEFAULT) {
                dimensions = dimensions.concat(
                    appManager.categoryOptionGroupSets.filter(
                        groupSet => groupSet.dataDimensionType === ATTRIBUTE
                    ) || []
                );
            }

            // remove and add dynamic program related dimensions
            accordionBody.removeItems();
            accordionBody.addItems(arraySort(arrayClean(dimensions)));

            // restore dynamic dimensions
            if (layout) {
                accordion.setDimensions(layout, true);
            }

            // stages
            stage.enable();
            stage.clearValue();

            stagesByProgramStore.removeAll();
            stagesByProgramStore.loadData(stages);

            var stageId =
                (layout ? layout.programStage.id : null) ||
                (stages.length === 1 ? stages[0].id : null);

            if (stageId) {
                stage.setValue(stageId);
                onStageSelect(stageId, layout);
            }
        };

        if (programStorage[programId]) {
            load(programStorage[programId]);
        } else {
            new api.Request(refs, {
                baseUrl: appManager.getApiPath() + '/programs.json',
                type: 'json',
                params: [
                    'filter=id:eq:' + programId,
                    [
                        'fields=programStages[id,displayName~rename(name)]',
                        'programIndicators[id,' + displayPropertyUrl + ']',
                        'programTrackedEntityAttributes[trackedEntityAttribute[id,' +
                            displayPropertyUrl +
                            ',valueType,confidential,optionSet[id,displayName~rename(name)],legendSets~rename(storageLegendSets)[id,displayName~rename(name)]]]',
                        'categoryCombo[id,name,categories[id,' +
                            displayPropertyUrl +
                            ',categoryOptions[id,' +
                            displayPropertyUrl +
                            ']]]',
                    ].join(''),
                    'paging=false',
                ],
                success: function(r) {
                    var _program = r.programs[0];

                    if (!_program) {
                        return;
                    }

                    // program stages
                    _program.programStages.forEach(stage => {
                        stage.isProgramStage = true;
                    });

                    // attributes
                    _program.attributes = arrayPluck(
                        _program.programTrackedEntityAttributes,
                        'trackedEntityAttribute'
                    ).filter(attribute => {
                        attribute.isAttribute = true;
                        attribute.name = '[PA] ' + attribute.name;
                        return !attribute.confidential;
                    });

                    // mark as program indicator
                    _program.programIndicators.forEach(function(item) {
                        item.name = '[PI] ' + item.name;
                        item.isProgramIndicator = true;
                    });

                    if (isArray(_program.programStages) && _program.programStages.length) {
                        // program cache
                        programStorage[programId] = _program;

                        load(_program);
                    }
                },
            }).run();
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
        listConfig: { loadMask: false },
        store: stagesByProgramStore,
        getRecord: function() {
            return this.getValue()
                ? {
                      id: this.getValue(),
                      name: this.getRawValue(),
                  }
                : null;
        },
        listeners: {
            select: function(cb) {
                onStageSelect(cb.getValue());
            },
        },
    });

    var onStageSelect = function(stageId, layout) {
        if (!layout) {
            dataElementSelected.removeAllDataElements(true);
            uiManager.get('aggregateLayoutWindow').value.resetData();
        }

        dataElementType.enable();
        dataElementSearch.enable();
        dataElementSearch.hideFilter();

        loadDataElements(stageId, layout);
    };

    var loadDataElements = function(stageId, layout) {
        var programId = layout ? layout.program.id : program.getValue() || null;

        var _program = programStorage[programId];

        var dataItems = arrayClean(
            [].concat(_program.attributes || [], _program.programIndicators || [])
        );

        stageId = stageId || layout.programStage.id;

        var load = function(dataElements) {
            var data = arrayClean(dataItems.concat(dataElements || []));

            dataElementsByStageStore.loadData(data);
            dataElementsByStageStore.onLoadData();

            if (layout) {
                var dataDimensions = layout
                        ? layout
                              .getDimensions(true)
                              .filter(dim => !arrayContains(['pe', 'ou'], dim.dimension))
                        : [],
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
        } else {
            new api.Request(refs, {
                baseUrl: appManager.getApiPath() + '/programStages.json',
                type: 'json',
                params: [
                    'filter=id:eq:' + stageId,
                    'fields=programStageDataElements[dataElement[id,' +
                        displayPropertyUrl +
                        ',valueType,optionSet[id,displayName~rename(name)],legendSets~rename(storageLegendSets)[id,displayName~rename(name)]]]',
                    'paging=false',
                ],
                success: function(r) {
                    var stages = r.programStages,
                        types = dimensionConfig.valueType['tracker_aggregatable_types'];

                    if (!stages.length) {
                        load();
                        return;
                    }

                    var include = function(element) {
                        return (
                            arrayContains(types, element.valueType) ||
                            isObject(element.optionSet) ||
                            isArray(element.legendSets || element.storageLegendSets)
                        );
                    };

                    // filter by type
                    var dataElements = arrayPluck(
                        stages[0].programStageDataElements,
                        'dataElement'
                    ).filter(dataElement => {
                        dataElement.isDataElement = true;
                        dataElement.name = '[DE] ' + dataElement.name;
                        return include(dataElement);
                    });

                    // data elements cache
                    dataElementStorage[stageId] = dataElements;

                    load(dataElements);
                },
            }).run();
        }
    };

    // DHIS2-1496: filter by data element, program attribute or program indicator
    const dataElementType = Ext.create('Ext.form.field.ComboBox', {
        editable: false,
        valueField: 'id',
        displayField: 'name',
        queryMode: 'local',
        lastQuery: '',
        width: accBaseWidth / 2 - 32,
        disabled: true,
        listConfig: { loadMask: false },
        style: 'padding-bottom:1px; border-bottom:1px solid #ddd; margin-bottom:1px',
        value: 'all',
        store: {
            fields: ['id', 'name'],
            data: [
                { id: 'all', name: 'All' },
                { id: 'de', name: 'Data elements' },
                { id: 'pa', name: 'Program attributes' },
                { id: 'pi', name: 'Program indicators' },
            ],
        },
        reset: () => {
            onDataElementTypeSelect('all');
        },
        listeners: {
            select: cmp => {
                onDataElementTypeSelect(cmp.getValue());
            },
        },
    });

    const onDataElementTypeSelect = type => {
        dataElementType.setValue(type);

        const store = dataElementsByStageStore;

        switch (type) {
            case 'all':
                store.clearFilter();

                // filter out PI if in aggregated tab
                if (
                    uiManager.disallowProgramIndicators ||
                    uiManager.get('dataTypeToolbar').getDataType() ===
                        dimensionConfig.dataType['aggregated_values']
                ) {
                    store.filterBy(record => !record.data.isProgramIndicator);
                }
                break;
            case 'de':
                store.filterBy(
                    record => !record.data.isAttribute && !record.data.isProgramIndicator
                );
                break;
            case 'pa':
                store.filterBy(record => record.data.isAttribute);
                break;
            case 'pi':
                store.filterBy(record => record.data.isProgramIndicator);
                break;
        }
    };

    var dataElementLabel = Ext.create('Ext.form.Label', {
        width: accBaseWidth / 2 - 32,
        text: i18n.available,
        cls: 'ns-toolbar-multiselect-left-label',
        style: 'margin-right:5px',
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
        },
    });

    var dataElementFilter = Ext.create('Ext.form.field.Trigger', {
        cls: 'ns-trigger-filter',
        emptyText: 'Filter available...',
        height: 22,
        width: accBaseWidth / 2 - 5,
        hidden: true,
        enableKeyEvents: true,
        fieldStyle: 'height:22px; border-right:0 none',
        style: 'height:22px',
        onTriggerClick: function() {
            if (this.getValue()) {
                this.reset();
                this.onKeyUpHandler();
            }

            dataElementSearch.hideFilter();
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
                buffer: 100,
            },
            show: function(cmp) {
                cmp.focus(false, 50);
            },
            focus: function(cmp) {
                cmp.addCls('ns-trigger-filter-focused');
            },
            blur: function(cmp) {
                cmp.removeCls('ns-trigger-filter-focused');
            },
        },
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
            dataElementType,
            '->',
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowdown',
                width: 22,
                height: 22,
                handler: function() {
                    if (dataElementAvailable.getValue().length) {
                        selectDataElements(dataElementAvailable.getValue());
                    }
                },
            },
            //{
            //xtype: 'button',
            //iconCls: './src/images/arrowdowndouble.png',
            //width: 22,
            //height: 22,
            //handler: function() {
            //if (dataElementsByStageStore.getRange().length) {
            //selectDataElements(dataElementsByStageStore.getRange());
            //}
            //}
            //}
        ],
        listeners: {
            afterrender: function(ms) {
                this.boundList.on('itemdblclick', function() {
                    if (ms.getValue().length) {
                        selectDataElements(ms.getValue());
                    }
                });
            },
        },
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
                cls: 'ns-toolbar-multiselect-left-label',
            },
            '->',
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowupdouble',
                width: 22,
                height: 22,
                handler: function() {
                    dataElementSelected.removeAllDataElements();
                },
            },
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

            this.items.each(function(item) {
                if (item.dataElement.id === dataElementId) {
                    hasDataElement = true;
                }
            });

            return hasDataElement;
        },
        getUxArrayById: function(dataElementId) {
            var uxArray = [];

            this.items.each(function(item) {
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
            this.items.each(function(item) {
                if (
                    type === dimensionConfig.dataType['aggregated_values'] &&
                    item.isProgramIndicator
                ) {
                    item.disable();
                } else {
                    item.enable();
                }
            });
        },
    });

    var addUxFromDataElement = function(element, index) {
        var aggWindow = uiManager.get('aggregateLayoutWindow'),
            queryWindow = uiManager.get('queryLayoutWindow');

        index = index || dataElementSelected.items.items.length;

        var getUxType = function(element) {
            var valueTypes = dimensionConfig.valueType;

            if (isObject(element.optionSet) && isString(element.optionSet.id)) {
                return 'Ext.ux.container.GroupSetContainer';
            }

            if (arrayContains(valueTypes['numeric_types'], element.valueType)) {
                return 'Ext.ux.container.DataElementIntegerContainer';
            }

            if (arrayContains(valueTypes['text_types'], element.valueType)) {
                return 'Ext.ux.container.DataElementStringContainer';
            }

            if (arrayContains(valueTypes['date_types'], element.valueType)) {
                return 'Ext.ux.container.DataElementDateContainer';
            }

            if (arrayContains(valueTypes['boolean_types'], element.valueType)) {
                return 'Ext.ux.container.DataElementBooleanContainer';
            }

            return 'Ext.ux.container.DataElementIntegerContainer';
        };

        // add
        var ux = dataElementSelected.insert(
            index,
            Ext.create(getUxType(element), {
                dataElement: element,
            })
        );

        ux.isAttribute = element.isAttribute;
        ux.isProgramIndicator = element.isProgramIndicator;
        ux.isDataElement = element.isDataElement;

        ux.removeDataElement = function(reset) {
            dataElementSelected.remove(ux);

            if (!dataElementSelected.hasDataElement(element.id)) {
                if (!reset) {
                    dataElementsByStageStore.add(element);
                    dataElementsByStageStore.sort();
                }

                aggWindow.removeDimension(element.id, aggWindow.valueStore);

                if (queryWindow) {
                    queryWindow.removeDimension(element.id);
                }
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
            aggWindow = uiManager.get('aggregateLayoutWindow'),
            queryWindow = uiManager.get('queryLayoutWindow'),
            includeKeys = dimensionConfig.valueType['tracker_aggregatable_types'],
            ignoreKeys = ['pe', 'ou'],
            recordMap = dimensionConfig.getObjectNameMap(),
            extendDim = function(dim) {
                dim.id = dim.id || dim.dimension;
                dim.name =
                    dim.name || layout
                        ? layout.getResponse().getNameById(dim.dimension)
                        : null || recordMap[dim.dimension].name;

                return dim;
            };

        // data element objects
        for (var i = 0, item; i < items.length; i++) {
            item = items[i];

            if (isString(item)) {
                dataElements.push(dataElementsByStageStore.getById(item).data);
            } else if (isObject(item)) {
                if (item.data) {
                    dataElements.push(item.data);
                } else {
                    dataElements.push(item);
                }
            }
        }

        // expand if multiple filter
        for (var i = 0, element, a, numberOfElements; i < dataElements.length; i++) {
            element = dataElements[i];
            allElements.push(element);

            if (
                arrayContains(dimensionConfig.valueType['numeric_types'], element.valueType) &&
                element.filter
            ) {
                a = element.filter.split(':');
                numberOfElements = a.length / 2;

                if (numberOfElements > 1) {
                    a.shift();
                    a.shift();

                    for (var j = 1, newElement; j < numberOfElements; j++) {
                        //newElement = Ext.clone(element);
                        newElement = Object.assign({}, element);
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

            store =
                arrayContains(includeKeys, element.valueType) || element.optionSet
                    ? aggWindow.getDefaultStore()
                    : aggWindow.fixedFilterStore;

            aggWindow.addDimension(element, store, aggWindow.valueStore);

            if (queryWindow) {
                queryWindow.colStore.add(element);
            }
        }

        // favorite
        if (layout && layout.dataType !== dimensionConfig.dataType['individual_cases']) {
            aggWindow.reset(true, true);

            // start end dates
            if (layout.startDate && layout.endDate) {
                aggWindow.fixedFilterStore.add({
                    id: dimensionConfig.get('startEndDate').value,
                    name: dimensionConfig.get('startEndDate').name,
                });
            }

            // columns
            if (layout.columns) {
                for (var i = 0, record, dim; i < layout.columns.length; i++) {
                    dim = Object.assign({}, layout.columns[i]);
                    record = recordMap[dim.dimension];

                    aggWindow.colStore.add(record || extendDim(dim));
                }
            }

            // rows
            if (layout.rows) {
                for (var i = 0, record, dim; i < layout.rows.length; i++) {
                    dim = Object.assign({}, layout.rows[i]);
                    record = recordMap[dim.dimension];

                    aggWindow.rowStore.add(record || extendDim(dim));
                }
            }

            // filters
            if (layout.filters) {
                for (var i = 0, store, record, dim; i < layout.filters.length; i++) {
                    dim = Object.assign({}, layout.filters[i]);
                    record = recordMap[dim.dimension];
                    store =
                        arrayContains(includeKeys, element.valueType) || element.optionSet
                            ? aggWindow.filterStore
                            : aggWindow.fixedFilterStore;

                    store.add(record || extendDim(dim));
                }
            }

            // value
            if (layout.value && layout.aggregationType) {
                aggWindow.setValueConfig(layout.value.id, layout.aggregationType);
            }

            // collapse data dimensions
            if (aggWindow.collapseDataDimensions) {
                aggWindow.collapseDataDimensions.setValue(layout.collapseDataDimensions);
                aggWindow.onCollapseDataDimensionsChange(layout.collapseDataDimensions);
            }
        }
    };

    var programStagePanel = Ext.create('Ext.panel.Panel', {
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin-top:2px',
        items: [program, stage],
    });

    var data = Ext.create('Ext.panel.Panel', {
        title: '<div class="ns-panel-title-data">' + i18n.data + '</div>',
        cls: 'ns-accordion-first',
        bodyStyle: 'padding:1px',
        hideCollapseTool: true,
        dimension: dimensionConfig.get('data').objectName,
        items: [programStagePanel, dataElementAvailable, dataElementSelected],
        setDimension: function(layout) {
            setData(layout);
        },
        clearDimension: function() {
            program.clearValue();
            stage.clearValue();

            dataElementsByStageStore.removeAll();
            dataElementSelected.removeAll();

            dataElementSearch.hideFilter();
        },
        getHeightValue: function() {
            var westRegion = uiManager.get('westRegion');

            return westRegion.hasScrollbar
                ? uiConfig.west_scrollbarheight_accordion_indicator
                : uiConfig.west_maxheight_accordion_indicator;
        },
        onExpand: function() {
            accordion.setThisHeight(this.getHeightValue());

            var msHeight = this.getHeight() - 28 - programStagePanel.getHeight() - 6;

            dataElementAvailable.setHeight(msHeight * 0.4);
            dataElementSelected.setHeight(msHeight * 0.6 - 1);
        },
        listeners: {
            expand: function(cmp) {
                cmp.onExpand();
            },
        },
    });
    accordionPanels.push(uiManager.reg(data, 'data'));

    // dates
    var periodMode = Ext.create('Ext.form.field.ComboBox', {
        editable: false,
        valueField: 'id',
        displayField: 'name',
        queryMode: 'local',
        width: accBaseWidth,
        listConfig: { loadMask: false },
        style: 'padding-bottom:1px; border-bottom:1px solid #ddd; margin-bottom:1px',
        value: 'periods',
        store: {
            fields: ['id', 'name'],
            data: [
                { id: 'periods', name: 'Fixed and relative periods' },
                { id: 'dates', name: 'Start/end dates' },
            ],
        },
        reset: function() {
            onPeriodModeSelect('periods');
        },
        listeners: {
            select: function(cmp) {
                onPeriodModeSelect(cmp.getValue());
            },
        },
    });

    var onPeriodModeSelect = function(mode) {
        var aggregateLayoutWindow = uiManager.get('aggregateLayoutWindow');

        periodMode.setValue(mode);

        if (mode === 'dates') {
            startEndDate.show();
            periods.hide();

            aggregateLayoutWindow.addDimension(
                {
                    id: dimensionConfig.get('startEndDate').value,
                    name: dimensionConfig.get('startEndDate').name,
                },
                aggregateLayoutWindow.fixedFilterStore
            );

            aggregateLayoutWindow.removeDimension(dimensionConfig.get('period').dimensionName);
        } else if (mode === 'periods') {
            startEndDate.hide();
            periods.show();

            aggregateLayoutWindow.addDimension(
                {
                    id: dimensionConfig.get('period').dimensionName,
                    name: dimensionConfig.get('period').name,
                },
                aggregateLayoutWindow.colStore
            );

            aggregateLayoutWindow.removeDimension(dimensionConfig.get('startEndDate').value);
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
                },
            },
        });
    };

    var onDateFieldRender = function(c) {
        $('#' + c.inputEl.id).calendarsPicker({
            calendar: calendarManager.calendar,
            dateFormat: appManager.systemInfo.dateFormat,
        });
    };

    var startDate = Ext.create('Ext.form.field.Text', {
        fieldLabel: 'Start date',
        labelAlign: 'top',
        labelCls: 'ns-form-item-label-top ns-form-item-label-top-padding',
        labelSeparator: '',
        columnWidth: 0.5,
        height: 44,
        value: calendarManager.calendar.formatDate(
            appManager.systemInfo.dateFormat,
            calendarManager.calendar.today().add(-3, 'm')
        ),
        listeners: {
            render: function(c) {
                onDateFieldRender(c);
            },
        },
    });

    var endDate = Ext.create('Ext.form.field.Text', {
        fieldLabel: 'End date',
        labelAlign: 'top',
        labelCls: 'ns-form-item-label-top ns-form-item-label-top-padding',
        labelSeparator: '',
        columnWidth: 0.5,
        height: 44,
        style: 'margin-left: 1px',
        value: calendarManager.calendar.formatDate(
            appManager.systemInfo.dateFormat,
            calendarManager.calendar.today()
        ),
        listeners: {
            render: function(c) {
                onDateFieldRender(c);
            },
        },
    });

    var startEndDate = Ext.create('Ext.container.Container', {
        cls: 'ns-container-default',
        layout: 'column',
        hidden: true,
        items: [startDate, endDate],
    });

    var onCheckboxAdd = function(cmp) {
        if (cmp.xtype === 'checkbox') {
            uiManager.reg(cmp, cmp.relativePeriodId, null, 'relativePeriod');
        }
    };

    var intervalListeners = {
        added: function(cmp) {
            onCheckboxAdd(cmp);
        },
    };

    var days = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:0 0 0 8px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners,
        },
        items: [
            {
                xtype: 'label',
                text: i18n['days'],
                cls: 'ns-label-period-heading',
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'TODAY',
                boxLabel: i18n['today'],
                index: 0,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'YESTERDAY',
                boxLabel: i18n['yesterday'],
                index: 1,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_3_DAYS',
                boxLabel: i18n['last_3_days'],
                index: 2,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_7_DAYS',
                boxLabel: i18n['last_7_days'],
                index: 3,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_14_DAYS',
                boxLabel: i18n['last_14_days'],
                index: 4,
            },
        ],
    });

    var weeks = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:0 0 0 8px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners,
        },
        items: [
            {
                xtype: 'label',
                text: i18n.weeks,
                cls: 'ns-label-period-heading',
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_WEEK',
                boxLabel: i18n.this_week,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_WEEK',
                boxLabel: i18n.last_week,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_4_WEEKS',
                boxLabel: i18n.last_4_weeks,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_12_WEEKS',
                boxLabel: i18n.last_12_weeks,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_52_WEEKS',
                boxLabel: i18n.last_52_weeks,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'WEEKS_THIS_YEAR',
                boxLabel: i18n.weeks_this_year,
            },
        ],
    });

    var months = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:0 0 0 8px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners,
        },
        items: [
            {
                xtype: 'label',
                text: i18n.months,
                cls: 'ns-label-period-heading',
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_MONTH',
                boxLabel: i18n.this_month,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_MONTH',
                boxLabel: i18n.last_month,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_3_MONTHS',
                boxLabel: i18n.last_3_months,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_6_MONTHS',
                boxLabel: i18n.last_6_months,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_12_MONTHS',
                boxLabel: i18n.last_12_months,
                checked: true,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'MONTHS_THIS_YEAR',
                boxLabel: i18n.months_this_year,
            },
        ],
    });

    var biMonths = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:5px 0 0 8px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners,
        },
        items: [
            {
                xtype: 'label',
                text: i18n.bimonths,
                cls: 'ns-label-period-heading',
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_BIMONTH',
                boxLabel: i18n.this_bimonth,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_BIMONTH',
                boxLabel: i18n.last_bimonth,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_6_BIMONTHS',
                boxLabel: i18n.last_6_bimonths,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'BIMONTHS_THIS_YEAR',
                boxLabel: i18n.bimonths_this_year,
            },
        ],
    });

    var quarters = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:5px 0 0 8px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners,
        },
        items: [
            {
                xtype: 'label',
                text: i18n.quarters,
                cls: 'ns-label-period-heading',
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_QUARTER',
                boxLabel: i18n.this_quarter,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_QUARTER',
                boxLabel: i18n.last_quarter,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_4_QUARTERS',
                boxLabel: i18n.last_4_quarters,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'QUARTERS_THIS_YEAR',
                boxLabel: i18n.quarters_this_year,
            },
        ],
    });

    var sixMonths = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:5px 0 0 8px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners,
        },
        items: [
            {
                xtype: 'label',
                text: i18n.sixmonths,
                cls: 'ns-label-period-heading',
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_SIX_MONTH',
                boxLabel: i18n.this_sixmonth,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_SIX_MONTH',
                boxLabel: i18n.last_sixmonth,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_2_SIXMONTHS',
                boxLabel: i18n.last_2_sixmonths,
            },
        ],
    });

    var financialYears = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:5px 0 0 8px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners,
        },
        items: [
            {
                xtype: 'label',
                text: i18n.financial_years,
                cls: 'ns-label-period-heading',
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_FINANCIAL_YEAR',
                boxLabel: i18n.this_financial_year,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_FINANCIAL_YEAR',
                boxLabel: i18n.last_financial_year,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_5_FINANCIAL_YEARS',
                boxLabel: i18n.last_5_financial_years,
            },
        ],
    });

    var years = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:5px 0 0 8px',
        defaults: {
            labelSeparator: '',
            style: 'margin-bottom:0',
            listeners: intervalListeners,
        },
        items: [
            {
                xtype: 'label',
                text: i18n.years,
                cls: 'ns-label-period-heading',
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'THIS_YEAR',
                boxLabel: i18n.this_year,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_YEAR',
                boxLabel: i18n.last_year,
            },
            {
                xtype: 'checkbox',
                relativePeriodId: 'LAST_5_YEARS',
                boxLabel: i18n.last_5_years,
            },
        ],
    });

    var relativePeriod = Ext.create('Ext.panel.Panel', {
        layout: 'column',
        hideCollapseTool: true,
        autoScroll: true,
        bodyStyle: 'border:0 none',
        items: [
            {
                xtype: 'container',
                columnWidth: 0.34,
                bodyStyle: 'border-style:none',
                items: [days, biMonths, financialYears],
            },
            {
                xtype: 'container',
                columnWidth: 0.33,
                bodyStyle: 'border-style:none',
                items: [weeks, quarters, years],
            },
            {
                xtype: 'container',
                columnWidth: 0.33,
                bodyStyle: 'border-style:none',
                items: [months, sixMonths],
            },
        ],
        getRecords: function() {
            return uiManager
                .getByGroup('relativePeriod')
                .filter(cmp => cmp.getValue())
                .map(cmp => cmp.relativePeriodId);
        },
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
                cls: 'ns-toolbar-multiselect-left-label',
            },
            '->',
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowright',
                width: 22,
                handler: function() {
                    uiManager.msSelect(fixedPeriodAvailable, fixedPeriodSelected);
                },
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowrightdouble',
                width: 22,
                handler: function() {
                    uiManager.msSelectAll(fixedPeriodAvailable, fixedPeriodSelected, true);
                },
            },
            ' ',
        ],
        listeners: {
            afterrender: function() {
                this.boundList.on(
                    'itemdblclick',
                    function() {
                        uiManager.msSelect(fixedPeriodAvailable, fixedPeriodSelected);
                    },
                    this
                );
            },
        },
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
                iconCls: 'ns-button-icon-arrowleftdouble',
                width: 22,
                handler: function() {
                    uiManager.msUnselectAll(fixedPeriodAvailable, fixedPeriodSelected);
                },
            },
            {
                xtype: 'button',
                iconCls: 'ns-button-icon-arrowleft',
                width: 22,
                handler: function() {
                    uiManager.msUnselect(fixedPeriodAvailable, fixedPeriodSelected);
                },
            },
            '->',
            {
                xtype: 'label',
                text: i18n.selected,
                cls: 'ns-toolbar-multiselect-right-label',
            },
        ],
        listeners: {
            afterrender: function() {
                this.boundList.on(
                    'itemdblclick',
                    function() {
                        uiManager.msUnselect(fixedPeriodAvailable, fixedPeriodSelected);
                    },
                    this
                );
            },
        },
    });

    var onPeriodTypeSelect = function() {
        var type = periodType.getValue(),
            periodOffset = periodType.periodOffset,
            generator = calendarManager.periodGenerator,
            periods = generator.generateReversedPeriods(
                type,
                type === 'Yearly' ? periodOffset - 5 : periodOffset
            );

        periods.forEach(period => (period.id = period.iso));

        fixedPeriodAvailableStore.setIndex(periods);
        fixedPeriodAvailableStore.loadData(periods);
        uiManager.msFilterAvailable(fixedPeriodAvailable, fixedPeriodSelected);
    };

    var periodType = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-right:1px; margin-bottom:1px',
        width: accBaseWidth - nextButtonWidth * 2 - 2,
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
            },
        },
    });

    var prevYear = Ext.create('Ext.button.Button', {
        text: i18n.prev_year,
        style: 'border-radius:1px; margin-right:1px',
        height: 24,
        width: nextButtonWidth,
        handler: function() {
            if (periodType.getValue()) {
                periodType.periodOffset--;
                onPeriodTypeSelect();
            }
        },
    });

    var nextYear = Ext.create('Ext.button.Button', {
        text: i18n.next_year,
        style: 'border-radius:1px',
        height: 24,
        width: nextButtonWidth,
        handler: function() {
            if (periodType.getValue()) {
                periodType.periodOffset++;
                onPeriodTypeSelect();
            }
        },
    });

    var fixedPeriodSettings = Ext.create('Ext.container.Container', {
        layout: 'column',
        bodyStyle: 'border-style:none',
        style: 'margin-top:0px',
        items: [periodType, prevYear, nextYear],
    });

    var fixedPeriodAvailableSelected = Ext.create('Ext.container.Container', {
        layout: 'column',
        bodyStyle: 'border-style:none; padding-bottom:2px',
        items: [fixedPeriodAvailable, fixedPeriodSelected],
    });

    var periods = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none',
        getRecords: function() {
            var selectedRecords = [],
                records;

            fixedPeriodSelectedStore.each(function(r) {
                selectedRecords.push({ id: r.data.id });
            });

            records = [
                ...selectedRecords,
                ...uiManager
                    .getByGroup('relativePeriod')
                    .filter(cmp => cmp.getValue())
                    .map(cmp => ({ id: cmp.relativePeriodId })),
            ];

            return records.length ? records : null;
        },
        getDimension: function() {
            return {
                dimension: 'pe',
                items: this.getRecords(),
            };
        },
        items: [
            {
                xtype: 'panel',
                layout: 'column',
                bodyStyle: 'border-style:none; padding-bottom:2px',
                items: [fixedPeriodSettings, fixedPeriodAvailableSelected],
            },
            relativePeriod,
        ],
    });

    var period = Ext.create('Ext.panel.Panel', {
        title: '<div class="ns-panel-title-period">Periods</div>',
        bodyStyle: 'padding:1px',
        hideCollapseTool: true,
        dimension: dimensionConfig.get('period').objectName,
        width: accBaseWidth,
        clearDimension: function(all) {
            this.resetFixedPeriods();
            this.resetRelativePeriods();
            this.resetStartEndDates();

            periodMode.reset();

            if (!all) {
                uiManager.get(appManager.getRelativePeriod()).setValue(true);
            }
        },
        setDimension: function(layout) {
            if (!layout) {
                return;
            }

            if (layout.startDate && layout.endDate) {
                onPeriodModeSelect('dates');
                startDate.setValue(layout.startDate);
                endDate.setValue(layout.endDate);
            } else {
                onPeriodModeSelect('periods');
            }

            if (layout.hasDimension(this.dimension, true)) {
                var records = layout
                        .getDimension(this.dimension)
                        .extendRecords(layout.getResponse()),
                    fixedRecords = [],
                    checkbox;

                records.forEach(function(record) {
                    checkbox = uiManager.get(record.id);

                    if (checkbox) {
                        checkbox.setValue(true);
                    } else {
                        fixedRecords.push(record);
                    }
                });

                fixedPeriodSelectedStore.add(fixedRecords);

                uiManager.msFilterAvailable(
                    { store: fixedPeriodAvailableStore },
                    { store: fixedPeriodSelectedStore }
                );
            }
        },
        getDimension: function() {
            var config = {
                dimension: periodObjectName,
                items: periods.getRecords(),
            };

            return config.items.length ? config : null;
        },
        getHeightValue: function() {
            var westRegion = uiManager.get('westRegion');

            return westRegion.hasScrollbar
                ? uiConfig.west_scrollbarheight_accordion_period
                : uiConfig.west_maxheight_accordion_period;
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
            return uiManager.getByGroup('relativePeriod').some(chb => chb.getValue());
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
        items: [periodMode, startEndDate, periods],
        listeners: {
            expand: function(cmp) {
                cmp.onExpand();
            },
        },
    });
    accordionPanels.push(uiManager.reg(period, 'period'));

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
            this.recordsToSelect = arrayClean(this.recordsToSelect);

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

            if (path.substr(0, rootId.length + 1) !== '/' + rootId) {
                path = '/' + rootId + '/' + path;
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
                },
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
                    fields:
                        'children[id,' +
                        displayPropertyUrl +
                        ',children::isNotEmpty~rename(hasChildren)&paging=false',
                },
                url: appManager.getApiPath() + '/organisationUnits',
                reader: {
                    type: 'json',
                    root: 'children',
                },
                sortParam: false,
            },
            sorters: [
                {
                    property: 'name',
                    direction: 'ASC',
                },
            ],
            root: {
                id: appManager.rootNodeId,
                expanded: true,
                children: appManager.getRootNodes(),
            },
            listeners: {
                beforeload: function(store, operation) {
                    if (!store.proxy._url) {
                        store.proxy._url = store.proxy.url;
                    }

                    store.proxy.url = store.proxy._url + '/' + operation.node.data.id;
                },
                load: function(store, node, records) {
                    records.forEach(function(record) {
                        if (isBoolean(record.data.hasChildren)) {
                            record.set('leaf', !record.data.hasChildren);
                        }
                    });
                },
            },
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
                    dimension: organisationUnitObjectName,
                    items: [],
                };

            if (toolMenu.menuValue === 'orgunit') {
                if (
                    userOrganisationUnit.getValue() ||
                    userOrganisationUnitChildren.getValue() ||
                    userOrganisationUnitGrandChildren.getValue()
                ) {
                    if (userOrganisationUnit.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT',
                            name: '',
                        });
                    }
                    if (userOrganisationUnitChildren.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT_CHILDREN',
                            name: '',
                        });
                    }
                    if (userOrganisationUnitGrandChildren.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT_GRANDCHILDREN',
                            name: '',
                        });
                    }
                } else {
                    for (var i = 0; i < r.length; i++) {
                        config.items.push({ id: r[i].data.id });
                    }
                }
            } else if (toolMenu.menuValue === 'level') {
                var levels = organisationUnitLevel.getValue();

                for (var i = 0; i < levels.length; i++) {
                    config.items.push({
                        id: 'LEVEL-' + levels[i],
                        name: '',
                    });
                }

                for (var i = 0; i < r.length; i++) {
                    config.items.push({
                        id: r[i].data.id,
                        name: '',
                    });
                }
            } else if (toolMenu.menuValue === 'group') {
                var groupIds = organisationUnitGroup.getValue();

                for (var i = 0; i < groupIds.length; i++) {
                    config.items.push({
                        id: 'OU_GROUP-' + groupIds[i],
                        name: '',
                    });
                }

                for (var i = 0; i < r.length; i++) {
                    config.items.push({
                        id: r[i].data.id,
                        name: '',
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
                    shadow: false,
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
                        },
                    });
                } else {
                    return;
                }

                v.menu.showAt(e.xy);
            },
        },
    });
    uiManager.reg(treePanel, 'treePanel');

    var userOrganisationUnit = Ext.create('Ext.form.field.Checkbox', {
        columnWidth: 0.25,
        style: 'padding-top: 3px; padding-left: 5px; margin-bottom: 0',
        boxLabel: 'User org unit',
        labelWidth: uiConfig.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([
                checked,
                userOrganisationUnitChildren.getValue(),
                userOrganisationUnitGrandChildren.getValue(),
            ]);
        },
    });

    var userOrganisationUnitChildren = Ext.create('Ext.form.field.Checkbox', {
        columnWidth: 0.26,
        style: 'padding-top: 3px; margin-bottom: 0',
        boxLabel: i18n.user_sub_units,
        labelWidth: uiConfig.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([
                checked,
                userOrganisationUnit.getValue(),
                userOrganisationUnitGrandChildren.getValue(),
            ]);
        },
    });

    var userOrganisationUnitGrandChildren = Ext.create('Ext.form.field.Checkbox', {
        columnWidth: 0.4,
        style: 'padding-top: 3px; margin-bottom: 0',
        boxLabel: i18n.user_sub_x2_units,
        labelWidth: uiConfig.form_label_width,
        handler: function(chb, checked) {
            treePanel.xable([
                checked,
                userOrganisationUnit.getValue(),
                userOrganisationUnitChildren.getValue(),
            ]);
        },
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
            data: appManager.organisationUnitLevels,
        },
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
        store: organisationUnitGroupStore,
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
            organisationUnitGroup,
        ],
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
                    } else {
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
            } else if (param === 'level') {
                userOrganisationUnit.hide();
                userOrganisationUnitChildren.hide();
                userOrganisationUnitGrandChildren.hide();
                organisationUnitLevel.show();
                organisationUnitGroup.hide();
                treePanel.enable();
            } else if (param === 'group') {
                // DHIS2-561: avoid showing the group ids in the combobox when
                // loading a favorite and expanding the OU panel
                organisationUnitGroupStore.load();

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
                style: 'padding:7px 5px 5px 7px; font-weight:bold; border:0 none',
            },
            {
                text: i18n.select_organisation_units + '&nbsp;&nbsp;',
                param: 'orgunit',
                iconCls: 'ns-menu-item-selected',
            },
            {
                text: 'Select levels' + '&nbsp;&nbsp;',
                param: 'level',
                iconCls: 'ns-menu-item-unselected',
            },
            {
                text: 'Select groups' + '&nbsp;&nbsp;',
                param: 'group',
                iconCls: 'ns-menu-item-unselected',
            },
        ],
        listeners: {
            afterrender: function() {
                this.getEl().addCls('ns-btn-menu');
            },
            click: function(menu, item) {
                this.clickHandler(item.param);
            },
        },
    });

    var tool = Ext.create('Ext.button.Button', {
        cls: 'ns-button-organisationunitselection',
        iconCls: 'ns-button-icon-gear',
        width: toolWidth,
        height: 24,
        menu: toolMenu,
    });

    var toolPanel = Ext.create('Ext.panel.Panel', {
        width: toolWidth,
        bodyStyle: 'border:0 none; text-align:right',
        style: 'margin-right:1px',
        items: tool,
    });

    var organisationUnit = Ext.create('Ext.panel.Panel', {
        title: '<div class="ns-panel-title-organisationunit">' + i18n.organisation_units + '</div>',
        bodyStyle: 'padding:1px',
        hideCollapseTool: true,
        dimension: dimensionConfig.get('organisationUnit').objectName,
        collapsed: false,
        clearDimension: function(doClear, skipTree) {
            if (doClear) {
                toolMenu.clickHandler(toolMenu.menuValue);

                if (!skipTree) {
                    treePanel.reset();
                }

                userOrganisationUnit.setValue(false);
                userOrganisationUnitChildren.setValue(false);
                userOrganisationUnitGrandChildren.setValue(false);

                organisationUnitLevel.clearValue();
                organisationUnitGroup.clearValue();
            }
        },
        setDimension: function(layout) {
            if (layout.hasDimension(this.dimension, true)) {
                var dimension = layout.getDimension(this.dimension, true),
                    parentGraphMap = layout.parentGraphMap;

                var records = dimension.getRecords(),
                    ids = [],
                    levels = [],
                    groups = [],
                    isOu,
                    isOuc,
                    isOugc;

                records.forEach(function(record) {
                    if (record.id === 'USER_ORGUNIT') {
                        isOu = true;
                    } else if (record.id === 'USER_ORGUNIT_CHILDREN') {
                        isOuc = true;
                    } else if (record.id === 'USER_ORGUNIT_GRANDCHILDREN') {
                        isOugc = true;
                    } else if (record.id.substr(0, 5) === 'LEVEL') {
                        levels.push(parseInt(record.id.split('-')[1]));
                    } else if (record.id.substr(0, 8) === 'OU_GROUP') {
                        groups.push(record.id.split('-')[1]);
                    } else {
                        ids.push(record.id);
                    }
                });

                if (levels.length) {
                    toolMenu.clickHandler('level');
                    organisationUnitLevel.setValue(levels);
                } else if (groups.length) {
                    toolMenu.clickHandler('group');
                    organisationUnitGroup.setValue(groups);
                } else {
                    toolMenu.clickHandler('orgunit');
                    userOrganisationUnit.setValue(isOu);
                    userOrganisationUnitChildren.setValue(isOuc);
                    userOrganisationUnitGrandChildren.setValue(isOugc);
                }

                if (!(isOu || isOuc || isOugc)) {
                    if (isObject(parentGraphMap)) {
                        treePanel.selectGraphMap(parentGraphMap);
                    }
                }
            } else {
                this.clearDimension(true);
            }
        },
        getDimension: function() {
            var r = treePanel.getSelectionModel().getSelection(),
                config = {
                    dimension: organisationUnitObjectName,
                    items: [],
                };

            if (toolMenu.menuValue === 'orgunit') {
                if (
                    userOrganisationUnit.getValue() ||
                    userOrganisationUnitChildren.getValue() ||
                    userOrganisationUnitGrandChildren.getValue()
                ) {
                    if (userOrganisationUnit.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT',
                            name: '',
                        });
                    }
                    if (userOrganisationUnitChildren.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT_CHILDREN',
                            name: '',
                        });
                    }
                    if (userOrganisationUnitGrandChildren.getValue()) {
                        config.items.push({
                            id: 'USER_ORGUNIT_GRANDCHILDREN',
                            name: '',
                        });
                    }
                } else {
                    for (var i = 0; i < r.length; i++) {
                        config.items.push({ id: r[i].data.id });
                    }
                }
            } else if (toolMenu.menuValue === 'level') {
                var levels = organisationUnitLevel.getValue();

                for (var i = 0; i < levels.length; i++) {
                    config.items.push({
                        id: 'LEVEL-' + levels[i],
                        name: '',
                    });
                }

                for (var i = 0; i < r.length; i++) {
                    config.items.push({
                        id: r[i].data.id,
                        name: '',
                    });
                }
            } else if (toolMenu.menuValue === 'group') {
                var groupIds = organisationUnitGroup.getValue();

                for (var i = 0; i < groupIds.length; i++) {
                    config.items.push({
                        id: 'OU_GROUP-' + groupIds[i],
                        name: '',
                    });
                }

                for (var i = 0; i < r.length; i++) {
                    config.items.push({
                        id: r[i].data.id,
                        name: '',
                    });
                }
            }

            return config.items.length ? config : null;
        },
        getHeightValue: function() {
            var westRegion = uiManager.get('westRegion');

            return westRegion.hasScrollbar
                ? uiConfig.west_scrollbarheight_accordion_organisationunit
                : uiConfig.west_maxheight_accordion_organisationunit;
        },
        onExpand: function() {
            accordion.setThisHeight(this.getHeightValue);

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
                        width: accBaseWidth - 37,
                        layout: 'column',
                        bodyStyle: 'border:0 none',
                        items: [
                            userOrganisationUnit,
                            userOrganisationUnitChildren,
                            userOrganisationUnitGrandChildren,
                            organisationUnitLevel,
                            organisationUnitGroup,
                        ],
                    },
                ],
            },
            treePanel,
        ],
        listeners: {
            expand: function(p) {
                p.onExpand();
            },
        },
    });
    accordionPanels.push(uiManager.reg(organisationUnit, 'organisationUnit'));

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
            var win = uiManager.get('viewport').getLayoutWindow();

            if (selectedStore.getRange().length || selectedAll.getValue()) {
                win.addDimension({ id: dimension.id, name: dimension.name });
            } else if (win.hasDimension(dimension.id)) {
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
                } else {
                    if (!append) {
                        this.lastPage = null;
                        this.nextPage = 1;
                    }

                    if (store.nextPage === store.lastPage) {
                        return;
                    }

                    url =
                        '/dimensions/' +
                        dimension.id +
                        '/items.json?fields=id,' +
                        displayPropertyUrl +
                        (filter ? '&filter=' + displayProperty + ':ilike:' + filter : '');

                    if (noPaging) {
                        params.paging = false;
                    } else {
                        params.page = store.nextPage;
                        params.pageSize = 50;
                    }

                    store.isPending = true;
                    uiManager.mask(available.boundList);

                    Ext.Ajax.request({
                        url: encodeURI(apiPath + url),
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
                        },
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

                uiManager.msFilterAvailable({ store: availableStore }, { store: selectedStore });

                if (fn) {
                    fn();
                }
            },
            sortStore: function() {
                this.sort('name', 'ASC');
            },
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
                },
            },
        });

        dataLabel = Ext.create('Ext.form.Label', {
            text: i18n.available,
            cls: 'ns-toolbar-multiselect-left-label',
            style: 'margin-right:5px',
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
            },
        });

        dataFilter = Ext.create('Ext.form.field.Trigger', {
            width: accBaseWidth / 2,
            cls: 'ns-trigger-filter',
            emptyText: 'Filter available...',
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
                    buffer: 100,
                },
                show: function(cmp) {
                    cmp.focus(false, 50);
                },
                focus: function(cmp) {
                    cmp.addCls('ns-trigger-filter-focused');
                },
                blur: function(cmp) {
                    cmp.removeCls('ns-trigger-filter-focused');
                },
            },
        });

        selectedAll = Ext.create('Ext.form.field.Checkbox', {
            cls: 'ns-checkbox',
            style: 'margin-left: 2px; margin-right: 5px',
            boxLabel: 'All',
            listeners: {
                change: function(chb, newVal) {
                    onSelectAll(newVal);
                },
            },
        });

        available = Ext.create('Ext.ux.form.MultiSelect', {
            cls: 'ns-toolbar-multiselect-left',
            width: accBaseWidth / 2,
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
                    },
                },
                {
                    xtype: 'button',
                    iconCls: 'ns-button-icon-arrowrightdouble',
                    width: 22,
                    handler: function() {
                        availableStore.loadPage(null, null, true, function() {
                            uiManager.msSelectAll(available, selected);
                        });
                    },
                },
            ],
            listeners: {
                render: function(ms) {
                    var el = Ext.get(ms.boundList.getEl().id + '-listEl').dom;

                    el.addEventListener('scroll', function(e) {
                        if (uiManager.isScrolled(e) && !availableStore.isPending) {
                            availableStore.loadPage(null, true);
                        }
                    });

                    ms.boundList.on(
                        'itemdblclick',
                        function() {
                            uiManager.msSelect(available, selected);
                        },
                        ms
                    );
                },
            },
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
                    iconCls: 'ns-button-icon-arrowleftdouble',
                    width: 22,
                    handler: function() {
                        uiManager.msUnselectAll(available, selected);
                    },
                },
                {
                    xtype: 'button',
                    iconCls: 'ns-button-icon-arrowleft',
                    width: 22,
                    handler: function() {
                        uiManager.msUnselect(available, selected);
                    },
                },
                '->',
                {
                    xtype: 'label',
                    text: i18n.selected,
                    cls: 'ns-toolbar-multiselect-right-label',
                },
                selectedAll,
            ],
            listeners: {
                afterrender: function() {
                    this.boundList.on(
                        'itemdblclick',
                        function() {
                            uiManager.msUnselect(available, selected);
                        },
                        this
                    );
                },
            },
        });

        onSelectAll = function(value) {
            if (available.boundList && selected.boundList) {
                if (value) {
                    available.boundList.disable();
                    selected.boundList.disable();
                } else {
                    available.boundList.enable();
                    selected.boundList.enable();
                }
            }

            onSelect();
        };

        panel = Ext.create('Ext.panel.Panel', {
            title: '<div class="' + iconCls + '">' + dimension.name + '</div>',
            hideCollapseTool: true,
            dimension: dimension.id,
            availableStore: availableStore,
            selectedStore: selectedStore,
            selectedAll: selectedAll,
            isDynamic: true,
            clearDimension: function() {
                availableStore.reset();
                selectedStore.removeAll();
                selectedAll.setValue(false);
            },
            setDimension: function(layout) {
                if (layout.hasDimension(this.dimension, true)) {
                    var records = layout.getDimension(this.dimension).getRecords();

                    if (records.length) {
                        selectedStore.add(records);
                        uiManager.msFilterAvailable(
                            { store: availableStore },
                            { store: selectedStore }
                        );
                    } else {
                        selectedAll.setValue(true);
                    }
                }
            },
            getDimension: function() {
                var config = {};

                if (dimension.id) {
                    config.dimension = dimension.id;
                }

                if (!selectedAll.getValue() && selectedStore.getRange().length) {
                    config.items = [];

                    selectedStore.each(function(r) {
                        config.items.push({ id: r.data.id });
                    });
                }

                return config.dimension ? config : null;
            },
            getHeightValue: function() {
                var westRegion = uiManager.get('westRegion');

                return westRegion.hasScrollbar
                    ? uiConfig.west_scrollbarheight_accordion_group
                    : uiConfig.west_maxheight_accordion_group;
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
                var westRegion = uiManager.get('westRegion');
                var accordion = uiManager.get('accordion');

                var accordionHeight = westRegion.hasScrollbar
                    ? uiConfig.west_scrollbarheight_accordion_group
                    : uiConfig.west_maxheight_accordion_group;

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
                    items: [available, selected],
                },
            ],
            listeners: {
                expand: function(p) {
                    p.onExpand();
                },
            },
        });

        return panel;
    };

    // accordion
    var defaultItems = [
        data,
        period,
        organisationUnit,
        ...appManager.dimensions.map(dimension => {
            var panel = getDimensionPanel(dimension, 'ns-panel-title-dimension');

            accordionPanels.push(uiManager.reg(panel, panel.dimension));

            return panel;
        }),
    ];

    var getItems = function(dimensions = []) {
        return dimensions.map(dimension =>
            getDimensionPanel(dimension, 'ns-panel-title-dimension')
        );
    };

    var accordionBody = Ext.create('Ext.panel.Panel', {
        layout: 'accordion',
        activeOnTop: true,
        cls: 'ns-accordion',
        bodyStyle: 'border:0 none',
        height: 700,
        toBeRemoved: [],
        addItems: function(dimensions) {
            this.toBeRemoved = this.add(getItems(dimensions));

            accordion.setThisHeight();
        },
        removeItems: function() {
            this.toBeRemoved.map(item => (isString(item) ? item : item.id)).forEach(id => {
                accordionBody.remove(id);
            });

            accordion.setThisHeight();

            this.toBeRemoved = [];
        },
        getExpandedPanel: function() {
            var expandedPanel;

            this.items.each(function(panel) {
                if (!panel.collapsed) {
                    expandedPanel = panel;
                    return false;
                }
            });

            return expandedPanel;
        },
        items: defaultItems,
    });

    // functions

    var setUiState = function(layout, response) {
        var viewport = uiManager.get('viewport');

        var dataTypeToolbar = uiManager.get('dataTypeToolbar'),
            chartTypeToolbar = uiManager.get('chartTypeToolbar'),
            aggLayoutWindow = uiManager.get('aggregateLayoutWindow'),
            queryLayoutWindow = uiManager.get('queryLayoutWindow'),
            aggOptionsWindow = uiManager.get('aggregateOptionsWindow'),
            queryOptionsWindow = uiManager.get('queryOptionsWindow');

        if (dataTypeToolbar) {
            dataTypeToolbar.setDataType(layout ? layout.dataType : null);
        }

        if (chartTypeToolbar) {
            chartTypeToolbar.setChartType(layout ? layout.type : null);
        }

        if (aggLayoutWindow) {
            aggLayoutWindow.reset();
        }

        if (queryLayoutWindow) {
            queryLayoutWindow.reset();
        }

        if (aggOptionsWindow) {
            aggOptionsWindow.setOptions(layout);
        }

        if (queryOptionsWindow) {
            queryOptionsWindow.setOptions(layout);
        }

        // dimensions
        accordion.clearDimensions(layout);

        if (layout) {
            // data
            programStore.add(layout.program);
            program.setValue(layout.program.id);

            // periods
            period.setDimension(layout);

            // organisation units
            organisationUnit.setDimension(layout);

            // data, dynamic dimensions and layout window
            setData(layout);
        }

        //var statusBar = uiManager.get('statusBar');

        // state
        //uiManager.get('downloadButton').enable();

        //if (layout.id) {
        //uiManager.get('shareButton').enable();
        //}

        //statusBar.setStatus(layout, response);
    };

    var getUiState = function(layoutWindow, optionsWindow, chartType, dataType) {
        var viewport = uiManager.get('viewport'),
            panels = uiManager.get('accordion').panels,
            dataTypeToolbar = uiManager.get('dataTypeToolbar'),
            aggregateLayoutWindow = uiManager.get('aggregateLayoutWindow'),
            aggregateOptionsWindow = uiManager.get('aggregateOptionsWindow'),
            queryOptionsWindow = uiManager.get('queryOptionsWindow'),
            statusBar = uiManager.get('statusBar'),
            config = {},
            map = {},
            columns = [],
            rows = [],
            filters = [],
            values = [],
            addAxisDimension,
            store,
            data;

        layoutWindow = layoutWindow || viewport.getLayoutWindow();

        config.program = program.getRecord();
        config.programStage = stage.getRecord();

        if (!(config.program && config.programStage)) {
            return;
        }

        if (dataTypeToolbar) {
            var dataType = dataTypeToolbar.getDataType();
        }

        // dy
        map['dy'] = [{ dimension: 'dy' }];

        // pe
        if (periodMode.getValue() === 'dates') {
            config.startDate = startDate.getSubmitValue();
            config.endDate = endDate.getSubmitValue();

            if (!(config.startDate && config.endDate)) {
                return;
            }
        } else if (periodMode.getValue() === 'periods') {
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
        accordionBody.items.each(function(panel) {
            if (panel.isDynamic && panel.getDimension) {
                var dim = panel.getDimension();

                if (dim && dim.dimension) {
                    map[dim.dimension] = [dim];
                }
            }
        });

        // other
        map['longitude'] = [{ dimension: 'longitude' }];
        map['latitude'] = [{ dimension: 'latitude' }];

        addAxisDimension = function(a, axis) {
            if (a.length) {
                if (a.length === 1) {
                    axis.push(a[0]);
                } else {
                    var dim;

                    for (var i = 0; i < a.length; i++) {
                        if (!dim) {
                            //todo ??
                            dim = a[i];
                        } else {
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
            data = store.findExact('id', 'dy') === -1 ? store.data : store.snapshot;

            data.each(function(item) {
                addAxisDimension(map[item.data.id || item.data.dimensionName] || [], columns);
            });
        }

        // rows
        store = layoutWindow.rowStore;

        if (store) {
            data = store.findExact('id', 'dy') === -1 ? store.data : store.snapshot;

            data.each(function(item) {
                addAxisDimension(map[item.data.id || item.data.dimensionName] || [], rows);
            });
        }

        // filters
        store = layoutWindow.filterStore;

        if (store) {
            data = store.findExact('id', 'dy') === -1 ? store.data : store.snapshot;

            data.each(function(item) {
                addAxisDimension(map[item.data.id || item.data.dimensionName] || [], filters);
            });
        }

        // fixed filters
        store = layoutWindow.fixedFilterStore;

        if (store) {
            data = store.findExact('id', 'dy') === -1 ? store.data : store.snapshot;

            data.each(function(item) {
                addAxisDimension(map[item.data.id || item.data.dimensionName] || [], filters);
            });
        }

        if (columns.length) {
            config.columns = columns;
        }
        if (rows.length) {
            config.rows = rows;
        }
        if (filters.length) {
            config.filters = filters;
        }

        // value, aggregation type
        Ext.apply(config, layoutWindow.getValueConfig());

        if (dataType === dimensionConfig.dataType['aggregated_values']) {
            Ext.applyIf(config, aggregateOptionsWindow.getOptions());
            Ext.applyIf(config, aggregateLayoutWindow.getOptions());

            // if order and limit -> sort
            if (config.sortOrder && config.topLimit) {
                config.sorting = {
                    id: 1,
                    direction: config.sortOrder == 1 ? 'DESC' : 'ASC',
                };
            }
        }

        if (dataType === dimensionConfig.dataType['individual_cases']) {
            Ext.applyIf(config, queryOptionsWindow.getOptions());

            if (statusBar) {
                config.paging = {
                    page: uiManager.get('statusBar').getCurrentPage(),
                    pageSize: 100,
                };
            }
        }

        return config;
    };

    var accordion = Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:1px; padding-bottom:0; overflow-y:scroll;',
        accordionBody: accordionBody,
        items: accordionBody,
        panels: accordionPanels,
        expandInitPanels: function() {
            organisationUnit.expand();
        },
        clearDimensions: function(layout) {
            accordionPanels.forEach(function(panel) {
                panel.clearDimension(!!layout);
            });
        },
        setDimensions: function(layout, dynamicOnly) {
            accordionPanels.forEach(function(panel) {
                if (dynamicOnly && !panel.isDynamic) {
                    return;
                }

                panel.setDimension(layout);
            });
        },
        setThisHeight: function(mx) {
            mx = mx || this.getExpandedPanel().getHeightValue();

            var settingsHeight = 41;

            var containerHeight = settingsHeight + accordionBody.items.items.length * 28 + mx,
                accordionHeight =
                    uiManager.get('westRegion').getHeight() - settingsHeight - uiConfig.west_fill,
                accordionBodyHeight;

            if (uiManager.get('westRegion').hasScrollbar) {
                accordionBodyHeight = containerHeight - settingsHeight - uiConfig.west_fill;
            } else {
                accordionBodyHeight =
                    (accordionHeight > containerHeight ? containerHeight : accordionHeight) -
                    uiConfig.west_fill;
            }

            this.setHeight(accordionHeight);
            accordionBody.setHeight(accordionBodyHeight);
        },
        getExpandedPanel: function() {
            return accordionBody.getExpandedPanel();
        },
        getFirstPanel: function() {
            return this.panels[0];
        },
        getParentGraphMap: function() {
            return treePanel.getParentGraphMap();
        },
        getUxArray: function(id) {
            return dataElementSelected.getUxArrayById(id);
        },

        accordionBody: accordionBody,
        panels: accordionPanels,
        treePanel: treePanel,

        getUiState: getUiState,
        setUiState: setUiState,
        onTypeClick: onTypeClick,
    });

    return accordion;
};
