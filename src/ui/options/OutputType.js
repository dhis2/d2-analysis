import style from './Style';

const OutputTypeSelect = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.ComboBox', {
        cls: 'ns-combo',
        style: 'margin-bottom:' + style.comboBottomMargin + 'px',
        width: style.cmpWidth,
        labelWidth: style.labelWidth,
        fieldLabel: i18n.output_type,
        labelSeparator: null,
        labelStyle: 'color:#333',
        queryMode: 'local',
        valueField: 'id',
        editable: false,
        value: 'EVENT',
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'text'],
            data: [
                {id: 'EVENT', text: i18n.event},
                {id: 'ENROLLMENT', text: i18n.enrollment},
                {id: 'TRACKED_ENTITY_INSTANCE', text: i18n.tracked_entity_instance}
            ]
        })
    });
}

export {
    OutputTypeSelect
};

export default OutputTypeSelect;
