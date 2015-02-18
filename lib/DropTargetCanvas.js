/** @jsx React.DOM */
"use strict";

var Layout          = require('./Layout');
var DropMenu        = require('./DropMenu');
var PopupService    = require('react-services').PopupService;

var NORTH = Layout.position.North,
    SOUTH = Layout.position.South,
    EAST = Layout.position.East,
    WEST = Layout.position.West,
    HEADER = Layout.position.Header;

var _rootDropTarget;
var _multiDropOptions = false;
var _currentDropTarget;   
var _multiDropLoopTime = 1500;
var _dropMenu = false;

class DropTargetCanvas {

	constructor(){
		var canvas = document.createElement('canvas');
		canvas.className = 'fullscreen';


		document.body.appendChild(canvas);

		this.canvas = canvas;

		this.w = document.body.clientWidth;
		this.h = document.body.clientHeight;
	}


	prepare(){

       this.canvas.classList.add("ready");

	};


	clear(){
        this.canvas.classList.remove("ready");
        if (_dropMenu){
            PopupService.hidePopup();
            _dropMenu = false;
        }
	}

	draw(dropTarget){

        //onsole.log('DropTargetCanvas.draw ', JSON.stringify(layout));

		_rootDropTarget = dropTarget;
		_currentDropTarget = null;
		_multiDropOptions = typeof dropTarget.nextDropTarget === 'object';

        console.log('draw, _multiDropOptions = ' + _multiDropOptions);

        if (_dropMenu){
            PopupService.hidePopup();
            _dropMenu = false;
        }

		draw(this.canvas, dropTarget, this.w, this.h);

	}


}

module.exports = DropTargetCanvas;


function setWidth(canvas,w,h){

	canvas.width = w;
	canvas.height = h;
}



function draw(canvas, dropTarget, w, h, skipDropOptions){

	setWidth(canvas, w, h);

	var ctx = canvas.getContext('2d');

    if (_currentDropTarget){
    	_currentDropTarget.active = false;
    }    

	//onsole.log('activate drop target',dropTarget);	    
    _currentDropTarget = dropTarget;
    dropTarget.active = true;

    var refs = dropTarget.component.refs;
    var header = refs && (refs.header || refs.tabstrip);
	if (dropTarget.pos.position === HEADER && header){

	    drawTabbedOutline(ctx, dropTarget, w, h);
	}
	else {
	    drawOutline(ctx, dropTarget, w, h);
	}

    if (_multiDropOptions){
	    var nextPos = dropTarget.nextDropTarget || _rootDropTarget;
        if (skipDropOptions !== true){
            drawDropOptions(canvas, dropTarget, w, h);
        }
    }

}

function drawTabbedOutline(ctx, dropTarget, w, h){

    console.log('draw TabbedOitline of ' + dropTarget.component.constructor.displayName);

    var box = dropTarget.component.props.json.$clientRect,
        header = dropTarget.component.refs.header || dropTarget.component.refs.tabstrip,
        headerBox = header.props.json.$clientRect;

    var t = Math.round(headerBox.top),
        l = /*header.name === 'Tabstrip' ? Math.round(header.tabRight) :*/ Math.round(headerBox.left),
        r = Math.round(headerBox.right),
        b = Math.round(headerBox.bottom);

    
    ctx.beginPath();

    var lineWidth = 6;
    var inset = 0;
    var headOffset = (header.top - box.top) + header.height;
    
    var gap = Math.round(lineWidth/2) + inset;
    var {top, left,right,bottom} = box;
    
    setCanvasStyles(ctx, {lineWidth:lineWidth,  strokeStyle:'yellow'});
    
 
    drawTab(ctx,l+gap, t+gap, r, b, top, left+gap, right-gap, bottom-gap);

    ctx.stroke();

}

function drawTab(ctx, l, t, r, b, top, left, right, bottom){

    var radius = 5;

    var x = l;
    var y = t;
    var width = 100;
    var height = b - t;
    var fill = false;
    var stroke = true;

    ctx.lineJoin = 'round';

      ctx.beginPath();
      
      ctx.moveTo(x, y + height);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x,y,x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height);

      ctx.lineTo(right, y + height);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left, y+height);


       ctx.closePath();
	
      if (stroke) {
        ctx.stroke();
      }
      if (fill) {
        ctx.fill();
      }        

}

