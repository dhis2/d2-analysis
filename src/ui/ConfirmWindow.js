export var ConfirmWindow;

ConfirmWindow = function(c, msg, btnText, fn) {
    var i18n = c.i18nManager.get();

    var btnPadding = '3 12 3 12',
        defaults = {
            bodyStyle: 'background:#fff; border:0 none'
        };

    var confirmButton = Ext.create('Ext.button.Button', {
        xtype: 'button',
        text: '<span style="font-weight:bold">' + btnText + '</span>',
        style: 'border-color:#888',
        padding: btnPadding,
        handler: function() {
            fn && fn();
            window.destroy();
        }
    });

    var window = Ext.create('Ext.window.Window', {
        bodyStyle: 'background:#fff; padding:8px',
        defaults: defaults,
        modal: true,
        preventHeader: true,
        items: [
            {
                html: msg,
                bodyStyle: 'padding:45px 60px 35px; border:0 none; font-size:14px'
            },
            {
                layout: 'hbox',
                defaults: defaults,
                items: [
                    {
                        flex: 1
                    },
                    {
                        xtype: 'button',
                        text: i18n.cancel,
                        padding: btnPadding,
                        handler: function() {
                            window.destroy();
                        }
                    },
                    {
                        width: 5
                    },
                    confirmButton
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
    });

    return window;
};
