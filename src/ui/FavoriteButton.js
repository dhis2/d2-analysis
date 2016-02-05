import {clone} from 'd2-utilizr';
import {FavoriteWindow} from './FavoriteWindow.js';

export var FavoriteButton;

FavoriteButton = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get(),
        uiConfig = c.uiConfig,

        path = appManager.getPath(),
        apiResource = instanceManager.getApiResource();

    return Ext.create('Ext.button.Button', {
        text: i18n.favorites,
        menu: {},
        handler: function(b) {
            this.menu = Ext.create('Ext.menu.Menu', {
                closeAction: 'destroy',
                shadow: false,
                showSeparator: false,
                items: function() {
                    var openItem = Ext.create('Ext.menu.Item', {
                        text: 'Open',
                        iconCls: 'ns-menu-item-tablelayout',
                        handler: function() {
                            FavoriteWindow(c).show();
                        }
                    });
                    uiManager.register(openItem, 'openItem');

                    var saveItem = Ext.create('Ext.menu.Item', {
                        text: 'Save',
                        iconCls: 'ns-menu-item-tablelayout',
                        disabled: !instanceManager.isStateUnsaved(),
                        handler: function() {
                            console.log("save");
                        }
                    });
                    uiManager.register(saveItem, 'saveItem');

                    var saveAsItem = Ext.create('Ext.menu.Item', {
                        text: 'Save as',
                        iconCls: 'ns-menu-item-tablelayout',
                        disabled: !instanceManager.isStateCurrent(),
                        handler: function() {
                            console.log("save as");
                        }
                    });
                    uiManager.register(saveAsItem, 'saveAsItem');

                    var closeItem = Ext.create('Ext.menu.Item', {
                        text: 'Close',
                        iconCls: 'ns-menu-item-tablelayout',
                        disabled: !instanceManager.isStateCurrent(),
                        handler: function() {
                            if (instanceManager.isStateUnsaved()) {
                                if (confirm("You have unsaved changes. Close anyway?")) {
                                    instanceManager.setState();
                                }
                            }
                            else {
                                instanceManager.setState();
                            }
                        }
                    });
                    uiManager.register(closeItem, 'closeItem');

                    return [
                        openItem,
                        '-',
                        saveItem,
                        saveAsItem,
                        '-',
                        closeItem
                    ];
                }(),
                listeners: {
                    show: function() {
                        uiManager.setAnchorPosition(b.menu, b);
                    },
                    hide: function() {
                        b.menu.destroy();
                    },
                    destroy: function(m) {
                        b.menu = null;
                    }
                }
            });

            this.menu.show();
        }
    });
};
