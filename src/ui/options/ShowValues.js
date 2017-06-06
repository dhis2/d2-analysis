import style from './Style';

const ShowValuesCheckbox = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.show_values,
        style: 'margin-bottom:' + style.checkboxBottomMargin + 'px',
        checked: true
    });
}

export {
    ShowValuesCheckbox
};

export default ShowValuesCheckbox;
