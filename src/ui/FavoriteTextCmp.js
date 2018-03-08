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
        setEventChangeHandler: function (handler) {
            this.eventChangeHandler = handler;
        },
        setEventKeyUpHandler: function(handler) {
            this.eventKeyUpHandler = handler;
        },
        listeners: {
            change: function (cmp, e) {
                if (this.eventChangeHandler) {
                    this.eventChangeHandler(cmp, e);
                }
            },
            keyup: function(cmp, e) {
                if (e.keyCode === 13 && this.eventKeyUpHandler) {
                    this.eventKeyUpHandler(cmp, e);
                }
            }
        }
    });

    const descriptionTextField = Ext.create('Ext.ux.CKEditor', {
        width: fs.windowCmpWidth,
        height: 200,
        style: 'margin-bottom: 0',
        fieldStyle: fs.textfieldStyle.concat([
            'padding-top: 5px'
        ]).join(';'),
        fieldLabel: i18n.description,
        labelAlign: 'top',
        labelStyle: fs.textFieldLabelStyle.join(';'),
        labelSeparator: '',
        emptyText: 'No description (optional)',
        enableKeyEvents: true,
        value: layout.description
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
        emptyText: 'No title (optional)',		
        enableKeyEvents: true,		
        currentValue: '',		
        value: layout.title,		
        setEventKeyUpHandler: function(handler) {		
            this.eventKeyUpHandler = handler;		
        },		
        listeners: {		
            keyup: function(cmp, e) {		
                if (e.keyCode === 13 && this.eventKeyUpHandler) {		
                    this.eventKeyUpHandler(cmp, e);		
                }		
            }		
        }		
    });

    return {
        nameTextField,
        descriptionTextField,
        titleTextField
    };
}
