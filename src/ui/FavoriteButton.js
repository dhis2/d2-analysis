import { FavoriteWindow } from './FavoriteWindow.js';
import { RenameWindow } from './RenameWindow.js';
import { SharingWindow } from './SharingWindow.js';
import { InterpretationWindow } from './InterpretationWindow.js';
import { LinkWindow } from './LinkWindow.js';
import { TranslateWindow } from './TranslateWindow.js';

export var FavoriteButton;

FavoriteButton = function(c) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get();

    return Ext.create('Ext.button.Button', {
        text: i18n.favorites,
        menu: {},
        handler: function(b) {
            b.menu = Ext.create('Ext.menu.Menu', {
                closeAction: 'destroy',
                shadow: false,
                showSeparator: false,
                items: (function() {
                    var getTitle = function(text) {
                        return text + '&nbsp;&nbsp;&nbsp;';
                    };

                    var newItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.new_),
                        iconCls: 'ns-menu-item-favorite-new',
                        disabled: !instanceManager.isStateCurrent(),
                        handler: function() {
                            if (instanceManager.isStateUnsaved()) {
                                uiManager.confirmUnsaved(i18n.new_favorite, function() {
                                    instanceManager.setState();
                                });
                            } else {
                                instanceManager.setState();
                            }
                        },
                    });
                    uiManager.reg(newItem, 'newItem');

                    var openItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.open),
                        iconCls: 'ns-menu-item-favorite-open',
                        handler: function() {
                            uiManager.reg(FavoriteWindow(c, 'open'), 'favoriteWindow').show();
                        },
                    });
                    uiManager.reg(openItem, 'openItem');

                    var saveItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.save),
                        iconCls: 'ns-menu-item-favorite-save',
                        disabled: !instanceManager.isStateDirty(),
                        handler: function() {
                            var layout = instanceManager.getStateCurrent(),
                                favorite = instanceManager.getStateFavorite();

                            if (!favorite) {
                                saveAsItem.handlerFn();
                                return;
                            }

                            layout.apply(favorite, ['id', 'name', 'description']);

                            // DHIS2-2784: use PATCH to avoid losing translationsp
                            const payload = layout.clone();
                            payload.toPut();

                            layout.clone().patch(
                                payload,
                                function() {
                                    instanceManager.getById(layout.id, function(
                                        layout,
                                        isFavorite
                                    ) {
                                        instanceManager.getReport(
                                            layout,
                                            isFavorite,
                                            false,
                                            false,
                                            function() {
                                                uiManager.unmask();
                                            }
                                        );
                                    });
                                },
                                true,
                                true
                            );
                        },
                    });
                    uiManager.reg(saveItem, 'saveItem');

                    var saveAsItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.save_as),
                        iconCls: 'ns-menu-item-favorite-save',
                        disabled: !instanceManager.isStateCurrent(),
                        handlerFn: function() {
                            FavoriteWindow(c, 'saveas').show();
                        },
                        handler: function() {
                            this.handlerFn();
                        },
                    });
                    uiManager.reg(saveAsItem, 'saveAsItem');

                    var renameItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.rename),
                        iconCls: 'ns-menu-item-favorite-rename',
                        disabled: !instanceManager.isStateFavorite(),
                        handler: function() {
                            RenameWindow(c, instanceManager.getStateFavorite()).show();
                        },
                    });
                    uiManager.reg(saveAsItem, 'renameItem');

                    var translateItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.translate),
                        iconCls: 'ns-menu-item-favorite-translate',
                        disabled: !instanceManager.isStateFavorite(),
                        handler: function() {
                            TranslateWindow(c, instanceManager.getStateFavorite()).show();
                        },
                    });
                    uiManager.reg(saveAsItem, 'translateItem');

                    var shareItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.share),
                        iconCls: 'ns-menu-item-favorite-share',
                        disabled: (function() {
                            var fav = instanceManager.getStateFavorite();

                            if (fav && (!fav.getAccess() || fav.getAccess().manage)) {
                                return false;
                            }

                            return true;
                        })(),
                        handler: function() {
                            instanceManager.getSharingById(
                                instanceManager.getStateFavoriteId(),
                                function(r) {
                                    SharingWindow(c, r).show();
                                }
                            );
                        },
                    });
                    uiManager.reg(interpretationItem, 'interpretationItem');

                    var interpretationItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.write_interpretation),
                        iconCls: 'ns-menu-item-favorite-interpretation',
                        disabled: !instanceManager.isStateFavorite(),
                        handler: function() {
                            instanceManager.getSharingById(
                                instanceManager.getStateFavoriteId(),
                                function(r) {
                                    InterpretationWindow(c, r).show();
                                }
                            );
                        },
                    });
                    uiManager.reg(interpretationItem, 'interpretationItem');

                    var linkItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.get_link),
                        iconCls: 'ns-menu-item-favorite-link',
                        disabled: !instanceManager.isStateFavorite(),
                        handler: function() {
                            LinkWindow(c).show();
                        },
                    });
                    uiManager.reg(linkItem, 'linkItem');

                    var deleteItem = Ext.create('Ext.menu.Item', {
                        text: getTitle(i18n.delete_),
                        iconCls: 'ns-menu-item-favorite-delete',
                        disabled: !instanceManager.isStateFavorite(),
                        handler: function() {
                            uiManager.confirmDelete(i18n.delete_favorite, function() {
                                instanceManager.getStateFavorite().del(function() {
                                    instanceManager.setState();
                                });
                            });
                        },
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
                        //discardItem,
                        //'-',
                        renameItem,
                        translateItem,
                        '-',
                        shareItem,
                        interpretationItem,
                        linkItem,
                        '-',
                        deleteItem,
                    ];
                })(),
                listeners: {
                    show: function() {
                        uiManager.setAnchorPosition(b.menu, b);
                    },
                    hide: function() {
                        b.menu.destroy();
                    },
                    destroy: function(m) {
                        b.menu = null;
                    },
                },
            });

            b.menu.show();
        },
    });
};
