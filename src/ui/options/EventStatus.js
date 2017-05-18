import style from './Style';

const EventStatusSelect = function(refs, applyConfig) {
    const optionConfig = refs.optionConfig;
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.ComboBox', Object.assign({
        cls: 'ns-combo',
        style: 'margin-bottom:' + style.comboBottomMargin + 'px',
        width: style.cmpWidth,
        labelWidth: style.labelWidth,
        fieldLabel: i18n.event_status,
        labelSeparator: null,
        labelStyle: 'color:#333',
        queryMode: 'local',
        valueField: 'id',
        displayField: 'name',
        editable: false,
        value: optionConfig.getEventStatus('def').id,
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'name', 'index'],
            data: optionConfig.getEventStatusRecords()
        })
    }, applyConfig || {}));
}

export {
    EventStatusSelect
};

export default EventStatusSelect;
