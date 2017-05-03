import style from './Style';

const HideLegendCheckbox = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.hide_legend,
        style: 'margin-bottom:' + style.checkboxBottomMargin + 'px'
    });
};

export {
    HideLegendCheckbox
};

export default HideLegendCheckbox
