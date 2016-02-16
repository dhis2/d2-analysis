import {AboutWindow} from './AboutWindow';

export var NorthRegion;

NorthRegion = function(c, cmpConfig) {
    var appManager = c.appManager,
        uiManager = c.uiManager,
        i18nManager = c.i18nManager,

        i18n = i18nManager.get(),
        path = appManager.getPath();

    // component
    cmpConfig = cmpConfig || {};

    cmpConfig.appName = appManager.appName || '';

    cmpConfig.i18n = cmpConfig.i18n || {};
    cmpConfig.i18n.about = cmpConfig.i18n.about || i18n.about || 'about';
    cmpConfig.i18n.home = cmpConfig.i18n.home || i18n.home || 'home';

    cmpConfig.theme = cmpConfig.theme || uiManager.getTheme();
    cmpConfig.brandName = cmpConfig.brandName || 'DHIS 2';
    cmpConfig.logoWidth = cmpConfig.logoWidth ? parseFloat(cmpConfig.logoWidth) : 418;
    cmpConfig.aboutFn = cmpConfig.aboutFn || function() {
        AboutWindow(c).show();
    };
    cmpConfig.homeFn = cmpConfig.homeFn || function() {
        window.location.href = path +  '/dhis-web-commons-about/redirect.action';
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
        items: function() {
            var defaultTitleText = 'Untitled';

            cmp.logo = Ext.create('Ext.toolbar.TextItem', {
                cls: 'logo',
                width: cmpConfig.logoWidth,
                html: '<span class="brand">' + cmpConfig.brandName + '</span> ' + cmpConfig.appName
            });

            cmp.title = Ext.create('Ext.toolbar.TextItem', {
                cls: 'title untitled user-select',
                //html: '&nbsp;',
                titleText: '',
                text: defaultTitleText,
                setTitle: function(name) {
                    this.titleText = name || defaultTitleText;
                    this.update(this.titleText);
                },
                setSaved: function() {
                    this.getEl().removeCls('unsaved');
                    this.getEl().removeCls('untitled');
                },
                setUnsaved: function() {
                    if (this.titleText) {
                        this.getEl().removeCls('untitled');
						this.getEl().addCls('unsaved');
					}
                },
                setNew: function() {
                    this.getEl().removeCls('unsaved');
                    this.getEl().addCls('untitled');
                },
                setState: function(layout, isFavorite) {
                    if (layout) {
                        if (isFavorite && layout.name) {
                            this.setTitle(layout.name);
                            this.setSaved();
                        }
                        else {
                            this.setUnsaved();
                        }
                    }
                    else {
                        this.setTitle();
                        this.setNew();
                    }
                }
            });

            cmp.about = Ext.create('Ext.toolbar.TextItem', {
                id: 'aboutButton',
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
                    }
                }
            });

            cmp.home = Ext.create('Ext.toolbar.TextItem', {
                id: 'homeButton',
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
                    }
                }
            });

            return [
                cmp.logo,
                cmp.title,
                '->',
                cmp.about,
                cmp.home,
                ' ', ' '
            ];
        }()
    });
};

