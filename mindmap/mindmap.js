
(function( $ ){


    var counter = 0;
    var getUniqId = function() {
        counter++;
        var d = new Date();
        return "n_"+counter+"_"+d.getTime();
    };

    var activateNode = function(id) {
    	$('.mindmapnode').removeClass('nodeactive');
        this.activeObj = $('#'+id);
        this.activeObj.addClass("nodeactive");
    };


    var moveAbove = function(id, dx, dy) {
        for(var i=0;i<this.edges.length;i++) {
            if(this.edges[i].from == id) {
                var myid = this.edges[i].to;
                this.nodes[myid].x += dx;
                this.nodes[myid].y += dy;
                moveAbove.call(this, this.edges[i].to, dx, dy);
            }
        }
    };

    var deleteAbove = function(id) {
        for(var i=0;i<this.edges.length;i++) {
            if(this.edges[i].from == id) {
                var myid = this.edges[i].to;
                deleteAbove.call(this, this.edges[i].to);
                this.edges[i].from = '-';
            }
        }
    };
    
    var getParent = function(id) {
    	    for(var i=0;i<this.edges.length;i++) {
		    if(this.edges[i].to == id) {
			    return this.edges[i].from; 
		    }
	    }
    };
    
    var addNewNode = function() {

        if(this.activeObj=="") {
            alert(MMLang.Kein_Objekt_aktiv+'!');
            return;
        }

        idFrom = this.activeObj.attr('id');

        xx = this.nodes[idFrom].x;
        yy = this.nodes[idFrom].y + Math.round(Math.random()*200-100);
        
        if(xx>0) xx += 100; else xx -= 300;
        
        
        var idTo = getUniqId();
        this.nodes[idTo] = {
            "id": idTo,
            "title": MMLang.neuer_Knotenpunkt,
            "infotext": "",
            "bgcolor" : "#ffffff",
            "fgcolor" : "#000000",
            "bordercolor" : "#999999",
            "borderwidth" : 1,
            "bordertype" : 'rund',
            "arrowtype": 'ende',
            "fontsize": 12,
            "linktype": '',
            "linktarget": '',
            "x": xx,
            "y": yy
        };

        this.edges.push({
            "from": idFrom, 
            "to": idTo
        });
        
        return idTo;
    };
    
    var rebuildJSON = function() {
    	    this.json = JSON.stringify({"edges": this.edges, "nodes": this.nodes});
    	    
    };

    var appendNode = function(mindmap, id, text, xx, yy, opts) {
                
                if(typeof(opts)=="undefined") opts = {};
        
                opts = $.extend( {"fgcolor":"#000000", 
                                  "bgcolor":"#ffffff", 
                                  "bordercolor":"#999999", 
                                  "borderwidth":1, 
                                  "bordertype":"rund",
                                  "arrowtype": "ende",
                                  "fontsize": 12  }, opts);
        
    	    	var idTo = getUniqId();
		mindmap.nodes[idTo] = {
		    "id": idTo,
		    "title": text,
		    "infotext": "",
                    "fgcolor": opts.fgcolor,
                    "bgcolor": opts.bgcolor,
                    "bordercolor" : opts.bordercolor,
                    "borderwidth" : opts.borderwidth,
                    "bordertype" : opts.bordertype,
                    "arrowtype": opts.arrowtype,
                    "fontsize": opts.fontsize,
		    "x": xx,
		    "y": yy
		};
	
		mindmap.edges.push({
		    "from": id, 
		    "to": idTo
		});    
		return idTo;
    };
    
    var changeNodeText = function(id, text, textta, opts) {
    	    
            if(typeof(opts)=="undefined") opts = {};
            opts = $.extend( {"fgcolor":"#000000", 
                              "bgcolor":"#ffffff", 
                              "bordercolor" : "#999999",
                              "borderwidth" : 1,
                              "bordertype" : 'rund',
                              "arrowtype": 'ende',
                              "fontsize": 12,
                              "linktype": '',
                              "linktarget": ''
            		}, opts);
            
    	    if(text.indexOf('&&')) {
    	    	    var T = text.split("&&");
    	    	    
    	    	    xx = this.nodes[id].x;
    	    	    yy = this.nodes[id].y + Math.round(Math.random()*200-100);
    	    	    if(xx>0) xx += 100; else xx -= 200;
    	    	    
    	    	    var lastID = id;
    	    	    for(var i=1;i<T.length;i++) {
    	    	    	    	lastID = appendNode(this, lastID, T[i], xx, yy, opts);
				xx += 150;
    	    	    }
    	    	    text = T[0];
    	    }
    	    if(text.indexOf('||')) {
    	    	    var T = text.split("||");
    	    	    
    	    	    xx = this.nodes[id].x;
    	    	    yy = this.nodes[id].y + Math.round(Math.random()*200-100);
    	    	    if(xx>0) xx += 100; else xx -= 200;
    	    	    
    	    	    var lastID = getParent.call(this, id);
    	    	    for(var i=1;i<T.length;i++) {
    	    	    	    	appendNode(this, lastID, T[i], xx, yy, opts);
				yy += 50;
    	    	    }
    	    	    text = T[0];
    	    }    	    
    	    
        this.nodes[id].title = text;
        this.nodes[id].infotext = textta;
        
        this.nodes[id].bgcolor= opts.bgcolor;
        this.nodes[id].fgcolor= opts.fgcolor;
        this.nodes[id].bordercolor= opts.bordercolor;
        this.nodes[id].borderwidth= opts.borderwidth;
        this.nodes[id].bordertype= opts.bordertype;
        this.nodes[id].arrowtype= opts.arrowtype;
        this.nodes[id].fontsize= opts.fontsize;
        this.nodes[id].linktype= opts.linktype;
        this.nodes[id].linktarget= opts.linktarget;
        
        this.disableRebuild--;
    };

    var centerMindmap = function(id) {
    	    this.left = -(5000+this.nodes[id].x-this.width/2)-100;
	    this.top = -(5000+this.nodes[id].y-this.height/4);
	    
	    
	    this.area.animate( {
			    'left': this.left,
			    'top': this.top
	    } );
    };

    var highlightNode = function( obj) {
        var p = obj.position();
        $('.highlighbox').remove();
        
        var div = '<div class="highlighbox" ';
        div +=' style="position:absolute;left:'+(p.left-15)+'px;top:'+(p.top-15)+'px;width:'+(obj.outerWidth()+30)+'px;height:'+(obj.outerHeight()+30)+'px;z-index:19;background-color:silver;opacity:0.5;"></div>';
        $(this.area).append(div);
        
    };

	var nodeMove = function(mindmap, e) {
		
	    if(mindmap.disableRebuild>0) return;
	
	    mindmap.objactive = "node";
	    mindmap.nodemove = $(this).position();
	    mindmap.activeObj = $(this);
	    
	    
            
        
	    var positionProvider;
	    if (typeof e.originalEvent.touches != 'undefined') {
		positionProvider = e.originalEvent.touches[0];
	    }
	    else {
		positionProvider = e.originalEvent;
	    }
	
	    mindmap.nodestartpos = {
		"left":positionProvider.clientX, 
		"top":positionProvider.clientY
	    };
	    e.preventDefault();
	    
	    $(document).bind('mousemove.nodedragging touchmove.nodedragging', function(e) {
		e.preventDefault();
		var positionProvider;
		if (typeof e.originalEvent.touches != 'undefined') {
		    positionProvider = e.originalEvent.touches[0];
		}
		else {
		    positionProvider = e.originalEvent;
		}
	
		var dx = positionProvider.clientX-mindmap.nodestartpos.left;
		var dy = positionProvider.clientY-mindmap.nodestartpos.top;
		mindmap.activeObj.css('left', mindmap.nodemove.left*1+dx*1).css('top', mindmap.nodemove.top*1+dy*1);
		
                $('.highlighbox').remove();
		
		
		
	    });
	    $(document).bind('mouseup.nodedragging touchend.nodedragging', function(e) {
		mindmap.objactive = "";
		$(document).unbind('.nodedragging');
		id = mindmap.activeObj.attr('id');
		var xy = mindmap.activeObj.position();
	
		var dx = (xy.left-5000) - mindmap.nodes[id].x;
		var dy = (xy.top-5000) - mindmap.nodes[id].y;
	
		mindmap.nodes[id].x = Math.round(xy.left-5000);
		mindmap.nodes[id].y = Math.round(xy.top-5000);
	
		moveAbove.call(mindmap, id, Math.round(dx), Math.round(dy));
	
		rebuildTree.call(this,mindmap);
                
                highlightNode.call(mindmap, mindmap.activeObj);
                
	    });
	};


	var addLernstand = function(lernstand) {
		var all = ["completed", "in_progress", "failed", "not_attempted"];
		if(typeof(lernstand)=="undefined" || lernstand==null || lernstand=="" || all.indexOf(lernstand)==-1) return "";

		if(lernstand=="in_progress") lernstand = "incomplete";

		var res = '<div style="width: 0;height:0;float:left;position:relative;left:-12px;top:-15px;">';
		res += '<img src="./templates/default/images/scorm/'+lernstand+'.svg" style="width:18px;height:18px;">';
		res += '</div>';
		return res;
	}


	var rebuildTree = function(mindmap) {

	rebuildJSON.call(mindmap);
	    
	if(mindmap.disableRebuild>0) return;

	var idActive = "";
	if(mindmap.activeObj!="") {
	    idActive = mindmap.activeObj.attr('id');
	}

	$('.mindmapnode').remove();


	var v = mindmap.nodes['root'].title;
	var info = mindmap.nodes['root'].infotext+"";
	    if(info=="undefined") info = "";
	    if(info!="") {
		    v += "<span class='simpletip'>";
			v += "&nbsp;*";
			v += "<div style='display:none;'>"+nl2br(info)+"</div>";
			v += "</span>";
	    }
	var lernstand = mindmap.nodes['root'].lernstand+"";
	v += addLernstand(lernstand);
	
	var  M = $('<div></div>');
             M.attr('id', mindmap.nodes['root'].id)
                     .addClass('mindmapnode')
                     .addClass('rootnode')
                     .css('left', 5000+mindmap.nodes['root'].x)
                     .css('top', 5000+mindmap.nodes['root'].y)
                         .css('background-color', mindmap.nodes['root'].bgcolor)
                         .css('color', mindmap.nodes['root'].fgcolor)
                         .css('border-color', mindmap.nodes['root'].bordercolor)
                         .css('border-width', mindmap.nodes['root'].borderwidth+"px")
                         .css('font-size', mindmap.nodes['root'].fontsize+"px")
                     .append(v);
	
        if( mindmap.nodes['root'].bordertype=="eckig" ) M.css("border-radius", "0");
        if( mindmap.nodes['root'].bordertype=="rund2" ) M.css("border-radius", "20px");
        if( mindmap.nodes['root'].bordertype=="unterstrich" ) M.css("border-radius", "0").css("border-top-width", 0).css("border-left-width", 0).css("border-right-width", 0).css("background-color", 'transparent');
        
	mindmap.area.append(M);
	
	M.bind('click', function() {
	    mindmap.activeObj = $(this);	    
            
	    
	    
            highlightNode.call(mindmap, $(this) );
	});



	for(var i=0;i<mindmap.edges.length;i++) {
	    var v = mindmap.nodes[mindmap.edges[i].to].title;
	    
            if(typeof(mindmap.nodes[mindmap.edges[i].to].fgcolor)=="undefined") mindmap.nodes[mindmap.edges[i].to].fgcolor = "#000000";
            if(typeof(mindmap.nodes[mindmap.edges[i].to].bgcolor)=="undefined") mindmap.nodes[mindmap.edges[i].to].bgcolor = "#ffffff";
            if(typeof(mindmap.nodes[mindmap.edges[i].to].bordercolor)=="undefined") mindmap.nodes[mindmap.edges[i].to].bordercolor = "#999999";
            if(typeof(mindmap.nodes[mindmap.edges[i].to].borderwidth)=="undefined") mindmap.nodes[mindmap.edges[i].to].borderwidth = 1;
            if(typeof(mindmap.nodes[mindmap.edges[i].to].bordertype)=="undefined") mindmap.nodes[mindmap.edges[i].to].bordertype = 'rund';
            if(typeof(mindmap.nodes[mindmap.edges[i].to].arrowtype)=="undefined") mindmap.nodes[mindmap.edges[i].to].arrowtype = 'ende';
            if(typeof(mindmap.nodes[mindmap.edges[i].to].fontsize)=="undefined") mindmap.nodes[mindmap.edges[i].to].fontsize = 12;
            
	    var info = mindmap.nodes[mindmap.edges[i].to].infotext+"";
	    if(info=="undefined") info = "";
	    if(info!="") {
	    	    v += "<span class='simpletip'>";
				v += "&nbsp;*";
				v += "<div style='display:none;'>"+nl2br(info)+"</div>";
				v += "</span>";
	    }


	    if(!mindmap.editable) {

			if(mindmap.nodes[mindmap.edges[i].to].linktype) {
				var lernstand = mindmap.nodes[mindmap.edges[i].to].lernstand + "";
				v += addLernstand(lernstand);
			}

			if(mindmap.nodes[mindmap.edges[i].to].linktype=="extern") {
			    v = "<a href='"+mindmap.nodes[mindmap.edges[i].to].linktarget+"' target='_blank' style='text-decoration: none; border-bottom:1px solid;'>"+v+"</a>";
		    } else if(mindmap.nodes[mindmap.edges[i].to].linktype=="intern" || mindmap.nodes[mindmap.edges[i].to].linktype=="lernstand") {
			    if(typeof(internlinks[mindmap.nodes[mindmap.edges[i].to].linktarget])!="undefined") {
				    v = "<a href='"+internlinks[mindmap.nodes[mindmap.edges[i].to].linktarget]+"' style='text-decoration: none; border-bottom:1px dashed;'>"+v+"</a>";
			    }
		    }
	    } else {

			if(mindmap.nodes[mindmap.edges[i].to].linktype) {
				var lernstand = mindmap.nodes[mindmap.edges[i].to].lernstand + "";
				v += addLernstand("not_attempted");
			}

		    if(mindmap.nodes[mindmap.edges[i].to].linktype=="extern") {
			    v = "<span style='text-decoration: none; border-bottom:1px solid;'>"+v+"</span>";
		    } else if(mindmap.nodes[mindmap.edges[i].to].linktype=="intern" || mindmap.nodes[mindmap.edges[i].to].linktype=="lernstand") {
			    v = "<span style='text-decoration: none; border-bottom:1px dashed;'>"+v+"</span>";
		    }
	    }
	    
	    var  M = $('<div></div>');
                 M.attr('id', mindmap.nodes[mindmap.edges[i].to].id)
                         .addClass('mindmapnode')
                         .css('left', 5000+mindmap.nodes[mindmap.edges[i].to].x)
                         .css('top', 5000+mindmap.nodes[mindmap.edges[i].to].y)
                         .css('background-color', mindmap.nodes[mindmap.edges[i].to].bgcolor)
                         .css('color', mindmap.nodes[mindmap.edges[i].to].fgcolor)
                         .css('border-color', mindmap.nodes[mindmap.edges[i].to].bordercolor)
                         .css('border-width', mindmap.nodes[mindmap.edges[i].to].borderwidth+"px")
                         .css('font-size', mindmap.nodes[mindmap.edges[i].to].fontsize+"px")
                         .append( v  );
                  if(mindmap.nodes[mindmap.edges[i].to].bordertype=="eckig") M.css('border-radius', "0");
                  if(mindmap.nodes[mindmap.edges[i].to].bordertype=="rund2") M.css('border-radius', "20px");
                  if(mindmap.nodes[mindmap.edges[i].to].bordertype=="unterstrich") M.css('border-radius', "0").css("border-top-width", 0).css("border-left-width", 0).css("border-right-width", 0).css("background-color", 'transparent');
                  
                  
	    mindmap.area.append(M);
	    if(mindmap.editable) {
	    	    M.bind('mousedown touchstart', function(e) { nodeMove.call(this,mindmap,e);} );
	    }

	}
	
    /*    
	$('.simpletip').each( function() {
			var c = $(this).find('div').html();
			c = "<div style='position:relative;width:0;height:0;'><div style='background-color:white;border: solid 1px gray; padding:3px;font-size: 7pt;width: 100px;'>"+c+"</div></div>";
			$(this).simpletip({'content': c});
	});
	*/
	$('.simpletip').each(function() {
			var $this = this;
			$(this).closest(".mindmapnode").on("mouseover", function(e) {
					//console.log(e.pageX);
					var pos = $($this).offset();
					//console.log(pos);
					/*
					$($this).find("div").css("position", "absolute")
									    .css("display", "block")
									    .css("left", e.pageX)
									    .css("top", e.pageY)
									    .css("width", 100)
									    .css("z-index", 10000);
					*/		
					$('.tooltips').remove();
					var X = pos.left+10;
					var Y = pos.top+10;
					var txt = $($this).find("div").html();
					var id = 'tooltip'+(new Date()).getTime();
					var html = "<div id='"+id+"' class='tooltips' style='";
					html += "position: absolute;";
					html += "display:block;";
					html += "max-width: 150px;";
					html += "left:"+X+"px;";
					html += "top:"+Y+"px;";
					html += "z-index:10000;";
					html += "padding: 5px 10px;";
					html += "background-color: white;";
					html += "border-radius: 5px;";
					html += "font-size: 0.8em;";
					html += "border: 1px solid gray;";
					html += "'>"+txt+"</div>";
					$("body").append(html);
					
					$(this).on("mouseout", function(e) {
							$('#'+id).remove();
							$('.tooltips').remove();
					});
							
			});
	});
	

	redrawLines.call(mindmap);

	if(idActive!='') {
	    activateNode.call(mindmap, idActive);
	}
    };	
	
    var redrawLines = function() {

    	    var isIE = false;
    	    var ua = window.navigator.userAgent;
            var msie = ua.indexOf("MSIE ");
            if (msie > 0) {
            	    isIE = true;
            }
    	    
    	if(!this.mycontext  || this.mycontext==null || isIE) { // $.browser.msie==true
    		var D = (new Date()).getTime();
    		
    		var edges = "";
    		var arrows = "";
    		for(var i=0;i<this.edges.length;i++) {
    			var from = this.edges[i].from;
    			var to = this.edges[i].to;
	
    			var startX = 5000+this.nodes[from].x + $('#'+from).outerWidth()/2;
    			var startY = 5000+this.nodes[from].y + $('#'+from).outerHeight()/2;
	
    			var endX = 5000+this.nodes[to].x + $('#'+to).outerWidth()/2;
    			var endY = 5000+this.nodes[to].y + $('#'+to).outerHeight()/2;
					
    			
    			
		
			    var dx = -startX + endX;
			    var dy = -startY + endY;
		
		
			    if(endY>startY && Math.abs(dy) > Math.abs(dx)) {
				startY += $('#'+from).outerHeight()/2; 
			    } else if(endY<startY && Math.abs(dy) > Math.abs(dx)) {
				startY -= $('#'+from).outerHeight()/2;
			    } 
		
			    if(endX>startX && Math.abs(dx) > Math.abs(dy)) {
				startX += $('#'+from).outerWidth()/2; 
				
			    } else if(endX<startX && Math.abs(dx) > Math.abs(dy)) {
				startX -= $('#'+from).outerWidth()/2;
				
			    }
			    
			    if(endX>startX && Math.abs(dx) > Math.abs(dy)) {
				endX -= $('#'+to).outerWidth()/2;
				
			    } else if(endX<startX && Math.abs(dx) > Math.abs(dy)) {
				endX += $('#'+to).outerWidth()/2; //+12;
				
			    }
		
			    if(endY>startY && Math.abs(dy) > Math.abs(dx)) {
				endY -= $('#'+to).outerHeight()/2;
				
			    } else if(endY<startY && Math.abs(dy) > Math.abs(dx)) {
				endY += $('#'+to).outerHeight()/2; 
				
			    }
    			
    			if(edges!="") edges += ",";
    			edges += startX+","+startY+","+endX+","+endY
    			
    			if(arrows!="") arrows += ",";
    			arrows += this.nodes[to].arrowtype;
    		}
    		
    		
    		$('.mindmapbackground').css("background-image", "url(Customizing/global/plugins/Services/Repository/RepositoryObject/Mindmap/mindmap/background.php?edges="+edges+"&arrows="+arrows+")");
    		// @todo Linien ohne Canvas zeichnen.
    		return;
    	}
    		
	this.mycontext.clearRect(0,0,10000,10000);

	for(var i=0;i<this.edges.length;i++) {

	    var from = this.edges[i].from;
	    var to = this.edges[i].to;

	    var startX = 5000+this.nodes[from].x + $('#'+from).outerWidth()/2;
	    var startY = 5000+this.nodes[from].y + $('#'+from).outerHeight()/2;

	    var endX = 5000+this.nodes[to].x + $('#'+to).outerWidth()/2;
	    var endY = 5000+this.nodes[to].y + $('#'+to).outerHeight()/2;



	    var dx = -startX + endX;
	    var dy = -startY + endY;


            if(endY>startY && Math.abs(dy) > Math.abs(dx)) {
                startY += $('#'+from).outerHeight()/2; 
            } else if(endY<startY && Math.abs(dy) > Math.abs(dx)) {
                startY -= $('#'+from).outerHeight()/2;
            } 

            if(endX>startX && Math.abs(dx) > Math.abs(dy)) {
                startX += $('#'+from).outerWidth()/2; 
                
            } else if(endX<startX && Math.abs(dx) > Math.abs(dy)) {
                startX -= $('#'+from).outerWidth()/2;
                
            }
            
            if(endX>startX && Math.abs(dx) > Math.abs(dy)) {
                endX -= $('#'+to).outerWidth()/2;
                
            } else if(endX<startX && Math.abs(dx) > Math.abs(dy)) {
                endX += $('#'+to).outerWidth()/2; //+12;
                
            }

            if(endY>startY && Math.abs(dy) > Math.abs(dx)) {
                endY -= $('#'+to).outerHeight()/2;
                
            } else if(endY<startY && Math.abs(dy) > Math.abs(dx)) {
                endY += $('#'+to).outerHeight()/2; 
                
            }

	    var dx = -startX + endX;
	    var dy = -startY + endY;


	    var len = Math.sqrt(dx*dx + dy*dy);

	    if(startY>endY && startX<endX || startY<endY && startX>endX ) {
		var rdx = dy / len;
		var rdy = -dx / len;
	    } else {
		var rdx = -dy / len;
		var rdy = dx / len;
	    }

	    var f = 30;
	    var controlX1 = startX + dx/3 + rdx*f;
	    var controlY1 = startY + dy/3 + rdy*f;

	    var controlX2 = startX + dx/3*2 + rdx*f;
	    var controlY2 = startY + dy/3*2 + rdy*f;

	    this.mycontext.beginPath();
	    this.mycontext.lineWidth = 2;
	    this.mycontext.moveTo(startX, startY);
	    this.mycontext.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
            
            this.mycontext.stroke();
            
            if(this.nodes[to].arrowtype=="ende" ||  this.nodes[to].arrowtype=="beide") {

		    /* Pfeilspitze ende ------------------------------------------------------------ */
		    var len = Math.sqrt((controlX2-endX)*(controlX2-endX) + (controlY2-endY)*(controlY2-endY));
		    
		    this.mycontext.lineWidth = 1;
		    this.mycontext.beginPath();
		    this.mycontext.moveTo(endX, endY);
		    var dxm = (endX - controlX2)/len*10;
		    var dym = (endY - controlY2)/len*10;
		    
		    this.mycontext.lineTo(endX - dxm - dym/2 , endY - dym + dxm/2 );
		    this.mycontext.lineTo(endX - dxm + dym/2 , endY - dym - dxm/2 );
	
		    this.mycontext.fill();
		    /* ------------------------------------------------------------ */
            }
            
            if(this.nodes[to].arrowtype=="anfang" ||  this.nodes[to].arrowtype=="beide") {
		    /* Pfeilspitze anfang ------------------------------------------------------------ */
		    var len = Math.sqrt((controlX1-startX)*(controlX1-startX) + (controlY1-startY)*(controlY1-startY));
		    
		    this.mycontext.lineWidth = 1;
		    this.mycontext.beginPath();
		    this.mycontext.moveTo(startX, startY);
		    var dxm = (startX - controlX1)/len*10;
		    var dym = (startY - controlY1)/len*10;
		    
		    this.mycontext.lineTo(startX - dxm - dym/2 , startY - dym + dxm/2 );
		    this.mycontext.lineTo(startX - dxm + dym/2 , startY - dym - dxm/2 );
	
		    this.mycontext.fill();
		    /* ------------------------------------------------------------ */
	    }

	}
    };    

    var deleteNode = function(mindmap) {
	    var id = mindmap.activeObj.attr('id');
	    deleteAbove.call(mindmap,id);
	    var ed = new Array();
	    for(var i=0;i<mindmap.edges.length;i++) {
		    if(mindmap.edges[i].from!='-' && mindmap.edges[i].to!=id) {
			    ed.push(mindmap.edges[i]);
		    }
	    }
	    mindmap.edges = ed;
	    rebuildTree.call(this,mindmap);
    };

    var id2Relink;
    var id2RelinkTarget;
    var startRelink = function() {
    	    $('.mindmapbutton').hide();
    	    $('#relink2Button').show();
    	    
    	    id2Relink = this.activeObj.attr('id');
    	    
    	    for(var i=0;i<this.edges.length;i++) {
    	    	    if(this.edges[i].to == id2Relink) {
    	    	    	    activateNode.call(this, this.edges[i].from);
    	    	    	    highlightNode.call(this, this.activeObj);
    	    	    	    break;
    	    	    }
    	    }
    	    
    	    //console.log(idRelink);
    	    
    };
    var doRelink = function() {
    	    $('.mindmapbutton').show();
    	    $('#relink2Button').hide();
    	    
    	    id2RelinkTarget = this.activeObj.attr('id');
    	    
    	    var i=0;
    	    var test = id2RelinkTarget;
    	    do {
    	    	    var parent = getParent.call(this, test)
    	    	    if(parent=="root") break;
    	    	    if(parent==id2Relink) {
    	    	    	    alert("Fehler!");
    	    	    	    return false;
    	    	    }
    	    	    test = parent;
    	    } while(i++<100 && parent!=false);
    	    
    	    
    	    for(var i=0;i<this.edges.length;i++) {
    	    	    if(this.edges[i].to == id2Relink) {
    	    	    	    this.edges[i].from = id2RelinkTarget;
    	    	    	    break;
    	    	    }
    	    }
    	    
    	    
    	    activateNode.call(this, id2Relink);
    	    highlightNode.call(this, this.activeObj);
    	    rebuildTree.call(this,this);
    	    id2Relink = "";
    }
    
    var getParent = function(id) {
    	    for(var i=0;i<this.edges.length;i++) {
    	    	    if(this.edges[i].to==id) {
    	    	    	    return this.edges[i].from;
    	    	    }
    	    }
    	    return false;
    }
    

	var editNode = function() {
		    
		$('.mindmapbutton').attr('disabled', 'disabled').css('color', 'gray');
		
		var myid = this.activeObj.attr('id');
		centerMindmap.call(this, myid);
		
		this.disableRebuild++;
		
		orig = this.nodes[myid].title;
		
                
                var pp = $(this.activeObj).position();
                
                $(this.area).append("<div id='transparentbg' style='position:absolute;z-index:999;left:0;top:0;width:10000px;height:10000px;background-color:silver;opacity: 0.7;'>&nbsp;</div>");
                
                var editObj = $("<div id='editObjDiv' style='width:300px;position:absolute;z-index: 1000;left:"+(pp.left-30)+"px;top:"+(pp.top-30)+"px;background-color: white;border: solid 1px silver;border-radius:5px;box-shadow:0 10px 18px -10px #888888;padding: 10px;'></div>");
                $(this.area).append(editObj);
                
                editObj.append( '<div style="float:left;font-weight: bold;font-size:10pt;color: #555555;">'+MMLang.Knotenpunkt_bearbeiten+'</div>' );
                
                
                var closeIcon = $('<img src="'+this.path+'/close.png" onclick="" style="cursor:pointer;" />')
                                .bind("mousedown", function(e) { e.stopPropagation(); })
                                .click( (function(id, mindmap) {
										    return function() {
											$('.mindmapbutton').removeAttr('disabled').css('color', 'black');;
											
                                                                                        var text = mindmap.nodes[id].title;
                                                                                        var textta = mindmap.nodes[id].infotext;
                                                                                        
                                                                                        
                                                                                        $('#editObjDiv').remove();
                                                                                        $('#transparentbg').remove();
                                                                                        
											
                                                                                        mindmap.disableRebuild--;
											
										    };                        
										}( myid, this ) ) );
                var close = $('<div style="color:black;float:right;"></div>').append( closeIcon );
                editObj.append( close );
                editObj.append( '<div style="clear:both;height:5px;"></div>');
                
                editObj.append( '<div style="font-size:8pt;color: #555555;">'+MMLang.Titel+'</div>' );
                
                
                editObj.append( '<input type="text" class="mindmaptextarea" value="'+orig+'" id="edit_'+myid+'" style="width: 97%;" />').bind("mousedown", function(e) { e.stopPropagation(); });

                if(orig==MMLang.neuer_Knotenpunkt) {
			editObj.append( '<div style="font-size:8pt;color:gray;">|| '+MMLang.um_mehrere_Knoten_nebeneinander_zu_erstellen+'.</div>' );
			editObj.append( '<div style="font-size:8pt;color:gray;">&& '+MMLang.um_mehrere_Knoten_hintereinander_zu_erstellen+'.</div>' );
		}
                editObj.append( '<div style="clear:both;height:1px;border-bottom: dotted 1px gray;margin: 6px 0 6px 0;"></div>');
                
                var info = "";
                info += "<img class='mmimg' src='"+this.path+"/input-edit.png' style='border: solid 1px red;margin:0 0 3px 3px;cursor:pointer;' width=20 height=18 onclick=\"hlimg(this);$('.editnodeall').hide();$('#editnodedesc').show();\" />&nbsp;";
                info += "<img class='mmimg' src='"+this.path+"/text_color_hilight.png' style='border: solid 1px white;margin:0 0 3px 3px;cursor:pointer;' width=20 height=18 onclick=\"hlimg(this);$('.editnodeall').hide();$('#editnodefg').show();\" />&nbsp;";
                info += "<img class='mmimg' src='"+this.path+"/bg_color_fill.png' style='border: solid 1px white;margin:0 0 3px 3px;cursor:pointer;' width=20 height=18 onclick=\"hlimg(this);$('.editnodeall').hide();$('#editnodebg').show();\" />&nbsp;";
                info += "<img class='mmimg' src='"+this.path+"/border_outline.png' style='border: solid 1px white;margin:1px 0 3px 4px;cursor:pointer;' width=20 height=18 onclick=\"hlimg(this);$('.editnodeall').hide();$('#editnodeborder').show();\" />&nbsp;";
                info += "<img class='mmimg' src='"+this.path+"/icon_link.png' style='border: solid 1px white;margin:1px 0 3px 4px;cursor:pointer;' width=20 height=18 onclick=\"hlimg(this);$('.editnodeall').hide();$('#editnodelink').show();\" />&nbsp;";
                
                info += "<img class='mmimg' src='"+this.path+"/icon_arrows.png' style='border: solid 1px white;margin:1px 0 3px 4px;cursor:pointer;' width=20 height=18 onclick=\"hlimg(this);$('.editnodeall').hide();$('#editnodearrow').show();\" />&nbsp;";
                

                editObj.append( '<div style="margin-bottom:10px;">'+info+'</div>' );
                
		var ta = this.nodes[myid].infotext+"";
		if(ta=="undefined") ta = "";
                
		
		var FARBEN  = ["#000000", "#ff0000", "#008000", "#0000ff", "#ffff00"];
		var FARBWAHL = "<br/>";
		FARBWAHL += "<table><tr>";
		for(var i=0;i<FARBEN.length;i++) {
			FARBWAHL += "<td style='width:15px;height:15px;background-color:"+FARBEN[i]+";cursor:pointer;' onclick=\"$(this).closest('.propbox').find('.farbvalue').val('"+FARBEN[i]+"');\">&nbsp;</td>";
			FARBWAHL += "<td width=3></td>";
		}
		FARBWAHL += "</tr></table>";
		
                var info = "";
                
                
                info += "<div id='editnodedesc' class='editnodeall'>";
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Beschreibung+'</div>';
                info += "<textarea width='100%' rows='3' class='mindmaptextarea' style='width:100%;z-index:1000;' id='editta_"+myid+"'>"+ta+"</textarea>";
                info += "</div>";
                
                info += "<div id='editnodearrow' class='editnodeall' style='display:none;'>";
                info += '<table cellspacing=0 cellpadding=0 class="propbox"><tr><td valign=top>';
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Pfeilspitzen+'</div>';
                
                info += "<select id='arrowtypevalue_"+myid+"'>";
                info += "<option value='ende' "+(this.nodes[myid].arrowtype=='ende' ? 'selected' : '')+">"+MMLang.arrow_ende+"</option>";
                info += "<option value='anfang' "+(this.nodes[myid].arrowtype=='anfang' ? 'selected' : '')+">"+MMLang.arrow_anfang+"</option>";
                info += "<option value='beide' "+(this.nodes[myid].arrowtype=='beide' ? 'selected' : '')+">"+MMLang.arrow_beide+"</option>";
                info += "<option value='ohne' "+(this.nodes[myid].arrowtype=='ohne' ? 'selected' : '')+">"+MMLang.arrow_ohne+"</option>";
                info += "</select>";
                
                info += '</td></tr></table>';
                
                info += "</div>";

                
                info += "<div id='editnodefg' class='editnodeall' style='display:none;'>";
                
                info += '<table cellspacing=0 cellpadding=0 class="propbox"><tr><td valign=top>';
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Schriftfarbe+'</div>';
                info += "<input type='text' size=10 value='"+this.nodes[myid].fgcolor+"' id='fgcolorvalue_"+myid+"' class='farbvalue' /><br/>";
                info += '</td><td width=20></td><td valign=top>';
                
                info += FARBWAHL;
                info += '</td></tr>';
                info += '<tr>';
                info += '<td valign=top><br/>';
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Schriftgroesse+'</div>';
                info += "<input type='text' size=5 style='text-align:center;' value='"+this.nodes[myid].fontsize+"' id='fontsize_"+myid+"' />pt<br/>";
                info += '</td></tr></table>';
                
                info += "</div>";
                
                info += "<div id='editnodebg' class='editnodeall' style='display:none;'>";
                info += '<table cellspacing=0 cellpadding=0 class="propbox"><tr><td valign=top>';
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Hintergrundfarbe+'</div>';
                info += "<input type='text' size=10 value='"+this.nodes[myid].bgcolor+"' id='bgcolorvalue_"+myid+"' class='farbvalue' /><br/>";
                info += '</td><td width=20></td><td valign=top>';
                
                info += FARBWAHL;
                info += '</td></tr></table>';
                info += "</div>";
                
                
                info += "<div id='editnodeborder' class='editnodeall' style='display:none;'>";
                info += '<table cellspacing=0 cellpadding=0 class="propbox"><tr><td valign=top>';
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Rahmenfarbe+'</div>';
                info += "<input type='text' size=10 value='"+this.nodes[myid].bordercolor+"' id='bordercolorvalue_"+myid+"' class='farbvalue' /><br/>";
                info += '</td><td width=20></td><td valign=top>';
                
                info += FARBWAHL;
                info += '</td></tr>';
                
                info += '<tr>';
                info += '<td valign=top><br/>';
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Dicke+'</div>';
                info += "<input type='text' size=10 value='"+this.nodes[myid].borderwidth+"' id='borderwidthvalue_"+myid+"' /><br/>";
                info += '</td><td width=20></td>';
                
                info += '<td valign=top><br/>';
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Art+'</div>';
                info += "<select id='bordertypevalue_"+myid+"'>";
                info += "<option value='rund' "+(this.nodes[myid].bordertype=='rund' ? 'selected' : '')+">"+MMLang.abgerundet+"</option>";
                info += "<option value='rund2' "+(this.nodes[myid].bordertype=='rund2' ? 'selected' : '')+">"+MMLang.rund+"</option>";
                info += "<option value='eckig' "+(this.nodes[myid].bordertype=='eckig' ? 'selected' : '')+">"+MMLang.eckig+"</option>";
                info += "<option value='unterstrich' "+(this.nodes[myid].bordertype=='unterstrich' ? 'selected' : '')+">"+MMLang.unterstrichen+"</option>";
                info += "</select>";
                info += '</td></tr>';
                info += "</table>";
                info += "</div>";

                info += "<div id='editnodelink' class='editnodeall' style='display:none;'>";
                info += '<div style="font-size:8pt;color: #555555;">'+MMLang.Verlinkung+'</div>';
                info += "<select id='linktypevalue_"+myid+"'>";
                info += "<option value=''>"+MMLang.kein_Link+"</option>";
                info += "<option value='extern' "+(this.nodes[myid].linktype=='extern' ? 'selected' : '')+">"+MMLang.externer_Link+"</option>";
                info += "<option value='intern' "+(this.nodes[myid].linktype=='intern' ? 'selected' : '')+">"+MMLang.interner_Link+" (RefID)</option>";
				info += "<option value='lernstand' "+(this.nodes[myid].linktype=='lernstand' ? 'selected' : '')+">"+MMLang.lernstand+" (RefID)</option>";
                info += "</select>";
                info += "<br/><br/>";
                info += '<div style="font-size:8pt;color: #555555;">URL '+MMLang.oder+' RefID</div>';
                if(typeof(this.nodes[myid].linktarget)=="undefined") this.nodes[myid].linktarget = "";
                info += "<input type='text' size=30 value='"+this.nodes[myid].linktarget+"' id='linktargetvalue_"+myid+"' /><br/>";
                info += "</div>";
                
                
		editObj.append( $('<div id="mindmapextrainfo" class="mindmapextrainfo" style="z-index: 2000;text-align:left;background-color:transparent;"></div>')
					.bind("mousedown", function(e) { e.stopPropagation(); })
					.append(info)
					/*.append("Farbe:&nbsp;<input type='text' size=10 name='color' class='colorpicker mindmaptextarea' /> ")*/
					);
		$('#edit_'+myid).select();
		
		editObj.append( '<div style="clear:both;height:1px;border-bottom: dotted 1px gray;margin: 6px 0 6px 0;"></div>');
		
		editObj.append( $('<input type="button" value="Ok" class="mindmapokbutton" style="float:right;" />')
			     			.bind("mousedown", function(e) { e.stopPropagation(); })
			     			.click( (function(id, mindmap) {
										    return function() {
											$('.mindmapbutton').removeAttr('disabled').css('color', 'black');;
											var text = $('#edit_'+id).val();
											var textta = $('#editta_'+id).val();

                                                                                        var opts = {
                                                                                                "fgcolor": $('#fgcolorvalue_'+id).val(), 
                                                                                                "bordercolor": $('#bordercolorvalue_'+id).val(), 
                                                                                                "borderwidth": $('#borderwidthvalue_'+id).val(), 
                                                                                                "bordertype": $('#bordertypevalue_'+id).val(),
                                                                                                "arrowtype": $('#arrowtypevalue_'+id).val(),
                                                                                                "bgcolor": $('#bgcolorvalue_'+id).val(),
                                                                                                "fontsize": $('#fontsize_'+id).val(),
                                                                                                "linktype": $('#linktypevalue_'+id).val(),
                                                                                                "linktarget": $('#linktargetvalue_'+id).val()
                                                                                            };
                                                                                            
											$('#'+id).html( text );
                                                                                        $('#editObjDiv').remove();
                                                                                        
                                                                                        $('#transparentbg').remove();
                                                                                        
											changeNodeText.call(mindmap, id, text, textta, opts );
											
											rebuildTree.call(this,mindmap);
											
											highlightNode.call(mindmap, $("#"+id));
										    };                        
										}( myid, this ) ) ) 
					);
		editObj.append( '<div style="clear:both;"></div>');
		/*$('#colorpicker').farbtastic( function(color) { $('.colorpicker').val(color) } );*/
	    };    
    
    
    var methods = {
        init : function( options ) {

            var settings = $.extend( {
            		    'tree'         : '{"edges": [], "nodes": {"root": {"id": "root", "title":"Mindmap", "x":0, "y":0}}}',
            		    'edit' : true,
			      'zoom' : 1
			    }, options);
        	
            return $(this).each(function(){

                var dragData = {
                    dragging: false,
                    start: {
                        x: 0, 
                        y: 0
                    },
                    deltaStart: {
                        x: 0, 
                        y: 0
                    },
                    delta: {
                        x: 0, 
                        y: 0
                    },
                    current: {
                        x: 0, 
                        y: 0
                    }
                };


                
                
                var $this = $(this);
                var data = $this.data('mindmap');
                var mindmap = {};


                
                if ( ! data || 1==1 ) {

                    mindmap.width = $(this).width();
                    mindmap.height = $(this).height();

                    mindmap.disableRebuild = 0;

                    mindmap.edges = new Array();
                    mindmap.nodes = new Object();

                    mindmap.objactive = "";
                    mindmap.activeObj = "";

                   
                    mindmap.edges = settings.tree.edges;
                    mindmap.nodes = settings.tree.nodes;
                    mindmap.path = settings.path;
                    mindmap.editable = settings.edit;
                    

                    $this.css('overflow', 'hidden');

                    var onMouseMove = function(e, t){
                        mindmap.area.css('left', mindmap.left+(dragData.current.x-dragData.start.x)).css('top', mindmap.top+(dragData.current.y-dragData.start.y));
                    };
                    mindmap.left = -(5000-mindmap.width/2);
                    mindmap.top = -(5000-mindmap.height/2);
                    
                    mindmap.area = $('<div class="mindmapbackground"></div>').css('position', 'relative')
                                                   .css('z-index', 1)
                                                   .css('left', mindmap.left)
                                                   .css('top', mindmap.top)
                                                   .css('width', 10000)
                                                   .css('height', 10000)
                                                   
                                                   .css('background-position', 'center');
                                                   
                    mindmap.area.bind('mousedown touchstart', function(e) {
                                $('.highlighbox').remove();
				
				if(mindmap.objactive != "") return;
				mindmap.objactive = "bg";
	
				e.preventDefault();
				dragData.dragging = true;
				var me = this;
				$(document).bind('mousemove.controllerdragging touchmove.controllerdragging', function(e) {
				    var positionProvider;
				    if (typeof e.originalEvent.touches != 'undefined') {
					positionProvider = e.originalEvent.touches[0];
				    }
				    else {
					positionProvider = e.originalEvent;
				    }
	
				    dragData.delta = {
					x: positionProvider.clientX - dragData.current.x,
					y: positionProvider.clientY - dragData.current.y
				    };
	
				    dragData.current = {
					x: positionProvider.clientX, 
					y: positionProvider.clientY
				    };
				    e.preventDefault();
	
				    return onMouseMove.call(me, e, dragData);
				});
				var positionProvider;
				if (typeof e.originalEvent.touches != 'undefined') {
				    positionProvider = e.originalEvent.touches[0];
				}
				else {
				    positionProvider = e.originalEvent;
				}
	
				dragData.start = {
				    x: positionProvider.clientX, 
				    y: positionProvider.clientY
				};
				dragData.deltaStart = {
				    x: 0, 
				    y: 0
				};
				dragData.delta = {
				    x: 0, 
				    y: 0
				};
				dragData.current = {
				    x: positionProvider.clientX, 
				    y: positionProvider.clientY
				};
	
				myHeight = $(this).height();
				viewportHeight = $(this).parent().height();
	
				if (typeof e.originalEvent.touches == 'undefined') {
				    e.preventDefault();
				}
	
				$(document).bind('mouseup.controllerdragging touchend.controllerdragging', function(e) {
				    mindmap.objactive = "";
	
				    dragData.dragging = false;
				    $(document).unbind('.controllerdragging');
	
				    mindmap.left = mindmap.left+(dragData.current.x-dragData.start.x);
				    mindmap.top = mindmap.top+(dragData.current.y-dragData.start.y);
				    dragData.start.x = dragData.current.x;
				    dragData.start.y = dragData.current.y;
	
	
				});

                    }
                    );

                    
                    var barG = $('<div id="areabar"></div>').css('width', 2000)
                                              .css('height', 30)
                                              .css('background-color','silver')
                                              .css('padding-left','10px')
                                              .css('overflow','hidden')
                                              .css('border-bottom', 'solid 1px gray')
                                              .append('<div style="padding-top:2px;"></div>');
                                              
                    var barL = $('<div style="float:left;padding-top:3px;"></div>');
                    var barR = $('<div style="float:right;padding-right:20px;"></div>');
                                              
                    var addButton = $('<input type="button" class="mindmapbutton" value="'+MMLang.hinzufuegen+'">').click( (function() {
                        return function() {
                            var id = addNewNode.call(mindmap);
                            rebuildTree.call(this,mindmap);
                            
                            
                            centerMindmap.call(mindmap, id);
                            
                            
                            activateNode(id);
                            mindmap.activeObj = $("#"+id);
                            
                            editNode.call(mindmap);
                        };                
                    }() ) );
                    /*
                    var refreshButton = $('<button title="aktualisieren" class=mindmapimgbutton><img src="'+settings.path+'/refresh.png" /></button>').click( (function() {
                        return function() {
                            rebuildTree.call(this,mindmap);
                        };            
                    }() ) );
                    */
                    var editButton = $('<input type="button" class="mindmapbutton" value="'+MMLang.bearbeiten+'">').click( (function() {
                        return function() {
                            editNode.call(mindmap);
                        };            
                    }() ) );
                    var delButton = $('<input type="button" class="mindmapbutton" value="'+MMLang.loeschen+'">').click( (function() {
                        return function() {
                        	if(confirm(MMLang.Diesen_Knoten_inkl_Unterknoten_loeschen+'?')) {
                        		deleteNode.call(this,mindmap);
                        	}
                        };            
                    }() ) );

                    var relinkButton = $('<input type="button" class="mindmapbutton" id="relinkButton" value="'+MMLang.relink+'">').click( (function() {
                        return function() {
                            startRelink.call(mindmap);
                        };            
                    }() ) );
                    var relink2Button = $('<input type="button" class="mindmapbutton" id="relink2Button" style="display:none;" value="'+MMLang.relink2+'">').click( (function() {
                        return function() {
                            doRelink.call(mindmap);
                        };            
                    }() ) );


                    if(settings.edit==true) {
			    barL.append(addButton);
			    barL.append(editButton);
			    barL.append(delButton);
                            
			    barL.append(relinkButton);
			    barL.append(relink2Button);
                            	

                            barG.append(barL);
                            barG.append(barR);
                            barG.append("<div style='clear:both;'></div>");

			    $this.append($('<div style="position:relative;left:0px;top:0px;z-index:10;height:0;width:0;"></div>').append( barG ) );
		    }
		    
		    
                    $this.append(mindmap.area);
                    

                    $this.bind("resize", function() {
                        $('#areabar').css("width", $(this).width());
                        //console.log($(this).width());
                    });
                    $('#areabar').css("width", $(this).width());
                    
                    
                    


                    mindmap.mycanvas = $('<canvas id="cvs" style="position:relative;top:0;left;0;width:10000px;height:10000px;z-index:20;" width="10000" height="10000"></canvas>');
                    mindmap.area.append(mindmap.mycanvas);

                    if(mindmap.mycanvas[0] && mindmap.mycanvas[0].getContext && typeof(mindmap.mycanvas[0].getContext)=="function") {
                    	    mindmap.mycontext = mindmap.mycanvas[0].getContext('2d');
                    } else {
                    	    mindmap.mycontext = null;
                    }

                    rebuildTree.call(this,mindmap);

                    
                    
                    activateNode.call(mindmap, 'root');

                    $(this).data('mindmap', {
                        target : $this,
                        mindmap : mindmap
                    });

                }
            });
        },
        
        destroy : function( ) {

            return this.each(function(){

                var $this = $(this),
                data = $this.data('mindmap');

                
                $(document).unbind('.mindmap');
                /*data.mindmap.remove();
                $this.removeData('mindmap');*/

            })

        },
        reposition : function( ) {  },
        show : function( ) {  },
        hide : function( ) {  },
        update : function( content ) {  }
    };

    $.fn.mindmap = function( method ) {

        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.mindmap' );
        }

    };

})( jQuery );

