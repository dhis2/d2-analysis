import isNumber from 'd2-utilizr/lib/isNumber';

export var LimitContainer;

LimitContainer = function(refs) {
    var i18n = refs.i18nManager.get();

    Ext.define('Ext.ux.container.LimitContainer', {
        extend: 'Ext.container.Container',
        alias: 'widget.limitcontainer',
        layout: 'hbox',
        sortOrder: null,
        topLimit: null,
        comboboxWidth: null,
        comboBottomMargin: null,
        onCheckboxChange: function(value) {
            this.sortOrderCmp.setDisabled(!value);
            this.topLimitCmp.setDisabled(!value);
        },
        getSortOrder: function() {
            return this.activateCmp.getValue() ? this.sortOrderCmp.getValue() : 0;
        },
        getTopLimit: function() {
            return this.activateCmp.getValue() ? this.topLimitCmp.getValue() : 0;
        },
        setValues: function(sortOrder, topLimit) {
            sortOrder = parseInt(sortOrder);
            topLimit = parseInt(topLimit);

            if (isNumber(sortOrder)) {
                this.sortOrderCmp.setValue(sortOrder);
            }
            else {
                this.sortOrderCmp.reset();
            }

            if (isNumber(topLimit)) {
                this.topLimitCmp.setValue(topLimit);
            }
            else {
                this.topLimitCmp.reset();
            }

            this.activateCmp.setValue(!!(sortOrder > 0 && topLimit > 0));
        },
        initComponent: function() {
            var container = this,
                activateWidth = 135,
                sortWidth = (this.comboboxWidth - activateWidth) / 2;

            this.activateCmp = Ext.create('Ext.form.field.Checkbox', {
                boxLabel: container.boxLabel,
                width: activateWidth,
                style: 'margin-bottom:4px',
                listeners: {
                    change: function(cmp, newValue) {
                        container.onCheckboxChange(newValue);
                    }
                }
            });

            this.sortOrderCmp = Ext.create('Ext.form.field.ComboBox', {
                cls: 'ns-combo',
                style: 'margin-bottom:' + container.comboBottomMargin + 'px',
                width: sortWidth,
                queryMode: 'local',
                valueField: 'id',
                editable: false,
                value: container.sortOrder,
                store: Ext.create('Ext.data.Store', {
                    fields: ['id', 'text'],
                    data: [
                        {id: -1, text: i18n.bottom},
                        {id: 1, text: i18n.top}
                    ]
                })
            });

            this.topLimitCmp = Ext.create('Ext.form.field.Number', {
                width: sortWidth - 1,
                style: 'margin-bottom:' + container.comboBottomMargin + 'px; margin-left:1px',
                minValue: 1,
                maxValue: 10000,
                value: container.topLimit,
                allowBlank: false
            });

            this.items = [
                this.activateCmp,
                this.sortOrderCmp,
                this.topLimitCmp
            ];

            this.self.superclass.initComponent.call(this);
        },
        listeners: {
            render: function() {
                this.onCheckboxChange(false);
            }
        }
    });
};
