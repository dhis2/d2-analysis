import style from './Style';

const PercentStackedValuesCheckbox = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.use_percent_stacked_values,
        style: 'margin-bottom:' + style.checkboxBottomMargin + 'px'
    });
};

export {
    PercentStackedValuesCheckbox
};

export default PercentStackedValuesCheckbox;
