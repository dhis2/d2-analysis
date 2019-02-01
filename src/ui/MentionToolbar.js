export var MentionToolbar;

MentionToolbar = function (refs) {

    var appManager = refs.appManager,
    i18nManager = refs.i18nManager,
    uiManager = refs.uiManager;
    
    var i18n = i18nManager.get();

    var usersReq = function(search, onSuccess) {
        new refs.api.Request(refs, {
            baseUrl: appManager.getApiPath() + '/users.json',
            type: 'json',
            params: [
                'query=' + search,
                'fields=displayName,userCredentials[username]',
                'order=displayName:asc',
                'pageSize=5',
            ],
            success: function(response) {
                onSuccess(response.users);
            },
        }).run();
    };

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
                        return {
                            xtype: 'label',
                            html:  user.displayName + " (" + user.userCredentials.username + ")",
                            listeners: {
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
