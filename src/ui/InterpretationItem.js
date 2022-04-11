import {InterpretationWindow} from './InterpretationWindow';

export var InterpretationItem;

InterpretationItem = function(c) {
    var instanceManager = c.instanceManager,
        i18nManager = c.i18nManager,

        i18n = c.i18nManager.get();

    return Ext.create('Ext.menu.Item', {
        text: i18n.write_interpretation + '&nbsp;&nbsp;',
        iconCls: 'ns-menu-item-tablelayout',
        disabled: true,
        xable: function() {
            this.setDisabled(!instanceManager.isStateSaved());
        },
        handler: function() {
            InterpretationWindow(c).show();
        }
    });
};
