import fs from './FavoriteStyle';

export default function({ layout, i18n }) {

    const nameTextField = Ext.create('Ext.form.field.Text', {
        width: fs.windowCmpWidth,
        height: 45,
        style: 'margin-top: 2px; margin-bottom: 0',
        fieldStyle: fs.textfieldStyle.join(';'),
        fieldLabel: i18n.name,
        labelAlign: 'top',
        labelStyle: fs.textFieldLabelStyle.join(';'),
        labelSeparator: '',
        emptyText: 'Unnamed',
        enableKeyEvents: true,
        currentValue: '',
        value: layout.name,
        setEventKeyUpHandler: function(handler) {
            this.eventKeyUpHandler = handler;
        },
        listeners: {
            keyup: function(cmp, e) {
                if (e.keyCode === 13 && this.eventKeyUpHandler) {
                    this.eventKeyUpHandler(cmp, e);
                }
            }
        }
    });

    const titleTextField = Ext.create('Ext.form.field.Text', {
        width: fs.windowCmpWidth,
        height: 45,
        style: 'margin-bottom: 0',
        fieldStyle: fs.textfieldStyle.join(';'),
        fieldLabel: i18n.title,
        labelAlign: 'top',
        labelStyle: fs.textFieldLabelStyle.join(';'),
        labelSeparator: '',
        emptyText: 'No title',
        enableKeyEvents: true,
        currentValue: '',
        value: layout.title,
        setEventKeyUpHandler: function(handler) {
            this.eventKeyUpHandler = handler;
        },
        listeners: {
            keyup: function(cmp, e) {
                if (e.keyCode === 13 && this.eventKeyUpHandler) {
                    this.eventKeyUpHandler(cmp, e);
                }
            }
        }
    });

    const descriptionTextField = Ext.create('Ext.form.field.TextArea', {
        width: fs.windowCmpWidth,
        height: 77,
        grow: true,
        style: 'margin-bottom: 0',
        fieldStyle: fs.textfieldStyle.concat([
            'padding-top: 5px'
        ]).join(';'),
        fieldLabel: i18n.description,
        labelAlign: 'top',
        labelStyle: fs.textFieldLabelStyle.join(';'),
        labelSeparator: '',
        emptyText: 'No description',
        enableKeyEvents: true,
        value: layout.description
    });

    return {
        nameTextField,
        titleTextField,
        descriptionTextField
    };
}
