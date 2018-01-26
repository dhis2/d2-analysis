import { ConfirmButton } from '../ui/ConfirmButton';

export var ConfirmWindow;

ConfirmWindow = function(refs, title, msg, btnText, fn, applyConfig, cancelFn=Function.prototype, closeOnAccept=false) {
    applyConfig = applyConfig || {};

    var i18n = refs.i18nManager.get();

    var confirmButtonText = btnText || 'OK';
    var cancelButtonText = i18n.cancel || 'Cancel';

    var defaults = {
        bodyStyle: 'background:#fff; border:0 none'
    };

    var closeFn = function() {
        return window.destroy();
    };

    var confirmFn = function() {
        if (closeOnAccept) {
            closeFn();
            setTimeout(fn, 0);
        } else {
            fn();
        }
    }

    var confirmButton = new ConfirmButton(refs, { text: confirmButtonText, fn: confirmFn, closeFn });
    var cancelButton = new ConfirmButton(refs, { type: 'close', text: cancelButtonText, fn: cancelFn, closeFn });

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
