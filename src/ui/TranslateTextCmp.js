import getFavoriteTextCmp from './FavoriteTextCmp';

export default function({ layout, i18n }) {

    // Load Favorite textfield
    const { nameTextField, descriptionTextField, titleTextField } = getFavoriteTextCmp({ layout, i18n });

    // Customise them for translate Panel
    delete nameTextField.height;
    delete titleTextField.height;
    delete descriptionTextField.height;

    nameTextField.emptyText = i18n.no_translation_for_name;

    if (!layout.title) {
        titleTextField['disabled'] = true;
        titleTextField.emptyText = i18n.no_title;
    }
    else {
        titleTextField.emptyText = i18n.no_translation_for_title;
    }

    if (!layout.description) {
        descriptionTextField['disabled'] = true;
        descriptionTextField.emptyText = i18n.no_description;
    }
    else {
        descriptionTextField.emptyText = i18n.no_translation_for_description;
    }

    // Create labels for keys
    var getLabelKey = function(text) {
        return Ext.create('Ext.panel.Panel', {
            style: 'margin-bottom:0',
            bodyStyle: 'font-size:11px; color:#666; padding-left:6px; padding-top:3px; border:0 none',
            html: text
        });
    };

    const nameLabelKey = getLabelKey(layout.name);
    const titleLabelKey = getLabelKey(layout.title);
    const descriptionLabelKey = getLabelKey(layout.description);

    return {
        nameTextField,
        nameLabelKey,
        titleTextField,
        titleLabelKey,
        descriptionTextField,
        descriptionLabelKey
    };
}
