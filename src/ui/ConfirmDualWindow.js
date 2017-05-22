import { ConfirmButton } from '../ui/ConfirmButton';

export var ConfirmDualWindow;

ConfirmDualWindow = function(refs, title, msg, btnText, fn, applyConfig) {




    var window = Ext.create('Ext.window.Window', Object.assign({
        bodyStyle: 'background:#fff; padding:30px 60px 26px 42px',
        defaults: defaults,
        modal: true,
        preventHeader: true,
        resizable: false,
        closeable: false,
        items: [
            {
                html: title,
                bodyStyle: 'padding:0; border:0 none; font-size:16px',
                style: 'margin-bottom:20px'
            },
            {
                html: msg,
                bodyStyle: 'padding:0; border:0 none; font-size:13px',
                style: 'margin-bottom:16px'
            },
            {
                layout: 'hbox',
                defaults: defaults,
                items: [
                    confirmButton,
                    {
                        width: 10
                    },
                    cancelButton
                ]
            }
        ],
        listeners: {
            afterrender: function() {
                this.setPosition(this.getPosition()[0], this.getPosition()[1] / 2);
            },
            show: function() {
                confirmButton.focus(false, 50);
            }
        }
    }, applyConfig));

    return window;
};
