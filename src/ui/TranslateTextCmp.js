import getFavoriteTextCmp from './FavoriteTextCmp';

export default function({ layout, i18n }) {

    // Load Favorite textfield
    const { nameTextField, titleTextField, descriptionTextField } = getFavoriteTextCmp({ layout, i18n });
    
    // Customise them for translate Panel
    delete nameTextField.height;
    delete titleTextField.height;
    delete descriptionTextField.height;

    titleTextField.emptyText = 'No title';
    descriptionTextField.emptyText = 'No description';

    // Create labels for keys
    var getLabelKey = function(text) {
        return Ext.create('Ext.form.Label', {
            style: 'font-size: 11px;color: #111;padding-left: 7px;padding-top: 4px;margin-bottom: 0',
            text: text
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
