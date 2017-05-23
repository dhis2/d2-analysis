export var ConfirmButton;

ConfirmButton = function(refs, { type = 'confirm', text = 'OK', fn = Function.prototype, closeFn = Function.prototype, applyConfig = {} }) {
    var i18n = refs.i18nManager.get();
console.log("text: ", text);
    var defaults = {
        padding: '0 3px',
        borderRadius: '2px',
        fontWeight: 'bold',
        btnHeight: 29
        //btnWidth: text ? null : 72
    };

    var typeStyle = {
        'confirm': {
            color: '#fff',
            borderColor: '#3079ed',
            background: '#619dff'
        },
        'close': {
            color: '#555',
            borderColor: '#ccc'
        }
    };

    var style = Object.assign(defaults, typeStyle[type]);

    return Ext.create('Ext.button.Button', Object.assign({
        xtype: 'button',
        //width: defaults.btnWidth,
        height: defaults.btnHeight,
        minWidth: 72,
        text: '<span style="color:' + style.color + '; font-weight:' + style.fontWeight + '; padding:' + style.padding + '">' + text + '</span>',
        style: 'border-color:' + style.borderColor + '; background:' + style.background + '; border-radius:' + style.borderRadius,
        handler: function() {
            fn();
            closeFn();
        }
    }, applyConfig));
};
