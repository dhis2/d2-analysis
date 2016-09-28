import {DateManager} from '../manager/DateManager.js';
import {InterpretationWindow} from './InterpretationWindow.js';
import {SharingWindow} from './SharingWindow.js';
import {RenameWindow} from './RenameWindow.js';

export var EastRegion;

EastRegion = function(c){
	
	var t = this,
		uiManager = c.uiManager,
		uiConfig = c.uiConfig,
		instanceManager = c.instanceManager,
		appManager = c.appManager,
		i18nManager = c.i18nManager,
		i18n = i18nManager.get();
	
	/*
	 * FAVORITE DETAILS PANEL
	 */ 
	    
	// Favorite Details Panel content when favorite loaded    
	var favoriteDetailsPanel ={
        xtype: 'panel',
        bodyStyle: 'border-style:none',
        style: 'padding:10px',
        itemId: 'favoriteDetailsPanel',
        descriptionMaxNumberCharacter: 200,
        
        // Create Description Panel from description field
        getDescriptionPanel: function(description){
        	var descriptionItems = [];
        	if (description == undefined){description = 'No description';}
        	var isLongDescription = (description.length > this.descriptionMaxNumberCharacter);
        	
        	// Description label
        	descriptionItems.push({
                xtype: 'label',
                itemId: 'descriptionLabel',
                html: (isLongDescription)?description.substring(0,descriptionMaxNumberCharacter):description,
                cls: 'ns-label-period-heading'
            });
        	
        	// Longer than 200 characters -> Create More/Less link
        	if (isLongDescription){
        		var longDescription = description;
                var shortDescription = description.substring(0, descriptionMaxNumberCharacter);
        		
            	descriptionItems.push({
                    xtype: 'label',
                    html: '[<span style="cursor:pointer;color:blue;text-decoration:underline;">more</span>]',
                    moreText: '[<span style="cursor:pointer;color:blue;text-decoration:underline;">more</span>]',
                    lessText: '[<span style="cursor:pointer;color:blue;text-decoration:underline;">less</span>]',
                    cls: 'ns-label-period-heading',
                    isShortDescriptionDisplayed: true,
                    style: 'margin: 0px 3px;',
                    listeners: {
        	        	'render': function(label) {
        	        		label.getEl().on('click', function(){
        	        			if (this.isShortDescriptionDisplayed){this.up('#descriptionPanel').down('#descriptionLabel').setText(longDescription,false); this.setText(this.lessText,false)}
        	        			else{this.up('#descriptionPanel').down('#descriptionLabel').setText(shortDescription,false); this.setText(this.moreText,false)}
        	        			this.isShortDescriptionDisplayed = !this.isShortDescriptionDisplayed;
        	        			this.up('#descriptionPanel').doLayout();
        	        			}, label);
    	        	    }
        	        }
                });
        	}
        	
        	// Change Link
        	descriptionItems.push({
                xtype: 'label',
                html: '[<span style="cursor:pointer;color:blue;text-decoration:underline;">change</span>]',
                cls: 'ns-label-period-heading',
                style: 'margin: 0px 3px;',
                listeners: {
    	        	'render': function(label) {
    	        		label.getEl().on('click', function(){RenameWindow(c, instanceManager.getStateFavorite()).show();}, label);
	        	    }
    	        }
            });
        	
        	return descriptionItems;
        },
        
        // Create Sharing setting text from publicAccess and userGroupAccesses field
        getSharingText: function(layout){
        	// Public permissions
        	var sharingText = 'Public: ';
        	if (layout.publicAccess == "r-------"){
        		sharingText += 'Read';
        	}
        	else if (layout.publicAccess == "rw------"){
        		sharingText += 'Read/Write';
        	}
        	else{
        		sharingText += 'None';
        	}
        	
        	// User Group Accesses permissions
        	// TODO: Create a tooltip
        	if (layout.userGroupAccesses != undefined){ 
            	sharingText += ' + ';
            	if (layout.userGroupAccesses.length > 2){
            		sharingText += layout.userGroupAccesses.length + ' groups';
            	}
            	else{
            		for (var i = 0; i < layout.userGroupAccesses.length; i++){
            			if (i > 0){sharingText += ', '}
            			sharingText += 'Group ' + layout.userGroupAccesses[i].displayName ;
            		}
            	}
        	}
        	return sharingText;
        },
        
        // Get Number of Views from analytics api and update label
        getNumberOfViews: function(favoritesId){
        	Ext.Ajax.request({
                url: encodeURI(appManager.getPath() + '/api/dataStatistics/favorites/' + favoritesId + '.json'), 
                method: 'GET',
                scope: this,
                success: function(r) {
                	this.getComponent('numberViews').setValue(Ext.decode(r.responseText).views);
                }
            });
        },
        
        // Update Panel on new favorite load or change
        updateFavoriteDetailsPanel: function(layout){
        	this.getComponent('descriptionPanel').add(this.getDescriptionPanel(layout.displayDescription));
    		this.getComponent('owner').setValue((layout.user != undefined)?layout.user.displayName:'');	
        	this.getComponent('created').setValue(layout.created);
        	this.getComponent('lastUpdated').setValue(layout.lastUpdated);
        	this.getNumberOfViews(layout.id);
        	this.getComponent('sharing').setValue(this.getSharingText(layout));
        },
        
        items: [
			{
			    xtype: 'panel',
			    itemId: 'descriptionPanel',
			    bodyStyle: 'border-style:none;',
			    style: 'margin-bottom:5px;',
			    items:[]
			},
			{
	            xtype: 'displayfield',
	            fieldLabel: 'Owner',
	            itemId: 'owner',
	            value: '',
	            style: 'white-space: nowrap;font-weight:bold;line-height:18px;',
	        },
			{
	            xtype: 'displayfield',
	            itemId: 'created',
	            fieldLabel: 'Created',
	            value: '',
	            style: 'white-space: nowrap;font-weight:bold;line-height:18px;',
	        },
			{
	            xtype: 'displayfield',
	            itemId: 'lastUpdated',
	            fieldLabel: 'Last Updated',
	            value: '',
	            style: 'white-space: nowrap;font-weight:bold;line-height:18px;',
	        },
	        {
	            xtype: 'displayfield',
	            itemId: 'numberViews',
	            fieldLabel: 'Number of views',
	            value: "Retrieving number of views...",
	            style: 'white-space: nowrap;font-weight:bold;line-height:18px;',
	        },
			{
	            xtype: 'displayfield',
	            itemId: 'sharing',
	            fieldLabel: 'Sharing [<span style="cursor:pointer;color:blue;text-decoration:underline;">change</span>]',
	            value: '',
	            style: 'white-space: nowrap;font-weight:bold;line-height:18px;',
    	        listeners: {
    	        	'render': function(label) {
    	        		label.getEl().on('click', function(){instanceManager.getSharingById(instanceManager.getStateFavoriteId(), function(r) {SharingWindow(c, r).show();});}, label);
	        	    }
    	        }
	        }
        ]
    };
	
	// Favorite Details Panel content when no favorite is loaded
	var noFavoriteDetailsPanel = {
            xtype: 'label',
            text: 'No current favorite',
            cls: 'ns-label-period-heading'
        };
	
	// Main Details Panel Container
	var detailsPanel = {
        xtype: 'panel',
        title: '<div class="ns-panel-title-details">Details</div>',
        itemId: 'detailsPanel',
        // By default no favorite details panel is displayed
        items: [noFavoriteDetailsPanel]
    };
	
	/*
	 * INTERPRETATIONS PANEL
	 */ 
	
	// Create interpretation panel depending on interpretation
	var getInterpretationPanel = function(interpretation) {
		
		// Create inner comments panel depending on comments
		var getCommentsPanel = function (comments){
			var commentsPanel = [];
			for (var i=0; i < comments.length; i++){
				var comment = comments[i];
				
				commentsPanel.push({
	                xtype: 'panel',
	                bodyStyle: 'border-style:none',
	                layout: 'column',
	                style: 'margin-bottom: 5px;',
	                items: [
							{
								xtype: 'panel',
								bodyStyle: 'border-style:none',
								items: [
										{
										    xtype: 'label',
										    style: 'height: 30px;width: 30px;border-radius:50%;display:inline-block;background-color:#bdbdbd;text-align:center;line-height:30px;font-size:14px;color:black;font-weight:bold;',
										    text: comment.user.displayName.split(' ')[0][0] + comment.user.displayName.split(' ')[comment.user.displayName.split(' ').length -1][0]
										}
								],
								columnWidth: 0.20
							},
							{
								xtype: 'panel',
								bodyStyle: 'border-style:none',
								items: [
								        {
											xtype: 'panel',
											bodyStyle: 'border-style:none',
											items: [
											        {
													    xtype: 'label',
													    text: comment.user.displayName,
													    style: 'margin-right: 10px; font-weight: bold; color: blue;' 
													},
													{
													    xtype: 'label',
													    text: comment.text,
													}
											]
								        },
										{
										    xtype: 'label',
										    text: DateManager.getTimeDifference(comment.lastUpdated),
										} 
								],
								columnWidth: 0.80
							}
	                ]
	            });
	    	}
			
			commentsPanel.push({
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                layout: 'column',
                style: 'margin-bottom: 5px;',
                
                items: [
						{
							xtype: 'panel',
							bodyStyle: 'border-style:none',
							items: [
									{
									    xtype: 'label',
									    style: 'height: 30px;width: 30px;border-radius:50%;display:inline-block;background-color:#bdbdbd;text-align:center;line-height:30px;font-size:14px;color:black;font-weight:bold;',
									    text: appManager.userAccount.firstName[0] + appManager.userAccount.surname.split(' ')[appManager.userAccount.surname.split(' ').length -1][0]
									}
							],
							columnWidth: 0.20
						},
						{
							xtype: 'panel',
							bodyStyle: 'border-style:none',
							autoWidth: true,
							layout   : 'fit',
							flex     : 1,
							items: [
							        {
										xtype: 'textarea',
										itemId: 'commentArea',
										emptyText: 'Write a comment',
										submitEmptyText: false,
						                flex: 1,
						                border: 0,
										enableKeyEvents: true,
										listeners: {
											keypress: function (f,e) {    
							                     if (e.getKey() == e.ENTER && !e.shiftKey) {
							                    	 commentInterpretation(f);
							                    }
							                }
			    	        	        }
							        } 
							],
							columnWidth: 0.80
						}
                ]
            });
			return commentsPanel;
		};
		
		// User has liked this interpretation -> true
		// Otherwise -> false
		var isLiked = function(interpretation){
			var userId = appManager.userAccount.id
			for (var i = 0; i < interpretation.likedBy.length; i++){
        		if (interpretation.likedBy[i].id == userId){
        			return true;
        		}
        	}
			return false;
		};
        
		// Call Like or Unlike interpretation, update data model and update/reload panel
        var likeUnlikeInterpretation = function(){
        	var that = this;
			if (isLiked(interpretation)){
				Ext.Ajax.request({
	                url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/like'),
	                method: 'DELETE',
	                success: function() {
	                	// Updating date model
	                	interpretation.likes--;
	                	for (var i = 0; i < interpretation.likedBy.length; i++){
	                		if (interpretation.likedBy[i].id == appManager.userAccount.id){
	                			interpretation.likedBy.pop(i)
	                			break;
	                		}
	                	}
	                	
	                	// Refreshing interpretation panel
	                	that.up('#interpretationPanel' + interpretation.id).updateInterpretationPanelItems(interpretation);
	                }
	            });
			}
			else{
	        	Ext.Ajax.request({
	                url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/like'),
	                method: 'POST',
	                success: function() {
	                	// Updating date model
	                	interpretation.likes++;
	                	interpretation.likedBy.push({id: appManager.userAccount.id, displayName: appManager.userAccount.firstName + ' ' + appManager.userAccount.surname});
	                	
	                	// Refreshing interpretation panel
	                	that.up('#interpretationPanel' + interpretation.id).updateInterpretationPanelItems(interpretation);
	                }
	            });
			}
        };
        
        // Call comment interpretation, update data model and update/reload panel
        var commentInterpretation = function(f){
        	if (f.getValue().trim() != ''){
        		Ext.Ajax.request({
	                url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/comments'),
	                method: 'POST',
	                params: f.getValue(),
	                headers: {'Content-Type': 'text/plain'},
	                success: function(obj, _success, r) {
	                	// Updating data model
	                	var currentComment = {}
	                	currentComment['user'] = {}
	                	currentComment['user']['displayName'] = appManager.userAccount.firstName + ' ' + appManager.userAccount.surname
	                	currentComment['lastUpdated'] = new Date();
	                	currentComment['text'] = f.getValue();
	                	interpretation.comments.push(currentComment)
	                	
	                	// Clear up comment textarea
	                	f.reset();
	                	
	                	// Refreshing interpretation panel
	                	f.up('#interpretationPanel' + interpretation.id).updateInterpretationPanelItems(interpretation);
	                }
	            });
        	}
        };
        
        // Create tooltip for Like link
        var getTooltipLike = function(){
        	var toolTipLike = "";
        	for (var i = 0; i < interpretation.likedBy.length; i++){
        		toolTipLike += interpretation.likedBy[i].displayName + "</br>";
        	}
        	return toolTipLike;
        };
        
        // Get inner items for interpretation panel. 
        var getInterpretationPanelItems = function(interpretation, displayingComments){

			var interpretationPanelItems = [
					{
				    xtype: 'panel',
				    bodyStyle: 'border-style:none',
				    style: 'margin-bottom: 5px;',
				    items: [
						{
						    xtype: 'label',
						    text: interpretation.user.displayName,
						    style: 'margin-right: 10px; font-weight: bold; color: blue;' 
						},
						{
						    xtype: 'label',
						    text: DateManager.getYYYYMMDD(interpretation.lastUpdated, true),
						}
				    ]
				},
				{
				    xtype: 'panel',
				    bodyStyle: 'border-style:none',
				    style: 'margin-bottom: 5px;',
				    items: [
						{
                            xtype: 'label',
                            text: interpretation.text,
                        }
				    ]
				},
				{
				    xtype: 'panel',
				    bodyStyle: 'border-style:none',
				    style: 'margin-bottom: 5px;',
				    itemId: 'likePanelUnselected',
				    hidden: displayingComments,
				    items: [
						{
                            xtype: 'label',
                            text: interpretation.likes + " people like this. " + interpretation.comments.length + " people commented.",
                        }
				    ]
				},
				{
				    xtype: 'panel',
				    bodyStyle: 'border-style:none',
				    style: 'margin-bottom: 5px;',
				    itemId: 'likePanelSelected',
				    hidden: !displayingComments,
                    
				    items: [
						{
						    xtype: 'panel',
						    bodyStyle: 'border-style:none',
						    style: 'margin-bottom: 5px;',
						    
						    items: [
								{
						            xtype: 'label',
						            text: interpretation.likes + " people like this.",
						            style: 'margin-right: 5px;cursor:pointer;color:blue;font-weight: bold;',
				                    
						            listeners: {
		    	        	        	'render': function(label) {
		    	        	        	       
		    	        	        	       if (interpretation.likedBy.length > 0){
		    	        	        	    	   Ext.create('Ext.tip.ToolTip', {
			    	        	        	           target: label.getEl(),
			    	        	        	           html: getTooltipLike(),
			    	        	        	           bodyStyle: 'background-color: white;border' 
			    	        	        	         });   
		    	        	        	    	   
		    	        	        	       }
		    	        	        	    }
		    	        	        }
						        }
						    ]
						},
						{
						    xtype: 'panel',
						    bodyStyle: 'border-style:none',
						    style: 'margin-bottom: 5px;',
						    items: [
								{
						            xtype: 'label',
						            text: isLiked(interpretation)?"Unlike":"Like",
						            style: 'margin-right: 5px;cursor:pointer;color:blue;font-weight: bold;',
				                    
						            listeners: {
		    	        	        	'render': function(label) {
		    	        	        	       label.getEl().on('click', likeUnlikeInterpretation, this);
		    	        	        	       
		    	        	        	       if (interpretation.likedBy.length > 0){
		    	        	        	    	   Ext.create('Ext.tip.ToolTip', {
			    	        	        	           target: label.getEl(),
			    	        	        	           html: getTooltipLike(),
			    	        	        	           bodyStyle: 'background-color: white;border' 
			    	        	        	         });   
		    	        	        	    	   
		    	        	        	       }
		    	        	        	    }
		    	        	        }
						        },
						        {
						            xtype: 'label',
						            text: '|',
						            style: 'margin-right: 5px;'
						        },
						        {
						            xtype: 'label',
						            text: 'Comment',
						            style: 'margin-right: 5px;cursor:pointer;color:blue;font-weight: bold;',
				                    
						            listeners: {
		    	        	        	'render': function(label) {
		    	        	        	       label.getEl().on('click', function(){this.up('#interpretationPanel' + interpretation.id).down('#commentArea').focus();}, this);
	    	        	        	    }
		    	        	        }
						        }
						    ]
						}
				    ]
				},
                {
                	xtype: 'panel',
                	hidden: !displayingComments,
                	bodyStyle: 'border-style:none',
                	itemId: 'comments',
                	items: [getCommentsPanel(interpretation.comments)]
                }
			]	
			return interpretationPanelItems;
        }
        
        // Interpretation panel per single interpretation
		var interpretationPanel = {
            xtype: 'panel',
            bodyStyle: 'border-style:none',
            style: 'padding:10px',
            instanceManager: instanceManager,
            interpretation: interpretation,
            displayingComments: false,
            itemId: 'interpretationPanel' + interpretation.id,
            
            // Update inner interpretation panel items depending on interpretation. If none is provided, previously store one will be used
            updateInterpretationPanelItems: function(interpretation){
            	if (interpretation != undefined){
            		this.interpretation = interpretation;
            	}
            	this.removeAll(true);
            	this.add(getInterpretationPanelItems(this.interpretation, this.displayingComments));
            },
            
            // Expand comments on click
            expandComments: function(){
            	if(!this.displayingComments){
            		for (var i = 0; i < this.up("#interpretationsPanel").items.items.length; i++){
            			if (this.up("#interpretationsPanel").items.items[i].interpretation != undefined){
            				this.up("#interpretationsPanel").items.items[i].displayingComments = (this.up("#interpretationsPanel").items.items[i].id == this.id);
            				this.up("#interpretationsPanel").items.items[i].updateInterpretationPanelItems();	
            			}
            		}
            		
            		// Swop top panel
                	this.up("[xtype='panel']").down('#shareInterpretation').hide();
                	this.up("[xtype='panel']").down('#backToToday').show();

                	// Update canvas with favorite as it was by the time the interpretation was created
            		instanceManager.updateInterpretationFunction(interpretation);
                	uiManager.get('northRegion').cmp.title.setTitle(uiManager.get('northRegion').cmp.title.titleText + ' [' + DateManager.getYYYYMMDD(this.interpretation.created, true) + ']')
            	}
            },
                        
            items: getInterpretationPanelItems(interpretation, this.displayingComments),
	        
	        listeners: {
	        	'render': function(panel) {panel.body.on('click', this.expandComments, this);}, scope:interpretationPanel
	        }
        };
		return interpretationPanel;
	}
	
	// Interpretations Panel when no favorite is loaded
	var noInterpretationsPanel = {
        xtype: 'label',
        text: 'No interpretations',
        cls: 'ns-label-period-heading'
    };
	
	// Main Interpretations Panel Container
    var interpretationsPanel = {
        xtype: 'panel',
        title: '<div class="ns-panel-title-interpretation">Interpretations</div>',
        itemId: 'interpretationsPanel',
        displayingInterpretation: false,
        
        getInterpretationPanel: getInterpretationPanel,
        	            
        addAndUpdateInterpretationsPanel: function(interpretations){
        	
        	// Add Share/Back to Today Panel.
        	// If displayingInterpretation on canvas -> Back to Today
        	// Otherwise -> Share Interpretation
        	this.add({
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                style: 'padding:10px;border-width:0px 0px 1px;border-style:solid;',
                items: [
					{
					    xtype: 'label',
					    itemId: 'backToToday',
					    html: '<< Back to today',
					    cls: 'ns-label-period-heading',
					    style: 'cursor:pointer;color:blue;',
					    hidden: !this.displayingInterpretation,
					    
					    listeners: {
					    	'render': function(label) {
					    	       label.getEl().on('click', function(){instanceManager.getById(instanceManager.getStateCurrent().id);}, label);
					    	    }
					    }
					},
					{
		                xtype: 'label',
		                itemId: 'shareInterpretation',
		                html: 'Share interpretation',
			            cls: 'ns-label-period-heading',
			            style: 'cursor:pointer;color:blue;',
			            hidden: this.displayingInterpretation,
			            
		    	        listeners: {
		    	        	'render': function(label) {
		    	        	       label.getEl().on('click', function(){InterpretationWindow(c).show();}, label);
		    	        	    }
		    	        }
		            }
                ]
            });
        	
        	// Add an interpretation panel per interpretation
        	for (var i=0; i < interpretations.length; i++){
        		this.add(this.getInterpretationPanel(interpretations[i]));
        	}
        },
        
        // By default no interpretations panel is displayed
        items: [noInterpretationsPanel]
    };
	
	/*
	 * RIGHT PANEL CONTAINER
	 */ 
	return Ext.create('Ext.panel.Panel', {
	    region: 'east',
	    border: false,
	    width: uiConfig.west_width + uiManager.getScrollbarSize().width,
	    items: [detailsPanel, interpretationsPanel],
	    setState: function(layout) {
	    	// Remove any previous panel
	    	this.getComponent('interpretationsPanel').removeAll(true);
	    	this.getComponent('detailsPanel').removeAll(true);

	    	// Favorite loaded ->  Add favorite detail panel and update
	    	// Otherwise -> Display No Favorite Panel
	    	if (instanceManager.isStateFavorite() && !instanceManager.isStateDirty()){
	    		this.getComponent('detailsPanel').add(favoriteDetailsPanel);
	    		this.getComponent('detailsPanel').getComponent('favoriteDetailsPanel').updateFavoriteDetailsPanel(layout);
	    	}
	    	else{
	    		this.getComponent('detailsPanel').add(noFavoriteDetailsPanel);
	    	}
	    	
	    	// Favorite loaded with interpretations ->  Add interpretation panel and update
	    	// Otherwise -> Display No Interpretation Panel
	    	if (layout.interpretations != undefined && layout.interpretations.length > 0){
	    		this.getComponent('interpretationsPanel').addAndUpdateInterpretationsPanel(layout.interpretations);
	    	}
	    	else{
	    		this.getComponent('interpretationsPanel').add(noInterpretationsPanel);
	    	}
	    }
	});
}; 
    
    