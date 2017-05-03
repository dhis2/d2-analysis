import style from './Style';

const AxisContainer = function (refs) {
    const i18n = refs.i18nManager.get();

    const container = Ext.create('Ext.container.Container', {
        bodyStyle: 'border:0 none',
        style: 'margin-left:14px',
    });

    container.rangeAxisMinValueInput = Ext.create('Ext.form.field.Number', {
        width: style.numberWidth,
        height: style.numberHeight,
        labelWidth: style.labelWidth
    });

    container.rangeAxisMaxValueInput = Ext.create('Ext.form.field.Number', {
        width: style.numberWidth,
        height: style.numberHeight,
        labelWidth: style.labelWidth,
        style: 'margin-left:1px'
    });

    container.rangeAxisStepsInput = Ext.create('Ext.form.field.Number', {
        width: style.labelWidth + 5 + style.numberWidth,
        height: style.numberHeight,
        fieldLabel: 'Range axis tick steps',
        labelSeparator: null,
        labelStyle: 'color:#333',
        labelWidth: style.labelWidth,
        minValue: 1
    });

    container.rangeAxisDecimalsInput = Ext.create('Ext.form.field.Number', {
        width: style.labelWidth + 5 + style.numberWidth,
        height: style.numberHeight,
        fieldLabel: 'Range axis decimals',
        labelSeparator: null,
        labelStyle: 'color:#333',
        labelWidth: style.labelWidth,
        minValue: 0,
        maxValue: 20
    });

    container.rangeAxisTitleInput = Ext.create('Ext.form.field.Text', {
        width: style.cmpWidth,
        fieldLabel: i18n.range_axis_label,
        labelSeparator: null,
        labelStyle: 'color:#333',
        labelWidth: style.labelWidth,
        maxLength: 100,
        enforceMaxLength: true,
        style: 'margin-bottom:1px'
    });

    container.domainAxisTitleInput = Ext.create('Ext.form.field.Text', {
        width: style.cmpWidth,
        fieldLabel: i18n.domain_axis_label,
        labelSeparator: null,
        labelStyle: 'color:#333',
        labelWidth: style.labelWidth,
        maxLength: 100,
        enforceMaxLength: true,
        style: 'margin-bottom:1px'
    });

    container.add([
        {
            layout: 'column',
            bodyStyle: 'border:0 none',
            items: [
                {
                    bodyStyle: 'border:0 none; padding-top:3px; margin-right:5px; color:#333',
                    width: 130,
                    html: 'Range axis min/max'
                },
                container.rangeAxisMinValueInput,
                container.rangeAxisMaxValueInput
            ]
        },
        container.rangeAxisStepsInput,
        container.rangeAxisDecimalsInput,
        container.rangeAxisTitleInput,
        container.domainAxisTitleInput
    ]);

    return container;
};

export {
    AxisContainer
};

export default AxisContainer
