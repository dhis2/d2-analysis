export var MentionToolbar;

MentionToolbar = function (refs) {

    var appManager = refs.appManager,
    i18nManager = refs.i18nManager,
    uiManager = refs.uiManager;
    
    var i18n = i18nManager.get();

    var getCurrentWord = function(component) {
        var text, startOffset;
        if (component.editor) {
            var range = component.editor.getSelection().getRanges()[0];
            text = range && range.startContainer.type === CKEDITOR.NODE_TEXT ? range.startContainer.getText() : "";
            startOffset = range ? range.startOffset : 0;
        } else {
            text = component.getValue();
            startOffset = component.el.down("textarea").dom.selectionStart;
        }
        return text.slice(0, startOffset).split(/\s+/).slice(-1)[0];
    };

    var updateContents = function(component, user) {
        var getNewText = function(text, startOffset) {
            var index = text.slice(0, startOffset).lastIndexOf("@");
            var afterText = text.slice(index);
            var restIndex = afterText.indexOf(" ");
            var rest = restIndex >= 0 ? afterText.slice(restIndex) : "";
            var newText = text.slice(0, index) + "@" + user.userCredentials.username + rest;
            return newText;
        };

        if (component.editor) {
            var range = component.editor.getSelection().getRanges()[0];
            if (range) {
                var container = range.startContainer.$;
                container.textContent = getNewText(container.textContent, range.startOffset);
            }
        } else {
            var text = component.getValue();
            var startOffset = component.el.down("textarea").dom.selectionStart;
            var newText = getNewText(text, startOffset);;
            component.setValue(newText);
        }
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
        createMentionLabelsForUser : function(users, currentMention, component){
            return users
                    .filter(user => (user.userCredentials.username.toLowerCase().includes(currentMention.toLowerCase()) || user.displayName.toLowerCase().includes(currentMention.toLowerCase())))
                    .map((user) => {
                        return {
                            xtype: 'label',
                            html:  user.displayName + " (" + user.userCredentials.username + ")",
                            listeners: {
                                'render': function(label) {
                                    label.getEl().parent().on('click', function() {
                                        updateContents(component, user);
                                        this.hide();
                                    }, label);
                                }
                            }
                        }
                    });
        },
        displayMentionSuggestion : function(component, event) {
            var currentWord = getCurrentWord(component);
            var currentMention = currentWord && currentWord.startsWith("@") ? currentWord.slice(1) : null;

            if (currentMention !== null && currentMention === currentMention.replace(" ", "").replace(/(?:\r\n|\r|\n)/g, "")){
                mentionsPanel.removeAll(true);
    
                var potentialMostMentionedUsers =
                    this.createMentionLabelsForUser(appManager.mostMentionedUsers, currentMention, component);
                var potentialUsers =
                    this.createMentionLabelsForUser(appManager.users, currentMention, component);
    
                if (potentialMostMentionedUsers && potentialMostMentionedUsers.length > 0){
                    mentionsPanel.add({
                        html: i18n.most_common_users_matching + ' @' + currentMention,
                        cls: 'mentionsTitle',
                    });
                    mentionsPanel.add(potentialMostMentionedUsers);
                    
                }
                if (potentialUsers && potentialUsers.length > 0){
                    mentionsPanel.add({
                        html: i18n.other_users_matching + ' @' + currentMention,
                        cls: 'mentionsTitle',
                    });
                    mentionsPanel.add(potentialUsers);
                }
    
                if (potentialMostMentionedUsers && potentialMostMentionedUsers.length == 0 && potentialUsers && potentialUsers.length == 0){
                    mentionsPanel.hide();
                }
                else{
                    mentionsPanel.show().alignTo(component.getEl(), 'bl-tl');
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