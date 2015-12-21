import {arrayFrom, arrayContains} from 'd2-utilizr';

import {IndicatorPanel} from './IndicatorPanel.js';
import {DataElementPanel} from './DataElementPanel.js';
//import {DataSetPanel} from './DataSetPanel.js';
//import {EventDataItemPanel} from './EventDataItemPanel.js';
//import {ProgramIndicatorPanel} from './ProgramIndicatorPanel.js';

export var DataTab;

DataTab = function() {
    var t = DataTab,
        uiManager = t.uiManager,
        i18nManager = t.i18nManager,
        dimensionConfig = t.dimensionConfig,
        uiConfig = t.uiConfig,

        i18n = i18nManager.get(),
        thisObjectName = dimensionConfig.get('data').objectName;

    // store
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
            ids = Ext.Array.from(ids);

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

            values = Ext.Array.from(values);

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

    var dataSelectedView = Ext.create('Ext.ux.form.MultiSelect', {
        cls: 'ns-toolbar-multiselect-right',
        width: (uiConfig.west_fieldset_width - uiConfig.west_width_padding) / 2,
        valueField: 'id',
        displayField: 'name',
        ddReorder: true,
        store: dataSelectedStore,
        tbar: [
            {
                xtype: 'button',
                icon: 'images/arrowleftdouble.png',
                width: 22,
                handler: function() {
                    //ns.core.web.multiSelect.unselectAll(programIndicatorAvailable, programIndicatorSelected);
                    dataSelectedStore.removeAll();
                    t.updateStoreFilters();
                }
            },
            {
                xtype: 'button',
                icon: 'images/arrowleft.png',
                width: 22,
                handler: function() {
                    //ns.core.web.multiSelect.unselect(programIndicatorAvailable, programIndicatorSelected);
                    dataSelectedStore.removeByIds(dataSelected.getValue());
                    t.updateStoreFilters();
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
                    //ns.core.web.multiSelect.unselect(programIndicatorAvailable, this);
                    dataSelectedStore.removeByIds(dataSelected.getValue());
                    data.updateStoreFilters();
                }, this);
            }
        }
    });

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
        //else if (type === 'ds') {
            //indicator.hide();
            //dataElement.hide();
            //dataSet.show();
            //eventDataItem.hide();
            //programIndicator.hide();

            //if (!dataSetAvailableStore.isLoaded) {
                //dataSetAvailableStore.isLoaded = true;
                //dataSetAvailableStore.loadPage(null, false);
            //}
        //}
        //else if (type === 'di') {
            //indicator.hide();
            //dataElement.hide();
            //dataSet.hide();
            //eventDataItem.show();
            //programIndicator.hide();

            //if (!programStore.isLoaded) {
                //programStore.isLoaded = true;
                //programStore.load();
            //}
        //}
        //else if (type === 'pi') {
            //indicator.hide();
            //dataElement.hide();
            //dataSet.hide();
            //eventDataItem.hide();
            //programIndicator.show();

            //if (!programStore.isLoaded) {
                //programStore.isLoaded = true;
                //programStore.load();
            //}
        //}
    };

    var dataType = Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:1px',
        width: uiConfig.west_fieldset_width - uiConfig.west_width_padding,
        valueField: 'id',
        displayField: 'name',
        //emptyText: NS.i18n.data_type,
        editable: false,
        queryMode: 'local',
        value: 'in',
        store: {
            fields: ['id', 'name'],
            data: [
                 {id: 'in', name: i18n['indicators']},
                 {id: 'de', name: i18n['data_elements']},
                 {id: 'ds', name: i18n['reporting_rates']},
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

    t.getSelectedStore = function() {
        return dataSelectedStore;
    };

    t.getSelectedView = function() {
        return dataSelectedView;
    };

    // constructor
    IndicatorPanel.parentTab = t;
    DataElementPanel.parentTab = t;
    //DataSetPanel.parentTab = t;
    //EventDataItemPanel.parentTab = t;
    //ProgramIndicatorPanel.parentTab = t;

    var indicatorPanel = new IndicatorPanel();
    var dataElementPanel = new DataElementPanel();
    //dataSetPanel = new DataSetPanel(),
    //eventDataItemPanel = new EventDataItemPanel(),
    //programIndicatorPanel = new ProgramIndicatorPanel();

    $.extend(this, {
        xtype: 'panel',
        title: '<div class="ns-panel-title-data">' + i18n['data'] + '</div>',
        hideCollapseTool: true,
        dimension: thisObjectName,
        updateStoreFilters: function() {
            indicatorPanel.getAvailableStore().updateFilter();
            dataElementPanel.getAvailableStore().updateFilter();
            //dataSetPanel.getAvailableStore().updateFilter();
            //eventDataItemPanel.getAvailableStore().updateFilter();
            //programIndicatorPanel.getAvailableStore().updateFilter();
        },
        getDimension: function() {
            var config = {
                dimension: thisObjectName,
                items: []
            };

            dataSelectedStore.each( function(r) {
                config.items.push({
                    id: r.data.id,
                    name: r.data.name
                });
            });

            // TODO program
            //if (eventDataItemProgram.getValue() || programIndicatorProgram.getValue()) {
                //config.program = {id: eventDataItemProgram.getValue() || programIndicatorProgram.getValue()};
            //}

            return config.items.length ? config : null;
        },
        onExpand: function() {
            var ui = uiManager.getUi(),
                accordionHeight = ui.westRegion.hasScrollbar ? uiConfig.west_scrollbarheight_accordion_indicator : uiConfig.west_maxheight_accordion_indicator;

            ui.menuAccordion.setThisHeight(accordionHeight);

            uiManager.msSetHeight([indicatorPanel.getAvailableView(), indicatorPanel.getSelectedView()], this, uiConfig.west_fill_accordion_indicator);
            uiManager.msSetHeight([dataElementPanel.getAvailableView(), dataElementPanel.getSelectedView()], this, uiConfig.west_fill_accordion_indicator);
            //uiManager.msSetHeight([dataElementAvailable, dataElementSelected], this, uiConfig.west_fill_accordion_dataelement);
            //uiManager.msSetHeight([dataSetAvailable, dataSetSelected], this, uiConfig.west_fill_accordion_dataset);
            //uiManager.msSetHeight([eventDataItemAvailable, eventDataItemSelected], this, uiConfig.west_fill_accordion_eventdataitem);
            //uiManager.msSetHeight([programIndicatorAvailable, programIndicatorSelected], this, uiConfig.west_fill_accordion_programindicator);
        },
        items: [
            dataType,
            indicatorPanel,
            dataElementPanel
            //dataSet,
            //eventDataItem,
            //programIndicator
        ],
        listeners: {
            added: function() {
                //accordionPanels.push(this);
            },
            expand: function(p) {
                p.onExpand();
            }
        }
    });
};
