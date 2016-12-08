import arrayDifference from 'd2-utilizr/lib/arrayDifference';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';

var DataElementIntegerContainer = function(refs) {
    Ext.define('Ext.ux.panel.DataElementIntegerContainer', {
        extend: 'Ext.container.Container',
        alias: 'widget.dataelementintegerpanel',
        cls: 'ns-dxselector',
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin: ' + margin,
        getRecord: function() {
            var record = {},
                isRange = this.rangeSetCmp.getValue() !== defaultRangeSetId;

            record.dimension = this.dataElement.id;
            record.name = this.dataElement.name;

            if (isRange) {
                record.legendSet = {
                    id: this.rangeSetCmp.getValue()
                };

                if (this.rangeValueCmp.getValue().length) {
                    record.filter = 'IN:' + this.rangeValueCmp.getValue().join(';');
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
            else if (record.filter) {
                //this.rangeSetCmp.pendingValue = defaultRangeSetId;
                this.rangeSetCmp.setValue(defaultRangeSetId); //todo?
                this.onRangeSetSelect(defaultRangeSetId);

                var a = record.filter.split(':');

                if (a.length > 1) {
                    this.operatorCmp.setValue(a[0]);
                    this.valueCmp.setValue(a[1]);
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
                style: 'padding:' + namePadding
            });

            this.addCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-linkbutton',
                style: 'padding: 0',
                height: 18,
                text: NS.i18n.duplicate,
                handler: function() {
                    container.duplicateDataElement();
                }
            });

            this.removeCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-linkbutton',
                style: removeCmpStyle,
                height: 18,
                text: NS.i18n.remove,
                handler: function() {
                    container.removeDataElement();
                }
            });

            this.operatorCmp = Ext.create('Ext.form.field.ComboBox', {
                valueField: idProperty,
                displayField: nameProperty,
                queryMode: 'local',
                editable: false,
                width: operatorCmpWidth,
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
                width: nameCmpWidth - operatorCmpWidth - rangeSetWidth,
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
                width: operatorCmpWidth,
                style: 'margin-bottom: 0',
                emptyText: NS.i18n.select + '..',
                valueField: idProperty,
                displayField: displayProperty,
                editable: false,
                queryMode: 'local',
                hidden: true,
                store: this.rangeSearchStore,
                listConfig: {
                    minWidth: operatorCmpWidth + (nameCmpWidth - operatorCmpWidth - rangeSetWidth)
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
                width: nameCmpWidth - operatorCmpWidth - rangeSetWidth,
                valueField: idProperty,
                displayField: nameProperty,
                emptyText: 'No selected items',
                editable: false,
                hideTrigger: true,
                queryMode: 'local',
                hidden: true,
                store: container.rangeValueStore,
                listConfig: {
                    minWidth: valueCmpWidth,
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
                if (!id || id === defaultRangeSetId) {
                    container.operatorCmp.show();
                    container.valueCmp.show();
                    container.rangeSearchCmp.hide();
                    container.rangeValueCmp.hide();
                }
                else {
                    var ranges;

                    container.operatorCmp.hide();
                    container.valueCmp.hide();
                    container.rangeSearchCmp.show();
                    container.rangeValueCmp.show();

                    ranges = Ext.clone(ns.core.init.idLegendSetMap[id].legends);

                    // display name
                    for (var i = 0; i < ranges.length; i++) {
                        range = ranges[i];
                        range.displayName = range.name + ' (' + range.startValue + ' - ' + range.endValue + ')';
                    }

                    container.rangeSearchStore.loadData(ranges);
                    container.rangeSearchStore.sort('startValue', 'ASC');
                }
            };

            this.rangeSetCmp = Ext.create('Ext.form.field.ComboBox', {
                cls: 'ns-combo h22',
                style: 'margin-bottom: 0',
                width: rangeSetWidth,
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
                        this.pendingValue = defaultRangeSetId;
                        this.setPendingValue();
                    }
                },
                store: Ext.create('Ext.data.Store', {
                    fields: [idProperty, nameProperty]
                }),
                listeners: {
                    added: function(cb) {
                        cb.store.add({
                            id: defaultRangeSetId,
                            name: 'No range set'
                        });

                        var de = container.dataElement;

                        if (de.legendSet || de.storageLegendSet) {
                            var id = de.legendSet ? de.legendSet.id : (de.storageLegendSet ? de.storageLegendSet.id : null),
                                legendSet = ns.core.init.idLegendSetMap[id];

                            if (isObject(legendSet)) {
                                cb.store.add(legendSet);

                                cb.setValue(legendSet.id);
                                container.onRangeSetSelect(legendSet.id);
                            }
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
                    width: nameCmpWidth,
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

            this.callParent();
        }
    });
};

export default DataElementIntegerContainer;
