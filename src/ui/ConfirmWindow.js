export var ConfirmWindow;

ConfirmWindow = function(refs, title, msg, btnText, fn, applyConfig) {
    applyConfig = applyConfig || {};

    var i18n = refs.i18nManager.get();

    var confirmButtonText = btnText || 'OK';
    var cancelButtonText = i18n.cancel || 'Cancel';

    var buttonBorderRadius = '2px';
    var buttonWidth = btnText ? null : 72;
    var buttonHeight = 29;
    var buttonTextPadding = '3px';

    var defaults = {
        bodyStyle: 'background:#fff; border:0 none'
    };

    var confirmButton = Ext.create('Ext.button.Button', {
        xtype: 'button',
        width: buttonWidth,
        height: buttonHeight,
        text: '<span style="color:#fff; font-weight:bold; padding:0 ' + buttonTextPadding + ';">' + confirmButtonText + '</span>',
        style: 'border-color:#3079ed; background:#619dff; border-radius:' + buttonBorderRadius,
        handler: function() {
            fn && fn();
            window.destroy();
        }
    });

    var cancelButton = Ext.create('Ext.button.Button', {
        xtype: 'button',
        width: buttonWidth,
        height: buttonHeight,
        text: '<span style="color:#555; font-weight:bold; padding:0 ' + buttonTextPadding + ';">' + cancelButtonText + '</span>',
        style: 'border-color:#ccc; border-radius:' + buttonBorderRadius,
        handler: function() {
            window.destroy();
        }
    });

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
