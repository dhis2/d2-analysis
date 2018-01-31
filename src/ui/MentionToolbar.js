export var MentionToolbar;

MentionToolbar = function (refs) {

    var appManager = refs.appManager,
    i18nManager = refs.i18nManager,
    uiManager = refs.uiManager;
    
    var i18n = i18nManager.get();

    var mentionsPanel = Ext.create('Ext.panel.Panel', {
        floating: true,
        layout: {
            type: 'table',
            columns: 1
        },
        items: [],
        zIndex: 9999,
        cls: 'mentions',
        displayMentionSuggestion : function(component, event) {
            var splitText = component.getValue().split('@')
            var currentMention = splitText[splitText.length -1];
            if (splitText.length > 1 && currentMention == currentMention.replace(" ", "").replace(/(?:\r\n|\r|\n)/g, "")){
    
                mentionsPanel.removeAll(true);
    
                var potentialMostMentionedUsers= appManager.mostMentionedUsers
                    .filter(user => user.userCredentials.username.includes(currentMention))
                    .map((user) => {
                        return {
                            xtype: 'label',
                            html:  user.displayName + " (" + user.userCredentials.username + ")",
                            listeners: {
                                'render': function(label) {
                                    label.getEl().on('click', function() {
                                        splitText.splice(-1,1);
                                        var newText = splitText.join("@") + "@" + user.userCredentials.username;
                                        component.setValue(newText);
                                        mentionsPanel.hide();
                                    }, label);
                                }
                            }
                        }
                    });
    
                var potentialUsers = appManager.users
                    .filter(user => user.userCredentials.username.includes(currentMention))
                    .map((user) => {
                        return {
                            xtype: 'label',
                            html: user.displayName + " (" + user.userCredentials.username + ")",
                            listeners: {
                                'render': function(label) {
                                    label.getEl().on('click', function() {
                                        splitText.splice(-1,1);
                                        var newText = splitText.join("@") + "@" + user.userCredentials.username;
                                        component.setValue(newText);
                                        mentionsPanel.hide();
                                    }, label);
                                }
                            }
                        }
                    });
    
                if (potentialMostMentionedUsers != null && potentialMostMentionedUsers.length > 0){
                    mentionsPanel.add({
                        html: i18n.most_common_users_matching + ' @' + currentMention,
                        cls: 'mentionsTitle',
                    });
                    mentionsPanel.add(potentialMostMentionedUsers);
                    
                }
                if (potentialUsers != null && potentialUsers.length > 0){
                    mentionsPanel.add({
                        html: i18n.other_users_matching + ' @' + currentMention,
                        cls: 'mentionsTitle',
                    });
                    mentionsPanel.add(potentialUsers);
                }
    
                if (potentialMostMentionedUsers != null && potentialMostMentionedUsers.length == 0 && potentialUsers != null && potentialUsers.length == 0){
                    mentionsPanel.hide();
                }
                else{
                    mentionsPanel.show().alignTo(event.target,'bl-tl');
                }    
    
            }
            else{
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