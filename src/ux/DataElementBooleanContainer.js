import arrayDifference from 'd2-utilizr/lib/arrayDifference';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';

import containerConfig from './containerConfig';

export var DataElementBooleanContainer;

DataElementBooleanContainer = function(refs) {
    Ext.define('Ext.ux.panel.DataElementBooleanContainer', {
        extend: 'Ext.container.Container',
        alias: 'widget.dataelementbooleanpanel',
        cls: 'ns-dxselector',
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin: ' + containerConfig.margin,
        getRecord: function() {
            var items = this.valueCmp.getValue(),
                record = {
                    dimension: this.dataElement.id,
                    name: this.dataElement.name
                };

            // array or object
            for (var i = 0; i < items.length; i++) {
                if (isObject(items[i])) {
                    items[i] = items[i].code;
                }
            }

            if (items.length) {
                record.filter = 'IN:' + items.join(';');
            }

            return record;
        },
        setRecord: function(record) {
            if (isString(record.filter) && record.filter.length) {
                var a = record.filter.split(':');
                this.valueCmp.setOptionValues(a[1].split(';'));
            }
        },
        getRecordsByCode: function(options, codeArray) {
            var records = [];

            for (var i = 0; i < options.length; i++) {
                for (var j = 0; j < codeArray.length; j++) {
                    if (options[i].code === codeArray[j]) {
                        records.push(options[i]);
                    }
                }
            }

            return records;
        },
        initComponent: function() {
            var container = this,
                idProperty = 'id',
                nameProperty = 'name';

            this.nameCmp = Ext.create('Ext.form.Label', {
                text: this.dataElement.name,
                flex: 1,
                style: 'padding:' + containerConfig.namePadding
            });

            this.addCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-linkbutton',
                style: 'padding: 0',
                height: 18,
                text: 'Duplicate',
                handler: function() {
                    container.duplicateDataElement();
                }
            });

            this.removeCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-linkbutton',
                style: containerConfig.removeCmpStyle,
                height: 18,
                text: 'Remove',
                handler: function() {
                    container.removeDataElement();
                }
            });

            this.operatorCmp = Ext.create('Ext.form.field.ComboBox', {
                valueField: 'id',
                displayField: 'name',
                queryMode: 'local',
                editable: false,
                style: 'margin-bottom:0',
                width: containerConfig.operatorCmpWidth,
                value: 'IN',
                store: {
                    fields: ['id', 'name'],
                    data: [
                        {id: 'IN', name: 'One of'}
                    ]
                }
            });

            this.getData = function(idArray) {
                var data = [], yes = {}, no = {};

                yes[idProperty] = '1';
                yes[nameProperty] = NS.i18n.yes;
                no[idProperty] = '0';
                no[nameProperty] = NS.i18n.no;

                for (var i = 0; i < idArray.length; i++) {
                    if (idArray[i] === '1' || idArray[i] === 1) {
                        data.push(yes);
                    }
                    else if (idArray[i] === '0' || idArray[i] === 0) {
                        data.push(no);
                    }
                }

                return data;
            };

            this.searchStore = Ext.create('Ext.data.Store', {
                fields: [idProperty, nameProperty],
                data: container.getData(['1', '0'])
            });

            // function
            this.filterSearchStore = function(isLayout) {
                var selected = container.valueCmp.getValue();

                // hack, using internal method to activate dropdown before filtering
                if (isLayout) {
                    container.searchCmp.onTriggerClick();
                    container.searchCmp.collapse();
                }

                // filter
                container.searchStore.clearFilter();

                container.searchStore.filterBy(function(record) {
                    return !arrayContains(selected, record.data[idProperty]);
                });
            };

            this.searchCmp = Ext.create('Ext.form.field.ComboBox', {
                multiSelect: true,
                width: containerConfig.operatorCmpWidth,
                style: 'margin-bottom:0',
                emptyText: 'Select..',
                valueField: idProperty,
                displayField: nameProperty,
                queryMode: 'local',
                listConfig: {
                    minWidth: containerConfig.nameCmpWidth - containerConfig.operatorCmpWidth
                },
                store: this.searchStore,
                listeners: {
                    select: function() {
                        var id = arrayFrom(this.getValue())[0];

                        // value
                        if (container.valueStore.findExact(idProperty, id) === -1) {
                            container.valueStore.add(container.searchStore.getAt(container.searchStore.findExact(idProperty, id)).data);
                        }

                        // search
                        this.select([]);

                        // filter
                        container.filterSearchStore();
                    },
                    expand: function() {
                        container.filterSearchStore();
                    }
                }
            });

            this.valueStore = Ext.create('Ext.data.Store', {
                fields: [idProperty, nameProperty],
                listeners: {
                    add: function() {
                        container.valueCmp.select(this.getRange());
                    },
                    remove: function() {
                        container.valueCmp.select(this.getRange());
                    }
                }
            });

            this.valueCmp = Ext.create('Ext.form.field.ComboBox', {
                multiSelect: true,
                style: 'margin-bottom:0',
                width: containerConfig.nameCmpWidth - containerConfig.operatorCmpWidth - containerConfig.operatorCmpWidth,
                valueField: idProperty,
                displayField: nameProperty,
                emptyText: 'No selected items',
                editable: false,
                hideTrigger: true,
                store: container.valueStore,
                queryMode: 'local',
                listConfig: {
                    minWidth: 266,
                    cls: 'ns-optionselector'
                },
                setOptionValues: function(codeArray) {
                    container.valueStore.removeAll();
                    container.valueStore.loadData(container.getData(codeArray));

                    this.setValue(codeArray);
                    container.filterSearchStore(true);
                    container.searchCmp.blur();
                },
                listeners: {
                    change: function(cmp, newVal, oldVal) {
                        newVal = arrayFrom(newVal);
                        oldVal = arrayFrom(oldVal);

                        if (newVal.length < oldVal.length) {
                            var id = arrayDifference(oldVal, newVal)[0];
                            container.valueStore.removeAt(container.valueStore.findExact(idProperty, id));
                        }
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
                this.operatorCmp,
                this.searchCmp,
                this.valueCmp
            ];

            this.callParent();
        }
    });
};
