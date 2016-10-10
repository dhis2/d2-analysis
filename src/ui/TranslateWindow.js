import isArray from 'd2-utilizr/lib/isArray';

import getFavoriteTextCmp from './FavoriteTextCmp';
import fs from './FavoriteStyle';

export var TranslateWindow;

TranslateWindow = function(refs, layout, fn, listeners) {
    var t = this,

        appManager = refs.appManager,
        uiManager = refs.uiManager,
        instanceManager = refs.instanceManager,
        i18n = refs.i18nManager.get(),
        uiConfig = refs.uiConfig,
        api = refs.api,

        path = appManager.getPath(),
        apiResource = instanceManager.apiResource;

    listeners = listeners || {};

    const { nameTextField, titleTextField, descriptionTextField } = getFavoriteTextCmp({ layout, i18n });

    nameTextField["hidden"] = true;
    titleTextField["hidden"] = true;
    descriptionTextField["hidden"] = true;

    var translations = {};

    var onEventLocaleSelect = function(localeId){
         console.log(localeId);
        if (localeId in translations) {

        }
        else{
            nameTextField.setValue("");
            titleTextField.setValue("");
            descriptionTextField.setValue("");
        }

        nameTextField.show();
        titleTextField.show();
        descriptionTextField.show();

    };

    var localeStore = Ext.create('Ext.data.Store', {
        fields: ['locale', 'name'],
        proxy: {
            type: 'ajax',
            url: encodeURI(path + '/api/locales/db.json?paging=false'),
            reader: {
                type: 'json'
            },
            pageParam: false,
            startParam: false,
            limitParam: false
        }
    });

    var localeComboBox = Ext.create('Ext.form.ComboBox', {
        fieldLabel: 'Select a locale to enter translations for ',
        store: localeStore,
        queryMode: 'local',
        displayField: 'name',
        valueField: 'locale',
        emptyText: i18n.select_locale,
        listeners: {
            select: function(locale) {
                onEventLocaleSelect(locale.getValue());
            }
        }
    });

    var saveButton = Ext.create('Ext.button.Button', {
        text: i18n.save,
        handler: function() {
            var name = nameTextField.getValue(),
                title = titleTextField.getValue(),
                description = descriptionTextField.getValue();

            var newTranslations = [];

            var translation = {
                property: 'NAME',
                locale: localeComboBox.getValue(),
                value: name
            };

            newTranslations.push(translation);

            var payloadTranslations = {"translations": newTranslations}

            $.ajax({
                url: encodeURI(path + '/api/' + apiResource + '/' + layout.id + '/translations/'),
                type: 'PUT',
                data: JSON.stringify(payloadTranslations),
                dataType: 'json',
                headers: appManager.defaultRequestHeaders,
                success: function(obj, success, r) {
                    console.log('taka')
                },
                error: function(obj, success, r) {
                    console.log(obj)
                    console.log(success)
                    console.log(r)
                }
            });
           
        }
    });

    var cancelButton = Ext.create('Ext.button.Button', {
        text: i18n.cancel,
        handler: function() {
            window.destroy();
        }
    });

    var window = Ext.create('Ext.window.Window', {
        title: 'Translate',
        bodyStyle: 'padding:1px; background:#fff',
        resizable: false,
        modal: true,
        items: [
            localeComboBox,
            nameTextField,
            titleTextField,
            descriptionTextField
        ],
        destroyOnBlur: true,
        bbar: [
            cancelButton,
            '->',
            saveButton
        ],
        listeners: {
            show: function(w) {
                localeStore.load();

                //TODO: Can we get translations from the endpoint? 
                Ext.Ajax.request({
                    url: encodeURI(path + '/api/' + apiResource + '/' + layout.id + '.json?fields=translations&paging=false'),
                    disableCaching: false,
                    success: function(r) {
                       translations = Ext.decode(r.responseText).translations
                    }
                });


                var favoriteButton = uiManager.get('favoriteButton') || {};

                if (favoriteButton.rendered) {
                    uiManager.setAnchorPosition(w, favoriteButton);

                    if (!w.hasDestroyOnBlurHandler) {
                        uiManager.addDestroyOnBlurHandler(w);
                    }
                }

                //nameTextField.focus(false, 500);

                if (listeners.show) {
                    listeners.show();
                }
            },
            destroy: function() {
                if (listeners.destroy) {
                    listeners.destroy();
                }
            }
        }
    });

    return window;
};
