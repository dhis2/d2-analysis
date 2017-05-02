import style from './Style';

const HideEmptyRowItemsSelect = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:' + style.comboBottomMargin + 'px',
        width: style.cmpWidth,
        labelWidth: style.labelWidth,
        fieldLabel: i18n.hide_empty_categories,
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
                { id: 'BEFORE_FIRST', text: i18n.before_first },
                { id: 'AFTER_LAST', text: i18n.after_last },
                { id: 'BEFORE_FIRST_AFTER_LAST', text: i18n.before_first_after_last },
                { id: 'ALL', text: i18n.all }
            ]
        })
    });
};

export {
    HideEmptyRowItemsSelect
};

export default HideEmptyRowItemsSelect
