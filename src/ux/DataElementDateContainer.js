import isString from 'd2-utilizr/lib/isString';

var DataElementDateContainer = function(refs) {
    Ext.define('Ext.ux.panel.DataElementDateContainer', {
        extend: 'Ext.container.Container',
        alias: 'widget.dataelementdatepanel',
        cls: 'ns-dxselector',
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin: ' + margin,
        getRecord: function() {
            var record = {};

            record.dimension = this.dataElement.id;
            record.name = this.dataElement.name;

            if (this.valueCmp.getValue()) {
                record.filter = this.operatorCmp.getValue() + ':' + this.valueCmp.getSubmitValue();
            }

            return record;
        },
        setRecord: function(record) {
            if (record.filter && isString(record.filter)) {
                var a = record.filter.split(':');

                this.operatorCmp.setValue(a[0]);
                this.valueCmp.setValue(a[1]);
            }
        },
        initComponent: function() {
            var container = this;

            this.nameCmp = Ext.create('Ext.form.Label', {
                text: this.dataElement.name,
                flex: 1,
                style: 'padding:' + namePadding
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
                style: removeCmpStyle,
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
                width: operatorCmpWidth,
                style: 'margin-bottom:0',
                value: 'EQ',
                store: {
                    fields: ['id', 'name'],
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

            this.valueCmp = Ext.create('Ext.form.field.Date', {
                width: nameCmpWidth - operatorCmpWidth,
                style: 'margin-bottom:0',
                format: 'Y-m-d'
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
                this.operatorCmp,
                this.valueCmp
            ];

            this.callParent();
        }
    });
};

export default DataElementDateContainer;
