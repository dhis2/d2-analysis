import style from './Style';

const TitleContainer = function (refs) {
    const i18n = refs.i18nManager.get();

    const container = Ext.create('Ext.container.Container', {
        layout: 'column',
        style: 'margin-bottom:1px',
        bodyStyle: 'border:0 none',
    });

    container.hideTitleCheckbox = Ext.create('Ext.form.field.Checkbox', {
        boxLabel: i18n.hide_chart_title,
        style: `margin-bottom:${ style.checkboxBottomMargin }px; margin-right: 5px`,
        width: 125,
        listeners: {
            change: function () {
                container.titleInput.xable();
            }
        }
    });

    container.titleInput = Ext.create('Ext.form.field.Text', {
        width: style.cmpWidth - style.labelWidth - 5,
        emptyText: i18n.chart_title,
        maxLength: 100,
        enforceMaxLength: true,
        style: 'margin-bottom:0',
        xable: function () {
            this.setDisabled(container.hideTitleCheckbox.getValue());
        }
    });

    container.add([
        container.hideTitleCheckbox,
        container.titleInput
    ]);

    return container;
};

export {
    TitleContainer
};

export default TitleContainer;
