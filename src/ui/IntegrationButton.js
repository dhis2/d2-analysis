export var IntegrationButton;

IntegrationButton = function(refs, { isDefaultButton, objectName, moduleName, btnIconCls, btnText, menuItem1Text, menuItem2Text, menuItem3Text }) {
    var appManager = refs.appManager,
        uiManager = refs.uiManager,
        instanceManager = refs.instanceManager,
        sessionStorageManager = refs.sessionStorageManager,

        i18n = refs.i18nManager.get(),
        path = appManager.getPath(),
        config;

    if (isDefaultButton) {
        config = {
            text: btnText,
            iconCls: btnIconCls,
            toggleGroup: 'module',
            pressed: true,
            handler: function() {
                if (!this.pressed) {
                    this.toggle();
                }
            }
        };
    }
    else {
        config = {
            text: btnText,
            iconCls: btnIconCls,
            toggleGroup: 'module',
            menu: {},
            handler: function(b) {
                b.menu = Ext.create('Ext.menu.Menu', {
                    closeAction: 'destroy',
                    shadow: false,
                    showSeparator: false,
                    items: [
                        {
                            text: menuItem1Text + '&nbsp;&nbsp;',
                            cls: 'ns-menu-item-noicon',
                            listeners: {
                                render: function(b) {
                                    this.getEl().dom.addEventListener('click', function(e) {
                                        if (!b.disabled) {
                                            uiManager.redirectCtrl(path + '/' + moduleName, e);
                                        }
                                    });
                                }
                            }
                        },
                        '-',
                        {
                            text: menuItem2Text + '&nbsp;&nbsp;',
                            cls: 'ns-menu-item-noicon',
                            disabled: !(instanceManager.isStateCurrent()),
                            listeners: {
                                render: function(b) {
                                    this.getEl().dom.addEventListener('click', function(e) {
                                        if (!b.disabled) {
                                            var layout = instanceManager.getStateCurrent().toSession();
                                            layout.parentGraphMap = uiManager.get('treePanel').getParentGraphMap();

                                            sessionStorageManager.set(layout, 'analytical');

                                            if (sessionStorageManager.supported) {
                                                uiManager.redirectCtrl(path + '/' + moduleName + '/index.html?s=analytical', e);
                                            }
                                        }
                                    });
                                }
                            }
                        },
                        {
                            text: menuItem3Text + '&nbsp;&nbsp;',
                            cls: 'ns-menu-item-noicon',
                            disabled: !sessionStorageManager.get(objectName),
                            listeners: {
                                render: function(b) {
                                    this.getEl().dom.addEventListener('click', function(e) {
                                        if (!b.disabled) {
                                            uiManager.redirectCtrl(path + '/' + moduleName + '/index.html?s=' + objectName, e);
                                        }
                                    });
                                }
                            }
                        }
                    ],
                    listeners: {
                        show: function() {
                            uiManager.setAnchorPosition(b.menu, b);
                        },
                        hide: function() {
                            b.menu.destroy();
                            uiManager.get('defaultIntegrationButton').toggle();
                        },
                        destroy: function(m) {
                            b.menu = null;
                        }
                    }
                });

                b.menu.show();
            }
        };
    }

    return Ext.create('Ext.button.Button', config);
};
