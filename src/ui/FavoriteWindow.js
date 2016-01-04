import {clone} from 'd2-utilizr';

export var FavoriteWindow;

FavoriteWindow = function(c) {
    var t = this,

        appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get(),
        uiConfig = c.uiConfig,

        path = appManager.getPath(),

        dimensionStoreMap = {},
        margin = 1,
        defaultWidth = 200,
        defaultHeight = 220;

    // components
    var favoriteStore,

        NameWindow,
        nameWindow,

        getBody,

        addButton,
        onSearchTextfieldKeyUp,
        searchTextfield,
        grid,
        prevButton,
        nextButton,
        tbar,
        bbar,
        info,
        nameTextfield,
        createButton,
        updateButton,
        cancelButton,
        favoriteWindow,

        windowWidth = 500,
        windowCmpWidth = windowWidth - 14;

    favoriteStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'lastUpdated', 'access'],
        proxy: {
            type: 'ajax',
            reader: {
                type: 'json',
                root: 'reportTables'
            },
            startParam: false,
            limitParam: false
        },
        isLoaded: false,
        pageSize: 10,
        page: 1,
        defaultUrl: path + '/api/reportTables.json?fields=id,displayName|rename(name),access',
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
        listeners: {
            load: function(store, records) {
                if (!this.isLoaded) {
                    this.isLoaded = true;
                }

                this.sort('name', 'ASC');

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

    getBody = function() {
        var favorite,
            dimensions;

        //if (ns.app.layout) { //TODO
        if (true) {
            //favorite = clone(ns.app.layout);
            favorite = {};
            dimensions = [].concat(favorite.columns || [], favorite.rows || [], favorite.filters || []);

            // Server sync
            favorite.rowTotals = favorite.showRowTotals;
            delete favorite.showRowTotals;

            favorite.colTotals = favorite.showColTotals;
            delete favorite.showColTotals;

            favorite.rowSubTotals = favorite.showRowSubTotals;
            delete favorite.showRowSubTotals;

            favorite.colSubTotals = favorite.showColSubTotals;
            delete favorite.showColSubTotals;

            favorite.reportParams = {
                paramReportingPeriod: favorite.reportingPeriod,
                paramOrganisationUnit: favorite.organisationUnit,
                paramParentOrganisationUnit: favorite.parentOrganisationUnit
            };
            delete favorite.reportingPeriod;
            delete favorite.organisationUnit;
            delete favorite.parentOrganisationUnit;

            delete favorite.parentGraphMap;

            delete favorite.id;
        }

        return favorite;
    };

    NameWindow = function(id) {
        var window,
            record = favoriteStore.getById(id);

        nameTextfield = Ext.create('Ext.form.field.Text', {
            height: 26,
            width: 371,
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
                var favorite = getBody();
                favorite.name = nameTextfield.getValue();

                //tmp
                //delete favorite.legendSet;

                if (favorite && favorite.name) {
                    Ext.Ajax.request({
                        url: path + '/api/reportTables/',
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        params: Ext.encode(favorite),
                        failure: function(r) {
                            uiManager.unmask('centerRegion');
                            uiManager.alert(r);
                        },
                        success: function(r) {
                            var id = r.getAllResponseHeaders().location.split('/').pop();
                            console.log("Favorite id: " + id);
//TODO
                            //ns.app.layout.id = id;
                            //ns.app.xLayout.id = id;

                            //ns.app.layout.name = name;
                            //ns.app.xLayout.name = name;

                            favoriteStore.loadStore();

                            window.destroy();
                        }
                    });
                }
            }
        });

        updateButton = Ext.create('Ext.button.Button', {
            text: i18n.update,
            handler: function() {
                var name = nameTextfield.getValue(),
                    fields = appManager.getAnalysisFields(),
                    reportTable;

                if (id && name) {
                    Ext.Ajax.request({
                        url: path + '/api/reportTables/' + id + '.json?fields=' + fields,
                        method: 'GET',
                        failure: function(r) {
                            uiManager.unmask('centerRegion');
                            uiManager.alert(r);
                        },
                        success: function(r) {
                            reportTable = Ext.decode(r.responseText);
                            reportTable.name = name;

                            Ext.Ajax.request({
                                url: path + '/api/reportTables/' + reportTable.id + '?mergeStrategy=REPLACE',
                                method: 'PUT',
                                headers: {'Content-Type': 'application/json'},
                                params: Ext.encode(reportTable),
                                failure: function(r) {
                                    uiManager.unmask('centerRegion');
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
                    if (addButton.rendered) {
                        uiManager.setAnchorPosition(w, addButton);

                        if (!w.hasDestroyOnBlurHandler) {
                            uiManager.hasDestroyOnBlurHandler(w);
                        }
                    }

                    nameTextfield.focus(false, 500);
                },
                destroy: function() {
                    favoriteWindow.hideOnBlur = true;
                }
            }
        });

        return window;
    };

    addButton = Ext.create('Ext.button.Button', {
        text: i18n.add_new,
        width: 67,
        height: 26,
        style: 'border-radius: 1px;',
        menu: {},
        //disabled: !isObject(ns.app.xLayout), //TODO
        handler: function() {
            nameWindow = new NameWindow(null, 'create');
            nameWindow.show();
        }
    });

	onSearchTextfieldKeyUp = function(value) {
		var t = searchTextfield,
			value = Ext.isString(value) ? value : t.getValue();
			
		if (value !== t.currentValue) {
			t.currentValue = value;

			var url = value ? path + '/api/reportTables.json?fields=id,name,access' + (value ? '&filter=name:ilike:' + value : '') : null;

			favoriteStore.page = 1;
			favoriteStore.loadStore(url);
		}
	};

    searchTextfield = Ext.create('Ext.form.field.Text', {
        width: windowCmpWidth - addButton.width - 3,
        height: 26,
        fieldStyle: 'padding-right: 0; padding-left: 4px; border-radius: 1px; border-color: #bbb; font-size:11px',
        emptyText: i18n.search_for_favorites,
        enableKeyEvents: true,
        currentValue: '',
        listeners: {
            keyup: {
                fn: function() {
					onSearchTextfieldKeyUp();
                },
                buffer: 100
            }
        }
    });

    prevButton = Ext.create('Ext.button.Button', {
        text: i18n.prev,
        handler: function() {
            var value = searchTextfield.getValue(),
                url = value ? path + '/api/reportTables.json?fields=id,name,access' + (value ? '&filter=name:ilike:' + value : '') : null;

            favoriteStore.page = store.page <= 1 ? 1 : store.page - 1;
            favoriteStore.loadStore(url);
        }
    });

    nextButton = Ext.create('Ext.button.Button', {
        text: i18n.next,
        handler: function() {
            var value = searchTextfield.getValue(),
                url = value ? path + '/api/reportTables.json?fields=id,name,access' + (value ? '&filter=name:ilike:' + value : '') : null;

            favoriteStore.page = favoriteStore.page + 1;
            favoriteStore.loadStore(url);
        }
    });

    info = Ext.create('Ext.form.Label', {
        cls: 'ns-label-info',
        width: 300,
        height: 22
    });

    grid = Ext.create('Ext.grid.Panel', {
        cls: 'ns-grid',
        scroll: false,
        hideHeaders: true,
        columns: [
            {
                dataIndex: 'name',
                sortable: false,
                width: windowCmpWidth - 88,
                renderer: function(value, metaData, record) {
                    var fn = function() {
                        var element = Ext.get(record.data.id);

                        if (element) {
                            element = element.parent('td');
                            element.addClsOnOver('link');
                            element.load = function() {
                                favoriteWindow.hide();
                                instanceManager.getById(record.data.id);
                            };
                            element.dom.setAttribute('onclick', 'Ext.get(this).load();');
                        }
                    };

                    Ext.defer(fn, 100);

                    return '<div id="' + record.data.id + '">' + value + '</div>';
                }
            },
            {
                xtype: 'actioncolumn',
                sortable: false,
                width: 80,
                items: [
                    {
                        iconCls: 'ns-grid-row-icon-edit',
                        getClass: function(value, metaData, record) {
                            return 'tooltip-favorite-edit' + (!record.data.access.update ? ' disabled' : '');
                        },
                        handler: function(grid, rowIndex, colIndex, col, event) {
                            var record = this.up('grid').store.getAt(rowIndex);

                            if (record.data.access.update) {
                                nameWindow = new NameWindow(record.data.id);
                                nameWindow.show();
                            }
                        }
                    },
                    {
                        iconCls: 'ns-grid-row-icon-overwrite',
                        getClass: function(value, metaData, record) {
                            return 'tooltip-favorite-overwrite' + (!record.data.access.update ? ' disabled' : '');
                        },
                        handler: function(grid, rowIndex, colIndex, col, event) {
                            var record = this.up('grid').store.getAt(rowIndex),
                                message,
                                favorite;

                            if (record.data.access.update) {
                                message = i18n.overwrite_favorite + '?\n\n' + record.data.name;
                                favorite = getBody();

                                if (favorite) {
                                    favorite.name = record.data.name;

                                    if (confirm(message)) {
                                        Ext.Ajax.request({
                                            url: path + '/api/reportTables/' + record.data.id + '?mergeStrategy=REPLACE',
                                            method: 'PUT',
                                            headers: {'Content-Type': 'application/json'},
                                            params: Ext.encode(favorite),
                                            success: function(r) {
                                                //ns.app.layout.id = record.data.id;
                                                //ns.app.xLayout.id = record.data.id;

                                                //ns.app.layout.name = true;
                                                //ns.app.xLayout.name = true;
                                                //TODO

                                                favoriteStore.loadStore();
                                            }
                                        });
                                    }
                                }
                                else {
                                    uiManager.alert(i18n.please_create_a_table_first);
                                }
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
                                        var sharing = Ext.decode(r.responseText),
                                            window = new SharingWindow(sharing);

                                        window.show();
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
                                message;

                            if (record.data.access['delete']) {
                                message = i18n.delete_favorite + '?\n\n' + record.data.name;

                                if (confirm(message)) {
                                    Ext.Ajax.request({
                                        url: path + '/api/reportTables/' + record.data.id,
                                        method: 'DELETE',
                                        success: function() {
                                            favoriteStore.loadStore();
                                        }
                                    });
                                }
                            }
                        }
                    }
                ]
            },
            {
                sortable: false,
                width: 6
            }
        ],
        store: favoriteStore,
        bbar: [
            info,
            '->',
            prevButton,
            nextButton
        ],
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
                        overwriteArray = Ext.query('.tooltip-favorite-overwrite'),
                        //dashboardArray = Ext.query('.tooltip-favorite-dashboard'),
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

                    for (var i = 0; i < overwriteArray.length; i++) {
                        el = overwriteArray[i];
                        Ext.create('Ext.tip.ToolTip', {
                            target: el,
                            html: i18n.overwrite,
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
                this.currentItem.removeCls('x-grid-row-selected');
            },
            selectionchange: function() {
                this.currentItem.removeCls('x-grid-row-focused');
            }
        }
    });

    favoriteWindow = Ext.create('Ext.window.Window', {
        //title: i18n.favorites + (ns.app.layout && ns.app.layout.name ? '<span style="font-weight:normal">&nbsp;|&nbsp;&nbsp;' + ns.app.layout.name + '</span>' : ''),
        title: i18n.favorites, //TODO
        bodyStyle: 'padding:1px; background-color:#fff',
        closeAction: 'hide',
        resizable: false,
        modal: true,
        width: windowWidth,
        hideOnBlur: true,
        items: [
            {
                xtype: 'panel',
                layout: 'hbox',
                bodyStyle: 'border:0 none',
                height: 27,
                items: [
                    addButton,
                    {
                        height: 26,
                        width: 1,
                        style: 'width:1px; margin-left:1px; margin-right:1px',
                        bodyStyle: 'border-left: 1px solid #aaa'
                    },
                    searchTextfield
                ]
            },
            grid
        ],
        listeners: {
            show: function(w) {
                var favoriteButton = uiManager.get('favoriteButton');

                if (favoriteButton.rendered) {
                    uiManager.setAnchorPosition(w, favoriteButton);

                    if (!w.hasHideOnBlurHandler) {
                        uiManager.addHideOnBlurHandler(w);
                    }
                }
				
				searchTextfield.reset();
				onSearchTextfieldKeyUp('');
                searchTextfield.focus(false, 500);
            }
        }
    });

    return favoriteWindow;
};

