'use strict';

var refArray  		= require('./util/refArray');




class BoxModelCanvas {

	constructor(){

		var canvas = document.body.querySelector('.boxmodel-canvas');
		if (canvas === null){
			canvas = document.createElement('div');
			canvas.className= 'boxmodel-canvas';
			canvas.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;overflow:visible;';
			document.body.appendChild(canvas);
		}
		this.canvas = canvas;

	}

	draw(container){
   		draw(container, this.canvas)
	}

	clear(){
		var canvas = document.body.querySelector('.boxmodel-canvas');
		canvas.innerHTML = '';
	}

}

module.exports = BoxModelCanvas;


function draw(component, canvas){

	if (component.props.json.$clientRect == null) return;
	if (component.props.isHidden || component.props.dragging) return;

    var size = 6;    

	var children = refArray(component.refs);
	if (children.length){
		
		if (component.refs.tabstrip){
			var {t, l, w, h, r, b} = roundedRect(component.refs.tabstrip.props.json.$clientRect);
			addEdge(canvas, t,l, w, h, 'rgba(190,190,120,0.7)');
		}

		children.forEach( child => draw(child, canvas)); 
	}
	else {

	    var {t, l, w, h, r, b} = roundedRect(component.props.json.$clientRect);

	    addEdge(canvas, t,l+size, w-size, size, 'lime');
	    addEdge(canvas, t+size, r-size, size, h-size, 'red');
	    addEdge(canvas, b-size, l, w-size, size, 'yellow');
	    addEdge(canvas, t, l, size, h-size, 'purple');

	    if (component.refs.header){
	    	var {t, l, w, h, r, b} = roundedRect(component.refs.header.props.json.$clientRect);
	    	addEdge(canvas, t+size,l+size, w-(size*2), h-size, 'rgba(190,190,190,0.9)');
	    }

	}




}

function roundedRect(rect){
	var {top, left, width, height, right,bottom} = rect;
	var rnd = Math.round;

	return {
		t : rnd(top),
	    l : rnd(left),
	    w : rnd(width),
	    h : rnd(height),
	    r : rnd(right),
	    b : rnd(bottom)
	};

}

function addEdge(canvas, t, l, w, h, bg){

	var div = canvas.appendChild(document.createElement("div"));
	div.style.cssText = `position:absolute;top:${t}px;left:${l}px;width:${w}px;height:${h}px;background-color:${bg}`;

}