import {DateManager} from '../manager/DateManager.js';
import {InterpretationWindow} from './InterpretationWindow.js';
import {SharingWindow} from './SharingWindow.js';
import {RenameWindow} from './RenameWindow.js';
import arraySort from 'd2-utilizr/lib/arraySort';

export var EastRegion;

EastRegion = function(c) {

    var t = this,
        uiManager = c.uiManager,
        uiConfig = c.uiConfig,
        instanceManager = c.instanceManager,
        appManager = c.appManager,
        i18nManager = c.i18nManager,
        i18n = i18nManager.get();

    var descriptionMaxNumberCharacter = 200;

    var getLink = function(text, isBold, isBrackets) {
        return (isBrackets ? '<span class="bold">[</span> ' : '') +
            '<span class="eastPanelLink' + (isBold ? ' bold' : '') + '">' + text + '</span>' +
            (isBrackets ? ' <span class="bold">]</span>' : '');
    };

    /*
     * FAVORITE DETAILS PANEL
     */

    var getDetailsPanelItems = function(layout) {
        // Favorite loaded ->  Add favorite detail panel and update
        // Otherwise -> Display No Favorite Panel
        var detailsPanelItems;
        if (instanceManager.isStateFavorite() && !instanceManager.isStateDirty()) {

            var moreText = i18n.show_more;
            var lessText = i18n.show_less;
            var editText = i18n.edit;

            // Create Description Panel from description field
            var getDescriptionPanel = function(description) {
                var descriptionItems = [];
                if (description == undefined) {
                    description = i18n.no_description;
                }
                var isTooLongDescription = (description.length > descriptionMaxNumberCharacter);
                var shortDescription = description.substring(0, descriptionMaxNumberCharacter) + ' ... ';

                // Description label
                descriptionItems.push({
                    xtype: 'label',
                    itemId: 'descriptionLabel',
                    html: isTooLongDescription ? shortDescription : description,
                    cls: 'interpretationActions'
                });

                // Longer than 200 characters -> Create More/Less link
                if (isTooLongDescription) {
                    var longDescription = description;

                    descriptionItems.push({
                        xtype: 'label',
                        html: getLink(moreText, false, true),
                        cls: 'interpretationActions',
                        isShortDescriptionDisplayed: true,
                        style: 'margin: 1px 3px 0;',
                        listeners: {
                            render: function(label) {
                                label.getEl().on('click', function() {
                                    if (this.isShortDescriptionDisplayed) {
                                        this.up('#descriptionPanel').down('#descriptionLabel').setText(longDescription, false);
                                        this.setText(getLink(lessText, false, true));
                                    } else {
                                        this.up('#descriptionPanel').down('#descriptionLabel').setText(shortDescription, false);
                                        this.setText(getLink(moreText, false, true));
                                    }
                                    this.isShortDescriptionDisplayed = !this.isShortDescriptionDisplayed;
                                    this.up('#descriptionPanel').doLayout();
                                }, label);

                                //linkRender(label.getEl());
                            }
                        }
                    });
                }

                // Change Link
                descriptionItems.push({
                    xtype: 'label',
                    html: getLink(editText, false, true),
                    cls: 'interpretationActions',
                    style: 'margin: 1px 3px 0;',
                    listeners: {
                        'render': function(label) {
                            label.getEl().on('click', function() {
                                RenameWindow(c, instanceManager.getStateFavorite()).show();
                            }, label);
                        }
                    }
                });

                return descriptionItems;
            };

            // Create Sharing setting text from publicAccess and userGroupAccesses field
            var getSharingText = function(layout) {
                // Public permissions
                var sharingText = i18n.public + ': ';
                if (layout.publicAccess == "r-------") {
                    sharingText += i18n.read;
                } else if (layout.publicAccess == "rw------") {
                    sharingText += i18n.read_write;
                } else {
                    sharingText += i18n.none;
                }

                // User Group Accesses permissions
                // TODO: Create a tooltip
                if (layout.userGroupAccesses != undefined) {
                    sharingText += ' + ';
                    if (layout.userGroupAccesses.length > 2) {
                        sharingText += layout.userGroupAccesses.length + ' ' + i18n.groups;
                    } else {
                        for (var i = 0; i < layout.userGroupAccesses.length; i++) {
                            if (i > 0) {
                                sharingText += ', '
                            }
                            sharingText += i18n.group + ' ' + layout.userGroupAccesses[i].displayName;
                        }
                    }
                }
                return sharingText;
            };

            // Get Number of Views from analytics api and update label
            var setNumberOfViews = function(label, favoritesId) {
                Ext.Ajax.request({
                    url: encodeURI(appManager.getPath() + '/api/dataStatistics/favorites/' + favoritesId + '.json'),
                    method: 'GET',
                    scope: this,
                    success: function(r) {
                        label.setValue(Ext.decode(r.responseText).views);
                    }
                });
                return "Retrieving number of views...";
            }

            // Favorite Details Panel content when favorite loaded
            detailsPanelItems = [{
                xtype: 'panel',
                itemId: 'descriptionPanel',
                bodyStyle: 'border-style:none;',
                style: 'margin-bottom:5px;',
                items: [getDescriptionPanel(layout.displayDescription)]
            }, {
                xtype: 'displayfield',
                fieldLabel: i18n.owner,
                labelStyle: 'padding-top:0',
                style: 'margin-bottom:3px',
                itemId: 'owner',
                value: (layout.user != undefined) ? layout.user.displayName : '',
                cls: 'interpretationDetailsField'
            }, {
                xtype: 'displayfield',
                itemId: 'created',
                fieldLabel: i18n.created,
                labelStyle: 'padding-top:0',
                style: 'margin-bottom:3px',
                value: layout.created,
                cls: 'interpretationDetailsField'
            }, {
                xtype: 'displayfield',
                itemId: 'lastUpdated',
                fieldLabel: i18n.last_updated,
                labelStyle: 'padding-top:0',
                style: 'margin-bottom:3px',
                value: layout.lastUpdated,
                cls: 'interpretationDetailsField',
            }, {
                xtype: 'displayfield',
                itemId: 'numberViews',
                fieldLabel: i18n.number_of_views,
                labelStyle: 'padding-top:0',
                style: 'margin-bottom:3px',
                value: i18n.retrieving_number_of_views,
                cls: 'interpretationDetailsField',
                listeners: {
                    'render': function(label) {
                        setNumberOfViews(label, layout.id);
                    }
                }
            }, {
                xtype: 'displayfield',
                itemId: 'sharing',
                fieldLabel: i18n.sharing,
                labelStyle: 'padding-top:0',
                style: 'margin-bottom:3px',
                value: getSharingText(layout) + '<span style="padding-left:10px">' + getLink(editText, false, true) + '</span>',
                cls: 'interpretationDetailsField',
                listeners: {
                    'render': function(label) {
                        label.getEl().on('click', function() {
                            instanceManager.getSharingById(instanceManager.getStateFavoriteId(), function(r)  {
                                SharingWindow(c, r).show();
                            });
                        }, label);
                    }
                }
            }];
        } else {
            // Favorite Details Panel content when no favorite is loaded
            detailsPanelItems = [{
                xtype: 'label',
                text: i18n.no_current_favorite,
                cls: 'interpretationActions',
                style: 'padding:4px 1px;'
            }];
        }

        return {
            xtype: 'panel',
            bodyStyle: 'border-style:none',
            style: 'padding:6px;',
            itemId: 'noFavoriteDetailsPanel',
            defaults: {
                style: 'margin-top: 1px;'
            },
            items: [detailsPanelItems]
        };
    };

    // Main Details Panel Container
    var detailsPanel = {
        xtype: 'panel',
        cls: 'ns-panel-title-east-default first',
        title: i18n.details,
        itemId: 'detailsPanel',

        addAndUpdateFavoritePanel: function(layout) {
            if (!layout) {
                return;
            }

            // Remove any previous panel
            this.removeAll(true);

            this.add(getDetailsPanelItems(layout));
        },

        // By default no favorite details panel is displayed
        items: getDetailsPanelItems()
    };

    /*
     * INTERPRETATIONS PANEL
     */

    // Create interpretation panel depending on interpretation
    var getInterpretationPanel = function(interpretation, displayingComments) {

        var numberOfCommentsToDisplay = 3;

        // Create inner comments panel depending on comments
        var getCommentsPanel = function(comments) {

            var commentsPanel = [];

            // Textarea to comment
            commentsPanel.push({
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                layout: 'column',
                itemId: 'commentPanel',
                hidden: true,
                style: 'margin-top: 1px;',
                cls: 'comment greyBackground',
                items: [{
                    xtype: 'panel',
                    bodyStyle: 'border-style:none',
                    items: [{
                        xtype: 'label',
                        cls: 'avatar',
                        text: appManager.userAccount.firstName[0] + appManager.userAccount.surname.split(' ')[appManager.userAccount.surname.split(' ').length - 1][0]
                    }],
                    columnWidth: 0.11
                }, {
                    xtype: 'panel',
                    bodyStyle: 'border-style:none',
                    autoWidth: true,
                    layout: 'fit',
                    flex: 1,
                    items: [{
                        xtype: 'textarea',
                        itemId: 'commentArea',
                        cls: 'commentArea',
                        emptyText: i18n.write_your_interpretation,
                        submitEmptyText: false,
                        flex: 1,
                        border: 0,
                        enableKeyEvents: true,
                        listeners: {
                            keypress: function(f, e) {
                                if (e.getKey() == e.ENTER && !e.shiftKey) {
                                    commentInterpretation(f);
                                }
                            }
                        }
                    }, {
                        xtype: 'label',
                        html: getLink(i18n.post_comment),
                        cls: 'link',
                        listeners: {
                            'render': function(label) {
                                label.getEl().on('click', function() {
                                    commentInterpretation(this.up("[xtype='panel']").down('#commentArea'))
                                }, label);
                            }
                        }
                    }],
                    columnWidth: 0.89
                }]
            });

            // Comments
            // Sorting by last updated
            arraySort(comments, 'DESC', 'lastUpdated');
            for (var i = 0; i < comments.length; i++) {
                var comment = comments[i];

                commentsPanel.push({
                    xtype: 'panel',
                    bodyStyle: 'border-style:none;',
                    cls: 'comment greyBackground',
                    layout: 'column',
                    hidden: (i > numberOfCommentsToDisplay - 1),
                    items: [{
                        xtype: 'panel',
                        bodyStyle: 'border-style:none',
                        items: [{
                            xtype: 'label',
                            cls: 'avatar',
                            text: comment.user.displayName.split(' ')[0][0] + comment.user.displayName.split(' ')[comment.user.displayName.split(' ').length - 1][0]
                        }],
                        columnWidth: 0.11
                    }, {
                        xtype: 'panel',
                        bodyStyle: 'border-style:none',
                        items: [{
                            xtype: 'panel',
                            style: 'margin-bottom: 3px;',
                            bodyStyle: 'border-style:none',
                            items: [{
                                xtype: 'label',
                                html: getLink(comment.user.displayName, true),
                                cls: 'link bold',
                                style: 'margin-right: 7px;',
                                listeners: {
                                    render: function() {
                                        this.getEl().on('click', function() {
                                            window.location.href = appManager.getPath() + '/dhis-web-dashboard-integration/profile.action?id=' + comment.user.id;
                                        });
                                    }
                                }
                            }, {
                                xtype: 'label',
                                text: comment.text,
                            }]
                        }, {
                            xtype: 'label',
                            style: 'color: #666',
                            text: DateManager.getTimeDifference(comment.lastUpdated) + ' ' + i18n.ago
                        }],
                        columnWidth: 0.89
                    }]
                });
            }

            // Show more comments
            if (comments.length > 3 && comments.length > numberOfCommentsToDisplay) {
                commentsPanel.push({
                    xtype: 'panel',
                    bodyStyle: 'border-style:none',
                    style: 'margin-top: 1px;',
                    cls: 'comment greyBackground',
                    items: [{
                        xtype: 'label',
                        text: '[' + (comments.length - numberOfCommentsToDisplay) + ' ' + i18n.more_comments + ']',
                        cls: 'link',
                        listeners: {
                            'render': function(label) {
                                label.getEl().on('click', function() {
                                    numberOfCommentsToDisplay += 3;
                                    this.up('#interpretationPanel' + interpretation.id).updateInterpretationPanelItems();
                                }, label);
                            }
                        }
                    }]
                });
            }

            return commentsPanel;
        };

        // User has liked this interpretation -> true
        // Otherwise -> false
        var isLiked = function(interpretation) {
            var userId = appManager.userAccount.id
            for (var i = 0; i < interpretation.likedBy.length; i++) {
                if (interpretation.likedBy[i].id == userId) {
                    return true;
                }
            }
            return false;
        };

        var refreshInterpretationDataModel = function(interpretationPanel) {
            Ext.Ajax.request({
                url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '.json?fields=*,user[id,displayName],likedBy[id,displayName],comments[lastUpdated,text,user[id,displayName]]'),
                method: 'GET',
                scope: this,
                success: function(r) {
                    // Refreshing interpretation panel
                    interpretation = JSON.parse(r.responseText)
                    interpretationPanel.updateInterpretationPanelItems(interpretation);
                }
            });
        }

        // Call Like or Unlike interpretation, update data model and update/reload panel
        var likeUnlikeInterpretation = function() {
            var that = this;
            if (isLiked(interpretation)) {
                Ext.Ajax.request({
                    url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/like'),
                    method: 'DELETE',
                    success: function() {
                        refreshInterpretationDataModel(that.up('#interpretationPanel' + interpretation.id));
                    }
                });
            } else {
                Ext.Ajax.request({
                    url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/like'),
                    method: 'POST',
                    success: function() {
                        refreshInterpretationDataModel(that.up('#interpretationPanel' + interpretation.id));
                    }
                });
            }
        };

        // Call comment interpretation, update data model and update/reload panel
        var commentInterpretation = function(f) {
            if (f.getValue().trim() != '') {
                Ext.Ajax.request({
                    url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/comments'),
                    method: 'POST',
                    params: f.getValue(),
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    success: function() {
                        // Clear up comment textarea
                        f.reset();

                        // Refreshing interpretation panel
                        refreshInterpretationDataModel(f.up('#interpretationPanel' + interpretation.id));
                    }
                });
            }
        };

        // Create tooltip for Like link
        var getTooltipLike = function() {
            var toolTipLike = "";
            for (var i = 0; i < interpretation.likedBy.length; i++) {
                toolTipLike += interpretation.likedBy[i].displayName + "</br>";
            }
            return toolTipLike;
        };

        // Get inner items for interpretation panel.
        var getInterpretationPanelItems = function(interpretation, displayingComments) {

            var interpretationPanelItems = [{
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                style: 'margin-bottom: 3px;',
                items: [{
                    xtype: 'label',
                    html: getLink(interpretation.user.displayName, true),
                    style: 'margin-right:10px;',
                    listeners: {
                        render: function() {
                            var element = this.getEl();

                            element.on('click', function() {
                                window.location.href = appManager.getPath() + '/dhis-web-dashboard-integration/profile.action?id=' + interpretation.user.id;
                            });
                        }
                    }
                }, {
                    xtype: 'label',
                    text: DateManager.getYYYYMMDD(interpretation.lastUpdated, true),
                }]
            }, {
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                style: 'margin-bottom: 7px;',
                items: [{
                    xtype: 'label',
                    text: interpretation.text,
                }]
            }, {
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                cls: 'likeContainer',
                itemId: 'likePanelUnselected',
                hidden: displayingComments,
                items: [{
                    xtype: 'label',
                    html: "<div class='thumbs_up greyBackground'>" + interpretation.likes + " " + i18n.people_like_this + ". " + interpretation.comments.length + " " + i18n.people_commented + "</div>",
                }]
            }, {
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                style: 'margin-top: 1px;',
                itemId: 'likePanelSelected',
                hidden: !displayingComments,

                items: [{
                    xtype: 'panel',
                    bodyStyle: 'border-style:none',
                    style: 'margin-bottom: 5px;',
                    items: [{
                        xtype: 'label',
                        html: isLiked(interpretation) ? getLink(i18n.unlike) : getLink(i18n.like),
                        style: 'margin-right: 5px;',

                        listeners: {
                            'render': function(label) {
                                label.getEl().on('click', likeUnlikeInterpretation, this);

                                if (interpretation.likedBy.length > 0) {
                                    Ext.create('Ext.tip.ToolTip', {
                                        target: label.getEl(),
                                        html: getTooltipLike(),
                                        bodyStyle: 'background-color: white;border'
                                    });
                                }
                            }
                        }
                    }, {
                        xtype: 'label',
                        text: '·',
                        style: 'margin-right: 5px;'
                    }, {
                        xtype: 'label',
                        html: getLink(i18n.comment),
                        style: 'margin-right: 5px;',
                        listeners: {
                            'render': function(label) {
                                label.getEl().on('click', function() {
                                    this.up('#interpretationPanel' + interpretation.id).down('#commentPanel').show();
                                    this.up('#interpretationPanel' + interpretation.id).down('#commentArea').focus();
                                }, this);
                            }
                        }
                    }]
                }, {
                    xtype: 'panel',
                    bodyStyle: 'border-style:none',
                    cls: 'likeContainer',
                    items: [{
                        xtype: 'label',
                        html: '<div class="thumbs_up greyBackground">' + getLink(interpretation.likes + ' ' + i18n.people) + ' ' + i18n.like_this + '</div>',
                        listeners: {
                            'render': function(label) {

                                if (interpretation.likedBy.length > 0) {
                                    Ext.create('Ext.tip.ToolTip', {
                                        target: label.getEl(),
                                        html: getTooltipLike(),
                                        bodyStyle: 'background-color: white;border'
                                    });

                                }
                            }
                        }
                    }]
                }]
            }, {
                xtype: 'panel',
                hidden: !displayingComments,
                bodyStyle: 'border-style:none',
                itemId: 'comments',
                items: [getCommentsPanel(interpretation.comments)]
            }]
            return interpretationPanelItems;
        }

        // Interpretation panel per single interpretation
        var interpretationPanel = {
            xtype: 'panel',
            bodyStyle: 'border-style:none;',
            style: 'padding:6px;',
            cls: 'clickable',
            instanceManager: instanceManager,
            interpretation: interpretation,
            displayingComments: displayingComments,
            itemId: 'interpretationPanel' + interpretation.id,

            // Update inner interpretation panel items depending on interpretation. If none is provided, previously store one will be used
            updateInterpretationPanelItems: function(interpretation) {
                if (interpretation != undefined) {
                    this.interpretation = interpretation;
                }
                this.removeAll(true);
                this.add(getInterpretationPanelItems(this.interpretation, this.displayingComments));

                // Remove pointer effect. This is not clickable any more
                if (this.displayingComments) {
                    this.removeCls('clickable');
                } else {
                    this.addCls('clickable');
                }
            },

            // Expand comments on click
            expandComments: function() {
                if (!this.displayingComments) {
                    for (var i = 0; i < this.up("#interpretationsPanel").items.items.length; i++) {
                        if (this.up("#interpretationsPanel").items.items[i].interpretation != undefined) {
                            this.up("#interpretationsPanel").items.items[i].displayingComments = (this.up("#interpretationsPanel").items.items[i].id == this.id);
                            //this.up("#interpretationsPanel").items.items[i].numberOfCommentsToDisplay = 3;
                            this.up("#interpretationsPanel").items.items[i].updateInterpretationPanelItems();
                        }
                    }

                    // Swop top panel
                    this.up("[xtype='panel']").down('#shareInterpretation').hide();
                    this.up("[xtype='panel']").down('#backToToday').show();

                    // Update canvas with favorite as it was by the time the interpretation was created
                    uiManager.updateInterpretation(interpretation);
                }
            },

            items: getInterpretationPanelItems(interpretation, displayingComments),

            listeners: {
                'render': function(panel) {
                    panel.body.on('click', this.expandComments, this);
                },
                scope: interpretationPanel
            }
        };
        return interpretationPanel;
    };

    var getTopInterpretationsPanel = function(interpretations, displayingInterpretation) {
        var topInterpretationPanelItems = [];

        var shareInterpretationPanel = {
            xtype: 'panel',
            bodyStyle: 'border-style:none',
            style: 'padding:10px 7px; border-width:0 0 1px 0; border-style:solid;',
            hidden: displayingInterpretation,
            itemId: 'shareInterpretation',
            items: [{
                xtype: 'label',
                html: getLink(i18n.share + ' ' + i18n.interpretation),
                cls: 'interpretationActions',
                listeners: {
                    'render': function(label) {
                        label.getEl().on('click', function() {
                            instanceManager.getSharingById(instanceManager.getStateFavoriteId(), function(r) {
                                InterpretationWindow(c, r).show();
                            });
                        }, label);
                    }
                }
            }]
        };

        var noInterpretationsPanel = {
            xtype: 'panel',
            bodyStyle: 'border-style:none',
            style: 'padding:6px; border-width:0;',
            items: [{
                xtype: 'label',
                text: i18n.no_interpretations,
                cls: 'interpretationActions'
            }]
        };

        var backToTodayPanel = {
            xtype: 'panel',
            bodyStyle: 'border-style:none',
            style: 'padding:10px 7px; border:1px solid #dadada; border-width:0 0 1px 0;',
            hidden: !displayingInterpretation,
            itemId: 'backToToday',
            items: [{
                xtype: 'label',
                html: getLink('<< ' + i18n.back_to_today),
                cls: 'interpretationActions link',
                listeners: {
                    'render': function(label) {
                        label.getEl().on('click', function() {
                            instanceManager.getById(instanceManager.getStateCurrent().id);
                        }, label);
                    }
                }
            }]
        };

        if (instanceManager.isStateFavorite() && !instanceManager.isStateDirty()) {
            // Interpretations Panel when no favorite is loaded
            topInterpretationPanelItems.push(shareInterpretationPanel);

            if (interpretations == undefined) {
                // Interpretations Panel when no favorite is loaded
                topInterpretationPanelItems.push(noInterpretationsPanel);
            } else {
                topInterpretationPanelItems.push(backToTodayPanel);
            }
        } else {
            topInterpretationPanelItems.push(noInterpretationsPanel);
        }

        // Add Share/Back to Today Panel.
        // If displayingInterpretation on canvas -> Back to Today
        // Otherwise -> Share Interpretation
        var topInterpretationPanel = {
            xtype: 'panel',
            bodyStyle: 'border-style:none',
            style: 'border-width:0',
            items: topInterpretationPanelItems
        };

        return topInterpretationPanel;
    };

    // Main Interpretations Panel Container
    var interpretationsPanel = {
        xtype: 'panel',
        cls: 'ns-panel-title-east-default',
        title: i18n.interpretations,
        itemId: 'interpretationsPanel',
        displayingInterpretation: false,

        getInterpretationPanel: getInterpretationPanel,
        getTopInterpretationsPanel: getTopInterpretationsPanel,

        addAndUpdateInterpretationsPanel: function(layout) {
            if (!layout) {
                return;
            }

            var interpretations = layout.interpretations;
            var interpretationId = layout.interpretationId;

            // Remove any previous panel
            this.removeAll(true);

            //Get top interpretations panel depending on interpretations and if we are displaying an interpretation
            this.add(this.getTopInterpretationsPanel(interpretations, interpretationId != undefined));

            // Add an interpretation panel per interpretation
            if (interpretations != undefined && interpretations.length > 0) {
                for (var i = 0; i < interpretations.length; i++) {
                    this.add(this.getInterpretationPanel(interpretations[i], (interpretations[i].id == interpretationId)));
                }
            }
        },

        // By default no interpretations panel is displayed
        items: getTopInterpretationsPanel()
    };

    /*
     * RIGHT PANEL CONTAINER
     */
    return Ext.create('Ext.panel.Panel', {
        region: 'east',
        border: false,
        width: uiConfig.west_width + uiManager.getScrollbarSize().width,
        items: [detailsPanel, interpretationsPanel],
        cls: 'eastPanel',
        setState: function(layout) {

            this.getComponent('detailsPanel').addAndUpdateFavoritePanel(layout);

            // Favorite loaded with interpretations ->  Add interpretation panel and update
            this.getComponent('interpretationsPanel').addAndUpdateInterpretationsPanel(layout);
        }
    });
};
