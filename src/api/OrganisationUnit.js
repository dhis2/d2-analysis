import arrayFrom from 'd2-utilizr/lib/arrayFrom';

export var OrganisationUnit;

OrganisationUnit = function(config, refs) {
    var t = this;

    t.id = config.id;
    t.refs = refs;
    t.i18n = refs.i18nManager.get();

    // dynamic
    t.ancestors = [];
    t.level = null;
};

OrganisationUnit.prototype.getLevel = function() {
    return this.level;
};

OrganisationUnit.prototype.setLevel = function(level) {
    this.level = level;
};

OrganisationUnit.prototype.getAncestors = function() {
    return this.ancestors;
};

OrganisationUnit.prototype.setAncestors = function(ancestors) {
    this.ancestors = arrayFrom(ancestors);
};

OrganisationUnit.prototype.getInstanceManager = function() {
    return this.refs.instanceManager;
};

OrganisationUnit.prototype.getAppManager = function() {
    return this.refs.appManager;
};

OrganisationUnit.prototype.getUpperLevels = function() {
    return this.getAncestors();
};

// dep 1

OrganisationUnit.prototype.getAncestorsRequest = function(callback) {
    const { Request } = this.refs.api;

    const request = new Request(refs, {
        baseUrl: this.getAppManager().getApiPath() + '/organisationUnits/' + this.id + '.json',
        type: 'json',
        success: callback,
        params: [
            'fields=id,level,ancestors[id,level,displayName~rename(name)]',
            'paging=false'
        ],
    });

    request.run();
};

OrganisationUnit.prototype.getOrganisationUnitLevels = function() {
    return this.getAppManager().organisationUnitLevels;
};

OrganisationUnit.prototype.getResponse = function() {
    return this.getInstanceManager().getStateCurrent().getResponse();
};

// dep 2

OrganisationUnit.prototype.getName = function() {
    return this.getResponse().getNameById(this.id);
};

// dep 3

OrganisationUnit.prototype.getSublevels = function() {
    const level = this.getLevel();

    let sublevels = this.getOrganisationUnitLevels().filter(ou => {
        return ou.level > level;
    });

    sublevels = sublevels.map(ou => {
        return {
            id: this.id + ';' + 'LEVEL-' + ou.level,
            name: ou.name.toLowerCase()
        }
    });

    return sublevels;
};

// dep 4

OrganisationUnit.prototype.getContextMenuItemsConfig = function() {
    // fun goes here
    const items = [];

    const sublevels = this.getSublevels();
    const upperLevels = this.getUpperLevels();
    const current = {
        id: this.id,
        name: this.getName(),
        level: this.getLevel()
    };

    // generate upper levels
    if (upperLevels.length > 0) {
        items.push({
            isSubtitle: true,
            style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
            html: this.i18n.drill_up
        });

        upperLevels.forEach(ou => {
            items.push({
                items: [{ id: ou.id }],
                text: 'Show <span class="name">' + ou.name + '</span>',
                iconCls: 'ns-menu-item-float'
            });
        });
    }

    // generate menu item for current level
    items.push({
        isSubtitle: true,
        style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
        html: current.name
    });

    items.push({
        items: [{ id: current.id }],
        text: 'Show only <span class="name">' + current.name +'</span>',
        iconCls: 'ns-menu-item-float'
    });

    // generate menu items for sublevels
    if (sublevels.length > 0) {
        items.push({
            isSubtitle: true,
            style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
            html: this.i18n.drill_down
        });

        sublevels.forEach(ou => {
            items.push({
                items: [{ id: ou.id }],
                text: 'Show all <span class="name">' + ou.name + ' units</span>',
                iconCls: 'ns-menu-item-float'
            });
        });
    }

    return items;
};
