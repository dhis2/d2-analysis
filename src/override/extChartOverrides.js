export var extChartOverrides = function() {

    Ext.override(Ext.chart.Chart, {
        insetPaddingObject: {},

        alignAxes: function() {
            var me = this,
                axes = me.axes,
                legend = me.legend,
                edges = ['top', 'right', 'bottom', 'left'],
                chartBBox,
                insetPadding = me.insetPadding,
                insetPaddingObject = me.insetPaddingObject,
                insets = {
                    top: insetPaddingObject.top || insetPadding,
                    right: insetPaddingObject.right || insetPadding,
                    bottom: insetPaddingObject.bottom || insetPadding,
                    left: insetPaddingObject.left || insetPadding
                };

            function getAxis(edge) {
                var i = axes.findIndex('position', edge);
                return (i < 0) ? null : axes.getAt(i);
            }


            Ext.each(edges, function(edge) {
                var isVertical = (edge === 'left' || edge === 'right'),
                    axis = getAxis(edge),
                    bbox;


                if (legend !== false) {
                    if (legend.position === edge) {
                        bbox = legend.getBBox();
                        insets[edge] += (isVertical ? bbox.width : bbox.height) + insets[edge];
                    }
                }



                if (axis && axis.bbox) {
                    bbox = axis.bbox;
                    insets[edge] += (isVertical ? bbox.width : bbox.height);
                }
            });

            chartBBox = {
                x: insets.left,
                y: insets.top,
                width: me.curWidth - insets.left - insets.right,
                height: me.curHeight - insets.top - insets.bottom
            };
            me.chartBBox = chartBBox;



            axes.each(function(axis) {
                var pos = axis.position,
                    isVertical = (pos === 'left' || pos === 'right');

                axis.x = (pos === 'right' ? chartBBox.x + chartBBox.width : chartBBox.x);
                axis.y = (pos === 'top' ? chartBBox.y : chartBBox.y + chartBBox.height);
                axis.width = (isVertical ? chartBBox.width : chartBBox.height);
                axis.length = (isVertical ? chartBBox.height : chartBBox.width);
            });
        }
    });

    Ext.override(Ext.chart.series.Line, {
        drawSeries: function() {
            var ak=this,au=ak.chart,S=au.axes,ao=au.getChartStore(),V=ao.getCount(),u=ak.chart.surface,am={},R=ak.group,K=ak.showMarkers,aA=ak.markerGroup,D=au.shadow,C=ak.shadowGroups,X=ak.shadowAttributes,O=ak.smooth,q=C.length,ar=["M"],T=["M"],d=["M"],b=["M"],J=au.markerIndex,ai=[].concat(ak.axis),ah,av=[],ag={},aa=[],v={},I=false,Q=[],az=ak.markerStyle,Z=ak.style,t=ak.colorArrayStyle,P=t&&t.length||0,L=Ext.isNumber,aw=ak.seriesIdx,g=ak.getAxesForXAndYFields(),l=g.xAxis,ay=g.yAxis,ac,h,ab,ad,A,c,ae,H,G,f,e,s,r,W,N,M,at,m,F,E,aB,n,p,B,a,Y,af,z,aq,w,ap,o,ax,an,al,U,k,aj;if(ak.fireEvent("beforedraw",ak)===false){return}if(!V||ak.seriesIsHidden){aj=this.items;if(aj){for(N=0,at=aj.length;N<at;++N){if(aj[N].sprite){aj[N].sprite.hide(true)}}}return}an=Ext.apply(az||{},ak.markerConfig);U=an.type;delete an.type;al=Z;if(!al["stroke-width"]){al["stroke-width"]=0.5}if(J&&aA&&aA.getCount()){for(N=0;N<J;N++){E=aA.getAt(N);aA.remove(E);aA.add(E);aB=aA.getAt(aA.getCount()-2);E.setAttributes({x:0,y:0,translate:{x:aB.attr.translation.x,y:aB.attr.translation.y}},true)}}ak.unHighlightItem();ak.cleanHighlights();ak.setBBox();am=ak.bbox;ak.clipRect=[am.x,am.y,am.width,am.height];for(N=0,at=ai.length;N<at;N++){m=S.get(ai[N]);if(m){F=m.calcEnds();if(m.position=="top"||m.position=="bottom"){z=F.from;aq=F.to}else{w=F.from;ap=F.to}}}if(ak.xField&&!L(z)&&(l=="bottom"||l=="top")&&!S.get(l)){m=Ext.create("Ext.chart.axis.Axis",{chart:au,fields:[].concat(ak.xField)}).calcEnds();z=m.from;aq=m.to}if(ak.yField&&!L(w)&&(ay=="right"||ay=="left")&&!S.get(ay)){m=Ext.create("Ext.chart.axis.Axis",{chart:au,fields:[].concat(ak.yField)}).calcEnds();w=m.from;ap=m.to}if(isNaN(z)){z=0;Y=am.width/((V-1)||1)}else{Y=am.width/((aq-z)||(V-1)||1)}if(isNaN(w)){w=0;af=am.height/((V-1)||1)}else{af=am.height/((ap-w)||(V-1)||1)}ak.eachRecord(function(j,x){p=j.get(ak.xField);if(typeof p=="string"||typeof p=="object"&&!Ext.isDate(p)||l&&S.get(l)&&S.get(l).type=="Category"){if(p in ag){p=ag[p]}else{p=ag[p]=x}}B=j.get(ak.yField);if(typeof B=="undefined"||(typeof B=="string"&&!B)){if(Ext.isDefined(Ext.global.console)){Ext.global.console.warn("[Ext.chart.series.Line]  Skipping a store element with an undefined value at ",j,p,B)}return}if(typeof B=="object"&&!Ext.isDate(B)||ay&&S.get(ay)&&S.get(ay).type=="Category"){B=x}Q.push(x);av.push(p);aa.push(B)});at=av.length;if(at>am.width){a=ak.shrink(av,aa,am.width);av=a.x;aa=a.y}ak.items=[];k=0;at=av.length;for(N=0;N<at;N++){p=av[N];B=aa[N];if(B===false){if(T.length==1){T=[]}I=true;ak.items.push(false);continue}else{H=(am.x+(p-z)*Y).toFixed(2);G=((am.y+am.height)-(B-w)*af).toFixed(2);if(I){I=false;T.push("M")}T=T.concat([H,G])}if((typeof r=="undefined")&&(typeof G!="undefined")){r=G;s=H}if(!ak.line||au.resizing){ar=ar.concat([H,am.y+am.height/2])}if(au.animate&&au.resizing&&ak.line){ak.line.setAttributes({path:ar},true);if(ak.fillPath){ak.fillPath.setAttributes({path:ar,opacity:0.2},true)}if(ak.line.shadows){ac=ak.line.shadows;for(M=0,q=ac.length;M<q;M++){h=ac[M];h.setAttributes({path:ar},true)}}}if(K){E=aA.getAt(k++);if(!E){E=Ext.chart.Shape[U](u,Ext.apply({group:[R,aA],x:0,y:0,translate:{x:+(f||H),y:e||(am.y+am.height/2)},value:'"'+p+", "+B+'"',zIndex:4000},an));E._to={translate:{x:+H,y:+G}}}else{E.setAttributes({value:'"'+p+", "+B+'"',x:0,y:0,hidden:false},true);E._to={translate:{x:+H,y:+G}}}}ak.items.push({series:ak,value:[p,B],point:[H,G],sprite:E,storeItem:ao.getAt(Q[N])});f=H;e=G}if(T.length<=1){return}if(ak.smooth){b=Ext.draw.Draw.smooth(T,L(O)?O:ak.defaultSmoothness)}d=O?b:T;if(au.markerIndex&&ak.previousPath){ad=ak.previousPath;if(!O){Ext.Array.erase(ad,1,2)}}else{ad=T}if(!ak.line){ak.line=u.add(Ext.apply({type:"path",group:R,path:ar,stroke:al.stroke||al.fill},al||{}));if(D){ak.line.setAttributes(Ext.apply({},ak.shadowOptions),true)}ak.line.setAttributes({fill:"none",zIndex:3000});if(!al.stroke&&P){ak.line.setAttributes({stroke:t[aw%P]},true)}if(D){ac=ak.line.shadows=[];for(ab=0;ab<q;ab++){ah=X[ab];ah=Ext.apply({},ah,{path:ar});h=u.add(Ext.apply({},{type:"path",group:C[ab]},ah));ac.push(h)}}}if(ak.fill){c=d.concat([["L",H,am.y+am.height],["L",s,am.y+am.height],["L",s,r]]);if(!ak.fillPath){ak.fillPath=u.add({group:R,type:"path",opacity:al.opacity||0.3,fill:al.fill||t[aw%P],path:ar})}}W=K&&aA.getCount();if(au.animate){A=ak.fill;o=ak.line;ae=ak.renderer(o,false,{path:d},N,ao);Ext.apply(ae,al||{},{stroke:al.stroke||al.fill});delete ae.fill;o.show(true);if(au.markerIndex&&ak.previousPath){ak.animation=ax=ak.onAnimate(o,{to:ae,from:{path:ad}})}else{ak.animation=ax=ak.onAnimate(o,{to:ae})}if(D){ac=o.shadows;for(M=0;M<q;M++){ac[M].show(true);if(au.markerIndex&&ak.previousPath){ak.onAnimate(ac[M],{to:{path:d},from:{path:ad}})}else{ak.onAnimate(ac[M],{to:{path:d}})}}}if(A){ak.fillPath.show(true);ak.onAnimate(ak.fillPath,{to:Ext.apply({},{path:c,fill:al.fill||t[aw%P],"stroke-width":0},al||{})})}if(K){k=0;for(N=0;N<at;N++){if(ak.items[N]){n=aA.getAt(k++);if(n){ae=ak.renderer(n,ao.getAt(N),n._to,N,ao);ak.onAnimate(n,{to:Ext.apply(ae,an||{})});n.show(true)}}}for(;k<W;k++){n=aA.getAt(k);n.hide(true)}}}else{ae=ak.renderer(ak.line,false,{path:d,hidden:false},N,ao);Ext.apply(ae,al||{},{stroke:al.stroke||al.fill});delete ae.fill;ak.line.setAttributes(ae,true);if(D){ac=ak.line.shadows;for(M=0;M<q;M++){ac[M].setAttributes({path:d,hidden:false},true)}}if(ak.fill){ak.fillPath.setAttributes({path:c,hidden:false},true)}if(K){k=0;for(N=0;N<at;N++){if(ak.items[N]){n=aA.getAt(k++);if(n){ae=ak.renderer(n,ao.getAt(N),n._to,N,ao);n.setAttributes(Ext.apply(an||{},ae||{}),true);n.show(true)}}}for(;k<W;k++){n=aA.getAt(k);n.hide(true)}}}if(au.markerIndex){if(ak.smooth){Ext.Array.erase(T,1,2)}else{Ext.Array.splice(T,1,0,T[1],T[2])}ak.previousPath=T}ak.renderLabels();ak.renderCallouts();ak.fireEvent("draw",ak);
        }
    });

    Ext.override(Ext.chart.Legend, {
        updatePosition: function() {
            var me = this,
                x, y,
                legendWidth = me.width,
                legendHeight = me.height,
                padding = me.padding,
                chart = me.chart,
                chartBBox = chart.chartBBox,
                insets = chart.insetPadding,
                chartWidth = chartBBox.width - (insets * 2),
                chartHeight = chartBBox.height - (insets * 2),
                chartX = chartBBox.x + insets,
                chartY = chartBBox.y + insets,
                surface = chart.surface,
                mfloor = Math.floor;

            if (me.isDisplayed()) {
                // Find the position based on the dimensions
                switch(me.position) {
                    case "left":
                        x = insets;
                        y = mfloor(chartY + chartHeight / 2 - legendHeight / 2);
                        break;
                    case "right":
                        x = mfloor(surface.width - legendWidth) - insets;
                        y = mfloor(chartY + chartHeight / 2 - legendHeight / 2);
                        break;
                    case "top":
                        x = mfloor((chartX + chartBBox.width) / 2 - legendWidth / 2) - 7;
                        y = insets;
                        break;
                    case "bottom":
                        x = mfloor(chartX + chartWidth / 2 - legendWidth / 2);
                        y = mfloor(surface.height - legendHeight) - insets;
                        break;
                    default:
                        x = mfloor(me.origX) + insets;
                        y = mfloor(me.origY) + insets;
                }
                me.x = x;
                me.y = y;

                // Update the position of each item
                Ext.each(me.items, function(item) {
                    item.updatePosition();
                });
                // Update the position of the outer box
                me.boxSprite.setAttributes(me.getBBox(), true);
            }
        }
    });

    Ext.override(Ext.chart.LegendItem, {
        createLegend: function(config) {
            var me = this,
                index = config.yFieldIndex,
                series = me.series,
                seriesType = series.type,
                idx = me.yFieldIndex,
                legend = me.legend,
                surface = me.surface,
                refX = legend.x + me.x,
                refY = legend.y + me.y,
                bbox, z = me.zIndex,
                markerConfig, label, mask,
                radius, toggle = false,
                seriesStyle = Ext.apply(series.seriesStyle, series.style),
                labelMarkerSize = legend.labelMarkerSize || 10;

            function getSeriesProp(name) {
                var val = series[name];
                return (Ext.isArray(val) ? val[idx] : val);
            }

            label = me.add('label', surface.add({
                type: 'text',
                x: 30,
                y: 0,
                zIndex: z || 0,
                font: legend.labelFont,
                fill: legend.labelColor || '#000',
                text: getSeriesProp('title') || getSeriesProp('yField')
            }));

            if (seriesType === 'line' || seriesType === 'scatter') {
                if (seriesType === 'line') {
                    me.add('line', surface.add({
                        type: 'path',
                        path: 'M0.5,0.5L16.5,0.5',
                        zIndex: z,
                        "stroke-width": series.lineWidth,
                        "stroke-linejoin": "round",
                        "stroke-dasharray": series.dash,
                        stroke: seriesStyle.stroke || '#000',
                        style: {
                            cursor: 'pointer'
                        }
                    }));
                }
                if (series.showMarkers || seriesType === 'scatter') {
                    markerConfig = Ext.apply(series.markerStyle, series.markerConfig || {});
                    me.add('marker', Ext.chart.Shape[markerConfig.type](surface, {
                        fill: markerConfig.fill,
                        x: 8.5,
                        y: 0.5,
                        zIndex: z,
                        radius: markerConfig.radius || markerConfig.size,
                        style: {
                            cursor: 'pointer'
                        }
                    }));
                }
            }
            else {
                me.add('box', surface.add({
                    type: 'rect',
                    zIndex: z,
                    x: 6,
                    y: 0,
                    width: labelMarkerSize,
                    height: labelMarkerSize,
                    fill: series.getLegendColor(index),
                    style: {
                        cursor: 'pointer'
                    }
                }));
            }

            me.setAttributes({
                hidden: false
            }, true);

            bbox = me.getBBox();

            mask = me.add('mask', surface.add({
                type: 'rect',
                x: bbox.x,
                y: bbox.y,
                width: bbox.width || 20,
                height: bbox.height || 20,
                zIndex: (z || 0) + 1000,
                fill: '#f00',
                opacity: 0,
                style: {
                    'cursor': 'pointer'
                }
            }));


            me.on('mouseover', function() {
                label.setStyle({
                    'font-weight': 'bold'
                });
                mask.setStyle({
                    'cursor': 'pointer'
                });
                series._index = index;
                series.highlightItem();
            }, me);

            me.on('mouseout', function() {
                label.setStyle({
                    'font-weight': 'normal'
                });
                series._index = index;
                series.unHighlightItem();
            }, me);

            if (!series.visibleInLegend(index)) {
                toggle = true;
                label.setAttributes({
                   opacity: 0.5
                }, true);
            }

            me.on('mousedown', function() {
                if (!toggle) {
                    series.hideAll();
                    label.setAttributes({
                        opacity: 0.5
                    }, true);
                } else {
                    series.showAll();
                    label.setAttributes({
                        opacity: 1
                    }, true);
                }
                toggle = !toggle;
            }, me);
            me.updatePosition({x:0, y:0});
        }
    });

    Ext.override(Ext.chart.axis.Axis, {
        drawHorizontalLabels: function() {
            var me = this,
                labelConf = me.label,
                floor = Math.floor,
                max = Math.max,
                axes = me.chart.axes,
                position = me.position,
                inflections = me.inflections,
                ln = inflections.length,
                labels = me.labels,
                labelGroup = me.labelGroup,
                maxHeight = 0,
                ratio,
                gutterY = me.chart.maxGutter[1],
                ubbox, bbox, point, prevX, prevLabel,
                projectedWidth = 0,
                textLabel, attr, textRight, text,
                label, last, x, y, i, firstLabel;

            last = ln - 1;
            // get a reference to the first text label dimensions
            point = inflections[0];
            firstLabel = me.getOrCreateLabel(0, me.label.renderer(labels[0]));
            ratio = Math.floor(Math.abs(Math.sin(labelConf.rotate && (labelConf.rotate.degrees * Math.PI / 180) || 0)));

            for (i = 0; i < ln; i++) {
                point = inflections[i];
                text = me.label.renderer(labels[i]) || '';
                textLabel = me.getOrCreateLabel(i, text);
                bbox = textLabel._bbox;
                maxHeight = max(maxHeight, bbox.height + me.dashSize + me.label.padding);
                x = floor(point[0] - (ratio? bbox.height : bbox.width) / 2);
                if (me.chart.maxGutter[0] == 0) {
                    if (i == 0 && axes.findIndex('position', 'left') == -1) {
                        x = point[0];
                    }
                    else if (i == last && axes.findIndex('position', 'right') == -1) {
                        x = point[0] - bbox.width;
                    }
                }
                if (position == 'top') {
                    y = point[1] - (me.dashSize * 2) - me.label.padding - (bbox.height / 2);
                }
                else {
                    y = point[1] + (me.dashSize * 2) + me.label.padding + (bbox.height / 2);
                }

                var moveLabels = labelConf.rotate && labelConf.rotate.degrees && !Ext.Array.contains([0,90,180,270,360], labelConf.rotate.degrees),
                    adjust = Math.floor((textLabel.text.length - 12) * -1 * 0.75),
                    newX = moveLabels ? point[0] - textLabel._bbox.width + adjust: x;

                textLabel.setAttributes({
                    hidden: false,
                    x: newX,
                    y: y
                }, true);

                // skip label if there isn't available minimum space
                if (i != 0 && (me.intersect(textLabel, prevLabel)
                    || me.intersect(textLabel, firstLabel))) {
                    textLabel.hide(true);
                    continue;
                }

                prevLabel = textLabel;
            }

            return maxHeight;
        }
    });

    Ext.override(Ext.chart.axis.Radial, {
        drawLabel: function() {
            var chart = this.chart,
                surface = chart.surface,
                bbox = chart.chartBBox,
                store = chart.store,
                centerX = bbox.x + (bbox.width / 2),
                centerY = bbox.y + (bbox.height / 2),
                rho = Math.min(bbox.width, bbox.height) /2,
                max = Math.max, round = Math.round,
                labelArray = [], label,
                fields = [], nfields,
                categories = [], xField,
                aggregate = !this.maximum,
                maxValue = this.maximum || 0,
                steps = this.steps, i = 0, j, dx, dy,
                pi2 = Math.PI * 2,
                cos = Math.cos, sin = Math.sin,
                display = this.label.display,
                draw = display !== 'none',
                margin = 10,

                labelColor = '#333',
                labelFont = 'normal 9px sans-serif',
                seriesStyle = chart.seriesStyle;

            labelColor = seriesStyle ? seriesStyle.labelColor : labelColor;
            labelFont = seriesStyle ? seriesStyle.labelFont : labelFont;

            if (!draw) {
                return;
            }

            //get all rendered fields
            chart.series.each(function(series) {
                fields.push(series.yField);
                xField = series.xField;
            });

            //get maxValue to interpolate
            store.each(function(record, i) {
                if (aggregate) {
                    for (i = 0, nfields = fields.length; i < nfields; i++) {
                        maxValue = max(+record.get(fields[i]), maxValue);
                    }
                }
                categories.push(record.get(xField));
            });
            if (!this.labelArray) {
                if (display != 'categories') {
                    //draw scale
                    for (i = 1; i <= steps; i++) {
                        label = surface.add({
                            type: 'text',
                            text: round(i / steps * maxValue),
                            x: centerX,
                            y: centerY - rho * i / steps,
                            'text-anchor': 'middle',
                            'stroke-width': 0.1,
                            stroke: '#333',
                            fill: labelColor,
                            font: labelFont
                        });
                        label.setAttributes({
                            hidden: false
                        }, true);
                        labelArray.push(label);
                    }
                }
                if (display != 'scale') {
                    //draw text
                    for (j = 0, steps = categories.length; j < steps; j++) {
                        dx = cos(j / steps * pi2) * (rho + margin);
                        dy = sin(j / steps * pi2) * (rho + margin);
                        label = surface.add({
                            type: 'text',
                            text: categories[j],
                            x: centerX + dx,
                            y: centerY + dy,
                            'text-anchor': dx * dx <= 0.001? 'middle' : (dx < 0? 'end' : 'start'),
                            fill: labelColor,
                            font: labelFont
                        });
                        label.setAttributes({
                            hidden: false
                        }, true);
                        labelArray.push(label);
                    }
                }
            }
            else {
                labelArray = this.labelArray;
                if (display != 'categories') {
                    //draw values
                    for (i = 0; i < steps; i++) {
                        labelArray[i].setAttributes({
                            text: round((i + 1) / steps * maxValue),
                            x: centerX,
                            y: centerY - rho * (i + 1) / steps,
                            'text-anchor': 'middle',
                            'stroke-width': 0.1,
                            stroke: '#333',
                            fill: labelColor,
                            font: labelFont
                        }, true);
                    }
                }
                if (display != 'scale') {
                    //draw text
                    for (j = 0, steps = categories.length; j < steps; j++) {
                        dx = cos(j / steps * pi2) * (rho + margin);
                        dy = sin(j / steps * pi2) * (rho + margin);
                        if (labelArray[i + j]) {
                            labelArray[i + j].setAttributes({
                                type: 'text',
                                text: categories[j],
                                x: centerX + dx,
                                y: centerY + dy,
                                'text-anchor': dx * dx <= 0.001? 'middle' : (dx < 0? 'end' : 'start'),
                                fill: labelColor,
                                font: labelFont
                            }, true);
                        }
                    }
                }
            }
            this.labelArray = labelArray;
        }
    });
};
