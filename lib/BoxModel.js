/** *@jsx React.DOM */
var refArray  		= require('./util/refArray');
var Layout          = require('./Layout');

"use strict";

var NORTH = Layout.position.North,
    SOUTH = Layout.position.South,
    EAST = Layout.position.East,
    WEST = Layout.position.West,
    HEADER = Layout.position.Header,
    CENTRE = Layout.position.Centre;

class BoxModel {

	static annotateWithMeasurements(component){
		return addMeasurements(component);
	}

	static smallestBoxContainingPoint(component,x,y){
		return smallestBoxContainingPoint(component,x,y);
	}

	static pointPositionWithinComponent(x,y,component){

		var rect = getJson(component).$clientRect
        if (rect.height === 0){ // non-selected child in TabbedContainer
            rect = getJson(component.props.container).$clientRect;
        }

	    var posX = x - rect.left,
	        posY = y - rect.top,
	        pctX = posX / rect.width,
	        pctY = posY / rect.height,
	        closeToTheEdge,
	        position;

	    var borderZone = 30;

	    var header = component.refs && (component.refs.header || component.refs.tabstrip);
	    if (header && containsPoint(header,x,y)){
	        position = HEADER;
	    }
	    else {


	    	if (component.type === "PlaceHolder"){
	    		debugger;
	    	}

	        var quadrant  = (pctY < 0.5  ? "north" : "south") + (pctX < 0.5 ? "west" : "east");

	        switch (quadrant){
	            case "northwest":  position = (pctX > pctY) ? NORTH : WEST; break;
	            case "northeast":  position = ((1-pctX) > pctY) ? NORTH : EAST; break;
	            case "southeast":  position = (pctX > pctY) ? EAST : SOUTH; break;
	            case "southwest":  position = ((1-pctX) > pctY) ? WEST : SOUTH; break;
	        }

	        if (typeof borderZone === 'number'){
	            var closeToTheEdge = 0;
	            if (posX < borderZone)  closeToTheEdge += 8;
	            if (posX > rect.width - borderZone) closeToTheEdge += 2;
	            if (posY < borderZone) closeToTheEdge += 1;
	            if (posY > rect.height - borderZone) closeToTheEdge += 4;
	        }

	    }


	    // we might want to also know if we are in the center - this will be used to allow
	    // stack default option

	    return {position, x, y, pctX, pctY, closeToTheEdge};

	}

}


module.exports = BoxModel;

function smallestBoxContainingPoint(component,x,y){

	//onsole.log('smallestBoxContainingPoint in ' + component.constructor.displayName);

    if (!containsPoint(component,x,y)) return null;

    if (!component.refs){
    	return component;
    }

    var {header, tabstrip, ...childRefs} = component.refs;
    header = header || tabstrip;

    if (header && containsPoint(header,x,y)) {
    	console.log('%cIts all in the header','font-weight:bold;color:red;');
    	return component;
    }
    var children = refArray(childRefs);
    if (children.length === 0) return component;

    var child;

    for (var i=0;i<children.length;i++){
        if (child = smallestBoxContainingPoint(children[i],x,y)){
            return child;
        }
    }

    return component;
}


function containsPoint(component, x, y){

	if (!component) throw "containsPoint called without box";
	if (!component.isMounted()) throw "containsPoint called on component that is not mounted";

	if (component.props.isHidden || component.props.dragging === true) return false;

	var box = getJson(component).$clientRect;

    return  x >= box.left && x < box.right && y >= box.top && y < box.bottom;

}


function addMeasurements(component){

	if (component){

		// if (window.gogo === true && component.props.title === "Test 2.B"){
		// 	debugger;
		// }

		if (component.props.dragging) return component;

		addClientMeasurements(component);

		addHeaderMeasurements(component);

		return addChildMeasurements(component);

	}

}

function addClientMeasurements(component){
	var json = getJson(component);
	var rn = Math.round;
	var {top:t, left:l, width:w, height:h, bottom:b, right:r} = component.getDOMNode().getBoundingClientRect();
	json.$clientRect = {top: rn(t), left: rn(l), width:rn(w), height:rn(h), bottom:rn(b), right:rn(r)};
}

function addHeaderMeasurements(component){
	if (component.refs){
		var header = (component.refs.header || component.refs.tabstrip);
		if (header){
			addClientMeasurements(header);
		}
	}
}

function addChildMeasurements(container){

	var components = refArray(container.refs, false)
		.map(addMeasurements)
		.sort(byClientPosition);

	components.forEach((component, idx, components) => {
		var previousComponent = components[idx-1];
		var gap;

		if (previousComponent && (gap = gapBetweenClients(previousComponent, component))){
			console.log('Gap of ' + gap.size + ' between ' + previousComponent.constructor.displayName + ' and ' + component.constructor.displayName);

			var val1 = (Math.floor(gap.size/2)),
				val2 = gap.size - val1;

			if (gap.dimension === 'width'){
				stretchClients(previousComponent, 'right', val1);
				stretchClients(component, 'left',val2)
			}
			else {
				stretchClients(previousComponent, 'down', val1);
				stretchClients(component, 'up', val2)
			}
		}

	});

	return container;

}

function boxPrintId(name){ return `$${this.id} <${name||this.name}> ${maybe(this.title)}`;}

function flexboxPrintId(){return boxPrintId.call(this,`${this.flexOrientation === 'column' ? 'Tower' : 'Terrace'}`);}

function maybe(val){
	return val ? '.' + val : ''
}

function stretchClients(component, direction, amount){


	var header = component.refs && (component.refs.header || component.refs.tabstrip);
	if (header){
		if (direction === 'up'){
			var headerBox = header.props.json.$clientRect;
			headerBox.top -= amount;
			headerBox.height += amount;
		}
		if (direction === 'right' || direction === 'left'){
			stretchClients(header, direction, amount);
		}
	}

	var children = refArray(component.refs);
	if (children.length){
		children.forEach(child => stretchClients(child, direction, amount));
	}


	var box = getJson(component).$clientRect;
	
	if (direction === 'right'){
		box.width += amount;
		box.right += amount;
	}
	else if (direction === 'left'){
		box.width += amount;
		box.left -= amount;
	}
	else if (direction === 'down'){
		box.height += amount;
		box.bottom += amount;
	}
	else if (direction === 'up'){
		box.height += amount;
		box.top -= amount;
	}


}


function gapBetween(box1, box2){

	if (box1.right < box2.left){
		return {dimension: 'width', size: box2.left - box1.right};
	}
	else if (box1.bottom < box2.top){
		return {dimension: 'height', size: box2.top - box1.bottom};
	}
}

function gapBetweenClients(c1, c2){
	return gapBetween(getJson(c1).$clientRect, getJson(c2).$clientRect);
}


function nonDragging(component){
	return component.props.dragging !== true;
}

function byPosition(c1, c2){

	if (c1.top < c2.top || c1.left < c2.left) return -1;
	if (c1.top > c2.top || c1.left > c2.left) return 1;
	return 0;

}

function byClientPosition(c1, c2){
	return byPosition(getJson(c1).$clientRect, getJson(c2).$clientRect);
}

function getJson(component){
	if (component.state && component.state.json){
		return component.state.json;
	}
	return component.props.json;
}

function toJson(box){

	var {name, top, left, width, height} = this;

	return {
		name, top, left, width, height
	}
}
