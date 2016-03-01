import arrayTo from 'd2-utilizr/lib/arrayTo';

export var I18nManager;

I18nManager = function(config) {
    var t = this;

    var translations = config || {};

    // prototype
    t.add = function(obj, force) {
        if (force) {
            translations = obj;
        }
        else {
            $.extend(translations, obj);
        }
    };

    t.get = function(key) {
        return key ? translations[key] : translations;
    };
};

I18nManager.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.i18nManager = t;
    });
};
