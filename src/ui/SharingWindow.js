import isArray from 'd2-utilizr/lib/isArray';

export var SharingWindow;

SharingWindow = function(c, sharing, configOnly) {
    var t = this;

    var appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get();

    var apiPath = appManager.getApiPath();

    var SharingAccessRow,

        getBody,

        sharingStore,
        sharingField,
        sharingButton,
        userGroupRowContainer,
        userRowContainer,
        sharingContainer,
        externalAccess,
        publicGroup,

        items,
        window;

    SharingAccessRow = function(obj, isPublicAccess, disallowPublicAccess) {
        var getData,
            store,
            getItems,
            combo,
            getAccess,
            panel;

        getData = function() {
            var data = [
                {id: 'r-------', name: i18n.can_view},
                {id: 'rw------', name: i18n.can_edit_and_view}
            ];

            if (isPublicAccess) {
                data.unshift({id: '--------', name: i18n.none});
            }

            return data;
        }

        store = Ext.create('Ext.data.Store', {
            fields: ['id', 'name'],
            data: getData()
        });

        getItems = function() {
            var items = [];

            combo = Ext.create('Ext.form.field.ComboBox', {
                style: 'margin-bottom:2px',
                fieldLabel: isPublicAccess ? i18n.public_access : obj.name,
                labelStyle: 'color:#333',
                cls: 'ns-combo',
                width: 380,
                labelWidth: 250,
                queryMode: 'local',
                valueField: 'id',
                displayField: 'name',
                labelSeparator: null,
                editable: false,
                disabled: !!disallowPublicAccess,
                value: obj.access || 'rw------',
                store: store
            });

            items.push(combo);

            if (!isPublicAccess) {
                items.push(Ext.create('Ext.container.Container', {
                    cls: 'ns-grid-row-icon-delete',
                    style: 'margin-top:2px; margin-left:7px',
                    bodyStyle: 'border:0 none; background:#fff',
                    overCls: 'pointer',
                    width: 16,
                    height: 16,
                    listeners: {
                        render: function(cmp) {
                            cmp.getEl().on('click', function(e) {
                                cmp.up('panel').destroy();

                                if (window) {
                                    window.doLayout();
                                }
                            });
                        }
                    }
                }));
            }

            return items;
        };

        getAccess = function() {
            return {
                id: obj.id,
                name: obj.name,
                access: combo.getValue()
            };
        };

        panel = Ext.create('Ext.panel.Panel', {
            layout: 'column',
            bodyStyle: 'border:0 none',
            getAccess: getAccess,
            items: getItems()
        });

        return panel;
    };

    getBody = function() {
        var body = {
            object: {
                id: sharing.object.id,
                name: sharing.object.name,
                publicAccess: publicGroup.down('combobox').getValue(),
                externalAccess: externalAccess ? externalAccess.getValue() : false
            }
        };

        if (userGroupRowContainer.items.items.length > 1) {
            body.object.userGroupAccesses = [];
            userGroupRowContainer.items.items.forEach((item, i) => {
                if (i > 0) {
                    body.object.userGroupAccesses.push(item.getAccess());
                }
            });
        }

        if (userRowContainer.items.items.length > 1) {
            body.object.userAccesses = [];
            userRowContainer.items.items.forEach((item, i) => {
                if (i > 0) {
                    body.object.userAccesses.push(item.getAccess());
                }
            });
        }

        return body;
    };

    // Initialize
    sharingStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name', 'isGroup'],
        proxy: {
            type: 'ajax',
            url: encodeURI(apiPath + '/sharing/search'),
            extraParams: {
                pageSize: 50
            },
            startParam: false,
            limitParam: false,
            reader: {
                type: 'json',
                getData: (data) => {
                    // manually populate the store with the records from the response
                    // this is to avoid having to call the endpoint 2 times, one for user groups and one for users
                    const records = [];

                    data.userGroups.forEach(({id, name}) => {
                        records.push({ id, name, isGroup: true });
                    });

                    data.users.forEach(({id, name}) => {
                        records.push({ id, name, isGroup: false });
                    });

                    return records;
                },
            }
        }
    });

    const comboBoxConfig = {
        valueField: 'id',
        displayField: 'name',
        queryParam: 'key',
        queryDelay: 200,
        minChars: 1,
        hideTrigger: true,
        fieldStyle: 'height:26px; padding-left:6px; border-radius:1px; font-size:11px',
        style: 'margin-bottom:5px',
        width: 380,
    };

    sharingField = Ext.create('Ext.form.field.ComboBox',
        Object.assign({}, comboBoxConfig, {
            emptyText: i18n.add_users_and_user_groups,
            store: sharingStore,
            listeners: {
                beforeselect: function(cb) { // beforeselect instead of select, fires regardless of currently selected item
                    sharingButton.enable();
                },
                afterrender: function(cb) {
                    cb.inputEl.on('keyup', function(e) {
                        if (e.getKey() !== e.ENTER) {
                            sharingButton.disable();
                        }
                    });
                }
            }
        })
    );

    const buttonConfig = {
        text: '+',
        style: 'margin-left:2px; padding-right:4px; padding-left:4px; border-radius:1px',
        disabled: true,
        height: 26,
    };

    sharingButton = Ext.create('Ext.button.Button',
        Object.assign({}, buttonConfig, {
            handler: function(b) {
                const record = sharingStore.getById(sharingField.getValue());

                if (record && record.data) {
                    if (record.data.isGroup) {
                        userGroupRowContainer.add(SharingAccessRow({
                            id: record.data.id,
                            name: record.data.name,
                            access: 'r-------'
                        }));
                    }
                    else {
                        userRowContainer.add(SharingAccessRow({
                            id: record.data.id,
                            name: record.data.name,
                            access: 'r-------'
                        }));
                    }
                }

                sharingField.clearValue();
                b.disable();
            }
        })
    );

    sharingContainer = Ext.create('Ext.container.Container', {
        bodyStyle: 'border:0 none'
    });

    const rowContainerConfig = {
        hidden: true,
        bodyStyle: 'border:0 none',
        listeners: {
            add: (el) => {
                if (el.items.length > 1) {
                    // enable the whole container
                    el.show();
                }
            },
            remove: (el) => {
                if (el.items.length === 1) {
                    el.hide();
                }
            }
        }
    };

    userGroupRowContainer = Ext.create('Ext.container.Container',
        Object.assign({}, rowContainerConfig, {
            items: [{
                html: i18n.groups_access,
                bodyStyle: 'border:0 none; font-weight: bold'
            }]
        })
    );

    userRowContainer = Ext.create('Ext.container.Container',
        Object.assign({}, rowContainerConfig, {
            items: [{
                html: i18n.users_access,
                bodyStyle: 'border:0 none; font-weight: bold'
            }]
        })
    );

    if (sharing.meta.allowExternalAccess) {
        externalAccess = sharingContainer.add({
            xtype: 'checkbox',
            fieldLabel: i18n.allow_external_access,
            labelSeparator: '',
            labelWidth: 250,
            checked: !!sharing.object.externalAccess
        });
    }

    publicGroup = sharingContainer.add(SharingAccessRow({
        id: sharing.object.id,
        name: sharing.object.name,
        access: sharing.object.publicAccess
    }, true, !sharing.meta.allowPublicAccess));

    if (isArray(sharing.object.userGroupAccesses)) {
        sharing.object.userGroupAccesses.forEach(record => {
            userGroupRowContainer.add(SharingAccessRow(record));
        });
    }

    if (isArray(sharing.object.userAccesses)) {
        sharing.object.userAccesses.forEach(record => {
            userRowContainer.add(SharingAccessRow(record));
        });
    }

    items = [
        {
            html: sharing.object.name,
            bodyStyle: 'border:0 none; font-weight:bold; color:#333',
            style: 'margin-bottom:7px'
        },
        {
            xtype: 'container',
            layout: 'column',
            bodyStyle: 'border:0 none',
            items: [
                sharingField,
                sharingButton
            ]
        },
        {
            html: i18n.created_by + ' ' + sharing.object.user.name,
            bodyStyle: 'border:0 none; color:#777',
            style: 'margin-top:2px;margin-bottom:7px'
        },
        sharingContainer,
        userGroupRowContainer,
        userRowContainer
    ];

    if (configOnly) {
        return {
            SharingAccessRow,
            getBody,
            sharingStore,
            sharingField,
            sharingButton,
            userGroupRowContainer,
            userRowContainer,
            externalAccess,
            publicGroup,
            items
        };
    }
    else {
        window = Ext.create('Ext.window.Window', {
            title: i18n.sharing_settings,
            bodyStyle: 'padding:5px 5px 3px; background-color:#fff',
            resizable: false,
            modal: true,
            destroyOnBlur: true,
            items: items,
            bbar: [
                '->',
                {
                    text: i18n.save,
                    handler: function() {
                        Ext.Ajax.request({
                            url: encodeURI(apiPath + '/sharing?type=' + instanceManager.apiResource + '&id=' + sharing.object.id),
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            params: Ext.encode(getBody()),
                            success: function() {
                                instanceManager.getById(null, function(layout, isFavorite) {
                                    instanceManager.getReport(layout, isFavorite, false, false, function() {
                                        uiManager.unmask();
                                    });
                                });
                            }
                        });

                        window.destroy();
                    }
                }
            ],
            listeners: {
                show: function(w) {
                    var favoriteWindow = uiManager.get('favoriteWindow');

                    if (favoriteWindow && favoriteWindow.rendered) {

                        // position
                        var x = ((favoriteWindow.getWidth() - w.getWidth()) / 2) + favoriteWindow.getPosition()[0],
                            y = w.getPosition()[1] / 3;

                        w.setPosition(x, y);

                        // blur
                        favoriteWindow.destroyOnBlur = false;
                    }
                    else {
                        uiManager.setAnchorPosition(w, 'favoriteButton');
                    }

                    if (!w.hasDestroyOnBlurHandler) {
                        uiManager.addDestroyOnBlurHandler(w);
                    }
                },
                destroy: function() {
                    var favoriteWindow = uiManager.get('favoriteWindow');

                    if (favoriteWindow) {
                        favoriteWindow.destroyOnBlur = true;
                    }
                }
            }
        });

        return window;
    }
};
