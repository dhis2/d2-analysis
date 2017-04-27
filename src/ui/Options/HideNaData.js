import style from './Style';

const HideNaDataCheckbox = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.hide_na_data,
        style: 'margin-bottom:' + style.checkboxBottomMargin + 'px'
    });
};

export {
    HideNaDataCheckbox
};

export default HideNaDataCheckbox
