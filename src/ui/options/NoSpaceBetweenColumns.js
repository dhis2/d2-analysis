import style from './Style';

const NoSpaceBetweenColumns = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.no_space_between_columns,
        style: 'margin-bottom:' + style.checkboxBottomMargin + 'px'
    });
};

export {
    NoSpaceBetweenColumns
};

export default NoSpaceBetweenColumns;
