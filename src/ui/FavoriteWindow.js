import {RenameWindow} from './RenameWindow.js';
import {SharingWindow} from './SharingWindow.js';
import {GridHeaders} from './GridHeaders.js';

export var FavoriteWindow;

FavoriteWindow = function(c, action) {
    var appManager = c.appManager,
        instanceManager = c.instanceManager,
        uiManager = c.uiManager,
        i18n = c.i18nManager.get(),
        uiConfig = c.uiConfig,

        path = appManager.getPath(),

        apiResource = instanceManager.getApiResource();

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
        searchTextfield,
        saveasTextField,
        saveButtonHandler,
        saveButton,
        prevButton,
        nextButton,
        info,
        gridHeaders,
        renderers,
        gridBbar,
        grid,
        titles,
        windowItems,
        favoriteWindow,

        windowWidth = 700,
        borderWidth = 14,
        windowCmpWidth = windowWidth - borderWidth,

        lastUpdatedColWidth = 120,
        buttonColWidth = 60,
        paddingColWidth = 8,

        nameColWidth = windowCmpWidth - lastUpdatedColWidth - buttonColWidth - paddingColWidth - 2,

        fields = 'id,name,lastUpdated,access',
        sortField = 'name',
        sortDirection = 'asc',

        textfieldStyle = [
            'padding-right: 0',
            'padding-left: 5px',
            'border-color: transparent',
            'background: none',
            'font-size: 11px',
            'line-height: 13px'
        ];

    getDirection = function() {
        return sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    };

    getStoreUrl = function(field) {
        sortField = field || sortField;

        var value = action === 'open' ? searchTextfield.getValue() : null;
        return path + '/api/' + apiResource + '.json?fields=' + fields + (value ? '&filter=name:ilike:' + value : '') + '&order=' + sortField + ':' + getDirection();
    };

    favoriteStore = Ext.create('Ext.data.Store', {
        fields: fields.split(','),
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
        defaultUrl: path + '/api/' + apiResource + '.json?fields=' + fields + '&order=name:asc',
        loadStore: function(url) {
            this.proxy.url = url || this.defaultUrl;

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

    NameWindow = function(id) {
        var window,
            record = favoriteStore.getById(id);

        nameTextfield = Ext.create('Ext.form.field.Text', {
            height: 26,
            width: nameColWidth - 5,
            fieldStyle: 'padding-left: 4px; border-radius: 1px; border-color: #bbb; font-size:11px',
            style: 'margin-bottom:0',
            emptyText: 'Favorite name',
            value: id ? record.data.name : '',
            listeners: {
                afterrender: function() {
                    this.focus();
                }
            }
        });

        createButton = Ext.create('Ext.button.Button', {
            text: i18n.create,
            handler: function() {
                if (instanceManager.isStateCurrent()) {
                    var layout = instanceManager.getStateCurrent();
                    layout.name = nameTextfield.getValue();

                    layout.clone().post(function(id) {
                        layout.id = id;

                        instanceManager.setState(layout, true);

                        favoriteStore.loadStore();

                        window.destroy();
                    });
                }
            }
        });

        updateButton = Ext.create('Ext.button.Button', {
            text: i18n.rename,
            handler: function() {
                var name = nameTextfield.getValue(),
                    fields = appManager.getAnalysisFields(),
                    reportTable;

                if (id && name) {
                    Ext.Ajax.request({
                        url: path + '/api/' + apiResource + '/' + id + '.json?fields=' + fields,
                        method: 'GET',
                        failure: function(r) {
                            uiManager.unmask();
                            uiManager.alert(r);
                        },
                        success: function(r) {
                            reportTable = Ext.decode(r.responseText);
                            reportTable.name = name;

                            Ext.Ajax.request({
                                url: path + '/api/' + apiResource + '/' + reportTable.id + '?mergeStrategy=REPLACE',
                                method: 'PUT',
                                headers: {'Content-Type': 'application/json'},
                                params: Ext.encode(reportTable),
                                failure: function(r) {
                                    uiManager.unmask();
                                    uiManager.alert(r);
                                },
                                success: function(r) {
                                    //if (ns.app.layout && ns.app.layout.id && ns.app.layout.id === id) {
                                        //ns.app.layout.name = name;
                                        //ns.app.xLayout.name = name;
                                    //}
                                    //TODO

                                    favoriteStore.loadStore();
                                    window.destroy();
                                }
                            });
                        }
                    });
                }
            }
        });

        cancelButton = Ext.create('Ext.button.Button', {
            text: i18n.cancel,
            handler: function() {
                window.destroy();
            }
        });

        window = Ext.create('Ext.window.Window', {
            title: id ? 'Rename favorite' : 'Create new favorite',
            bodyStyle: 'padding:1px; background:#fff',
            resizable: false,
            modal: true,
            items: nameTextfield,
            destroyOnBlur: true,
            bbar: [
                cancelButton,
                '->',
                id ? updateButton : createButton
            ],
            listeners: {
                show: function(w) {
                    if (!w.hasDestroyOnBlurHandler) {
                        uiManager.addDestroyOnBlurHandler(w);
                    }

                    favoriteWindow.destroyOnBlur = false;

                    nameTextfield.focus(false, 500);
                },
                destroy: function() {
                    favoriteWindow.destroyOnBlur = true;
                }
            }
        });

        return window;
    };

    textfieldKeyUpHandlers = {
        search: function(cmp, e) {
            var t = searchTextfield,
                value = Ext.isString(value) ? value : t.getValue();

            if (action === 'open' && e.keyCode === 13 && favoriteStore.getRange().length) {
                favoriteWindow.destroy();
                instanceManager.getById(favoriteStore.getAt(0).data.id);
            }

            if (value !== t.currentValue) {
                t.currentValue = value;

                var url = value ? path + '/api/' + apiResource + '.json?fields=' + fields + (value ? '&filter=name:ilike:' + value : '') : null;

                favoriteStore.page = 1;
                favoriteStore.loadStore(url);
            }
        },
        saveas: function(cmp, e) {
            if (e.keyCode === 13) {
                saveButtonHandler();
            }
        }
    };

    searchTextfield = Ext.create('Ext.form.field.Text', {
        width: windowCmpWidth,
        height: 27,
        style: 'margin-bottom: 1px',
        fieldStyle: textfieldStyle.concat([
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

    saveasTextField = Ext.create('Ext.form.field.Text', {
        width: windowCmpWidth,
        height: 29,
        style: 'margin-bottom: 1px',
        fieldStyle: textfieldStyle.concat([
            'border-bottom-color: #ddd'
        ]).join(';'),
        emptyText: 'Untitled',
        enableKeyEvents: true,
        currentValue: '',
        value: instanceManager.getStateFavoriteName() || '',
        listeners: {
            keyup: function(cmp, e) {
                textfieldKeyUpHandlers['saveas'](cmp, e);
            }
        }
    });

    saveButtonHandler = function() {
        var currentLayout = instanceManager.getStateCurrent(),
            name = saveasTextField.getValue();

        var record = favoriteStore.get('name', name);

        var preXhr = function() {
            favoriteWindow.destroy();
        };

        var fn = function(id, obj, success, r) {
            currentLayout.id = id;
            instanceManager.setState(currentLayout, true);
        };

        currentLayout.name = name;

        if (record) {
            uiManager.confirmReplace(function() {
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

    saveButton = Ext.create('Ext.button.Button', {
        text: i18n.save,
        handler: saveButtonHandler
    });

    prevButton = Ext.create('Ext.button.Button', {
        text: i18n.prev,
        handler: function() {
            var url = getStoreUrl(),
                store = favoriteStore;

            store.page = store.page <= 1 ? 1 : store.page - 1;
            store.loadStore(url);
        }
    });

    nextButton = Ext.create('Ext.button.Button', {
        text: i18n.next,
        handler: function() {
            var url = getStoreUrl(),
                store = favoriteStore;

            store.page = store.page + 1;
            store.loadStore(url);
        }
    });

    info = Ext.create('Ext.form.Label', {
        cls: 'ns-label-info',
        width: 300,
        height: 22
    });

    gridHeaders = GridHeaders({
        width: windowCmpWidth,
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
                width: lastUpdatedColWidth,
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
                            uiManager.confirmUnsaved(function() {
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
                        saveasTextField.setValue(record.data.name);
                    };
                    element.dom.setAttribute('onclick', 'Ext.get(this).handler();');
                }
            };

            Ext.defer(fn, 100);

            return '<div id="' + record.data.id + '">' + value + '</div>';
        }
    };

    gridBbar = function() {
        var items = [];

        items.push(info, '->', prevButton, nextButton);

        if (action === 'saveas') {
            items.push(' ', {
                xtype: 'tbseparator',
                height: 20,
                style: 'border-color:transparent; border-right-color:#d1d1d1; margin-right:4px',
            }, ' ');

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
                width: lastUpdatedColWidth,
                renderer: function(value) {
                    return (value || '').substring(0, 16).split('T').join(', ');
                }
            },
            {
                xtype: 'actioncolumn',
                sortable: false,
                width: buttonColWidth,
                items: [
                    {
                        iconCls: 'ns-grid-row-icon-edit',
                        getClass: function(value, metaData, record) {
                            return 'tooltip-favorite-edit' + (!record.data.access.update ? ' disabled' : '');
                        },
                        handler: function(grid, rowIndex, colIndex, col, event) {
                            var record = this.up('grid').store.getAt(rowIndex),
                                x = event.target.x - nameColWidth - lastUpdatedColWidth - borderWidth + 6,
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
                                Ext.Ajax.request({
                                    url: path + '/api/sharing?type=reportTable&id=' + record.data.id,
                                    method: 'GET',
                                    failure: function(r) {
                                        uiManager.unmask('viewport');
                                        uiManager.alert(r);
                                    },
                                    success: function(r) {
                                        var sharing = Ext.decode(r.responseText);
                                        SharingWindow(c, sharing).show();
                                    }
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
                                uiManager.confirmDelete(function() {
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
                width: paddingColWidth
            }
        ],
        store: favoriteStore,
        bbar: gridBbar,
        listeners: {
            render: function() {
                var size = Math.floor((uiManager.get('centerRegion').getHeight() - 155) / uiConfig.grid_row_height);
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

    titles = {
        open: i18n.open_favorite,
        saveas: i18n.save_favorite_as
    };

    windowItems = function() {
        var items = [];

        if (action === 'saveas') {
            items.push(saveasTextField);
        }

        items.push(searchTextfield, gridHeaders, grid);

        return items;
    }();

    favoriteWindow = Ext.create('Ext.window.Window', {
        title: titles[action],
        bodyStyle: 'padding:1px; background-color:#fff',
        resizable: false,
        modal: true,
        width: windowWidth,
        destroyOnBlur: true,
        items: windowItems,
        listeners: {
            show: function(w) {
                var favoriteButton = uiManager.get('favoriteButton') || {};

                if (favoriteButton.rendered) {
                    uiManager.setAnchorPosition(w, favoriteButton);

                    if (!w.hasDestroyOnBlurHandler) {
                        uiManager.addDestroyOnBlurHandler(w);
                    }
                }

                (action === 'open' ? searchTextfield : saveasTextField).focus(false, 500);
            }
        }
    });

    return favoriteWindow;
};
