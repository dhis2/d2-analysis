import style from './Style';

const AggregationTypeSelect = function (refs) {
    const i18n = refs.i18nManager.get();
    const optionConfig = refs.optionConfig;

    return Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:' + style.comboBottomMargin + 'px',
        width: style.cmpWidth,
        labelWidth: style.labelWidth,
        fieldLabel: i18n.aggregation_type,
        labelSeparator: null,
        labelStyle: 'color:#333',
        queryMode: 'local',
        valueField: 'id',
        displayField: 'name',
        editable: false,
        value: optionConfig.getAggregationType('def').id,
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'name', 'index'],
            data: optionConfig.getAggregationTypeRecords()
        })
    });
}

export {
    AggregationTypeSelect
};

export default AggregationTypeSelect
