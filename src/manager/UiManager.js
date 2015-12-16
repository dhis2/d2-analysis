import {arrayTo} from 'd2-utilizr';

export var UiManager;

UiManager = function() {
     var t = this;

    // uninitialized
    t.viewport;
    t.menuRegion;

    // support
    t.getScrollbarSize = function() {
        var size,
            body = document.body,
            div = document.createElement('div');

        div.style.width = div.style.height = '100px';
        div.style.overflow = 'scroll';
        div.style.position = 'absolute';

        body.appendChild(div);

        size = {
            width: div.offsetWidth - div.clientWidth,
            height: div.offsetHeight - div.clientHeight
        };

        body.removeChild(div);

        return size;
    };
};

UiManager.prototype.addViewport = function(viewport) {
    this.viewport = viewport;
};

UiManager.prototype.addMenuRegion = function(viewport) {
    this.viewport = viewport;
};

UiManager.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.uiManager = t;
    });
};
