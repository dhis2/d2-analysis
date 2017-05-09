import style from './Style';

const SubtitleContainer = function (refs) {
    const i18n = refs.i18nManager.get();

    const container = Ext.create('Ext.container.Container', {
        layout: 'column',
        bodyStyle: 'border:0 none; padding-bottom:1px',
    });

    container.hideSubtitleCheckbox = Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.hide_chart_subtitle,
        style: `margin-bottom:${ style.checkboxBottomMargin }px; margin-right:5px`,
        width: 125,
        listeners: {
            change: function () {
                container.subtitleInput.xable();
            }
        }
    });

    container.subtitleInput = Ext.create('Ext.form.field.Text', {
        width: style.cmpWidth - style.labelWidth,
        emptyText: i18n.chart_subtitle,
        maxLength: 100,
        enforceMaxLength: true,
        style: 'margin-bottom:0',
        xable: function () {
            this.setDisabled(container.hideSubtitleCheckbox.getValue());
        }
    });

    container.add([
        container.hideSubtitleCheckbox,
        container.subtitleInput
    ]);

    return container;
};

export {
    SubtitleContainer
};

export default SubtitleContainer;
