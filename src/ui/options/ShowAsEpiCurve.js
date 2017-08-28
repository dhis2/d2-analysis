import style from './Style';

const ShowAsEpiCurve = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.show_as_epi_curve,
        style: 'margin-bottom:' + style.checkboxBottomMargin + 'px'
    });
};

export {
    ShowAsEpiCurve
};

export default ShowAsEpiCurve;
