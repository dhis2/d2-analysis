import style from './Style';

const CumulativeValuesCheckbox = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.use_cumulative_values,
        style: 'margin-bottom:' + style.checkboxBottomMargin + 'px'
    });
};

export {
    CumulativeValuesCheckbox
};

export default CumulativeValuesCheckbox;
