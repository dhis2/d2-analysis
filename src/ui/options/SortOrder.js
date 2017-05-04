import style from './Style';

const SortOrderSelect = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:' + style.comboBottomMargin + 'px',
        width: style.cmpWidth,
        labelWidth: style.labelWidth,
        fieldLabel: i18n.sort_order,
        labelSeparator: null,
        labelStyle: 'color:#333',
        queryMode: 'local',
        valueField: 'id',
        editable: false,
        value: 0,
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'text'],
            data: [
                {id: 0, text: i18n.none},
                {id: -1, text: i18n.low_to_high},
                {id: 1, text: i18n.high_to_low}
            ]
        })
    });
}

export {
    SortOrderSelect
};

export default SortOrderSelect
