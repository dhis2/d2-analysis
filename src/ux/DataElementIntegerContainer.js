import arrayDifference from 'd2-utilizr/lib/arrayDifference';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import isArray from 'd2-utilizr/lib/isArray';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';

import containerConfig from './containerConfig';

export var DataElementIntegerContainer;

DataElementIntegerContainer = function(refs) {
    var appManager = refs.appManager;

    var i18n = refs.i18nManager.get();

    Ext.define('Ext.ux.container.DataElementIntegerContainer', {
        extend: 'Ext.container.Container',
        alias: 'widget.dataelementintegercontainer',
        cls: 'ns-dxselector',
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin: ' + containerConfig.margin,
        getRecord: function() {
            var record = {},
                rangeSet = this.rangeSetCmp.getValue();

            var isRange = rangeSet !== containerConfig.defaultRangeSetId;

            record.dimension = this.dataElement.id;
            record.name = this.dataElement.name;

            if (isRange) {
                record.legendSet = {
                    id: rangeSet
                };

                var ranges = this.rangeValueCmp.getValue();

                if (ranges.length) {
                    record.filter = 'IN:' + ranges.join(';');
                }
            }
            else {
                if (this.valueCmp.getValue()) {
                    record.filter = this.operatorCmp.getValue() + ':' + this.valueCmp.getValue();
                }
            }

            return record;
        },
        setRecord: function(record) {
            if (isObject(record.legendSet) && record.legendSet.id) {
                this.rangeSetCmp.pendingValue = record.legendSet.id;
                this.onRangeSetSelect(record.legendSet.id);

                if (record.filter) {
                    var a = record.filter.split(':');

                    if (a.length > 1 && isString(a[1])) {
                        this.onRangeSearchSelect(a[1].split(';'), true);
                    }
                }
            }
            else {
                this.rangeSetCmp.setValue(containerConfig.defaultRangeSetId);
                this.onRangeSetSelect(containerConfig.defaultRangeSetId);

                if (record.filter) {
                //this.rangeSetCmp.pendingValue = containerConfig.defaultRangeSetId;

                    var a = record.filter.split(':');

                    if (a.length > 1) {
                        this.operatorCmp.setValue(a[0]);
                        this.valueCmp.setValue(a[1]);
                    }
                }
            }
        },
        initComponent: function() {
            var container = this,
                idProperty = 'id',
                nameProperty = 'name',
                displayProperty = 'displayName';

            this.nameCmp = Ext.create('Ext.form.Label', {
                text: this.dataElement.name,
                flex: 1,
                style: 'padding:' + containerConfig.namePadding
            });

            this.addCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-linkbutton',
                style: 'padding: 0',
                height: 18,
                text: i18n.duplicate,
                handler: function() {
                    container.duplicateDataElement();
                }
            });

            this.removeCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-linkbutton',
                style: containerConfig.removeCmpStyle,
                height: 18,
                text: i18n.remove,
                handler: function() {
                    container.removeDataElement();
                }
            });

            this.operatorCmp = Ext.create('Ext.form.field.ComboBox', {
                valueField: idProperty,
                displayField: nameProperty,
                queryMode: 'local',
                editable: false,
                width: containerConfig.operatorCmpWidth,
                style: 'margin-bottom:0',
                value: 'EQ',
                store: {
                    fields: [idProperty, nameProperty],
                    data: [
                        {id: 'EQ', name: '='},
                        {id: 'GT', name: '>'},
                        {id: 'GE', name: '>='},
                        {id: 'LT', name: '<'},
                        {id: 'LE', name: '<='},
                        {id: 'NE', name: '!='}
                    ]
                }
            });

            this.valueCmp = Ext.create('Ext.form.field.Number', {
                width: containerConfig.nameCmpWidth - containerConfig.operatorCmpWidth - containerConfig.rangeSetWidth,
                style: 'margin-bottom:0'
            });

            this.rangeSearchStore = Ext.create('Ext.data.Store', {
                fields: [idProperty, nameProperty]
            });

            // function
            this.filterSearchStore = function(isLayout) {
                var selected = container.rangeValueCmp.getValue();

                // hack, using internal method to activate dropdown before filtering
                if (isLayout) {
                    container.rangeSearchCmp.onTriggerClick();
                    container.rangeSearchCmp.collapse();
                }

                // filter
                container.rangeSearchStore.clearFilter();

                container.rangeSearchStore.filterBy(function(record) {
                    return !arrayContains(selected, record.data[idProperty]);
                });
            };

            // function
            this.onRangeSearchSelect = function(ids, isLayout) {
                ids = arrayFrom(ids);

                // store
                for (var i = 0, id; i < ids.length; i++) {
                    id = ids[i];

                    if (container.rangeValueStore.findExact(idProperty, id) === -1) {
                        container.rangeValueStore.add(container.rangeSearchStore.getAt(container.rangeSearchStore.findExact(idProperty, id)).data);
                    }
                }

                // search cmp
                container.rangeSearchCmp.select([]);

                // filter
                container.filterSearchStore(isLayout);
            };

            this.rangeSearchCmp = Ext.create('Ext.form.field.ComboBox', {
                multiSelect: true,
                width: containerConfig.operatorCmpWidth,
                style: 'margin-bottom: 0',
                emptyText: i18n.select + '..',
                valueField: idProperty,
                displayField: displayProperty,
                editable: false,
                queryMode: 'local',
                hidden: true,
                store: this.rangeSearchStore,
                listConfig: {
                    minWidth: containerConfig.operatorCmpWidth + (containerConfig.nameCmpWidth - containerConfig.operatorCmpWidth - containerConfig.rangeSetWidth)
                },
                listeners: {
                    select: function() {
                        container.onRangeSearchSelect(arrayFrom(this.getValue())[0]);
                    },
                    expand: function() {
                        container.filterSearchStore();
                    }
                }
            });

            this.rangeValueStore = Ext.create('Ext.data.Store', {
                fields: [idProperty, nameProperty],
                listeners: {
                    add: function() {
                        container.rangeValueCmp.select(this.getRange());
                    },
                    remove: function() {
                        container.rangeValueCmp.select(this.getRange());
                    }
                }
            });

            this.rangeValueCmp = Ext.create('Ext.form.field.ComboBox', {
                multiSelect: true,
                style: 'margin-bottom: 0',
                width: containerConfig.nameCmpWidth - containerConfig.operatorCmpWidth - containerConfig.rangeSetWidth,
                valueField: idProperty,
                displayField: nameProperty,
                emptyText: 'No selected items',
                editable: false,
                hideTrigger: true,
                queryMode: 'local',
                hidden: true,
                store: container.rangeValueStore,
                listConfig: {
                    minWidth: containerConfig.valueCmpWidth,
                    cls: 'ns-optionselector'
                },
                setOptionValues: function(records) {
                    var me = this;

                    container.rangeValueStore.removeAll();
                    container.rangeValueStore.loadData(records);

                    me.setValue(records);
                },
                listeners: {
                    change: function(cmp, newVal, oldVal) {
                        newVal = arrayFrom(newVal);
                        oldVal = arrayFrom(oldVal);

                        if (newVal.length < oldVal.length) {
                            var id = arrayDifference(oldVal, newVal)[0];
                            container.rangeValueStore.removeAt(container.rangeValueStore.findExact(idProperty, id));
                        }
                    }
                }
            });

            // function
            this.onRangeSetSelect = function(id) {
                if (!id || id === containerConfig.defaultRangeSetId) {
                    container.operatorCmp.show();
                    container.valueCmp.show();
                    container.rangeSearchCmp.hide();
                    container.rangeValueCmp.hide();
                }
                else {
                    container.operatorCmp.hide();
                    container.valueCmp.hide();
                    container.rangeSearchCmp.show();
                    container.rangeValueCmp.show();

                    // legend display name
                    var legends = appManager.getLegendSetById(id).legends.slice();

                    legends.forEach(legend => {
                        legend.displayName = legend.name + ' (' + legend.startValue + ' - ' + legend.endValue + ')';
                    });

                    container.rangeSearchStore.loadData(legends);
                    container.rangeSearchStore.sort('startValue', 'ASC');
                }
            };

            this.rangeSetCmp = Ext.create('Ext.form.field.ComboBox', {
                cls: 'ns-combo h22',
                style: 'margin-bottom: 0',
                width: containerConfig.rangeSetWidth,
                height: 22,
                fieldStyle: 'height: 22px',
                queryMode: 'local',
                valueField: idProperty,
                displayField: nameProperty,
                editable: false,
                storage: {},
                pendingValue: null,
                setPendingValue: function() {
                    if (this.pendingValue) {
                        this.setValue(this.pendingValue);
                        container.onRangeSetSelect(this.pendingValue);

                        this.pendingValue = null;
                    }

                    if (!this.getValue()) {
                        this.pendingValue = containerConfig.defaultRangeSetId;
                        this.setPendingValue();
                    }
                },
                store: Ext.create('Ext.data.Store', {
                    fields: [idProperty, nameProperty]
                }),
                listeners: {
                    added: function(cb) {
                        cb.store.add({
                            id: containerConfig.defaultRangeSetId,
                            name: 'No range set'
                        });

                        var legendSetRecords = container.dataElement.legendSets || container.dataElement.storageLegendSets;

                        if (isArray(legendSetRecords) && legendSetRecords.length) {

                            // add legendsets to store
                            cb.store.add(legendSetRecords.map(record => appManager.getLegendSetById(record.id)).filter(legendSet => isObject(legendSet)));

                            // select first legendset
                            cb.setValue(legendSetRecords[0].id);
                            container.onRangeSetSelect(legendSetRecords[0].id);
                        }

                        cb.setPendingValue();
                    },
                    select: function(cb, r) {
                        var id = arrayFrom(r)[0].data.id;
                        container.onRangeSetSelect(id);
                    }
                }
            });

            this.items = [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    width: containerConfig.nameCmpWidth,
                    items: [
                        this.nameCmp,
                        this.addCmp,
                        this.removeCmp
                    ]
                },
                this.rangeSearchCmp,
                this.rangeValueCmp,
                this.operatorCmp,
                this.valueCmp,
                this.rangeSetCmp
            ];

            this.self.superclass.initComponent.call(this);
        }
    });
};
