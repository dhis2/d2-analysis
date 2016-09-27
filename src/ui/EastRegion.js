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
		appManager = c.appManager;
	
	var getInterpretationItemPanel = function(interpretation) {
		
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
											items: [{
											    xtype: 'label',
											    text: comment.user.displayName,
											    style: 'margin-right: 10px; font-weight: bold; color: blue;' 
											},
											{
											    xtype: 'label',
											    text: comment.text,
											}]
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
		
		var isLiked = function(interpretation){
			var userId = appManager.userAccount.id
			for (var i = 0; i < interpretation.likedBy.length; i++){
        		if (interpretation.likedBy[i].id == userId){
        			return true;
        		}
        	}
			return false
		};
		
		var getLikeText = function(interpretation){
			var likeText = isLiked(interpretation)?"Unlike":"Like";
			return likeText;
        };
        
        var likeInterpretation = function(){
        	var that = this;
			if (isLiked(interpretation)){
				Ext.Ajax.request({
	                url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/like'),
	                method: 'DELETE',
	                success: function() {
	                	interpretation.likes--;
	                	for (var i = 0; i < interpretation.likedBy.length; i++){
	                		if (interpretation.likedBy[i].id == appManager.userAccount.id){
	                			interpretation.likedBy.pop(i)
	                			break;
	                		}
	                	}
	                	that.up('#interpretationItem' + interpretation.id).updateInterpretationItemItems(interpretation);
	                }
	            });
			}
			else{
	        	Ext.Ajax.request({
	                url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/like'),
	                method: 'POST',
	                success: function() {
	                	interpretation.likes++;
	                	interpretation.likedBy.push({id: appManager.userAccount.id, displayName: appManager.userAccount.firstName + ' ' + appManager.userAccount.surname});
	                	
	                	that.up('#interpretationItem' + interpretation.id).updateInterpretationItemItems(interpretation);
	                }
	            });
			}
        };
        
        var commentInterpretation = function(f){
        	if (f.getValue().trim() != ''){
        		Ext.Ajax.request({
	                url: encodeURI(appManager.getPath() + '/api/interpretations/' + interpretation.id + '/comments'),
	                method: 'POST',
	                params: f.getValue(),
	                headers: {'Content-Type': 'text/plain'},
	                success: function(obj, _success, r) {
	                	console.log('comment post');
	                	console.log(obj)
	                	console.log(_success)
	                    console.log(r)
	                	
	                    //AQP: We need to update this properly
	                	var currentComment = {}
	                	currentComment['user'] = {}
	                	currentComment['user']['displayName'] = appManager.userAccount.firstName + ' ' + appManager.userAccount.surname
	                	currentComment['lastUpdated'] = new Date();
	                	currentComment['text'] = f.getValue();
	                	interpretation.comments.push(currentComment)
	                	
	                	f.reset();
	                	
	                	f.up('#interpretationItem' + interpretation.id).updateInterpretationItemItems(interpretation);
	                }
	            });
        	}
        };
        
        var getTooltipLike = function(){
        	var toolTipLike = "";
        	for (var i = 0; i < interpretation.likedBy.length; i++){
        		toolTipLike += interpretation.likedBy[i].displayName + "</br>";
        	}
        	return toolTipLike;
        };
        
        var getInterpretationItemItems = function(interpretation, displayingComments){

			var interpretationItemItems = [
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
						            text: getLikeText(interpretation),
						            style: 'margin-right: 5px;cursor:pointer;color:blue;font-weight: bold;',
				                    
						            listeners: {
		    	        	        	'render': function(label) {
		    	        	        	       label.getEl().on('click', likeInterpretation, this);
		    	        	        	       
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
		    	        	        	       label.getEl().on('click', function(){this.up('#interpretationItem' + interpretation.id).down('#commentArea').focus();}, this);
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
			return interpretationItemItems;
        }
        
		var interpretationItem = {
            xtype: 'panel',
            bodyStyle: 'border-style:none',
            style: 'padding:10px',
            instanceManager: instanceManager,
            interpretation: interpretation,
            displayingComments: false,
            itemId: 'interpretationItem' + interpretation.id,
            
            updateInterpretationItemItems: function(interpretation){
            	if (interpretation != undefined){
            		this.interpretation = interpretation;
            	}
            	this.removeAll(true);
            	this.add(getInterpretationItemItems(this.interpretation, this.displayingComments));
            },
            
            expandComments: function(){
            	if(!this.displayingComments){
            		for (var i = 0; i < this.up("#interpretations").items.items.length; i++){
            			if (this.up("#interpretations").items.items[i].interpretation != undefined){
            				this.up("#interpretations").items.items[i].displayingComments = (this.up("#interpretations").items.items[i].id == this.id);
            				this.up("#interpretations").items.items[i].updateInterpretationItemItems();	
            			}
            		}
            		
            		//AQP: This can be improved so we rerender the whole thing
            		// Swope top panel
                	this.up("[xtype='panel']").down('#shareInterpretation').hide();
                	this.up("[xtype='panel']").down('#backToToday').show();

                	var currentLayout = this.instanceManager.getLayout();
                	if (this.interpretation.type == 'CHART'){
                    	var tablePayload = currentLayout.toPlugin($('svg').parent().prop("id"));
                    	tablePayload['url'] = appManager.getPath();
                    	tablePayload['relativePeriodDate'] = this.interpretation.created;
                    	DHIS.getChart(tablePayload);
                	}
                	else if (this.interpretation.type == 'REPORT_TABLE'){
                		//Generate reporttable for this interpretation
                    	//AQP: we should the org unit when user org unit, sub unit or/and sub-x2 unit is selected
                    	var tablePayload = currentLayout.toPlugin($('.pivot').parent().prop("id"));
                    	tablePayload['url'] = appManager.getPath();
                    	tablePayload['relativePeriodDate'] = this.interpretation.created;
                    	DHIS.getTable(tablePayload);
                	}
                	
                	uiManager.get('northRegion').cmp.title.setTitle(uiManager.get('northRegion').cmp.title.titleText + ' [' + DateManager.getYYYYMMDD(this.interpretation.created, true) + ']')
            	}
            },
                        
            items: getInterpretationItemItems(interpretation, this.displayingComments),
	        
	        listeners: {
	        	'render': function(panel) {panel.body.on('click', this.expandComments, this);}, scope:interpretationItem
	        }
        };
		return interpretationItem;
	}
	
	var favouriteDetailsPanel ={
            xtype: 'panel',
            bodyStyle: 'border-style:none',
            style: 'padding:10px',
            itemId: 'favouriteDetailsPanel',
            
            getDescriptionItems: function(description){
            	var descriptionItems = [];
            	
            	var isLongDescription = (description.length > 200);
            	var currentDescription= (isLongDescription)?description.substring(0,200):description;
            	
            	//AQP: Refactor a little bit this code
            	var descriptionLabel = {
                    xtype: 'label',
                    itemId: 'descriptionLabel',
                    html: currentDescription,
                    longDescription: description,
                    shortDescription: description.substring(0, 200),
                    cls: 'ns-label-period-heading'
                };
            	descriptionItems.push(descriptionLabel);
            	
            	if (isLongDescription){
                	descriptionItems.push({
                        xtype: 'label',
                        html: '[<span style="cursor:pointer;color:blue;text-decoration:underline;">more</span>]',
                        moreText: '[<span style="cursor:pointer;color:blue;text-decoration:underline;">more</span>]',
                        lessText: '[<span style="cursor:pointer;color:blue;text-decoration:underline;">less</span>]',
                        cls: 'ns-label-period-heading',
                        isShortDescriptionDisplayed: true,
                        descriptionLabel, descriptionLabel,
                        style: 'margin: 0px 3px;',
                        listeners: {
	        	        	'render': function(label) {
	        	        		label.getEl().on('click', function(){
	        	        			if (this.isShortDescriptionDisplayed){this.up('#descriptionPanel').down('#descriptionLabel').setText(this.descriptionLabel.longDescription,false); this.setText(this.lessText,false)}
	        	        			else{this.up('#descriptionPanel').down('#descriptionLabel').setText(this.descriptionLabel.shortDescription,false); this.setText(this.moreText,false)}
	        	        			this.isShortDescriptionDisplayed = !this.isShortDescriptionDisplayed;
	        	        			this.up('#descriptionPanel').doLayout();
	        	        			}, label);
        	        	    }
	        	        }
                    });
            	}
            	
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
            
            updateFavorites: function(layout){
            	// AQP: This should be replaced by layout.description when api is ready
            	var description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum';
            	this.getComponent('descriptionPanel').add(this.getDescriptionItems(description));
        		this.getComponent('owner').setValue((layout.user != undefined)?layout.user.displayName:'');	
            	this.getComponent('created').setValue(layout.created);
            	this.getComponent('lastUpdated').setValue(layout.lastUpdated);
            	
            	this.getNumberOfViews(layout.id);
            	this.getComponent('sharing').setValue(this.getSharingText(layout));
            },
            
            getSharingText: function(layout){
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
            	//AQP: Create a tooltip
            },
            
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
            
            items: [
				{
				    xtype: 'panel',
				    itemId: 'descriptionPanel',
				    bodyStyle: 'border-style:none',
				    items:[]
				},
				{
		            xtype: 'displayfield',
		            fieldLabel: 'Owner',
		            itemId: 'owner',
		            value: '',
		            style: 'white-space: nowrap;',
		            cls: 'ns-label-period-heading'
		        },
				{
		            xtype: 'displayfield',
		            itemId: 'created',
		            fieldLabel: 'Created',
		            value: '',
		            style: 'white-space: nowrap;',
		            cls: 'ns-label-period-heading'
		        },
				{
		            xtype: 'displayfield',
		            itemId: 'lastUpdated',
		            fieldLabel: 'Last Updated',
		            value: '',
		            style: 'white-space: nowrap;',
		            cls: 'ns-label-period-heading'
		        },
		        {
		            xtype: 'displayfield',
		            itemId: 'numberViews',
		            fieldLabel: 'Number of views',
		            value: "Retrieving number of views...",
		            style: 'white-space: nowrap;',
		            cls: 'ns-label-period-heading'
		        },
				{
		            xtype: 'displayfield',
		            itemId: 'sharing',
		            fieldLabel: 'Sharing [<span style="cursor:pointer;color:blue;text-decoration:underline;">change</span>]',
		            value: '',
		            style: 'white-space: nowrap;',
		            cls: 'ns-label-period-heading',
        	        listeners: {
        	        	'render': function(label) {
        	        		label.getEl().on('click', function(){instanceManager.getSharingById(instanceManager.getStateFavoriteId(), function(r) {SharingWindow(c, r).show();});}, label);
    	        	    }
        	        }
		        }
            ]
        };
	
	var noFavouriteDetailsPanel = {
            xtype: 'label',
            text: 'No current favorite',
            cls: 'ns-label-period-heading'
        };
	
	var details = {
            xtype: 'panel',
            title: '<div class="ns-panel-title-details">Details</div>',
            itemId: 'details',
            items: [
                   noFavouriteDetailsPanel
            ]
        };
	
	var defaultInterpretationItem = {
	                            xtype: 'label',
	                            text: 'No interpretations',
	                            cls: 'ns-label-period-heading'
	                        };

    var interpretations = {
        xtype: 'panel',
        title: '<div class="ns-panel-title-interpretation">Interpretations</div>',
        hideCollapseTool: true,
        itemId: 'interpretations',
        //AQP: We are not using this variable properly
        displayingInterpretation: false,
        
        getInterpretationItemPanel: getInterpretationItemPanel,
        	            
        renderInterpretations: function(interpretations){
        	var shareBackPanel = {
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                style: 'padding:10px;border-width:0px 0px 1px;border-style:solid;',
                items: []
            }
        	
    		shareBackPanel.items.push({
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
            });
    		shareBackPanel.items.push({
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
            });
        	
        	this.add(shareBackPanel);
        	
        	for (var i=0; i < interpretations.length; i++){
        		this.add(this.getInterpretationItemPanel(interpretations[i]));
        	}
        },
        
        items: [
                defaultInterpretationItem
        ]
    };
	
	return Ext.create('Ext.panel.Panel', {
	    region: 'east',
	    border: false,
	    width: uiConfig.west_width + uiManager.getScrollbarSize().width,
	    items: [details,interpretations],
	    setState: function(layout) {
	    	this.getComponent('interpretations').removeAll(true);
	    	this.getComponent('details').removeAll(true);

	    	if (instanceManager.isStateFavorite() && !instanceManager.isStateDirty()){
	    		this.getComponent('details').add(favouriteDetailsPanel);
	    		this.getComponent('details').getComponent('favouriteDetailsPanel').updateFavorites(layout);
	    	}
	    	else{
	    		this.getComponent('details').add(noFavouriteDetailsPanel);
	    	}
	    	
	    	if (layout.interpretations != undefined && layout.interpretations.length > 0){
	    		this.getComponent('interpretations').renderInterpretations(layout.interpretations);
	    	}
	    	else{
	    		this.getComponent('interpretations').add(defaultInterpretationItem);
	    	}
	    }
	});
}; 
    
    