export var NorthRegion;

NorthRegion = function(c, tbConf) {
    var t = this;
    var appManager = c.appManager;

    var cmp = {};

    var defaultValues = {
        logoWidth: 418
    };

    var getDefaultConfig = function(config) {
        config = config || {};

        config.i18n = config.i18n || {};
        config.i18n.about = config.i18n.about || 'About';
        config.i18n.home = config.i18n.home || 'Home';

        config.theme = config.theme || '';
        config.brandName = config.brandName || 'DHIS2';
        config.appName = config.appName || 'PIVOT TABLES';
        config.logoWidth = config.logoWidth ? parseFloat(config.logoWidth) : defaultValues.logoWidth;
        config.aboutFn = config.aboutFn || function() {};
        config.homeFn = config.homeFn || function() {
            window.location.href = appManager.getPath() +  '/dhis-web-commons-about/redirect.action';
        };

        return config;
    };

    var setLogoWidth = function(width, append) {
        width = width || this.defaultValues.logoWidth;
        append = append || 0;

        this.cmp.logo.setWidth(width + append);
    };

    var setTitle = function(name) {
        cmp.title.setTitle(name);
        cmp.title.setSaved();
    };

    return Ext.create('Ext.toolbar.Toolbar', {
        componentCls: 'toolbar-north',
        region: 'north',

        cls: tbConf.cls,
        cmp: cmp,
        setLogoWidth: setLogoWidth,
        setTitle: setTitle,
        items: function() {
            var config = getDefaultConfig(tbConf.config);

            cmp.logo = Ext.create('Ext.toolbar.TextItem', {
                cls: 'logo',
                width: config.logoWidth,
                html: '<span class="brand">' + config.brandName + '</span> ' + config.appName
            });

            cmp.title = Ext.create('Ext.toolbar.TextItem', {
                cls: 'title',
                html: '&nbsp;',
                titleValue: null,
                setTitle: function(name) {
                    this.titleValue = name;
                    this.update(this.titleValue);
                },
                setSaved: function() {
                    this.update(this.titleValue);
                    this.getEl().removeCls('unsaved');
                },
                setUnsaved: function() {
                    this.update('* ' + this.titleValue);
                    this.getEl().addCls('unsaved');
                }
            });

            cmp.about = Ext.create('Ext.toolbar.TextItem', {
                cls: 'about',
                html: 'ABOUT',
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
                            config.aboutFn();
                        });
                    }
                }
            });

            cmp.home = Ext.create('Ext.toolbar.TextItem', {
                cls: 'about home',
                html: 'HOME',
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
                            config.homeFn();
                        });
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

