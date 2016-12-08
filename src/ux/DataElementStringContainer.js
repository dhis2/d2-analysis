var DataElementIntegerContainer = function(refs) {
    Ext.define('Ext.ux.panel.DataElementStringContainer', {
        extend: 'Ext.container.Container',
        alias: 'widget.dataelementstringpanel',
        cls: 'ns-dxselector',
        layout: 'column',
        bodyStyle: 'border:0 none',
        style: 'margin: ' + margin,
        getRecord: function() {
            var record = {};

            record.dimension = this.dataElement.id;
            record.name = this.dataElement.name;

            if (this.valueCmp.getValue()) {
                record.filter = this.operatorCmp.getValue() + ':' + this.valueCmp.getValue();
            }

            return record;
        },
        setRecord: function(record) {
            this.operatorCmp.setValue(record.operator);
            this.valueCmp.setValue(record.filter);
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
                width: nameCmpWidth - operatorCmpWidth,
                style: 'margin-bottom:0'
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

export default DataElementStringContainer;
