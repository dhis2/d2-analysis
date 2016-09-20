import {DateManager} from '../manager/DateManager.js';
import {InterpretationWindow} from './InterpretationWindow.js';

export var EastRegion;

EastRegion = function(c){
	
	
	var t = this,
		uiManager = c.uiManager,
		uiConfig = c.uiConfig,
		instanceManager = c.instanceManager;
	
	
	
	var getInterpretationItemPanel = function(interpretation) {
		
		var getCommentsPanel = function (comments){
			var commentsPanel = [];
			for (var i=0; i < comments.length; i++){
				var comment = comments[i];
				
				commentsPanel.push({
	                xtype: 'panel',
	                bodyStyle: 'border-style:none',
	                layout: 'column',
	                
	                items: [
							{
								xtype: 'panel',
								bodyStyle: 'border-style:none',
								items: [
								        //AQP: Do they have an avatar in ext?
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
	                ],
	    	        
	    	        listeners: {
	    	            added: function() {
	    	                //accordionPanels.push(this);
	    	            },
	    	            expand: function(p) {
	    	                p.onExpand();
	    	            },
	    	            click: function(){
	    	                	console.log('taka');
	    	            },
	    	            element: 'body'
	    	            
	    	            
	    	        }
	            });
	    	}
			
			return commentsPanel;
		};
		
		
		var interpretationItem = {
	                    xtype: 'panel',
	                    bodyStyle: 'border-style:none',
	                    style: 'padding:10px',
	                    getCommentsPanel: getCommentsPanel,
	                    instanceManager: instanceManager,
	                    interpretation: interpretation,
	                    displayingComments: false,
	                    
	                    displayComment: function(){
	                    	if (!this.displayingComments){
    	                		this.getComponent('comments').show();
    	                	}
	                    	
	                    	//We should check if it is a relative period	                    	
//	                    	var currentLayout = this.instanceManager.getLayout();
//	                    	currentLayout.relativePeriodDate = this.interpretation.created;
//	                    	
//	                    	this.instanceManager.getReport(currentLayout, true);
	                    	

	                    	// we should the org unit when user org unit, sub unit or/and sub-x2 unit is selected
	                    	
//	                    	DHIS.getTable({
//	                    		url: base,
//	                    		el: "table2",
//	                    		columns: [
//	                    		{dimension: "de", items: [{id: "YtbsuPPo010"}, {id: "l6byfWFUGaP"}]}
//	                    		],
//	                    		rows: [
//	                    		{dimension: "pe", items: [{id: "LAST_12_MONTHS"}]}
//	                    		],
//	                    		filters: [
//	                    		{dimension: "ou", items: [{id: "USER_ORGUNIT"}]}
//	                    		],
//	                    		// All following options are optional
//	                    		showTotals: false,
//	                    		showSubTotals: false,
//	                    		hideEmptyRows: true,
//	                    		showHierarchy: true,
//	                    		displayDensity: "comfortable",
//	                    		fontSize: "large",
//	                    		digitGroupSeparator: "comma",
//	                    		legendSet: {id: "BtxOoQuLyg1"}
//	                    		});
	                    },
	                    
	                    items: [
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
			                                cls: 'grey'
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
			                                text: interpretation.likes + " people like this." + interpretation.comments.length + " people commented.",
			                                cls: 'grey'
			                            }
								    ]
								},
	                            {
	                            	xtype: 'panel',
	                            	hidden: true,
	                            	bodyStyle: 'border-style:none',
	                            	itemId: 'comments',
	                            	items: [
	                            	        getCommentsPanel(interpretation.comments)
	                            	]
	                            	
	                            }
	                    ],
	        	        
	        	        listeners: {
	        	        	'render': function(panel) {
	        	        	       panel.body.on('click', this.displayComment, this);
	        	        	    }, scope:interpretationItem
	        	            
	        	        }
	                };
		return interpretationItem;
	}
	
		var favouriteDetailsPanel ={
                xtype: 'panel',
                bodyStyle: 'border-style:none',
                style: 'padding:10px',
                itemId: 'favouriteDetailsPanel',
                hidden: true,
                
                formatDescription: function(description){
                	var formattedDescription = '';
                	if (description.length > 60){
                		formattedDescription = description.substring(0, 60) + 
                		"<span id='extraDescription' style='display:hide'>" + description.substring(60) + "</span>" +
                		"<span id='moreLink'>[<a href='javascript:document.getElementById(\"extraDescription\").style.display=\"block\";document.getElementById(\"lessLink\").style.display=\"block\";document.getElementById(\"moreLink\").style.display=\"none\";'>more</a>]</span>" + 
                		"<span id='lessLink' style='display:none'>[<a href='javascript:document.getElementById('extraDescription').style.display='none';document.getElementById('lessLink').style.display='none';document.getElementById('moreLink').style.display='block';'>less</a>]</span>";
                	}
                	else{
                		formattedDescription = description;
                	}
                	
                	formattedDescription += ' <a href="#">[change]</a>';
                	return formattedDescription;
                	
                },
                
                updateFavorites: function(layout){
                	
                	// AQP: This should be replaced by layout.description when api is ready
                	var description = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum';
                	this.getComponent('description').setText(this.formatDescription(description), false);
                	
                
            		this.getComponent('owner').setValue((layout.user != undefined)?layout.user.displayName:'');	
                	
                	this.getComponent('created').setValue(layout.created);
                	this.getComponent('lastUpdated').setValue(layout.lastUpdated);
                	//this.getComponent('numberViews').setValue(layout.numberViews);
                	
                },
                
                items: [
					{
                        xtype: 'label',
                        itemId: 'description',
                        html: '',
                        cls: 'ns-label-period-heading'
                    },    
					{
			            xtype: 'displayfield',
			            fieldLabel: 'Owner',
			            itemId: 'owner',
			            value: '',
			            cls: 'ns-label-period-heading'
			        },
					{
			            xtype: 'displayfield',
			            itemId: 'created',
			            fieldLabel: 'Created',
			            value: '',
			            cls: 'ns-label-period-heading'
			        },
					{
			            xtype: 'displayfield',
			            itemId: 'lastUpdated',
			            fieldLabel: 'Last Updated',
			            value: '',
			            cls: 'ns-label-period-heading'
			        },
			        {
			            xtype: 'displayfield',
			            itemId: 'numberViews',
			            fieldLabel: 'Number of views',
			            value: '###',
			            cls: 'ns-label-period-heading'
			        },
					{
			            xtype: 'displayfield',
			            itemId: 'sharing',
			            fieldLabel: 'Sharing <a href="#">[change]</a>',
			            value: 'Public XXXX, N Groups',
			            cls: 'ns-label-period-heading'
			        }
                ]
            };
	
	var noFavouriteDetailsPanel = {
            xtype: 'label',
            itemId: 'noFavouriteDetailsPanel',
            text: 'No current favorite',
            cls: 'ns-label-period-heading'
        };
	
	var details = {
            xtype: 'panel',
            title: '<div class="ns-panel-title-details">Details</div>',
            hideCollapseTool: true,
            itemId: 'details',
           
            items: [
                {
                    xtype: 'panel',
                    bodyStyle: 'border-style:none',
                    style: 'margin-top:0px',
                    items: [
                            noFavouriteDetailsPanel, favouriteDetailsPanel
                            
                    ]
                }
            ],
            listeners: {
                added: function() {
                    //accordionPanels.push(this);
                },
                expand: function(p) {
                    p.onExpand();
                }
            }
        };
	
	var defaultInterpretationItem = {
	        xtype: 'panel',
	        hideCollapseTool: true,
	       
	        items: [
	            {
	                xtype: 'panel',
	                bodyStyle: 'border-style:none',
	                items: [
							{
	                            xtype: 'label',
	                            text: 'No interpretations',
	                            cls: 'bold userLink'
	                        }
	                ]
	            }
	        ]
	    };

	    var interpretations = {
	            xtype: 'panel',
	            title: '<div class="ns-panel-title-interpretation">Interpretations</div>',
	            hideCollapseTool: true,
	            itemId: 'interpretations',
	            
	            displayingInterpretation: false,

	            onExpand: function() {
	                var accordionHeight = westRegion.hasScrollbar ? uiConfig.west_scrollbarheight_accordion_period : uiConfig.west_maxheight_accordion_period;

	                accordion.setThisHeight(accordionHeight);

	                uiManager.msSetHeight(
	                    [fixedPeriodAvailable, fixedPeriodSelected],
	                    this,
	                    uiConfig.west_fill_accordion_period
	                );
	            },
	            
	            getInterpretationItemPanel: getInterpretationItemPanel,
	            
	            shareInterpretation: function(){
	            	InterpretationWindow(c).show();
	            },
	            
	            renderInterpretations: function(interpretations){
	            	var shareBackPanel = {
		                xtype: 'panel',
		                bodyStyle: 'border-style:none',
		                style: 'padding:10px;border-width:0px 0px 1px;border-style:solid;',
		                items: []
		            }
	            	
	            	if (this.displayingInterpretation){
	            		shareBackPanel.items.push({
                            xtype: 'label',
                            html: 'Back to today',
    			            cls: 'ns-label-period-heading',
    			            style: 'cursor:pointer;color:blue;text-decoration:underline;',
    			            
    			            listeners: {
    	        	        	'render': function(label) {
    	        	        	       label.getEl().on('click', function(){}, label);
    	        	        	    }
    	        	        }
                        });
	            	}
	            	else{
	            		shareBackPanel.items.push({
                            xtype: 'label',
                            html: 'Share interpretation',
    			            cls: 'ns-label-period-heading',
    			            style: 'cursor:pointer;color:blue;text-decoration:underline;',
    	        	        
    	        	        listeners: {
    	        	        	'render': function(label) {
    	        	        	       label.getEl().on('click', function(){InterpretationWindow(c).show();}, label);
    	        	        	    }
    	        	        }
                        });
	            	}
	            	
	            	this.add(shareBackPanel);
	            	
	            	for (var i=0; i < interpretations.length; i++){
	            		this.add(this.getInterpretationItemPanel(interpretations[i]));
	            	}
	            },
	            
	            items: [
	                    defaultInterpretationItem
	            ],
	            listeners: {
	                added: function() {
	                    //accordionPanels.push(this);
	                },
	                expand: function(p) {
	                    p.onExpand();
	                }
	            }
	        };
	  
	    
	    
	    
	
	return Ext.create('Ext.panel.Panel', {
	    region: 'east',
	    preventHeader: true,
	    collapsible: true,
	    collapseMode: 'mini',
	    border: false,
	    width: uiConfig.west_width + uiManager.getScrollbarSize().width,
	    items: [details,interpretations],
	    setState: function(layout) {
	    	
	    	this.getComponent('interpretations').removeAll(true);
	    	//AQP: Is this the right way?
	    	if (instanceManager.isStateFavorite() && !instanceManager.isStateDirty()){
	    		this.down('#noFavouriteDetailsPanel').hide();
	    		this.down('#favouriteDetailsPanel').updateFavorites(layout);
	    		this.down('#favouriteDetailsPanel').show();
	    		
	    	}
	    	else{
	    		this.down('#noFavouriteDetailsPanel').show();
	    		this.down('#favouriteDetailsPanel').hide();
	    	}
	    	
	    	if (layout.interpretations != undefined && layout.interpretations.length > 0){
	    		this.getComponent('interpretations').renderInterpretations(layout.interpretations);
	    	}
	    	else{
	    		this.getComponent('interpretations').add(defaultInterpretationItem);
	    	}
	    	
	    	//this.getComponent('interpretations').doLayout();
	    }
	
	});






    
    
}; 
    
    