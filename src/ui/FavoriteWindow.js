import { RenameWindow } from './RenameWindow.js';
import { SharingWindow } from './SharingWindow.js';
import { GridHeaders } from './GridHeaders.js';

import getFavoriteTextCmp from './FavoriteTextCmp';
import fs from './FavoriteStyle';

export var FavoriteWindow;

FavoriteWindow = function(c, action) {
    var appManager = c.appManager,
        instanceManager = c.instanceManager,
        uiManager = c.uiManager,
        i18n = c.i18nManager.get(),
        uiConfig = c.uiConfig,

        path = appManager.getPath(),
        apiResource = instanceManager.apiResource;

    var getDirection,
        getStoreUrl,
        favoriteStore,

        NameWindow,
        nameWindow,
        nameTextfield,
        createButton,
        updateButton,
        cancelButton,

        textfieldKeyUpHandlers,
        showFavoritesLink,
        showFavoritesLinkCt,
        searchTextfield,
        descriptionPanel,
        saveButtonHandler,
        saveButton,
        prevButton,
        nextButton,
        info,
        gridHeaders,
        renderers,
        gridBbarSeparator,
        gridBbar,
        grid,
        titles,
        windowItems,
        favoriteWindow,

        nameColWidth = fs.windowCmpWidth - fs.lastUpdatedColWidth - fs.buttonColWidth - fs.paddingColWidth - 2,

        storeFields = 'id,name,lastUpdated,access,title,description',
        urlFields = 'id,displayName|rename(name),lastUpdated,access,title,description',
        sortField = 'name',
        sortDirection = 'asc',

        cmpToToggle = [],
        layout = instanceManager.getStateCurrent() || {};

    var { nameTextField, titleTextField, descriptionTextField } = getFavoriteTextCmp({ layout, i18n });

    getDirection = function(keepDir) {
        return sortDirection = keepDir ? sortDirection : (sortDirection === 'asc' ? 'desc' : 'asc');
    };

    getStoreUrl = function(field, keepDir) {
        sortField = field || sortField;

        var value = action === 'open' ? searchTextfield.getValue() : null;
        return path + '/api/' + apiResource + '.json?fields=' + urlFields + (value ? '&filter=displayName:ilike:' + value : '') + '&order=' + sortField + ':' + getDirection(keepDir);
    };

    favoriteStore = Ext.create('Ext.data.Store', {
        fields: storeFields.split(','),
        proxy: {
            type: 'ajax',
            reader: {
                type: 'json',
                root: apiResource
            },
            startParam: false,
            limitParam: false
        },
        isLoaded: false,
        pageSize: 10,
        page: 1,
        defaultUrl: path + '/api/' + apiResource + '.json?fields=' + urlFields + '&order=name:asc',
        loadStore: function(url) {
            this.proxy.url = encodeURI(url || this.defaultUrl);

            this.load({
                params: {
                    pageSize: this.pageSize,
                    page: this.page
                }
            });
        },
        loadFn: function(fn) {
            if (this.isLoaded) {
                fn.call();
            }
            else {
                this.load(fn);
            }
        },
        get: function(field, value) {
            var index = this.findExact(field, value);
            return index === -1 ? null : this.getAt(index);
        },
        listeners: {
            load: function(store, records) {
                if (!this.isLoaded) {
                    this.isLoaded = true;
                }

                // pager
                var pager = store.proxy.reader.jsonData.pager;

                info.setText('Page ' + pager.page + ' of ' + pager.pageCount);

                prevButton.enable();
                nextButton.enable();

                if (pager.page === 1) {
                    prevButton.disable();
                }

                if (pager.page === pager.pageCount) {
                    nextButton.disable();
                }
            }
        }
    });

    textfieldKeyUpHandlers = {
        search: function(cmp, e) {
            var t = cmp,
                value = Ext.isString(value) ? value : t.getValue();

            if (action === 'open' && e.keyCode === 13 && favoriteStore.getRange().length) {
                favoriteWindow.destroy();
                instanceManager.getById(favoriteStore.getAt(0).data.id);
            }

            if (value !== t.currentValue) {
                t.currentValue = value;

                var url = value ? path + '/api/' + apiResource + '.json?fields=' + urlFields + (value ? '&filter=displayName:ilike:' + value : '') : null;

                favoriteStore.page = 1;
                favoriteStore.loadStore(url);
            }
        }
    };

    showFavoritesLink = Ext.create('Ext.form.Label', {
        text: i18n.show_favorites,
        style: 'color:#226aba',
        nextAction: 'hide',
        textMap: {
            hide: i18n.hide_favorites,
            show: i18n.show_favorites
        },
        toggle: function() {
            var t = this;

            cmpToToggle.forEach(function(cmp) {
                cmp[t.nextAction]();
            });

            this.nextAction = this.nextAction === 'hide' ? 'show' : 'hide';

            this.setText(this.textMap[this.nextAction]);
        },
        listeners: {
            render: function(cmp) {
                var t = this,
                    el = this.getEl();

                el.setStyle('cursor', 'pointer');

                el.on('click', function() {
                    t.toggle();
                });
            }
        }
    });

    showFavoritesLinkCt = Ext.create('Ext.container.Container', {
        width: fs.windowCmpWidth,
        style: 'text-align:right; padding-right:7px; padding-bottom:4px',
        items: showFavoritesLink
    });

    searchTextfield = Ext.create('Ext.form.field.Text', {
        width: fs.windowCmpWidth,
        height: 27,
        style: 'margin-bottom: 1px',
        fieldStyle: fs.textfieldStyle.concat([
            'color: #333'
        ]).join(';'),
        emptyText: i18n.search_for_favorites + '..',
        enableKeyEvents: true,
        currentValue: '',
        listeners: {
            keyup: {
                fn: function(cmp, e) {
                    textfieldKeyUpHandlers['search'](cmp, e);
                },
                buffer: 100
            }
        }
    });
    cmpToToggle.push(searchTextfield);

    saveButton = Ext.create('Ext.button.Button', {
        text: i18n.save,
        handler: saveButtonHandler
    });

    saveButtonHandler = function() {
        var currentLayout = instanceManager.getStateCurrent(),
            name = nameTextField.getValue(),
            title = titleTextField.getValue(),
            description = descriptionTextField.getValue();

        var record = favoriteStore.get('name', name);

        var preXhr = function() {
            favoriteWindow.destroy();
        };

        var fn = function(id, success, r) {
            currentLayout.id = id || currentLayout.id;
            instanceManager.setState(currentLayout, true, true);
        };

        currentLayout.name = name;
        currentLayout.title = title;
        currentLayout.description = description;

        if (record) {
            uiManager.confirmReplace(i18n.save_favorite, function() {
                preXhr();
                currentLayout.id = record.data.id;
                currentLayout.clone().put(fn, true, true);
            });
        }
        else {
            preXhr();
            currentLayout.clone().post(fn, true, true);
        }
    };

    prevButton = Ext.create('Ext.button.Button', {
        text: i18n.prev,
        handler: function() {
            var url = getStoreUrl(null, true),
                store = favoriteStore;

            store.page = store.page <= 1 ? 1 : store.page - 1;
            store.loadStore(url);
        }
    });
    cmpToToggle.push(prevButton);

    nextButton = Ext.create('Ext.button.Button', {
        text: i18n.next,
        handler: function() {
            var url = getStoreUrl(null, true),
                store = favoriteStore;

            store.page = store.page + 1;
            store.loadStore(url);
        }
    });
    cmpToToggle.push(nextButton);

    info = Ext.create('Ext.form.Label', {
        cls: 'ns-label-info',
        width: 300,
        height: 22
    });
    cmpToToggle.push(info);

    gridHeaders = GridHeaders({
        width: fs.windowCmpWidth,
        height: 21,
        direction: 'asc',
        getDirection: function() {
        },
        items: [
            {
                text: i18n.name,
                textAlign: 'left',
                width: nameColWidth,
                height: 20,
                handler: function() {
                    var url = getStoreUrl('name'),
                        store = favoriteStore;

                    store.page = 1;
                    store.loadStore(url);
                }
            },
            {
                text: i18n.last_updated,
                textAlign: 'left',
                width: fs.lastUpdatedColWidth,
                height: 20,
                direction: 'asc',
                handler: function() {
                    var url = getStoreUrl('lastUpdated'),
                        store = favoriteStore;

                    store.page = 1;
                    store.loadStore(url);
                }
            }
        ]
    });
    cmpToToggle.push(gridHeaders);

    renderers = {
        open: function(value, metaData, record) {
            var fn = function() {
                var element = Ext.get(record.data.id);

                if (element) {
                    element = element.parent('td');
                    element.addClsOnOver('link');
                    element.load = function() {
                        favoriteWindow.destroy();
                        instanceManager.getById(record.data.id);
                    };
                    element.handler = function() {
                        if (instanceManager.isStateUnsaved()) {
                            uiManager.confirmUnsaved(i18n.open, function() {
                                element.load();
                            });
                        }
                        else {
                            element.load();
                        }
                    };
                    element.dom.setAttribute('onclick', 'Ext.get(this).handler();');
                }
            };

            Ext.defer(fn, 100);

            return '<div id="' + record.data.id + '">' + value + '</div>';
        },
        saveas: function(value, metaData, record) {
            var fn = function() {
                var element = Ext.get(record.data.id);

                if (element) {
                    element = element.parent('td');
                    element.handler = function() {
                        nameTextField.setValue(record.data.name);
                        titleTextField.setValue(record.data.title);
                        descriptionTextField.setValue(record.data.description);
                    };
                    element.dom.setAttribute('onclick', 'Ext.get(this).handler();');
                }
            };

            Ext.defer(fn, 100);

            return '<div id="' + record.data.id + '">' + value + '</div>';
        }
    };

    gridBbarSeparator = Ext.create('Ext.toolbar.Separator', {
        height: 20,
        style: 'border-color:transparent; border-right-color:#d1d1d1; margin-right:4px',
    });
    cmpToToggle.push(gridBbarSeparator);

    gridBbar = function() {
        var items = [];

        items.push(info, '->', prevButton, nextButton);

        if (action === 'saveas') {
            items.push(' ', gridBbarSeparator, ' ');

            items.push(saveButton);
        }

        return items;
    }();

    grid = Ext.create('Ext.grid.Panel', {
        cls: 'ns-grid',
        scroll: false,
        hideHeaders: true,
        columns: [
            {
                dataIndex: 'name',
                sortable: true,
                width: nameColWidth,
                renderer: renderers[action]
            },
            {
                dataIndex: 'lastUpdated',
                sortable: true,
                width: fs.lastUpdatedColWidth,
                renderer: function(value) {
                    return (value || '').substring(0, 16).split('T').join(', ');
                }
            },
            {
                xtype: 'actioncolumn',
                sortable: false,
                width: fs.buttonColWidth,
                items: [
                    {
                        iconCls: 'ns-grid-row-icon-edit',
                        getClass: function(value, metaData, record) {
                            return 'tooltip-favorite-edit' + (!record.data.access.update ? ' disabled' : '');
                        },
                        handler: function(grid, rowIndex, colIndex, col, event) {
                            var record = this.up('grid').store.getAt(rowIndex),
                                x = event.target.x - nameColWidth - fs.lastUpdatedColWidth - fs.borderWidth + 6,
                                y = event.target.y - 34,
                                layoutObj = {
                                    id: record.data.id,
                                    name: record.data.name
                                },
                                listeners = {},
                                fn;

                            if (record.data.access.update) {
                                fn = function() {
                                    favoriteStore.loadStore();
                                };

                                listeners.show = function() {
                                    favoriteWindow.destroyOnBlur = false;
                                };

                                listeners.destroy = function() {
                                    favoriteWindow.destroyOnBlur = true;
                                };

                                nameWindow = RenameWindow(c, layoutObj, fn, listeners);
                                nameWindow.showAt(x, y);
                            }
                        }
                    },
                    {
                        iconCls: 'ns-grid-row-icon-sharing',
                        getClass: function(value, metaData, record) {
                            return 'tooltip-favorite-sharing' + (!record.data.access.manage ? ' disabled' : '');
                        },
                        handler: function(grid, rowIndex) {
                            var record = this.up('grid').store.getAt(rowIndex);

                            if (record.data.access.manage) {
                                instanceManager.getSharingById(record.data.id, function(r) {
                                    SharingWindow(c, r).show();
                                });
                            }
                        }
                    },
                    {
                        iconCls: 'ns-grid-row-icon-delete',
                        getClass: function(value, metaData, record) {
                            return 'tooltip-favorite-delete' + (!record.data.access['delete'] ? ' disabled' : '');
                        },
                        handler: function(grid, rowIndex, colIndex, col, event) {
                            var record = this.up('grid').store.getAt(rowIndex),
                                id = record.data.id,
                                message;

                            if (record.data.access['delete']) {
                                uiManager.confirmDelete(i18n.delete_favorite, function() {
                                    instanceManager.delById(id, function() {
                                        favoriteStore.loadStore();

                                        if (id === instanceManager.getStateFavoriteId()) {
                                            instanceManager.setState();
                                        }
                                    }, true, true);
                                });
                            }
                        }
                    }
                ]
            },
            {
                sortable: false,
                width: fs.paddingColWidth
            }
        ],
        store: favoriteStore,
        listeners: {
            render: function() {
                var size = Math.floor((uiManager.getHeight() - (330)) / uiConfig.grid_row_height);
                this.store.pageSize = size;
                this.store.page = 1;
                this.store.loadStore();

                favoriteStore.on('load', function() {
                    if (this.isVisible()) {
                        this.fireEvent('afterrender');
                    }
                }, this);
            },
            afterrender: function() {
                var fn = function() {
                    var editArray = Ext.query('.tooltip-favorite-edit'),
                        sharingArray = Ext.query('.tooltip-favorite-sharing'),
                        deleteArray = Ext.query('.tooltip-favorite-delete'),
                        el;

                    for (var i = 0; i < editArray.length; i++) {
                        var el = editArray[i];
                        Ext.create('Ext.tip.ToolTip', {
                            target: el,
                            html: i18n.rename,
                            'anchor': 'bottom',
                            anchorOffset: -14,
                            showDelay: 1000
                        });
                    }

                    for (var i = 0; i < sharingArray.length; i++) {
                        el = sharingArray[i];
                        Ext.create('Ext.tip.ToolTip', {
                            target: el,
                            html: i18n.share_with_other_people,
                            'anchor': 'bottom',
                            anchorOffset: -14,
                            showDelay: 1000
                        });
                    }

                    for (var i = 0; i < deleteArray.length; i++) {
                        el = deleteArray[i];
                        Ext.create('Ext.tip.ToolTip', {
                            target: el,
                            html: i18n.delete_,
                            'anchor': 'bottom',
                            anchorOffset: -14,
                            showDelay: 1000
                        });
                    }
                };

                Ext.defer(fn, 100);
            },
            itemmouseenter: function(grid, record, item) {
                this.currentItem = Ext.get(item);
                this.currentItem.removeCls('x-grid-row-over');
            },
            select: function() {
                if (action === 'open') {
                    this.currentItem.removeCls('x-grid-row-selected');
                }
            },
            selectionchange: function() {
                this.currentItem.removeCls('x-grid-row-focused');
            },
            itemdblclick: function() {
                if (action === 'saveas') {
                    saveButtonHandler();
                }
            }
        }
    });
    cmpToToggle.push(grid);

    titles = {
        open: i18n.open_favorite,
        saveas: i18n.save_favorite_as
    };

    windowItems = function() {
        var items = [];

        if (action === 'saveas') {
            items.push(nameTextField, titleTextField, descriptionTextField);
        }

        items.push(showFavoritesLinkCt, searchTextfield, gridHeaders, grid);

        return items;
    }();

    favoriteWindow = Ext.create('Ext.window.Window', {
        title: titles[action],
        bodyStyle: 'padding:1px; background-color:#fff',
        resizable: false,
        modal: true,
        width: fs.windowWidth,
        destroyOnBlur: true,
        items: windowItems,
        bbar: gridBbar,
        listeners: {
            show: function(w) {
                var favoriteButton = uiManager.get('favoriteButton') || {};

                if (favoriteButton.rendered) {
                    uiManager.setAnchorPosition(w, favoriteButton);

                    if (!w.hasDestroyOnBlurHandler) {
                        uiManager.addDestroyOnBlurHandler(w);
                    }
                }

                (action === 'open' ? searchTextfield : nameTextField).focus(false, 500);

                if (action === 'saveas') {
                    showFavoritesLink.toggle();
                }
            },
            destroy: function(w) {
                uiManager.unreg('favoriteWindow');
            }
        }
    });

    nameTextField.setEventKeyUpHandler(saveButtonHandler);
    titleTextField.setEventKeyUpHandler(saveButtonHandler);

    return favoriteWindow;
};
