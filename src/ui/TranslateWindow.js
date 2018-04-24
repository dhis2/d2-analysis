import isArray from 'd2-utilizr/lib/isArray';
import getTranslateTextCmp from './TranslateTextCmp';
import fs from './FavoriteStyle';

export var TranslateWindow;

TranslateWindow = function(refs, layout, fn, listeners) {
    var t = this,
        appManager = refs.appManager,
        uiManager = refs.uiManager,
        instanceManager = refs.instanceManager,
        i18n = refs.i18nManager.get(),
        api = refs.api,
        path = appManager.getPath(),
        apiEndpoint = instanceManager.apiEndpoint;

    listeners = listeners || {};

    const {
        nameTextField,
        nameLabelKey,
        titleTextField,
        titleLabelKey,
        descriptionTextField,
        descriptionLabelKey,
    } = getTranslateTextCmp({ layout, i18n });

    var translations = {};
    var textfieldPropertyMapping = {};

    var onEventLocaleSelect = function() {
        var locale = localeComboBox.getValue();

        // Initialise map between db property and textfield
        textfieldPropertyMapping = {
            NAME: nameTextField,
            SHORT_NAME: titleTextField,
            DESCRIPTION: descriptionTextField,
        };

        // By default set them to empty
        for (var property in textfieldPropertyMapping) {
            textfieldPropertyMapping[property].setValue('');
        }

        // If any value is found, change textfield value
        translations.forEach(function(trn) {
            if (trn.locale === locale) {
                if (trn.property in textfieldPropertyMapping) {
                    textfieldPropertyMapping[trn.property].setValue(trn.value);
                }
            }
        });

        // Display translate Panel
        translatePanel.show();
    };

    var localeStore = Ext.create('Ext.data.Store', {
        fields: ['locale', 'name'],
        proxy: {
            type: 'ajax',
            url: encodeURI(path + '/api/locales/db.json?paging=false'),
            reader: {
                type: 'json',
            },
            pageParam: false,
            startParam: false,
            limitParam: false,
        },
    });

    var localeComboBox = Ext.create('Ext.form.ComboBox', {
        cls: 'ns-combo',
        width: fs.windowCmpWidth,
        height: 45,
        style: 'margin:2px 5px 0',
        fieldStyle:
            'padding-right:0; padding-left:5px; margin-bottom:3px; font-size:11px; line-height:13px;',
        fieldLabel: i18n.select_a_locale_to_enter_translations_for,
        labelAlign: 'top',
        labelStyle: 'font-size:11px;font-weight:bold;color:#111;padding-top:4px;margin-bottom:2px',
        labelSeparator: '',
        store: localeStore,
        queryMode: 'local',
        displayField: 'name',
        valueField: 'locale',
        emptyText: i18n.select_locale,
        listeners: {
            select: function(locale) {
                onEventLocaleSelect();
            },
        },
    });

    var translatePanel = Ext.create('Ext.form.Panel', {
        bodyStyle: 'border-style:none',
        style: 'margin-bottom:0',
        hidden: true,
        defaults: {
            bodyStyle: 'border-style:none',
            style: 'margin-bottom:15px',
        },
        items: [
            {
                items: [nameTextField, nameLabelKey],
            },
            {
                items: [titleTextField, titleLabelKey],
            },
            {
                items: [descriptionTextField, descriptionLabelKey],
            },
        ],
    });

    var saveButton = Ext.create('Ext.button.Button', {
        text: i18n.save,
        handler: function() {
            var locale = localeComboBox.getValue();

            // Remove existing translation for this locale
            var i = translations.length;
            while (i--) {
                if (translations[i].locale == locale) {
                    if (translations[i].property in textfieldPropertyMapping) {
                        translations.splice(i, 1);
                    }
                }
            }

            // Add translation if value is not empyty
            var newTranslations = [].concat(translations);
            for (var property in textfieldPropertyMapping) {
                if (textfieldPropertyMapping[property].getValue() != '') {
                    newTranslations.push({
                        property: property,
                        locale: locale,
                        value: textfieldPropertyMapping[property].getValue(),
                    });
                }
            }

            // Update server with translations
            $.ajax({
                url: encodeURI(path + '/api/' + apiEndpoint + '/' + layout.id + '/translations/'),
                type: 'PUT',
                data: JSON.stringify({ translations: newTranslations }),
                dataType: 'json',
                headers: appManager.defaultRequestHeaders,
                success: function(obj, success, r) {
                    instanceManager.getById(null, function(layout, isFavorite) {
                        instanceManager.getReport(layout, isFavorite, false, false, function() {
                            uiManager.unmask();
                        });
                    });

                    window.destroy();
                },
            });
        },
    });

    var cancelButton = Ext.create('Ext.button.Button', {
        text: i18n.cancel,
        handler: function() {
            window.destroy();
        },
    });

    var window = Ext.create('Ext.window.Window', {
        cls: 'ns-accordion',
        title: 'Translate',
        bodyStyle: 'padding:1px; background:#fff',
        resizable: false,
        modal: true,
        items: [localeComboBox, translatePanel],
        destroyOnBlur: true,
        bbar: [cancelButton, '->', saveButton],
        listeners: {
            show: function(w) {
                // Load locales
                localeStore.load();

                // Load translations for all languages
                Ext.Ajax.request({
                    url: encodeURI(
                        path +
                            '/api/' +
                            apiEndpoint +
                            '/' +
                            layout.id +
                            '/translations.json?paging=false'
                    ),
                    disableCaching: false,
                    success: function(r) {
                        translations = Ext.decode(r.responseText).translations;
                    },
                });

                var favoriteButton = uiManager.get('favoriteButton') || {};

                if (favoriteButton.rendered) {
                    uiManager.setAnchorPosition(w, favoriteButton);

                    if (!w.hasDestroyOnBlurHandler) {
                        uiManager.addDestroyOnBlurHandler(w);
                    }
                }

                localeComboBox.focus(false, 500);

                if (listeners.show) {
                    listeners.show();
                }
            },
            destroy: function() {
                if (listeners.destroy) {
                    listeners.destroy();
                }
            },
        },
    });

    return window;
};
