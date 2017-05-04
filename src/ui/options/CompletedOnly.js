import style from './Style';

const CompletedOnlyCheckbox = function (refs) {
    const i18n = refs.i18nManager.get();

    return Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.include_only_completed_events_only,
        style: 'margin-bottom:' + style.checkboxBottomMargin + 'px',
    });
};

export {
    CompletedOnlyCheckbox
};

export default CompletedOnlyCheckbox
