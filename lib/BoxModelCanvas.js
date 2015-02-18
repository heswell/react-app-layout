'use strict';

var refArray  		= require('./util/refArray');




class BoxModelCanvas {

	constructor(){

		var canvas = document.createElement('canvas');

		canvas.className = 'fullscreen';

		canvas.width = document.body.clientWidth;

		canvas.height = document.body.clientHeight;

		document.body.appendChild(canvas);

		this.canvas = canvas;

	}


	draw(container){

		setWidth(this.canvas);
   		
   		this.canvas.classList.add("ready");
        
        var ctx = this.canvas.getContext('2d');
   		draw(container, ctx)

	}


	clear(){
   		this.canvas.classList.remove("ready");
	}

}

module.exports = BoxModelCanvas;


function setWidth(canvas){
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
}


function draw(container, ctx){

	if (container.props.json.$clientRect == null) return;

	var children = refArray(container.refs);
	if (children.length){
		children.forEach( component => draw(component, ctx)); 
	}
	else {
	    var {top,left,right,bottom} = container.props.json.$clientRect;

	    var t = Math.round(top) + 2,
	        l = Math.round(left)  + 2,
	        r = Math.round(right) -  2,
	        b = Math.round(bottom) - 2;

	    ctx.lineWidth = 4;
	    ctx.strokeStyle = "lime";
	    ctx.fillStyle = 'rgba(0,0,0,.5)';

	    ctx.beginPath();
	    ctx.moveTo(l,t);
	    ctx.lineTo(r,t);
	    ctx.lineTo(r,b);
	    ctx.lineTo(l,b);
	    ctx.closePath();
	    ctx.stroke();

	}




}