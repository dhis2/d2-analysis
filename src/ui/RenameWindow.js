import isArray from 'd2-utilizr/lib/isArray';

import {Layout} from '../api/Layout.js';

export var RenameWindow;

RenameWindow = function(c, layout, fn, listeners) {
    var t = this,

        appManager = c.appManager,
        uiManager = c.uiManager,
        instanceManager = c.instanceManager,
        i18n = c.i18nManager.get(),
        uiConfig = c.uiConfig,

        path = appManager.getPath(),
        apiResource = instanceManager.getApiResource();

    listeners = listeners || {};

    var nameTextfield = Ext.create('Ext.form.field.Text', {
        height: 26,
        width: 496 - 5,
        fieldStyle: 'padding-left: 4px; border-radius: 1px; border-color: #bbb; font-size:11px',
        style: 'margin-bottom:0',
        emptyText: 'Favorite name',
        value: layout.name,
        listeners: {
            afterrender: function() {
                this.focus();
            }
        }
    });

    var renameButton = Ext.create('Ext.button.Button', {
        text: i18n.rename,
        handler: function() {
            var name = nameTextfield.getValue(),
                put = function() {
                    layout.clone().put(function() {
                        if (fn) {
                            fn();
                        }
                        instanceManager.setStateIf(layout, true);
                        window.destroy();
                    }, true, true);
                };

            if (layout.put) {
                put();
            }
            else {
                var fields = appManager.getAnalysisFields(),
                    url = path + '/api/' + apiResource + '/' + layout.id + '.json?fields=' + fields;

                $.getJSON(url, function(r) {
                    layout = new Layout(r);
                    layout.name = name;

                    put();
                });
            }
        }
    });

    var cancelButton = Ext.create('Ext.button.Button', {
        text: i18n.cancel,
        handler: function() {
            window.destroy();
        }
    });

    var window = Ext.create('Ext.window.Window', {
        title: id ? 'Rename favorite' : 'Create new favorite',
        bodyStyle: 'padding:1px; background:#fff',
        resizable: false,
        modal: true,
        items: nameTextfield,
        destroyOnBlur: true,
        bbar: [
            cancelButton,
            '->',
            renameButton
        ],
        listeners: {
            show: function(w) {
                if (!w.hasDestroyOnBlurHandler) {
                    uiManager.addDestroyOnBlurHandler(w);
                }

                nameTextfield.focus(false, 500);

                if (listeners.onShow) {
                    listeners.onShow();
                }
            },
            destroy: function() {
                if (listeners.onDestroy) {
                    listeners.onDestroy();
                }
            }
        }
    });

    return window;
};
