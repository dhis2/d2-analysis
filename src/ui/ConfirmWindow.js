export var ConfirmWindow;

ConfirmWindow = function(c, msg, btnText, fn) {
    var i18n = c.i18nManager.get();

    var btnPadding = '4',
        defaults = {
            bodyStyle: 'background:#fff; border:0 none'
        };

    var window = Ext.create('Ext.window.Window', {
        bodyStyle: 'background:#fff; padding:5px',
        defaults: defaults,
        modal: true,
        preventHeader: true,
        items: [
            {
                html: msg,
                bodyStyle: 'padding:30px 35px 25px; border:0 none; font-size:14px'
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
                        text: 'Cancel',
                        padding: btnPadding,
                        handler: function() {
                            window.destroy();
                        }
                    },
                    {
                        width: 5
                    },
                    {
                        xtype: 'button',
                        text: '<span style="font-weight:bold">' + btnText + '</span>',
                        padding: btnPadding,
                        handler: function() {
                            fn && fn();
                            window.destroy();
                        }
                    }
                ]
            }
        ],
        listeners: {
            afterrender: function() {
                this.setPosition(this.getPosition()[0], this.getPosition()[1] / 4);
            }
        }
    });

    return window;
};
