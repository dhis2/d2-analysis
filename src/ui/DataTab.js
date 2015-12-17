import {arrayFrom, arrayContains} from 'd2-utilizr';

import {IndicatorPanel} from './IndicatorPanel.js';
//import {DataElementPanel} from from './DataElementPanel.js';
//import {DataSetPanel} from from './DataSetPanel.js';
//import {EventDataItemPanel} from from './EventDataItemPanel.js';
//import {ProgramIndicatorPanel} from from './ProgramIndicatorPanel.js';

export var DataTab;

DataTab = function() {
    var t = this,
        uiManager = DataTab.uiManager,
        i18nManager = DataTab.i18nManager,
        dimensionConfig = DataTab.dimensionConfig,
        uiConfig = DataTab.uiConfig,

        i18n = i18nManager.get();

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

    // constructor
    IndicatorPanel.parentTab = t;
    //DataElementPanel.parentTab = t;
    //DataSetPanel.parentTab = t;
    //EventDataItemPanel.parentTab = t;
    //ProgramIndicatorPanel.parentTab = t;

    indicatorPanel = new IndicatorPanel();
    //dataElementPanel = new DataElementPanel(),
    //dataSetPanel = new DataSetPanel(),
    //eventDataItemPanel = new EventDataItemPanel(),
    //programIndicatorPanel = new ProgramIndicatorPanel();

    $.extend(this, {
        xtype: 'panel',
        title: '<div class="ns-panel-title-data">' + i18n['data'] + '</div>',
        hideCollapseTool: true,
        dimension: dimensionConfig.data.objectName,
        updateStoreFilters: function() {
            indicatorPanel.getAvailableStore().updateFilter();
            //dataElementAvailableStore.updateFilter();
            //dataSetAvailableStore.updateFilter();
            //eventDataItemAvailableStore.updateFilter();
            //programIndicatorAvailableStore.updateFilter();
        },
        getDimension: function() {
            var config = {
                dimension: dimensionConfig.get('data').objectName,
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
            var conf = ns.core.conf.layout,
                h = westRegion.hasScrollbar ? conf.west_scrollbarheight_accordion_indicator : conf.west_maxheight_accordion_indicator;

            accordion.setThisHeight(h);

            uiManager.setMultiselectHeight([indicatorPanel.getAvailableView(), indicatorPanel.getSelectedView()], this, uiConfig.west_fill_accordion_indicator);
            //uiManager.setMultiselectHeight([dataElementAvailable, dataElementSelected], this, uiConfig.west_fill_accordion_dataelement);
            //uiManager.setMultiselectHeight([dataSetAvailable, dataSetSelected], this, uiConfig.west_fill_accordion_dataset);
            //uiManager.setMultiselectHeight([eventDataItemAvailable, eventDataItemSelected], this, uiConfig.west_fill_accordion_eventdataitem);
            //uiManager.setMultiselectHeight([programIndicatorAvailable, programIndicatorSelected], this, uiConfig.west_fill_accordion_programindicator);
        },
        items: [
            dataType,
            IndicatorPanel
            //dataElement,
            //dataSet,
            //eventDataItem,
            //programIndicator
        ],
        listeners: {
            added: function() {
                accordionPanels.push(this);
            },
            expand: function(p) {
                p.onExpand();
            }
        }
    });

    t.getSelectedStore = function() {
        return dataSelectedStore;
    };

    t.getSelectedView = function() {
        return dataSelectedView;
    };
};
