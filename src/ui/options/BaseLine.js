import isNumber from 'd2-utilizr/lib/isNumber';
import style from './Style';

const BaseLineContainer = function (refs) {
    const i18n = refs.i18nManager.get();

    const container = Ext.create('Ext.container.Container', {
        layout: 'column',
        bodyStyle: 'border:0 none',
    });

    container.baseLineValueInput = Ext.create('Ext.form.field.Number', {
        width: style.numberWidth,
        height: style.numberHeight,
        listeners: {
            change: function (nf) {
                container.baseLineTitleInput.xable();
            }
        }
    });

    container.baseLineTitleInput = Ext.create('Ext.form.field.Text', {
        style: 'margin-left:1px; margin-bottom:1px',
        fieldStyle: 'padding-left:3px',
        emptyText: i18n.base_line_title,
        width: style.cmpWidth - style.labelWidth - 5 - style.numberWidth - 1,
        maxLength: 100,
        enforceMaxLength: true,
        disabled: true,
        xable: function () {
            this.setDisabled(! container.baseLineValueInput.getValue() && ! isNumber(container.baseLineValueInput.getValue()));
        }
    });

    container.add([
        {
            bodyStyle: 'border:0 none; padding-top:3px; margin-right:5px; color:#333',
            width: 130,
            html: i18n.base_line_value_title,
        },
        container.baseLineValueInput,
        container.baseLineTitleInput
    ]);

    return container;
};

export {
    BaseLineContainer
};

export default BaseLineContainer;
