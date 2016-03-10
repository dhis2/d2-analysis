import {FavoriteWindow} from './FavoriteWindow.js';
import {InterpretationWindow} from './InterpretationWindow.js';
import {LinkWindow} from './LinkWindow.js';

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
            b.menu = Ext.create('Ext.menu.Menu', {
                closeAction: 'destroy',
                shadow: false,
                showSeparator: false,
                items: function() {
                    var newItem = Ext.create('Ext.menu.Item', {
                        text: i18n.new_,
                        iconCls: 'ns-menu-item-favorite-new',
                        disabled: !instanceManager.isStateCurrent(),
                        handler: function() {
                            if (instanceManager.isStateUnsaved()) {
                                if (uiManager.confirmUnsaved()) {
                                    instanceManager.setState();
                                }
                            }
                            else {
                                instanceManager.setState();
                            }
                        }
                    });
                    uiManager.reg(newItem, 'newItem');

                    var openItem = Ext.create('Ext.menu.Item', {
                        text: i18n.open,
                        iconCls: 'ns-menu-item-favorite-open',
                        handler: function() {
                            uiManager.reg(FavoriteWindow(c, 'open'), 'favoriteWindow').show();
                        }
                    });
                    uiManager.reg(openItem, 'openItem');

                    var saveItem = Ext.create('Ext.menu.Item', {
                        text: i18n.save,
                        iconCls: 'ns-menu-item-favorite-save',
                        disabled: !instanceManager.isStateUnsaved(),
                        handler: function() {
                            var layout = instanceManager.getStateCurrent(),
                                favorite = instanceManager.getStateFavorite();

                            layout.id = favorite.id;
                            layout.name = favorite.name;

                            uiManager.mask();

                            layout.put(null, function() {
                                layout.id = favorite.id;
                                layout.name = favorite.name;

                                instanceManager.setState(layout, true);
                                uiManager.unmask();
                            });
                        }
                    });
                    uiManager.reg(saveItem, 'saveItem');

                    var saveAsItem = Ext.create('Ext.menu.Item', {
                        text: i18n.save_as,
                        iconCls: 'ns-menu-item-favorite-save',
                        disabled: !instanceManager.isStateCurrent(),
                        handler: function() {
                            FavoriteWindow(c, 'saveas').show();
                        }
                    });
                    uiManager.reg(saveAsItem, 'saveAsItem');

                    var interpretationItem = Ext.create('Ext.menu.Item', {
                        text: i18n.write_interpretation,
                        iconCls: 'ns-menu-item-favorite-interpretation',
                        disabled: !instanceManager.isStateFavorite(),
                        handler: function() {
                            InterpretationWindow(c).show();
                        }
                    });
                    uiManager.reg(interpretationItem, 'interpretationItem');

                    var linkItem = Ext.create('Ext.menu.Item', {
                        text: i18n.get_link,
                        iconCls: 'ns-menu-item-favorite-link',
                        disabled: !instanceManager.isStateFavorite(),
                        handler: function() {
                            LinkWindow(c).show();
                        }
                    });
                    uiManager.reg(linkItem, 'linkItem');

                    var deleteItem = Ext.create('Ext.menu.Item', {
                        text: i18n.delete_,
                        iconCls: 'ns-menu-item-favorite-delete',
                        disabled: !instanceManager.isStateFavorite(),
                        handler: function() {
                            if (uiManager.confirmDelete()) {
                                instanceManager.getStateFavorite().del();
                            }
                        }
                    });
                    uiManager.reg(deleteItem, 'deleteItem');

                    return [
                        newItem,
                        '-',
                        openItem,
                        '-',
                        saveItem,
                        saveAsItem,
                        '-',
                        interpretationItem,
                        linkItem,
                        '-',
                        deleteItem
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

            b.menu.show();
        }
    });
};

