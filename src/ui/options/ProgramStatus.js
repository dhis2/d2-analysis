import style from './Style';

const ProgramStatusSelect = function(refs, applyConfig) {
    const optionConfig = refs.optionConfig;
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.ComboBox', Object.assign({
        cls: 'ns-combo',
        style: 'margin-bottom:' + style.comboBottomMargin + 'px',
        width: style.cmpWidth,
        labelWidth: style.labelWidth,
        fieldLabel: i18n.program_status,
        labelSeparator: null,
        labelStyle: 'color:#333',
        queryMode: 'local',
        valueField: 'id',
        displayField: 'name',
        editable: false,
        value: optionConfig.getProgramStatus('def').id,
        store: Ext.create('Ext.data.Store', {
            fields: ['id', 'name', 'index'],
            data: optionConfig.getProgramStatusRecords()
        })
    }, applyConfig || {}));
}

export {
    ProgramStatusSelect
};

export default ProgramStatusSelect;
