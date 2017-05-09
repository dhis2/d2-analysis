import style from './Style';

const RegressionTypeSelect = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:' + style.comboBottomMargin + 'px',
        width: style.cmpWidth,
        labelWidth: style.labelWidth,
        fieldLabel: i18n.trend_line,
        labelSeparator: null,
        labelStyle: 'color:#333',
        queryMode: 'local',
        valueField: 'id',
        editable: false,
        value: 'NONE',
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'text'],
            data: [
                { id: 'NONE', text: i18n.none },
                { id: 'LINEAR', text: i18n.linear }
            ]
        })
    });
}

export {
    RegressionTypeSelect
};

export default RegressionTypeSelect;
