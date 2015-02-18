/** @jsx React.DOM */
"use strict";

class LayoutCanvas {

	constructor(){

		var canvas = document.createElement('canvas');
		canvas.className = 'fullscreen';

		canvas.width = document.body.clientWidth;
		canvas.height = document.body.clientHeight;

		document.body.appendChild(canvas);

		this.canvas = canvas;

	}

	prepare(){
   		
   		var e = this.canvas;
   		setWidth(e);
   		e.classList.add("ready");

	}

	clear(){
    	this.canvas.classList.remove("ready");
	}

	draw(component){

	    var rect,
	        children = refArray(component.refs),
	        ctx;

	    if (component.props.dragging){
	        return;
	    }    

	    if (children.length){
	        for (var i=0;i<children.length;i++){
	            this.draw(children[i]);
	        }
	    }
	    else if (rect = component.getDOMNode().getBoundingClientRect()){

	        ctx = this.canvas.getContext('2d');

	        var t = Math.round(rect.top),
	            l = Math.round(rect.left),
	            r = Math.round(rect.right),
	            b = Math.round(rect.bottom);

	        ctx.lineWidth = 4;
	        ctx.strokeStyle = "green";
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

}

function setWidth(canvas){
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
}

module.exports = LayoutCanvas;


    function refArray(refs){
        
        var i=0;
        var ret = [];
        var ref;

        if (!refs) return ret;

        while(ref = refs['relay-' + i]){
            ret.push(ref);
            i++;
        }

        return ret;


    }

