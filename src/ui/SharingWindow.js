import isArray from 'd2-utilizr/lib/isArray';

export var SharingWindow;

SharingWindow = function(c, sharing) {
    var t = this,

        appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get(),
        uiConfig = c.uiConfig,

        path = appManager.getPath(),

        favoriteWindow = uiManager.get('favoriteWindow');

    var UserGroupRow,

        getBody,

        userGroupStore,
        userGroupField,
        userGroupButton,
        userGroupRowContainer,
        externalAccess,
        publicGroup,
        window;

    UserGroupRow = function(obj, isPublicAccess, disallowPublicAccess) {
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
                items.push(Ext.create('Ext.Img', {
                    src: 'images/grid-delete_16.png',
                    style: 'margin-top:2px; margin-left:7px',
                    overCls: 'pointer',
                    width: 16,
                    height: 16,
                    listeners: {
                        render: function(i) {
                            i.getEl().on('click', function(e) {
                                i.up('panel').destroy();
                                window.doLayout();
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
            for (var i = 1, item; i < userGroupRowContainer.items.items.length; i++) {
                item = userGroupRowContainer.items.items[i];
                body.object.userGroupAccesses.push(item.getAccess());
            }
        }

        return body;
    };

    // Initialize
    userGroupStore = Ext.create('Ext.data.Store', {
        fields: ['id', 'name'],
        proxy: {
            type: 'ajax',
            url: path + '/api/sharing/search',
            extraParams: {
                pageSize: 50
            },
            startParam: false,
            limitParam: false,
            reader: {
                type: 'json',
                root: 'userGroups'
            }
        }
    });

    userGroupField = Ext.create('Ext.form.field.ComboBox', {
        valueField: 'id',
        displayField: 'name',
        emptyText: i18n.search_for_user_groups,
        queryParam: 'key',
        queryDelay: 200,
        minChars: 1,
        hideTrigger: true,
        fieldStyle: 'height:26px; padding-left:6px; border-radius:1px; font-size:11px',
        style: 'margin-bottom:5px',
        width: 380,
        store: userGroupStore,
        listeners: {
            beforeselect: function(cb) { // beforeselect instead of select, fires regardless of currently selected item
                userGroupButton.enable();
            },
            afterrender: function(cb) {
                cb.inputEl.on('keyup', function() {
                    userGroupButton.disable();
                });
            }
        }
    });

    userGroupButton = Ext.create('Ext.button.Button', {
        text: '+',
        style: 'margin-left:2px; padding-right:4px; padding-left:4px; border-radius:1px',
        disabled: true,
        height: 26,
        handler: function(b) {
            userGroupRowContainer.add(UserGroupRow({
                id: userGroupField.getValue(),
                name: userGroupField.getRawValue(),
                access: 'r-------'
            }));

            userGroupField.clearValue();
            b.disable();
        }
    });

    userGroupRowContainer = Ext.create('Ext.container.Container', {
        bodyStyle: 'border:0 none'
    });

    if (sharing.meta.allowExternalAccess) {
        externalAccess = userGroupRowContainer.add({
            xtype: 'checkbox',
            fieldLabel: i18n.allow_external_access,
            labelSeparator: '',
            labelWidth: 250,
            checked: !!sharing.object.externalAccess
        });
    }

    publicGroup = userGroupRowContainer.add(UserGroupRow({
        id: sharing.object.id,
        name: sharing.object.name,
        access: sharing.object.publicAccess
    }, true, !sharing.meta.allowPublicAccess));

    if (isArray(sharing.object.userGroupAccesses)) {
        for (var i = 0, userGroupRow; i < sharing.object.userGroupAccesses.length; i++) {
            userGroupRow = UserGroupRow(sharing.object.userGroupAccesses[i]);
            userGroupRowContainer.add(userGroupRow);
        }
    }

    window = Ext.create('Ext.window.Window', {
        title: i18n.sharing_settings,
        bodyStyle: 'padding:5px 5px 3px; background-color:#fff',
        resizable: false,
        modal: true,
        destroyOnBlur: true,
        items: [
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
                    userGroupField,
                    userGroupButton
                ]
            },
            {
                html: i18n.created_by + ' ' + sharing.object.user.name,
                bodyStyle: 'border:0 none; color:#777',
                style: 'margin-top:2px;margin-bottom:7px'
            },
            userGroupRowContainer
        ],
        bbar: [
            '->',
            {
                text: i18n.save,
                handler: function() {
                    Ext.Ajax.request({
                        url: path + '/api/sharing?type=reportTable&id=' + sharing.object.id,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        params: Ext.encode(getBody())
                    });

                    window.destroy();
                }
            }
        ],
        listeners: {
            show: function(w) {
                var xy = favoriteWindow.getPosition();
                w.setPosition(xy[0] + 5, xy[1] + 5);

                if (!w.hasDestroyOnBlurHandler) {
                    uiManager.addDestroyOnBlurHandler(w);
                }

                favoriteWindow.destroyOnBlur = false;
            },
            destroy: function() {
                favoriteWindow.destroyOnBlur = true;
            }
        }
    });

    return window;
};
