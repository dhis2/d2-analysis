import containerConfig from './containerConfig';

export var DataElementStringContainer;

DataElementStringContainer = function(refs) {
    Ext.define('Ext.ux.container.DataElementStringContainer', {
        extend: 'Ext.container.Container',
        alias: 'widget.dataelementstringcontainer',
        cls: 'ns-dxselector',
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin: ' + containerConfig.margin,
        getRecord: function() {
            var record = {
                dimension: this.dataElement.id,
                name: this.dataElement.name,
                programStage: {
                    id: (this.dataElement.programStage || {}).id,
                },
            };

            if (this.valueCmp.getValue()) {
                record.filter = this.operatorCmp.getValue() + ':' + this.valueCmp.getValue();
            }

            return record;
        },
        setRecord: function(record) {
            var filter = record.filter
            var operator
            var value

            if (typeof filter === 'string') {
                if (filter.substring(0,3) === 'EQ:') {
                    operator = 'EQ'
                    value = filter.substring(3)
                }
                else if (filter.substring(0,5) === 'LIKE:') {
                    operator = 'LIKE'
                    value = filter.substring(5)
                }
            }

            this.operatorCmp.setValue(operator);
            this.valueCmp.setValue(value);
        },
        initComponent: function() {
            var container = this;

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
                width: containerConfig.operatorCmpWidth,
                style: 'margin-bottom:0',
                value: 'LIKE',
                store: {
                    fields: ['id', 'name'],
                    data: [
                        {id: 'LIKE', name: 'Contains'},
                        {id: 'EQ', name: 'Is exact'}
                    ]
                }
            });

            this.valueCmp = Ext.create('Ext.form.field.Text', {
                width: containerConfig.nameCmpWidth - containerConfig.operatorCmpWidth,
                style: 'margin-bottom:0'
            });

            this.items = [
                {
                    xtype: 'container',
                    layout: 'hbox',
                    width: containerConfig.nameCmpWidth,
                    items: [
                        this.nameCmp,
                        //this.addCmp,
                        this.removeCmp
                    ]
                },
                this.operatorCmp,
                this.valueCmp
            ];

            this.self.superclass.initComponent.call(this);
        }
    });
};
