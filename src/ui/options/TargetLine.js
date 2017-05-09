import isNumber from 'd2-utilizr/lib/isNumber';
import style from './Style';

const TargetLineContainer = function (refs) {
    const i18n = refs.i18nManager.get();

    const container = Ext.create('Ext.container.Container', {
        layout: 'column',
        bodyStyle: 'border:0 none',
    });

    container.targetLineValueInput = Ext.create('Ext.form.field.Number', {
        width: style.numberWidth,
        height: style.numberHeight,
        listeners: {
            change: function (nf) {
                container.targetLineTitleInput.xable();
            }
        }
    });

    container.targetLineTitleInput = Ext.create('Ext.form.field.Text', {
        style: 'margin-left:1px; margin-bottom:1px',
        fieldStyle: 'padding-left:3px',
        width: style.cmpWidth - style.labelWidth - 5 - style.numberWidth - 1,
        maxLength: 100,
        enforceMaxLength: true,
        disabled: true,
        xable: function () {
            this.setDisabled(! container.targetLineValueInput.getValue() && ! isNumber(container.targetLineValueInput.getValue()));
        }
    });

    container.add([
        {
            layout: 'column',
            bodyStyle: 'border:0 none; padding-top:3px; margin-right:5px; color:#333',
            width: 130,
            html: 'Target value/title',
        },
        container.targetLineValueInput,
        container.targetLineTitleInput
    ]);

    return container;
};

export {
    TargetLineContainer
};

export default TargetLineContainer;
