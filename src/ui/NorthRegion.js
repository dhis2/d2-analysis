import { AboutWindow } from './AboutWindow';
import { DateManager } from '../manager/DateManager.js';

export var NorthRegion;

NorthRegion = function(c, cmpConfig) {
    var appManager = c.appManager,
        instanceManager = c.instanceManager,
        uiManager = c.uiManager,
        i18nManager = c.i18nManager,
        i18n = i18nManager.get(),
        path = appManager.getPath();

    // component
    cmpConfig = cmpConfig || {};

    cmpConfig.appName = appManager.appName || '';

    cmpConfig.i18n = cmpConfig.i18n || {};
    cmpConfig.i18n.about = cmpConfig.i18n.about || i18n.about || 'about';
    cmpConfig.i18n.home = cmpConfig.i18n.home || i18n.home || 'home';
    cmpConfig.i18n.untitled = cmpConfig.i18n.untitled || i18n.untitled || 'Untitled';

    cmpConfig.theme = cmpConfig.theme || uiManager.getTheme();
    cmpConfig.systemTitle =
        cmpConfig.systemTitle || appManager.systemSettings.systemTitle || 'DHIS 2';
    cmpConfig.logoWidth = cmpConfig.logoWidth ? parseFloat(cmpConfig.logoWidth) : 418;
    cmpConfig.aboutFn =
        cmpConfig.aboutFn ||
        function() {
            AboutWindow(c).getData();
        };
    cmpConfig.homeFn =
        cmpConfig.homeFn ||
        function() {
            var dest = path + '/dhis-web-commons-about/redirect.action';

            if (instanceManager.isStateUnsaved()) {
                uiManager.confirmUnsaved(i18n.leave_application, function() {
                    uiManager.disableConfirmUnload();
                    window.location.href = dest;
                });
            } else {
                window.location.href = dest;
            }
        };

    var cmp = {};

    var setLogoWidth = function(width, append) {
        width = width || cmpConfig.logoWidth;
        append = append || 0;

        cmp.logo.setWidth(width + append);
    };

    var setState = function(layout, isFavorite) {
        cmp.title.setState(layout, isFavorite);
    };

    return Ext.create('Ext.toolbar.Toolbar', {
        componentCls: 'toolbar-north',
        region: 'north',
        cls: cmpConfig.theme + ' ' + cmpConfig.cls,
        cmp: cmp,
        setLogoWidth: setLogoWidth,
        setState: setState,
        items: (function() {
            var defaultTitleText = cmpConfig.i18n.untitled;

            cmp.logo = Ext.create('Ext.toolbar.TextItem', {
                cls: 'logo',
                width: cmpConfig.logoWidth,
                html:
                    '<span class="brand">' + cmpConfig.systemTitle + '</span> ' + cmpConfig.appName,
            });

            cmp.title = Ext.create('Ext.toolbar.TextItem', {
                cls: 'title untitled user-select',
                titleText: '',
                appendixText: '',
                text: defaultTitleText,
                updateTitle: function() {
                    this.update(
                        this.titleText ? this.titleText + this.appendixText : defaultTitleText
                    );
                },
                setTitle: function(name) {
                    this.titleText = name || '';
                    //this.updateTitle();
                },
                setTitleAppendix: function(text) {
                    this.appendixText = text
                        ? '<span class="appendix">[' +
                          DateManager.getYYYYMMDD(text, true) +
                          ']</span>'
                        : '';
                    //this.updateTitle();
                },
                setStateSaved: function() {
                    this.getEl().removeCls('unsaved');
                    this.getEl().removeCls('untitled');
                },
                setStateUnsaved: function() {
                    if (this.titleText) {
                        this.getEl().removeCls('untitled');
                        this.getEl().addCls('unsaved');
                    }
                },
                setStateNew: function() {
                    this.getEl().removeCls('unsaved');
                    this.getEl().addCls('untitled');
                },
                setState: function(layout, isFavorite) {
                    if (layout) {
                        if (isFavorite && layout.displayName) {
                            this.setTitle(layout.displayName);
                            this.setTitleAppendix(layout.relativePeriodDate);
                            this.setStateSaved();
                        } else {
                            this.setTitleAppendix();
                            this.setStateUnsaved();
                        }
                    } else {
                        this.setTitle();
                        this.setTitleAppendix();
                        this.setStateNew();
                    }

                    this.updateTitle();
                },
            });

            uiManager.reg(
                (cmp.about = Ext.create('Ext.toolbar.TextItem', {
                    cls: 'about',
                    html: cmpConfig.i18n.about,
                    listeners: {
                        render: function(ti) {
                            var el = ti.getEl();

                            el.on('mouseover', function() {
                                el.addCls('hover');
                            });

                            el.on('mouseout', function() {
                                el.removeCls('hover');
                            });

                            el.on('click', function() {
                                cmpConfig.aboutFn();
                            });

                            el.rendered = true;
                        },
                    },
                })),
                'aboutButton'
            );

            uiManager.reg(
                (cmp.home = Ext.create('Ext.toolbar.TextItem', {
                    cls: 'about home',
                    html: cmpConfig.i18n.home,
                    listeners: {
                        render: function(ti) {
                            var el = ti.getEl();

                            el.on('mouseover', function() {
                                el.addCls('hover');
                            });

                            el.on('mouseout', function() {
                                el.removeCls('hover');
                            });

                            el.on('click', function() {
                                cmpConfig.homeFn();
                            });

                            el.rendered = true;
                        },
                    },
                })),
                'homeButton'
            );

            return [cmp.logo, cmp.title, '->', cmp.about, cmp.home, ' ', ' '];
        })(),
    });
};
