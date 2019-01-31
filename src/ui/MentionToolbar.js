export var MentionToolbar;

MentionToolbar = function (refs) {
    var appManager = refs.appManager;
    var i18n = refs.i18nManager.get();

    var canUserAccessCurrentFavorite = function(user) {
        const currentFavorite = refs.instanceManager.getStateCurrent() || {};
        const { publicAccess, userAccesses = [], userGroupAccesses = [] } = currentFavorite || {};
        const hasReadAccess = permission => permission && permission[0] === "r";

        const userHasPublicAccess = () =>
            hasReadAccess(publicAccess);

        const userHasUserAccess = () =>
            userAccesses.some(userAccess => userAccess.id === user.id && hasReadAccess(userAccess.access));

        const userHasUserGroupAccess = () =>
            userGroupAccesses.some(userGroupAccess =>
                (user.userGroups || []).some(userGroupOfUser =>
                    userGroupAccess.id === userGroupOfUser.id && hasReadAccess(userGroupAccess.access)));

        return userHasPublicAccess() || userHasUserAccess() || userHasUserGroupAccess();
    }

    var usersReq = function(search, onSuccess) {
        new refs.api.Request(refs, {
            baseUrl: appManager.getApiPath() + '/users.json',
            type: 'json',
            params: [
                'query=' + search,
                'fields=id,displayName,userCredentials[username],userGroups[id]',
                'order=displayName:asc',
                'pageSize=5',
            ],
            success: function(response) {
                onSuccess(response.users);
            },
        }).run();
    };

    var disabledRowStyle = "display: block; background-color: white; color: grey; cursor: not-allowed";

    var mentionsPanel = Ext.create('Ext.panel.Panel', {
        floating: true,
        layout: {
            type: 'table',
            columns: 1
        },
        items: [],
        zIndex: 9999,
        cls: 'mentions',
        _lastText: null,
        _isOpen: false,
        createMentionLabelsForUser: function(users, splitText, component) {
            return users
                    .map((user) => {
                        const hasAccess = canUserAccessCurrentFavorite(user);
                        const text = user.displayName +
                            " (" + user.userCredentials.username + ")" +
                            (hasAccess ? "" : (" - " + i18n.user_cannot_view));

                        return {
                            xtype: 'label',
                            text: text,
                            style: hasAccess ? "" : disabledRowStyle,
                            listeners: !hasAccess ? {} : {
                                'render': function(label) {
                                    label.getEl().parent().on('click', function() {
                                        splitText.splice(-1,1);
                                        var newText = splitText.join("@") + "@" + user.userCredentials.username;
                                        component.setValue(newText);
                                        this.hide();
                                    }, label);
                                }
                            }
                        }
                    });
        },
        displayMentionSuggestion: function(component, event) {
            // Get text from 0 to cursor position
            var text = component.getValue().substring(0,$(event.target).prop("selectionStart"));
            if (text === this._lastText)
                return;
            this._lastText = text;
            // Split by @ and take last bit
            var splitText = text.split('@');
            var currentMention = splitText[splitText.length -1];

            if (splitText.length > 1 && currentMention == currentMention.replace(" ", "").replace(/(?:\r\n|\r|\n)/g, "")) {
                this._isOpen = true;
                usersReq(currentMention, users => {
                    if (!this._isOpen)
                        return;
                    mentionsPanel.removeAll(true);

                    var userLabels = this.createMentionLabelsForUser(users, splitText, component);
        
                    if (userLabels.length === 0) {
                        mentionsPanel.hide();
                    } else {
                        mentionsPanel.add({
                            html: i18n.users_matching + ' @' + currentMention,
                            cls: 'mentionsTitle',
                        });
                        mentionsPanel.add(userLabels);
                        mentionsPanel.show().alignTo(event.target,'bl-tl');
                    }
                });
            }
            else {
                this._isOpen = false;
                mentionsPanel.hide();
            }
        },
        listeners: {
            show: function(w) {
                // hide if click anywhere 
                if (!w.hasDestroyOnBlurHandlerGlobal) {
                    Ext.getBody().on('click', function() {
                        w.hide();
                    });
                }
                w.hasDestroyOnBlurHandlerGlobal = true;
            }
            
        }
    });

    return mentionsPanel;
}