function nl2br(str) {
    if(typeof(str)=="string") return str.replace(/(\r\n)|(\n\r)|\r|\n/g,"<BR>");
    else return str;
}

var hlimg = function(obj) {
	$('.mmimg').css("border", "solid 1px white");
	$(obj).css("border", "solid 1px red");
};


/**
 * jquery.simpletip 1.3.1. A simple tooltip plugin
 * 
 * Copyright (c) 2009 Craig Thompson
 * http://craigsworks.com
 *
 * Licensed under GPLv3
 * http://www.opensource.org/licenses/gpl-3.0.html
 *
 * Launch  : February 2009
 * Version : 1.3.1
 * Released: February 5, 2009 - 11:04am
 */
(function($){function Simpletip(elem,conf){var self=this;elem=jQuery(elem);var tooltip=jQuery(document.createElement('div')).addClass(conf.baseClass).addClass((conf.fixed)?conf.fixedClass:'').addClass((conf.persistent)?conf.persistentClass:'').html(conf.content).appendTo(elem);if(!conf.hidden)tooltip.show();else tooltip.hide();if(!conf.persistent){elem.hover(function(event){self.show(event)},function(){self.hide()});if(!conf.fixed){elem.mousemove(function(event){if(tooltip.css('display')!=='none')self.updatePos(event);});};}else
{elem.click(function(event){if(event.target===elem.get(0)){if(tooltip.css('display')!=='none')self.hide();else
self.show();};});jQuery(window).mousedown(function(event){if(tooltip.css('display')!=='none'){var check=(conf.focus)?jQuery(event.target).parents('.tooltip').andSelf().filter(function(){return this===tooltip.get(0)}).length:0;if(check===0)self.hide();};});};jQuery.extend(self,{getVersion:function(){return[1,2,0];},getParent:function(){return elem;},getTooltip:function(){return tooltip;},getPos:function(){return tooltip.offset();},setPos:function(posX,posY){var elemPos=elem.offset();if(typeof posX=='string')posX=parseInt(posX)+elemPos.left;if(typeof posY=='string')posY=parseInt(posY)+elemPos.top;tooltip.css({left:posX,top:posY});return self;},show:function(event){conf.onBeforeShow.call(self);self.updatePos((conf.fixed)?null:event);switch(conf.showEffect){case'fade':tooltip.fadeIn(conf.showTime);break;case'slide':tooltip.slideDown(conf.showTime,self.updatePos);break;case'custom':conf.showCustom.call(tooltip,conf.showTime);break;default:case'none':tooltip.show();break;};tooltip.addClass(conf.activeClass);conf.onShow.call(self);return self;},hide:function(){conf.onBeforeHide.call(self);switch(conf.hideEffect){case'fade':tooltip.fadeOut(conf.hideTime);break;case'slide':tooltip.slideUp(conf.hideTime);break;case'custom':conf.hideCustom.call(tooltip,conf.hideTime);break;default:case'none':tooltip.hide();break;};tooltip.removeClass(conf.activeClass);conf.onHide.call(self);return self;},update:function(content){tooltip.html(content);conf.content=content;return self;},load:function(uri,data){conf.beforeContentLoad.call(self);tooltip.load(uri,data,function(){conf.onContentLoad.call(self);});return self;},boundryCheck:function(posX,posY){var newX=posX+tooltip.outerWidth();var newY=posY+tooltip.outerHeight();var windowWidth=jQuery(window).width()+jQuery(window).scrollLeft();var windowHeight=jQuery(window).height()+jQuery(window).scrollTop();return[(newX>=windowWidth),(newY>=windowHeight)];},updatePos:function(event){var tooltipWidth=tooltip.outerWidth();var tooltipHeight=tooltip.outerHeight();if(!event&&conf.fixed){if(conf.position.constructor==Array){posX=parseInt(conf.position[0]);posY=parseInt(conf.position[1]);}else if(jQuery(conf.position).attr('nodeType')===1){var offset=jQuery(conf.position).offset();posX=offset.left;posY=offset.top;}else
{var elemPos=elem.offset();var elemWidth=elem.outerWidth();var elemHeight=elem.outerHeight();switch(conf.position){case'top':var posX=elemPos.left-(tooltipWidth/2)+(elemWidth/2);var posY=elemPos.top-tooltipHeight;break;case'bottom':var posX=elemPos.left-(tooltipWidth/2)+(elemWidth/2);var posY=elemPos.top+elemHeight;break;case'left':var posX=elemPos.left-tooltipWidth;var posY=elemPos.top-(tooltipHeight/2)+(elemHeight/2);break;case'right':var posX=elemPos.left+elemWidth;var posY=elemPos.top-(tooltipHeight/2)+(elemHeight/2);break;default:case'default':var posX=(elemWidth/2)+elemPos.left+20;var posY=elemPos.top;break;};};}else
{var posX=event.pageX;var posY=event.pageY;};if(typeof conf.position!='object'){posX=posX+conf.offset[0];posY=posY+conf.offset[1];if(conf.boundryCheck){var overflow=self.boundryCheck(posX,posY);if(overflow[0])posX=posX-(tooltipWidth/2)-(2*conf.offset[0]);if(overflow[1])posY=posY-(tooltipHeight/2)-(2*conf.offset[1]);}}else
{if(typeof conf.position[0]=="string")posX=String(posX);if(typeof conf.position[1]=="string")posY=String(posY);};self.setPos(posX,posY);return self;}});};jQuery.fn.simpletip=function(conf){var api=jQuery(this).eq(typeof conf=='number'?conf:0).data("simpletip");if(api)return api;var defaultConf={content:'A simple tooltip',persistent:false,focus:false,hidden:true,position:'default',offset:[0,0],boundryCheck:true,fixed:true,showEffect:'fade',showTime:150,showCustom:null,hideEffect:'fade',hideTime:150,hideCustom:null,baseClass:'tooltip',activeClass:'active',fixedClass:'fixed',persistentClass:'persistent',focusClass:'focus',onBeforeShow:function(){},onShow:function(){},onBeforeHide:function(){},onHide:function(){},beforeContentLoad:function(){},onContentLoad:function(){}};jQuery.extend(defaultConf,conf);this.each(function(){var el=new Simpletip(jQuery(this),defaultConf);jQuery(this).data("simpletip",el);});return this;};})();

