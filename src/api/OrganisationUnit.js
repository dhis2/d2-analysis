import arrayFrom from 'd2-utilizr/lib/arrayFrom';

export var OrganisationUnit;

OrganisationUnit = function(refs, config) {
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

OrganisationUnit.prototype.getAncestorsRequest = function(shouldRun) {
    const { Request } = this.refs.api;

    const request = new Request(refs, {
        baseUrl: this.getAppManager().getApiPath() + '/organisationUnits/' + this.id + '.json',
        type: 'json',
        params: [
            'fields=id,level,ancestors[id,level,displayName~rename(name)]',
            'paging=false'
        ],
    });

    return shouldRun ? request.run() : request;
};

OrganisationUnit.prototype.getOrganisationUnitLevels = function() {
    return this.getAppManager().organisationUnitLevels;
};

OrganisationUnit.prototype.getResponse = function() {
    return this.getInstanceManager().getStateCurrent().getResponse();
};

OrganisationUnit.prototype.getRootAncestor = function() {
    const sorted = this.getAncestors().slice().sort((a, b) => a.level > b.level);

    return sorted.length ? sorted[0] : this;
};

OrganisationUnit.prototype.getParent = function() {
    const ancestors = this.getAncestors().slice().sort((a, b) => a.level > b.level);

    return ancestors.length ? ancestors[ancestors.length - 1] : null;
};

// dep 2

OrganisationUnit.prototype.getHierarchyName = function() {
    return this.getOrganisationUnitLevels().find(ou => ou.level === this.getLevel()).name;
};

OrganisationUnit.prototype.isRoot = function() {
    const ancestor = this.getRootAncestor();

    return ancestor ? this.getLevel() === ancestor.level : false;
};

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
            id: this.id,
            name: ou.name.toLowerCase(),
            level: ou.level
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
        html: this.getHierarchyName()
    });

    items.push({
        items: [{ id: this.id }],
        text: 'Show only <span class="name">' + this.getName() +'</span>',
        iconCls: 'ns-menu-item-float'
    });

    if (this.getParent()) {
        items.push({
            items: [{ id: this.getParent().id + ';LEVEL-' + this.getLevel() }],
            text: 'Show all <span class="name">' + this.getHierarchyName() + ' units in ' + this.getParent().name + '</span>',
            iconCls: 'ns-menu-item-float'
        });
    }


    // generate menu items for sublevels
    if (sublevels.length > 0) {
        const root = this.getRootAncestor();

        items.push({
            isSubtitle: true,
            style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
            html: this.i18n.drill_down
        });


        sublevels.forEach(ou => {
            items.push({
                items: [{ id: ou.id + ';' + 'LEVEL-' + ou.level }],
                text: 'Show all <span class="name">' + ou.name.toLowerCase() + ' units in ' + this.getName() + '</span>',
                iconCls: 'ns-menu-item-float'
            });
        });

        sublevels.forEach(ou => {
            if (root.level !== this.getLevel()) {
                items.push({
                    items: [{ id: root.id + ';' + 'LEVEL-' + ou.level }],
                    text: 'Show all <span class="name">' + ou.name + ' units</span>',
                    iconCls: 'ns-menu-item-float'
                });
            }
        });
    }

    return items;
};
