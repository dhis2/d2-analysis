import arrayDifference from 'd2-utilizr/lib/arrayDifference';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import isArray from 'd2-utilizr/lib/isArray';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';

import containerConfig from './containerConfig';

export var GroupSetContainer;

GroupSetContainer = function(refs) {
    var { api, appManager } = refs;

    const defaultPageSize = 100;

    Ext.define('Ext.ux.container.GroupSetContainer', {
        extend: 'Ext.container.Container',
        alias: 'widget.groupsetcontainer',
        cls: 'ns-dxselector',
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin: ' + containerConfig.margin,
        getRecord: function() {
            var items = this.valueCmp.getValue(),
                record = {
                    dimension: this.dataElement.id,
                    name: this.dataElement.name,
                    programStage: {
                        id: (this.dataElement.programStage || {}).id,
                    },
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
        getOptionSetOptions: (optionSetId, filters, limit, callbackFn) => {
            const params = [`filter=optionSet.id:eq:${optionSetId}`, 'fields=code,name'];

            if (limit) {
                params.push(`pageSize=${defaultPageSize}`);
            } else {
                params.push('paging=false');
            }

            if (filters) {
                filters.forEach(filter => params.push(`filter=${filter}`));
            }

            new api.Request(refs, {
                baseUrl: appManager.getApiPath() + '/options.json',
                params,
                success: callbackFn,
            }).run();
        },
        initComponent: function() {
            var container = this,
                idProperty = 'code',
                nameProperty = 'name';

            this.nameCmp = Ext.create('Ext.form.Label', {
                text: this.dataElement.name,
                flex: 1,
                style: 'padding:' + containerConfig.namePadding,
            });

            this.addCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-linkbutton',
                style: 'padding: 0',
                height: 18,
                text: 'Duplicate',
                handler: function() {
                    container.duplicateDataElement();
                },
            });

            this.removeCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-linkbutton',
                style: containerConfig.removeCmpStyle,
                height: 18,
                text: 'Remove',
                handler: function() {
                    container.removeDataElement();
                },
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
                    data: [{ id: 'IN', name: 'One of' }],
                },
            });

            this.searchStore = Ext.create('Ext.data.Store', {
                fields: [idProperty, nameProperty],
                data: [],
                loadOptionSet: function(optionSetId, filters, pageSize) {
                    var store = this;

                    optionSetId = optionSetId || container.dataElement.optionSet.id;
                    pageSize = pageSize || defaultPageSize;

                    container.getOptionSetOptions(optionSetId, filters, true, ({ options }) => {
                        if (isArray(options) && options.length) {
                            store.loadData(options.slice(0, pageSize));
                        }
                    });
                },
                listeners: {
                    datachanged: function(s) {
                        if (container.searchCmp && s.getRange().length) {
                            container.searchCmp.expand();
                        }
                    },
                },
            });

            // function
            this.filterSearchStore = function() {
                var selected = container.valueCmp.getValue();

                container.searchStore.clearFilter();

                container.searchStore.filterBy(function(record) {
                    return !arrayContains(selected, record.data[idProperty]);
                });
            };

            this.searchCmp = Ext.create('Ext.form.field.ComboBox', {
                multiSelect: true,
                width: containerConfig.operatorCmpWidth - containerConfig.triggerCmpWidth,
                style: 'margin-bottom:0',
                emptyText: 'Search..',
                valueField: idProperty,
                displayField: nameProperty,
                hideTrigger: true,
                enableKeyEvents: true,
                queryMode: 'local',
                lastQuery: '',
                listConfig: {
                    minWidth: containerConfig.nameCmpWidth - containerConfig.operatorCmpWidth,
                },
                store: this.searchStore,
                listeners: {
                    keyup: function() {
                        var value = this.getValue(),
                            optionSetId = container.dataElement.optionSet.id;

                        // search
                        container.searchStore.loadOptionSet(optionSetId, [`name:ilike:${value}`]);

                        // trigger
                        if (!value || (isString(value) && value.length === 1)) {
                            container.triggerCmp.setDisabled(!!value);
                        }
                    },
                    select: function() {
                        var id = arrayFrom(this.getValue())[0];

                        // value
                        if (container.valueStore.findExact(idProperty, id) === -1) {
                            container.valueStore.add(
                                container.searchStore.getAt(
                                    container.searchStore.findExact(idProperty, id)
                                ).data
                            );
                        }

                        // search
                        this.select([]);

                        // filter
                        container.filterSearchStore();

                        // trigger
                        container.triggerCmp.enable();
                    },
                    expand: function() {
                        container.filterSearchStore();
                    },
                },
            });

            this.triggerCmp = Ext.create('Ext.button.Button', {
                cls: 'ns-button-combotrigger',
                disabledCls: 'ns-button-combotrigger-disabled',
                width: containerConfig.triggerCmpWidth,
                height: 22,
                handler: function(b) {
                    container.searchStore.loadOptionSet();
                },
            });

            this.valueStore = Ext.create('Ext.data.Store', {
                fields: [idProperty, nameProperty],
                listeners: {
                    add: function() {
                        container.valueCmp.select(this.getRange());
                    },
                    remove: function() {
                        container.valueCmp.select(this.getRange());
                    },
                },
            });

            this.valueCmp = Ext.create('Ext.form.field.ComboBox', {
                multiSelect: true,
                style: 'margin-bottom:0',
                width:
                    containerConfig.nameCmpWidth -
                    containerConfig.operatorCmpWidth -
                    containerConfig.operatorCmpWidth,
                valueField: idProperty,
                displayField: nameProperty,
                emptyText: 'No selected items',
                editable: false,
                hideTrigger: true,
                store: container.valueStore,
                queryMode: 'local',
                listConfig: {
                    minWidth: 266,
                    cls: 'ns-optionselector',
                },
                setOptionValues: function(codeArray) {
                    var me = this,
                        records = [];

                    const filter = `code:in:[${codeArray.join(',')}]`;

                    container.getOptionSetOptions(
                        container.dataElement.optionSet.id,
                        [filter],
                        false, // no limit
                        ({ options }) => {
                            if (isArray(options) && options.length) {
                                container.valueStore.loadData(options);

                                me.setValue(options);
                            }
                        }
                    );
                },
                listeners: {
                    change: function(cmp, newVal, oldVal) {
                        newVal = arrayFrom(newVal);
                        oldVal = arrayFrom(oldVal);

                        if (newVal.length < oldVal.length) {
                            var id = arrayDifference(oldVal, newVal)[0];
                            container.valueStore.removeAt(
                                container.valueStore.findExact(idProperty, id)
                            );
                        }
                    },
                },
            });

            this.items = [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    width: containerConfig.nameCmpWidth,
                    items: [
                        this.nameCmp,
                        //this.addCmp,
                        this.removeCmp,
                    ],
                },
                this.operatorCmp,
                this.searchCmp,
                this.triggerCmp,
                this.valueCmp,
            ];

            this.self.superclass.initComponent.call(this);
        },
    });
};
