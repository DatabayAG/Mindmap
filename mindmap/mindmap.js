(function( $ ){


    var counter = 0;
    var MIN_ZOOM = 0.5;
    var MAX_ZOOM = 2.0;
    var ZOOM_STEP = 1.15;
    var TAP_SLOP = 10;
    var DOUBLE_TAP_MS = 10000;
    var DOUBLE_TAP_RADIUS = 30;
    var lastPointerType = '';

    var escAttr = function(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    var getUniqId = function() {
        counter++;
        var d = new Date();
        return "n_"+counter+"_"+d.getTime();
    };

    var clampZoom = function(zoom) {
        return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    };

    var cssWorldPos = function(obj) {
        var el = obj.jquery ? obj : $(obj);
        return {
            left: parseFloat(el.css('left')) || 0,
            top: parseFloat(el.css('top')) || 0
        };
    };

    var updateZoomControls = function(mindmap) {
        if (!mindmap.zoomControls) {
            return;
        }

        var zoom = mindmap.zoom || 1;
        mindmap.zoomControls.label.text(Math.round(zoom * 100) + '%');
        mindmap.zoomControls.zoomIn.prop('disabled', zoom >= MAX_ZOOM - 0.001);
        mindmap.zoomControls.zoomOut.prop('disabled', zoom <= MIN_ZOOM + 0.001);
    };

    var applyZoom = function(mindmap, newZoom, originX, originY) {
        var oldZoom = mindmap.zoom || 1;
        newZoom = clampZoom(newZoom);

        if (Math.abs(newZoom - oldZoom) < 0.0001) {
            updateZoomControls(mindmap);
            return;
        }

        var worldX = (originX - mindmap.left) / oldZoom;
        var worldY = (originY - mindmap.top) / oldZoom;

        mindmap.zoom = newZoom;
        mindmap.left = originX - worldX * newZoom;
        mindmap.top = originY - worldY * newZoom;

        mindmap.area.css({
            left: mindmap.left,
            top: mindmap.top,
            transform: 'scale(' + newZoom + ')',
            'transform-origin': '0 0'
        });
        mindmap.area.children('#editObjDiv').css('transform', 'scale(' + (1 / newZoom) + ')');

        updateZoomControls(mindmap);
    };

    var createZoomControls = function(mindmap, $viewport) {
        var wrap = $('<div class="il-mindmap-zoom" role="group"></div>');
        var zoomIn = $('<button type="button" class="il-mindmap-zoom-btn il-mindmap-zoom-in">+</button>')
            .attr('aria-label', MMLang.zoom_in);
        var zoomOut = $('<button type="button" class="il-mindmap-zoom-btn il-mindmap-zoom-out">&minus;</button>')
            .attr('aria-label', MMLang.zoom_out);
        var label = $('<span class="il-mindmap-zoom-level" aria-live="polite"></span>');

        zoomIn.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            applyZoom(
                mindmap,
                (mindmap.zoom || 1) * ZOOM_STEP,
                $viewport.width() / 2,
                $viewport.height() / 2
            );
        });

        zoomOut.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            applyZoom(
                mindmap,
                (mindmap.zoom || 1) / ZOOM_STEP,
                $viewport.width() / 2,
                $viewport.height() / 2
            );
        });

        wrap.append(zoomIn).append(label).append(zoomOut);
        $viewport.append(wrap);

        mindmap.zoomControls = {
            wrap: wrap,
            zoomIn: zoomIn,
            zoomOut: zoomOut,
            label: label
        };

        updateZoomControls(mindmap);
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
        var zoom = this.zoom || 1;

        this.left = this.width / 2 - (5000 + this.nodes[id].x) * zoom - 100;
        this.top = this.height / 4 - (5000 + this.nodes[id].y) * zoom;

        this.area.animate({
            left: this.left,
            top: this.top
        });
    };

    var highlightNode = function( obj) {
        var p = cssWorldPos(obj);
        $('.highlighbox').remove();
        
        var div = '<div class="highlighbox" ';
        div +=' style="position:absolute;left:'+(p.left-15)+'px;top:'+(p.top-15)+'px;width:'+(obj.outerWidth()+30)+'px;height:'+(obj.outerHeight()+30)+'px;z-index:19;background-color:silver;opacity:0.5;"></div>';
        $(this.area).append(div);
        
    };

	var nodeMove = function(mindmap, e) {
		
	    if(mindmap.disableRebuild>0) return;
	
	    mindmap.objactive = "node";
	    mindmap.nodemove = cssWorldPos($(this));
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
	
		var zoom = mindmap.zoom || 1;
		var dx = (positionProvider.clientX - mindmap.nodestartpos.left) / zoom;
		var dy = (positionProvider.clientY - mindmap.nodestartpos.top) / zoom;
		mindmap.activeObj.css('left', mindmap.nodemove.left * 1 + dx * 1).css('top', mindmap.nodemove.top * 1 + dy * 1);
		
                $('.highlighbox').remove();
		
		
		
	    });
	    $(document).bind('mouseup.nodedragging touchend.nodedragging', function(e) {
		mindmap.objactive = "";
		$(document).unbind('.nodedragging');
		id = mindmap.activeObj.attr('id');
		var xy = cssWorldPos(mindmap.activeObj);
	
		var dx = (xy.left-5000) - mindmap.nodes[id].x;
		var dy = (xy.top-5000) - mindmap.nodes[id].y;
	
		mindmap.nodes[id].x = Math.round(xy.left-5000);
		mindmap.nodes[id].y = Math.round(xy.top-5000);
	
		moveAbove.call(mindmap, id, Math.round(dx), Math.round(dy));
	
		rebuildTree.call(this,mindmap);
                
                highlightNode.call(mindmap, mindmap.activeObj);
                
	    });
	};    
    
    var tooltipHideTimer = null;
    var tooltipNodeId = null;
    var tooltipPinned = false;

    var cancelTooltipHide = function() {
        if (tooltipHideTimer) {
            clearTimeout(tooltipHideTimer);
            tooltipHideTimer = null;
        }
    };

    var removeNodeTooltips = function() {
        cancelTooltipHide();
        $('.tooltips').remove();
        $('.mindmap-info-toggle[aria-expanded="true"]')
            .attr('aria-expanded', 'false')
            .removeAttr('aria-controls aria-describedby');
        tooltipNodeId = null;
        tooltipPinned = false;
    };

    var scheduleTooltipHide = function() {
        if (tooltipPinned) {
            return;
        }
        cancelTooltipHide();
        tooltipHideTimer = setTimeout(removeNodeTooltips, 150);
    };

    var buildInfoMarker = function(info) {
        return "<span class='simpletip'>&nbsp;"
            + "<button type='button' class='mindmap-info-toggle' aria-expanded='false'"
            + " aria-label='" + escAttr(MMLang.Beschreibung) + "'>*</button>"
            + "<span class='mindmap-info-text' hidden>" + nl2br(info) + "</span>"
            + "</span>";
    };

    var positionNodeTooltip = function($tooltip, $node) {
        var gap = 8;
        var scrollLeft = $(window).scrollLeft();
        var scrollTop = $(window).scrollTop();
        var viewportWidth = $(window).width();
        var viewportHeight = $(window).height();
        var tw = $tooltip.outerWidth();
        var th = $tooltip.outerHeight();

        var rect = $node[0].getBoundingClientRect();
        var nodeLeft = rect.left + scrollLeft;
        var nodeTop = rect.top + scrollTop;
        var rightSide = nodeLeft + rect.width + gap;
        var leftSide = nodeLeft - tw - gap;
        var left;
        var top = nodeTop;

        if (rightSide + tw + gap <= scrollLeft + viewportWidth) {
            left = rightSide;
        } else if (leftSide >= scrollLeft + gap) {
            left = leftSide;
        } else {
            left = nodeLeft;
            top = nodeTop + rect.height + gap;
            if (top + th + gap > scrollTop + viewportHeight && nodeTop - th - gap >= scrollTop + gap) {
                top = nodeTop - th - gap;
            }
        }

        left = Math.max(Math.min(left, scrollLeft + viewportWidth - tw - gap), scrollLeft + gap);
        top = Math.max(Math.min(top, scrollTop + viewportHeight - th - gap), scrollTop + gap);

        $tooltip.css({ left: left, top: top });
    };

    var mmRepoLinkNodeId = null;
    var mmRepoPickerInited = false;

    var initRepositoryLinkPicker = function() {
        if (mmRepoPickerInited) {
            return;
        }
        if (!document.getElementById('mm_int_ref_hid')) {
            return;
        }
        mmRepoPickerInited = true;

        document.addEventListener('click', function(e) {
            var target = e.target;
            if (!target || !target.closest) {
                return;
            }
            if (!target.closest('#mm_int_ref_expl_content a.ilExplSelectInputButS')) {
                return;
            }
            setTimeout(function() {
                if (!mmRepoLinkNodeId) {
                    return;
                }
                var input = document.querySelector('#mm_int_ref_hid input[name="mm_int_ref"]');
                if (!input || !input.value) {
                    return;
                }
                var field = document.getElementById('linktargetvalue_' + mmRepoLinkNodeId);
                if (field) {
                    field.value = input.value;
                    field.focus({ preventScroll: true });
                }
            }, 50);
        }, true);
    };

    var openRepositoryLinkPicker = function(nodeId) {
        mmRepoLinkNodeId = nodeId;
        var sel = document.getElementById('mm_int_ref_select');
        if (sel) {
            sel.click();
        }
    };

    var updateLinkTargetUi = function(nodeId) {
        var typeEl = document.getElementById('linktypevalue_' + nodeId);
        var pickerRow = document.getElementById('linkpickerrow_' + nodeId);
        if (!typeEl || !pickerRow) {
            return;
        }
        pickerRow.style.display = typeEl.value === 'intern' ? '' : 'none';
    };

    var toHexColor = function(value, fallback) {
        var raw = (value == null ? '' : String(value)).trim();
        if (raw.charAt(0) === '#') {
            raw = raw.substr(1);
        }
        raw = raw.toLowerCase();
        if (/^[0-9a-f]{3}$/.test(raw)) {
            raw = raw.charAt(0) + raw.charAt(0) + raw.charAt(1) + raw.charAt(1) + raw.charAt(2) + raw.charAt(2);
        }
        if (/^[0-9a-f]{6}$/.test(raw)) {
            return '#' + raw;
        }
        return fallback;
    };

    var COLOR_PRESETS = [
        '#000000', '#767676', '#FFFFFF',
        '#0072B2', '#56B4E9', '#009E73',
        '#E69F00', '#F0E442', '#D55E00', '#CC79A7'
    ];

    var buildColorPresets = function(hexId, pickerId) {
        var html = "<div class='mindmap-color-presets' data-hex='"+hexId+"' data-picker='"+pickerId+"' role='group'>";
        for (var i = 0; i < COLOR_PRESETS.length; i++) {
            html += "<button type='button' class='mindmap-color-preset' data-color='"+COLOR_PRESETS[i]+"'"
                + " style='background-color:"+COLOR_PRESETS[i]+";'"
                + " title='"+COLOR_PRESETS[i]+"' aria-label='"+COLOR_PRESETS[i]+"'></button>";
        }
        html += "</div>";
        return html;
    };

    var bindHexColorPicker = function(hexId, pickerId) {
        var hexEl = document.getElementById(hexId);
        var pickerEl = document.getElementById(pickerId);
        if (!hexEl || !pickerEl) {
            return;
        }
        var fallback = pickerEl.value || '#000000';
        pickerEl.addEventListener('input', function() {
            hexEl.value = pickerEl.value;
        });
        pickerEl.addEventListener('change', function() {
            hexEl.value = pickerEl.value;
        });
        var syncPicker = function() {
            var hex = toHexColor(hexEl.value, '');
            if (hex) {
                pickerEl.value = hex;
            }
        };
        hexEl.addEventListener('keyup', syncPicker);
        hexEl.addEventListener('change', syncPicker);
        pickerEl.value = toHexColor(hexEl.value, fallback);

        var presets = document.querySelector('.mindmap-color-presets[data-hex="' + hexId + '"]');
        if (presets) {
            presets.addEventListener('click', function(e) {
                var btn = e.target.closest ? e.target.closest('.mindmap-color-preset') : null;
                if (!btn) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                var color = toHexColor(btn.getAttribute('data-color'), '');
                if (!color) {
                    return;
                }
                hexEl.value = color;
                pickerEl.value = color;
            });
        }
    };

    var editDialogOpen = function() {
        return !!document.getElementById('editObjDiv');
    };

    var showNodeTooltip = function($node, pinned) {
        if (editDialogOpen()) {
            return;
        }
        var txt = $node.find('.mindmap-info-text').html();
        if (!txt) {
            return;
        }
        removeNodeTooltips();

        var tooltipId = 'mindmap-tooltip-' + $node.attr('id');
        var $tooltip = $('<div role="tooltip"></div>')
            .attr('id', tooltipId)
            .addClass('tooltips il-mindmap-tooltip')
            .html(txt);

        $('body').append($tooltip);
        positionNodeTooltip($tooltip, $node);

        $node.find('.mindmap-info-toggle').attr({
            'aria-expanded': 'true',
            'aria-controls': tooltipId,
            'aria-describedby': tooltipId
        });
        tooltipNodeId = $node.attr('id');
        tooltipPinned = !!pinned;

        $tooltip.on('mouseenter', cancelTooltipHide);
        $tooltip.on('mouseleave', scheduleTooltipHide);
        $tooltip.on('wheel', function(e) {
            e.stopPropagation();
        });
    };

    var toggleNodeTooltip = function($node) {
        if (!$node.find('.mindmap-info-text').length) {
            return;
        }
        if (tooltipNodeId === $node.attr('id') && $('.il-mindmap-tooltip').length) {
            if (tooltipPinned) {
                removeNodeTooltips();
            } else {
                cancelTooltipHide();
                tooltipPinned = true;
            }
            return;
        }
        showNodeTooltip($node, true);
    };

    var bindNodeTooltips = function(mindmap) {
        mindmap.area
            .on('mouseenter.mindmaptooltip', '.mindmapnode', function() {
                if (tooltipPinned || lastPointerType === 'touch' || editDialogOpen()) {
                    return;
                }
                cancelTooltipHide();
                if (tooltipNodeId !== this.id) {
                    showNodeTooltip($(this), false);
                }
            })
            .on('mouseleave.mindmaptooltip', '.mindmapnode', scheduleTooltipHide);

        $(document)
            .on('pointerdown.mindmap pointerover.mindmap', function(e) {
                lastPointerType = e.originalEvent.pointerType || '';
            })
            .on('pointerdown.mindmap', function(e) {
                if (!tooltipPinned) {
                    return;
                }
                var node = document.getElementById(tooltipNodeId);
                if ((node && node.contains(e.target)) || $(e.target).closest('.il-mindmap-tooltip').length) {
                    return;
                }
                removeNodeTooltips();
            })
            .on('keydown.mindmap', function(e) {
                if (e.key === 'Escape' && tooltipNodeId && !editDialogOpen()) {
                    removeNodeTooltips();
                }
            });
    };

    var openNodeEditor = function(mindmap, id) {
        if (mindmap.disableRebuild > 0 || document.getElementById('editObjDiv')) {
            return;
        }
        if ($('#relink2Button').is(':visible') || !document.getElementById(id)) {
            return;
        }
        activateNode.call(mindmap, id);
        removeNodeTooltips();
        editNode.call(mindmap);
    };

    var bindNodeInteractions = function(mindmap) {
        var area = mindmap.area;

        if (mindmap.editable) {
            area.on('mousedown touchstart', '.mindmapnode:not(.rootnode)', function(e) {
                if ($(e.target).closest('.mindmap-info-toggle').length) {
                    return;
                }
                nodeMove.call(this, mindmap, e);
            });
        }

        area.on('click', '.rootnode', function() {
            mindmap.activeObj = $(this);
            highlightNode.call(mindmap, $(this));
        });

        area.on('click', '.mindmapnode', function(e) {
            if (editDialogOpen()) {
                e.preventDefault();
                removeNodeTooltips();
                return;
            }
            if (e.detail !== 0 && mindmap.lastPanMoved) {
                e.preventDefault();
                return;
            }
            var $target = $(e.target);
            if ($target.closest('.mindmap-info-toggle').length) {
                e.preventDefault();
                toggleNodeTooltip($(this));
                return;
            }
            if (mindmap.editable || $target.closest('a[href]').length) {
                return;
            }
            toggleNodeTooltip($(this));
        });

        if (!mindmap.editable || !window.PointerEvent) {
            return;
        }

        var tapStart = null;
        var lastTap = null;

        area[0].addEventListener('pointerdown', function(e) {
            var node = e.target.closest ? e.target.closest('.mindmapnode') : null;
            if (!e.isPrimary || e.button !== 0 || !node) {
                tapStart = null;
                return;
            }
            tapStart = { id: node.id, x: e.clientX, y: e.clientY, t: Date.now(), pointerId: e.pointerId };
        });

        $(document)
            .on('pointerup.mindmap', function(ev) {
                var e = ev.originalEvent;
                var start = tapStart;
                tapStart = null;
                if (!start || e.pointerId !== start.pointerId) {
                    return;
                }
                if (Math.abs(e.clientX - start.x) > TAP_SLOP || Math.abs(e.clientY - start.y) > TAP_SLOP) {
                    lastTap = null;
                    return;
                }
                if (lastTap && lastTap.id === start.id
                    && start.t - lastTap.t <= DOUBLE_TAP_MS
                    && Math.abs(start.x - lastTap.x) <= DOUBLE_TAP_RADIUS
                    && Math.abs(start.y - lastTap.y) <= DOUBLE_TAP_RADIUS) {
                    lastTap = null;
                    openNodeEditor(mindmap, start.id);
                    return;
                }
                lastTap = { id: start.id, t: Date.now(), x: start.x, y: start.y };
                if (start.id === 'root') {
                    mindmap.activeObj = $('#root');
                    highlightNode.call(mindmap, mindmap.activeObj);
                }
            })
            .on('pointercancel.mindmap', function() {
                tapStart = null;
            });
    };

    var rebuildTree = function(mindmap) {

	rebuildJSON.call(mindmap);
	    
	if(mindmap.disableRebuild>0) return;

	var idActive = "";
	if(mindmap.activeObj!="") {
	    idActive = mindmap.activeObj.attr('id');
	}

	removeNodeTooltips();
	$('.mindmapnode').remove();


	var v = mindmap.nodes['root'].title;
	var info = mindmap.nodes['root'].infotext+"";
	    if(info=="undefined") info = "";
	    if(info!="") {
		    v += buildInfoMarker(info);
	    }

	
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
	    
	    if(!mindmap.editable) {
		    if(mindmap.nodes[mindmap.edges[i].to].linktype=="extern") {
			    v = "<a href='"+mindmap.nodes[mindmap.edges[i].to].linktarget+"' target='_blank' rel='noopener noreferrer' style='text-decoration: none; border-bottom:1px solid;'>"+v+"</a>";
		    } else if(mindmap.nodes[mindmap.edges[i].to].linktype=="intern") {
			    if(typeof(internlinks[mindmap.nodes[mindmap.edges[i].to].linktarget])!="undefined") {
				    v = "<a href='"+internlinks[mindmap.nodes[mindmap.edges[i].to].linktarget]+"' style='text-decoration: none; border-bottom:1px dashed;'>"+v+"</a>";
			    }
		    }
	    } else {
		    if(mindmap.nodes[mindmap.edges[i].to].linktype=="extern") {
			    v = "<span style='text-decoration: none; border-bottom:1px solid;'>"+v+"</span>";
		    } else if(mindmap.nodes[mindmap.edges[i].to].linktype=="intern") {
			    v = "<span style='text-decoration: none; border-bottom:1px dashed;'>"+v+"</span>";
		    }
	    }
	    if(info!="") {
		    v += buildInfoMarker(info);
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

	}


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
    		
    		
    		$('.mindmapbackground').css("background-image", "url("+this.path+"/background.php?edges="+edges+"&arrows="+arrows+")");
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
    

	var EDIT_TABS = [
		{ panel: 'editnodedesc', icon: 'input-edit.png', label: 'Beschreibung' },
		{ panel: 'editnodefg', icon: 'text_color_hilight.png', label: 'Schriftfarbe' },
		{ panel: 'editnodebg', icon: 'bg_color_fill.png', label: 'Hintergrundfarbe' },
		{ panel: 'editnodeborder', icon: 'border_outline.png', label: 'Rahmenfarbe' },
		{ panel: 'editnodelink', icon: 'icon_link.png', label: 'Verlinkung' },
		{ panel: 'editnodearrow', icon: 'icon_arrows.png', label: 'Pfeilspitzen' }
	];

	var getFocusable = function(container) {
		return $(container).find('a[href], button, input, select, textarea, [tabindex]').filter(function() {
			return !this.disabled && this.type !== 'hidden' && this.tabIndex >= 0 && $(this).is(':visible');
		}).toArray();
	};

	var trapFocus = function(e, container) {
		var items = getFocusable(container);
		if (!items.length) {
			e.preventDefault();
			return;
		}
		var first = items[0];
		var last = items[items.length - 1];
		var active = document.activeElement;
		if (e.shiftKey && (active === first || active === container)) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	};

	var editNode = function() {
		var mindmap = this;
		var restoreFocus = document.activeElement;
		    
		$('.mindmapbutton').attr('disabled', 'disabled');
		
		var myid = this.activeObj.attr('id');
		centerMindmap.call(this, myid);
		
		this.disableRebuild++;
		removeNodeTooltips();
		
		var orig = this.nodes[myid].title;
		
                
                var pp = cssWorldPos(this.activeObj);
                
                $(this.area).append("<div id='transparentbg' style='position:absolute;z-index:999;left:0;top:0;width:10000px;height:10000px;background-color:silver;opacity: 0.7;'>&nbsp;</div>");
                
                var editObj = $("<div id='editObjDiv' role='dialog' aria-modal='true' aria-labelledby='mindmap-edit-title' aria-describedby='mindmap-edit-hint' tabindex='-1' style='width:300px;position:absolute;z-index: 1000;left:"+(pp.left-30)+"px;top:"+(pp.top-30)+"px;background-color: white;border: solid 1px silver;border-radius:5px;box-shadow:0 10px 18px -10px #888888;padding: 10px;'></div>");
                editObj.css({ transform: 'scale(' + (1 / (this.zoom || 1)) + ')', 'transform-origin': '0 0' });
                $(this.area).append(editObj);

                editObj.on('mousedown touchstart pointerdown wheel', function(e) { e.stopPropagation(); });
                
                var closeButton = $('<button type="button" class="mindmap-dialog-close"></button>')
                                .attr({ 'aria-label': MMLang.cancel, title: MMLang.cancel })
                                .append($('<img alt="" width="16" height="16" />').attr('src', this.path + '/close.png'));
                editObj.append(
                        $('<div class="mindmap-edit-header"></div>')
                                .append('<div id="mindmap-edit-title" class="mindmap-edit-title">' + MMLang.Knotenpunkt_bearbeiten + '</div>')
                                .append(closeButton)
                );
                editObj.append('<p id="mindmap-edit-hint" class="mindmap-sr-only">' + MMLang.mindmap_edit_keyboard_hint + '</p>');
                
                editObj.append( '<label class="mindmap-field-label" for="edit_'+myid+'">'+MMLang.Titel+'</label>' );
                
                
                editObj.append( '<input type="text" class="mindmaptextarea" value="'+orig+'" id="edit_'+myid+'" style="width: 97%;" />');

                if(orig==MMLang.neuer_Knotenpunkt) {
			editObj.append( '<div style="font-size:8pt;color:gray;">|| '+MMLang.um_mehrere_Knoten_nebeneinander_zu_erstellen+'.</div>' );
			editObj.append( '<div style="font-size:8pt;color:gray;">&& '+MMLang.um_mehrere_Knoten_hintereinander_zu_erstellen+'.</div>' );
		}
                editObj.append( '<div style="clear:both;height:1px;border-bottom: dotted 1px gray;margin: 6px 0 6px 0;"></div>');
                
                var tabs = "<div class='mindmap-edit-tabs' role='tablist' aria-label='" + escAttr(MMLang.Knotenpunkt_bearbeiten) + "'>";
                for (var t = 0; t < EDIT_TABS.length; t++) {
                        var tabLabel = escAttr(MMLang[EDIT_TABS[t].label]);
                        tabs += "<button type='button' role='tab' class='mindmap-edit-tab' id='" + EDIT_TABS[t].panel + "_tab'"
                                + " aria-controls='" + EDIT_TABS[t].panel + "' aria-selected='" + (t === 0) + "'"
                                + " tabindex='" + (t === 0 ? 0 : -1) + "' title='" + tabLabel + "' aria-label='" + tabLabel + "'>"
                                + "<img src='" + this.path + "/" + EDIT_TABS[t].icon + "' alt='' width='20' height='18' /></button>";
                }
                tabs += "</div>";
                editObj.append(tabs);
                
		var ta = this.nodes[myid].infotext+"";
		if(ta=="undefined") ta = "";

		var fgHex = toHexColor(this.nodes[myid].fgcolor, '#000000');
		var bgHex = toHexColor(this.nodes[myid].bgcolor, '#ffffff');
		var borderHex = toHexColor(this.nodes[myid].bordercolor, '#999999');

                var info = "";
                
                
                info += "<div id='editnodedesc' class='editnodeall' role='tabpanel' aria-labelledby='editnodedesc_tab'>";
                info += '<label class="mindmap-field-label" for="editta_'+myid+'">'+MMLang.Beschreibung+'</label>';
                info += "<textarea width='100%' rows='3' class='mindmaptextarea' style='width:100%;z-index:1000;' id='editta_"+myid+"'>"+ta+"</textarea>";
                info += "</div>";
                
                info += "<div id='editnodearrow' class='editnodeall' role='tabpanel' aria-labelledby='editnodearrow_tab' style='display:none;'>";
                info += '<table cellspacing=0 cellpadding=0 class="propbox"><tr><td valign=top>';
                info += '<label class="mindmap-field-label" for="arrowtypevalue_'+myid+'">'+MMLang.Pfeilspitzen+'</label>';
                
                info += "<select id='arrowtypevalue_"+myid+"'>";
                info += "<option value='ende' "+(this.nodes[myid].arrowtype=='ende' ? 'selected' : '')+">"+MMLang.arrow_ende+"</option>";
                info += "<option value='anfang' "+(this.nodes[myid].arrowtype=='anfang' ? 'selected' : '')+">"+MMLang.arrow_anfang+"</option>";
                info += "<option value='beide' "+(this.nodes[myid].arrowtype=='beide' ? 'selected' : '')+">"+MMLang.arrow_beide+"</option>";
                info += "<option value='ohne' "+(this.nodes[myid].arrowtype=='ohne' ? 'selected' : '')+">"+MMLang.arrow_ohne+"</option>";
                info += "</select>";
                
                info += '</td></tr></table>';
                
                info += "</div>";

                
                info += "<div id='editnodefg' class='editnodeall' role='tabpanel' aria-labelledby='editnodefg_tab' style='display:none;'>";
                
                info += '<table cellspacing=0 cellpadding=0 class="propbox"><tr><td valign=top>';
                info += '<label class="mindmap-field-label" for="fgcolorvalue_'+myid+'">'+MMLang.Schriftfarbe+'</label>';
                info += "<div class='mindmap-color-row'>";
                info += "<input type='text' size=10 value='"+this.nodes[myid].fgcolor+"' id='fgcolorvalue_"+myid+"' class='farbvalue' />";
                info += "<input type='color' class='c-field-color-picker' id='fgcolorpicker_"+myid+"' value='"+fgHex+"' aria-label='"+MMLang.Schriftfarbe+"' />";
                info += "</div>";
                info += buildColorPresets('fgcolorvalue_'+myid, 'fgcolorpicker_'+myid);
                info += '</td></tr>';
                info += '<tr>';
                info += '<td valign=top><br/>';
                info += '<label class="mindmap-field-label" for="fontsize_'+myid+'">'+MMLang.Schriftgroesse+'</label>';
                info += "<input type='text' size=5 style='text-align:center;' value='"+this.nodes[myid].fontsize+"' id='fontsize_"+myid+"' />pt<br/>";
                info += '</td></tr></table>';
                
                info += "</div>";
                
                info += "<div id='editnodebg' class='editnodeall' role='tabpanel' aria-labelledby='editnodebg_tab' style='display:none;'>";
                info += '<table cellspacing=0 cellpadding=0 class="propbox"><tr><td valign=top>';
                info += '<label class="mindmap-field-label" for="bgcolorvalue_'+myid+'">'+MMLang.Hintergrundfarbe+'</label>';
                info += "<div class='mindmap-color-row'>";
                info += "<input type='text' size=10 value='"+this.nodes[myid].bgcolor+"' id='bgcolorvalue_"+myid+"' class='farbvalue' />";
                info += "<input type='color' class='c-field-color-picker' id='bgcolorpicker_"+myid+"' value='"+bgHex+"' aria-label='"+MMLang.Hintergrundfarbe+"' />";
                info += "</div>";
                info += buildColorPresets('bgcolorvalue_'+myid, 'bgcolorpicker_'+myid);
                info += '</td></tr></table>';
                info += "</div>";
                
                
                info += "<div id='editnodeborder' class='editnodeall' role='tabpanel' aria-labelledby='editnodeborder_tab' style='display:none;'>";
                info += '<table cellspacing=0 cellpadding=0 class="propbox"><tr><td valign=top>';
                info += '<label class="mindmap-field-label" for="bordercolorvalue_'+myid+'">'+MMLang.Rahmenfarbe+'</label>';
                info += "<div class='mindmap-color-row'>";
                info += "<input type='text' size=10 value='"+this.nodes[myid].bordercolor+"' id='bordercolorvalue_"+myid+"' class='farbvalue' />";
                info += "<input type='color' class='c-field-color-picker' id='bordercolorpicker_"+myid+"' value='"+borderHex+"' aria-label='"+MMLang.Rahmenfarbe+"' />";
                info += "</div>";
                info += buildColorPresets('bordercolorvalue_'+myid, 'bordercolorpicker_'+myid);
                info += '</td></tr>';
                
                info += '<tr>';
                info += '<td valign=top><br/>';
                info += '<label class="mindmap-field-label" for="borderwidthvalue_'+myid+'">'+MMLang.Dicke+'</label>';
                info += "<input type='text' size=10 value='"+this.nodes[myid].borderwidth+"' id='borderwidthvalue_"+myid+"' /><br/>";
                info += '</td><td width=20></td>';
                
                info += '<td valign=top><br/>';
                info += '<label class="mindmap-field-label" for="bordertypevalue_'+myid+'">'+MMLang.Art+'</label>';
                info += "<select id='bordertypevalue_"+myid+"'>";
                info += "<option value='rund' "+(this.nodes[myid].bordertype=='rund' ? 'selected' : '')+">"+MMLang.abgerundet+"</option>";
                info += "<option value='rund2' "+(this.nodes[myid].bordertype=='rund2' ? 'selected' : '')+">"+MMLang.rund+"</option>";
                info += "<option value='eckig' "+(this.nodes[myid].bordertype=='eckig' ? 'selected' : '')+">"+MMLang.eckig+"</option>";
                info += "<option value='unterstrich' "+(this.nodes[myid].bordertype=='unterstrich' ? 'selected' : '')+">"+MMLang.unterstrichen+"</option>";
                info += "</select>";
                info += '</td></tr>';
                info += "</table>";
                info += "</div>";

                info += "<div id='editnodelink' class='editnodeall' role='tabpanel' aria-labelledby='editnodelink_tab' style='display:none;'>";
                info += '<label class="mindmap-field-label" for="linktypevalue_'+myid+'">'+MMLang.Verlinkung+'</label>';
                info += "<select id='linktypevalue_"+myid+"'>";
                info += "<option value=''>"+MMLang.kein_Link+"</option>";
                info += "<option value='extern' "+(this.nodes[myid].linktype=='extern' ? 'selected' : '')+">"+MMLang.externer_Link+"</option>";
                info += "<option value='intern' "+(this.nodes[myid].linktype=='intern' ? 'selected' : '')+">"+MMLang.interner_Link+"</option>";
                info += "</select>";
                info += "<br/><br/>";
                info += '<label class="mindmap-field-label" for="linktargetvalue_'+myid+'">URL '+MMLang.oder+' RefID</label>';
                if(typeof(this.nodes[myid].linktarget)=="undefined") this.nodes[myid].linktarget = "";
                info += "<input type='text' size=30 value='"+this.nodes[myid].linktarget+"' id='linktargetvalue_"+myid+"' /><br/>";
                info += "<div id='linkpickerrow_"+myid+"' style='"+(this.nodes[myid].linktype=='intern' ? '' : 'display:none;')+"margin-top:6px;'>";
                info += "<button type='button' class='mindmapbutton mindmap-link-picker' id='linkpickerbtn_"+myid+"'>"+MMLang.select_repository_object+"</button>";
                info += "</div>";
                info += "</div>";
                
                
		editObj.append( $('<div id="mindmapextrainfo" class="mindmapextrainfo" style="z-index: 2000;text-align:left;background-color:transparent;"></div>')
					.append(info)
					/*.append("Farbe:&nbsp;<input type='text' size=10 name='color' class='colorpicker mindmaptextarea' /> ")*/
					);
		$('#linkpickerbtn_'+myid).on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			openRepositoryLinkPicker(myid);
		});
		$('#linktypevalue_'+myid).on('change', function() {
			updateLinkTargetUi(myid);
		});
		bindHexColorPicker('fgcolorvalue_'+myid, 'fgcolorpicker_'+myid);
		bindHexColorPicker('bgcolorvalue_'+myid, 'bgcolorpicker_'+myid);
		bindHexColorPicker('bordercolorvalue_'+myid, 'bordercolorpicker_'+myid);
		
		editObj.append( '<div style="clear:both;height:1px;border-bottom: dotted 1px gray;margin: 6px 0 6px 0;"></div>');
		
		var okButton = $('<button type="button" class="mindmapokbutton">Ok</button>');
		editObj.append( $('<div class="mindmap-edit-footer"></div>').append(okButton) );

		var closed = false;

		var teardown = function() {
			closed = true;
			$('.mindmapbutton').removeAttr('disabled');
			editObj.remove();
			$('#transparentbg').remove();
		};

		var restore = function() {
			if (restoreFocus && restoreFocus !== document.body && document.contains(restoreFocus)) {
				restoreFocus.focus({ preventScroll: true });
			}
		};

		var cancelEdit = function() {
			if (closed) {
				return;
			}
			teardown();
			mindmap.disableRebuild--;
			restore();
		};

		var commitEdit = function() {
			if (closed) {
				return;
			}
			var id = myid;
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
			teardown();
			changeNodeText.call(mindmap, id, text, textta, opts );
			rebuildTree.call(mindmap, mindmap);
			highlightNode.call(mindmap, $("#"+id));
			restore();
		};

		closeButton.on('click', function(e) {
			e.preventDefault();
			cancelEdit();
		});
		okButton.on('click', function(e) {
			e.preventDefault();
			commitEdit();
		});

		var selectTab = function($tab, moveFocus) {
			editObj.find('.mindmap-edit-tab').attr({ 'aria-selected': 'false', tabindex: '-1' });
			$tab.attr({ 'aria-selected': 'true', tabindex: '0' });
			editObj.find('.editnodeall').hide();
			$('#' + $tab.attr('aria-controls')).show();
			if (moveFocus) {
				$tab.focus();
			}
		};

		editObj.find('.mindmap-edit-tabs')
			.on('click', '.mindmap-edit-tab', function(e) {
				e.preventDefault();
				selectTab($(this), false);
			})
			.on('keydown', '.mindmap-edit-tab', function(e) {
				var $tabs = editObj.find('.mindmap-edit-tab');
				var index = $tabs.index(this);
				var next = null;
				if (e.key === 'ArrowRight') {
					next = (index + 1) % $tabs.length;
				} else if (e.key === 'ArrowLeft') {
					next = (index - 1 + $tabs.length) % $tabs.length;
				} else if (e.key === 'Home') {
					next = 0;
				} else if (e.key === 'End') {
					next = $tabs.length - 1;
				}
				if (next === null) {
					return;
				}
				e.preventDefault();
				selectTab($tabs.eq(next), true);
			});

		editObj.on('keydown', function(e) {
			if (e.originalEvent.isComposing || e.keyCode === 229) {
				return;
			}
			if (e.key === 'Escape' || e.key === 'Esc') {
				e.preventDefault();
				e.stopPropagation();
				cancelEdit();
				return;
			}
			if (e.key === 'Enter') {
				var target = e.target;
				if (!e.ctrlKey && !e.metaKey
					&& (target.tagName !== 'INPUT' || target.type === 'color' || target.type === 'button')) {
					return;
				}
				e.preventDefault();
				commitEdit();
				return;
			}
			if (e.key === 'Tab') {
				trapFocus(e, editObj[0]);
			}
		});

		var titleInput = document.getElementById('edit_'+myid);
		if (titleInput) {
			titleInput.focus({ preventScroll: true });
			titleInput.select();
		}
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
                    mindmap.zoom = clampZoom(settings.zoom || 1);
                    mindmap.minZoom = MIN_ZOOM;
                    mindmap.maxZoom = MAX_ZOOM;

                    $this.css('overflow', 'hidden');

                    var onMouseMove = function(e, t){
                        mindmap.area.css('left', mindmap.left + (dragData.current.x - dragData.start.x)).css('top', mindmap.top + (dragData.current.y - dragData.start.y));
                    };
                    mindmap.left = mindmap.width / 2 - 5000 * mindmap.zoom;
                    mindmap.top = mindmap.height / 2 - 5000 * mindmap.zoom;

                    mindmap.area = $('<div class="mindmapbackground"></div>').css('position', 'relative')
                                                   .css('z-index', 1)
                                                   .css('left', mindmap.left)
                                                   .css('top', mindmap.top)
                                                   .css('width', 10000)
                                                   .css('height', 10000)
                                                   .css('transform', 'scale(' + mindmap.zoom + ')')
                                                   .css('transform-origin', '0 0')
                                                   .css('background-position', 'center');
                                                   
                    mindmap.area.bind('mousedown touchstart', function(e) {
                                $('.highlighbox').remove();
				
				if(mindmap.objactive != "") return;
				mindmap.objactive = "bg";

				var nativeTap = e.type === 'touchstart'
					&& $(e.target).closest(mindmap.editable ? '.mindmap-info-toggle' : '.mindmapnode').length > 0;
				if (!nativeTap) {
					e.preventDefault();
				}
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

				    mindmap.lastPanMoved = Math.abs(dragData.current.x - dragData.start.x) > TAP_SLOP
				        || Math.abs(dragData.current.y - dragData.start.y) > TAP_SLOP;
	
				    mindmap.left = mindmap.left+(dragData.current.x-dragData.start.x);
				    mindmap.top = mindmap.top+(dragData.current.y-dragData.start.y);
				    dragData.start.x = dragData.current.x;
				    dragData.start.y = dragData.current.y;
	
	
				});

                    }
                    );

                    mindmap.area[0].addEventListener('touchmove', function(e) {
                        if (mindmap.objactive !== 'bg' || !dragData.dragging || !e.cancelable || !e.touches.length) {
                            return;
                        }
                        var touch = e.touches[0];
                        if (Math.abs(touch.clientX - dragData.start.x) > TAP_SLOP
                            || Math.abs(touch.clientY - dragData.start.y) > TAP_SLOP) {
                            e.preventDefault();
                        }
                    }, { passive: false });

                    bindNodeInteractions(mindmap);
                    bindNodeTooltips(mindmap);

                    
                    var barG = $('<div id="areabar" role="toolbar"></div>');
                    var barL = $('<div class="mindmaptoolbar-actions"></div>');
                                              
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
			    initRepositoryLinkPicker();
			    barL.append(addButton);
			    barL.append(editButton);
			    barL.append(delButton);
                            
			    barL.append(relinkButton);
			    barL.append(relink2Button);
                            	

                            barG.append(barL);
			    $this.append($('<div class="mindmaptoolbar"></div>').append(barG));
		    }
		    
		    
                    $this.append(mindmap.area);
                    createZoomControls(mindmap, $this);

                    $this.on('wheel.mindmapzoom', function(e) {
                        e.preventDefault();
                        var oe = e.originalEvent;
                        var rect = $this[0].getBoundingClientRect();
                        var originX = oe.clientX - rect.left;
                        var originY = oe.clientY - rect.top;
                        var factor = oe.deltaY < 0 ? ZOOM_STEP : (1 / ZOOM_STEP);

                        applyZoom(mindmap, (mindmap.zoom || 1) * factor, originX, originY);
                    });

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
                $this.off('.mindmapzoom');
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

})( $ );

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

function nl2br(str) {
    if(typeof(str)=="string") return str.replace(/(\r\n)|(\n\r)|\r|\n/g,"<BR>");
    else return str;
}