function drawOutline(ctx, dropTarget, w, h){

    var component = dropTarget.component, 
        targetPosition = dropTarget.pos.position;

    var size = null;
    
    //onsole.log(`layout=${JSON.stringify(layout)}`);

    if (dropTarget.pos.width){
        size = {width: dropTarget.pos.width}
    }
    else if (dropTarget.pos.height){
        size = {height: dropTarget.pos.height}
    }

//    var rect = component.getDOMNode().getBoundingClientRect();
    var rect = component.props.json.$clientRect;

    var t = Math.round(rect.top),
        l = Math.round(rect.left),
        r = Math.round(rect.right),
        b = Math.round(rect.bottom);

    var lineWidth = 6;

    setCanvasStyles(ctx, {
    	lineWidth:lineWidth,
    	strokeStyle:'yellow'
    });

    ctx.beginPath();

    var inset = 0;
    var gap = Math.round(lineWidth/2) + inset;
 
    switch(targetPosition){

        case NORTH:
        case HEADER:
            var halfHeight = Math.round((b-t)/2);
            var sizeHeight = (size && size.height) ? size.height : 0;
            var height = sizeHeight ? Math.min(halfHeight,Math.round(sizeHeight)) : halfHeight;            
            drawRect(ctx, l+gap, t + gap, r-gap, t + gap + height);
            break;

        case WEST:
            var halfWidth = Math.round((r-l)/2);
            var sizeWidth = (size && size.width) ? size.width : 0; 
            var width = sizeWidth ? Math.min(halfWidth,Math.round(sizeWidth)) : halfWidth;
            drawRect(ctx, l + gap, t+gap, l + gap + width, b-gap);
            break;

        case EAST:
            var halfWidth = Math.round((r-l)/2);
            var sizeWidth = (size && size.width) ? size.width : 0; 
            var width = sizeWidth ? Math.min(halfWidth,Math.round(sizeWidth)) : halfWidth;
            drawRect(ctx, (r-gap) - width, t+gap, r-gap, b-gap);
            break;	        
        
        case SOUTH:
            var halfHeight = Math.round((b-t)/2);
            var sizeHeight = (size && size.height) ? size.height : 0;
            var height = sizeHeight ? Math.min(halfHeight,Math.round(sizeHeight)) : halfHeight;            
        
            drawRect(ctx, l+gap, (b - gap) -height, r-gap, b - gap);
            break;
        
        default:

            console.log('DropTargetCanvas what are we doing here ?');
    }

    ctx.closePath();
    ctx.stroke();


    // if (dropTarget.pos.closeToTheEdge == dropTarget.pos.position){

    // 	var zone = 30;

    //     ctx.beginPath();
    //     ctx.fillStyle = 'rgba(0,0,0,.25)';

    //     //TODO if op is 'insert' we may not be at the edge - may be 
    //     // somewhere in middle of a tower or terrace - look at index
    //     var g = 6;

    //     zone = zone - gap;

    //     console.log(_rootDropTarget.pos.position , dropTarget.pos.position);
    //     switch (_rootDropTarget.pos.position ){
    //         case NORTH: drawRect(ctx,l+g,t+g,r-g,t+g+zone); break;
    //         case SOUTH: drawRect(ctx,l+g,b-g-zone,r-g,b-g); break;
    //         case EAST: drawRect(ctx,r-g-zone,t+g,r-g,b-g); break;
    //         case WEST: drawRect(ctx,l+g,t+g,l+zone,b-g); break;
    //     }

    //     ctx.closePath();
    //     ctx.fill();

    // }
}

function drawDropOptions(canvas, dropTarget, w, h){

    console.log('draw Drop Options');

    PopupService.showPopup({component : (
            <DropMenu dropTarget={dropTarget}
                onMouseOver={handleMouseOver(canvas, w, h)} /> )});

    _dropMenu = true;

}

function handleMouseOver(canvas, w, h){
    return function(dropTarget){
        draw(canvas, dropTarget, w, h, true);
    };
}


function setCanvasStyles(ctx, styles){
	ctx.strokeStyle = styles.strokeStyle || 'black';
	ctx.lineWidth = styles.lineWidth || 2;
	ctx.fillStyle = styles.fillStyle || 'rgba(255,0,0,.5)';

	// if (_multiDropOptions){
	// 	ctx.setLineDash([15,10]);
	// }
}

function drawRect(ctx, x1, y1, x2, y2){

    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y1);
    ctx.lineTo(x2,y2);
    ctx.lineTo(x1,y2);


}


