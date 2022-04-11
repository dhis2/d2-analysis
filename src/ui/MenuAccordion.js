import {isObject, arrayTo} from 'd2-utilizr';

export var MenuAccordion;

MenuAccordion = function(config) {
    var t = this;

    const tabHeight = 28;

    config = isObject(config) ? config : {};
    t.tabs = config.items;

    // items
    t.accordionBody = Ext.create('Ext.panel.Panel', {
        layout: 'accordion',
        activeOnTop: true,
        cls: 'ns-accordion',
        bodyStyle: 'border:0 none; margin-bottom:2px',
        height: 700,
        items: config.items
    });

    // constructor
    $.extend(this, Ext.create('Ext.panel.Panel', {
        bodyStyle: 'border-style:none; padding:1px; padding-bottom:0; overflow-y:scroll;',
        items: t.accordionBody
    }));

    // references
    t.uiManager = MenuAccordion.uiManager;
    t.uiConfig = MenuAccordion.uiConfig;
};

MenuAccordion.prototype.setThisHeight = function(mx) {
    var t = this,
        panelHeight = this.tabs.length * this.tabHeight,
        height;

    if (this.uiManager.hasWestRegionScrollbar) {
        height = panelHeight + mx;
        this.setHeight(t.uiManager.getHeight() - 2);
        this.accordionBody.setHeight(height - 2);
    }
    else {
        height = t.uiManager.getHeight() - this.uiConfig.west_fill;
        mx += panelHeight;
        this.setHeight((height > mx ? mx : height) - 2);
        this.accordionBody.setHeight((height > mx ? mx : height) - 2);
    }
};

MenuAccordion.prototype.getExpandedTab = function() {
    this.tabs.forEach(function(tab) {
        if (!tab.collapsed) {
            return tab;
        }
    });

    return null;
};

MenuAccordion.prototype.getFirstPanel = function() {
    return this.tabs[0];
};

MenuAccordion.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.menuAccordion = t;
    });
};
