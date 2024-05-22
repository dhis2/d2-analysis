import getFavoriteTextCmp from './FavoriteTextCmp';

export var RenameWindow;

RenameWindow = function(refs, layout, fn, listeners) {
    var t = this,

        appManager = refs.appManager,
        uiManager = refs.uiManager,
        instanceManager = refs.instanceManager,
        i18n = refs.i18nManager.get(),
        api = refs.api,

        apiPath = appManager.getApiPath(),
        apiEndpoint = instanceManager.apiEndpoint;

    listeners = listeners || {};

    const { nameTextField, descriptionTextField } = getFavoriteTextCmp({ layout, i18n });

    var renameButton = Ext.create('Ext.button.Button', {
        text: i18n.update,
        handler: function() {
            var name = nameTextField.getValue(),
                description = descriptionTextField.getValue(),
                patch = function() {
                    var properties = {
                        name: name,
                        description: description
                    };

                    layout.apply(properties);

                    layout.patch(properties, function() {
                        if (fn) {
                            fn();
                        }
                        instanceManager.getById(null, function(layout, isFavorite) {
                            instanceManager.getReport(layout, isFavorite, false, false, function() {
                                uiManager.unmask();
                            });
                        });
                        window.destroy();
                    }, true, true);
                };

            if (layout.patch) {
                patch();
            }
            else {
                var fields = appManager.getAnalysisFields(),
                    url = apiPath + '/' + apiEndpoint + '/' + layout.id + '.json?fields=' + fields;

                $.getJSON(encodeURI(url), function(r) {
                    layout = new api.Layout(refs, r).val();
                    patch();
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
        items: [
            nameTextField,
            descriptionTextField
        ],
        destroyOnBlur: true,
        bbar: [
            cancelButton,
            '->',
            renameButton
        ],
        listeners: {
            show: function(w) {
                var favoriteButton = uiManager.get('favoriteButton') || {};

                if (favoriteButton.rendered) {
                    uiManager.setAnchorPosition(w, favoriteButton);

                    if (!w.hasDestroyOnBlurHandler) {
                        uiManager.addDestroyOnBlurHandler(w);
                    }
                }

                nameTextField.focus(false, 500);

                if (listeners.show) {
                    listeners.show();
                }
            },
            destroy: function() {
                if (listeners.destroy) {
                    listeners.destroy();
                }
            }
        }
    });

    return window;
};
