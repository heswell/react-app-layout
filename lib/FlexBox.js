/** @jsx React.DOM */
var React 			= window.React = require('react/addons');
var cx				= React.addons.classSet;
var PropTypes 		= React.PropTypes;
var cloneWithProps 	= React.addons.cloneWithProps;
var {checkMeasurements, checkChildMeasurements} = require('./FlexUtils');

var shallowCloneObject		= require('./util/shallowCloneObject');

var Splitter 		= require('./Splitter');
var LayoutItem 		= require('./LayoutItem');
var PlaceHolder 	= require('./PlaceHolder');
var Container 		= require('./Container');
var refArray        = require('./util/refArray');
var indexOf         = require('./util/indexOf');


var DragContainerType = PropTypes.oneOfType([PropTypes.object, PropTypes.bool]);

var FlexBox = React.createClass({

	mixins : [Container],

	render(){

		//onsole.log('Tower.render state.dimensions = ' + JSON.stringify(this.state.dimensions));

		var {flexOrientation, style, isSelected} = this.props;

		var className = cx(
			this.props.className,
			'rect-layout',
			'rect-container',
			flexOrientation === 'row' ? 'rect-terrace' : 'rect-tower',
	        isSelected ? 'active' : null
		);

		return (
			<div className={className}  style={style}>
				{this.renderFlexibleChildren()}
			</div>
		)
	},

	renderFlexibleChildren(){

		var {children, onLayout} = this.props;

		var {dimensions, dragging, flexPlaceholder, childMeasurements} = this.state;

		//onsole.log('Flexible.renderFlexibleChildren \n' + JSON.stringify(dimensions))
		 
		var splitterIdx = 1;

		var splitterAt = splitterPositions(children, dimensions, dragging);
		
		return children.reduce(	(results, child, idx, arr) => {

			if (splitterAt[idx]){

				results.push(
					<Splitter ref={'splitter-' + splitterIdx}
						key={'splitter-' + idx}
						idx={idx}
						container={this}
						onLayout={onLayout} />
				);

				splitterIdx += 1;

			}

			// if (idx === flexPlaceholder){
			if (idx === dragging && this.context.releaseSpace !== 'close'){
				var dim = this.getManagedDimension();
				var style = {flexBasis:dimensions[idx][dim],flexGrow:0,flexShrink:0, backgroundColor: "rgb(60,60,60)"};
				results.push(
					<div className="rect-layout placeholder" style={style}></div>
				)
			}

			var {json, children, ...childProps} = child.props;

			var props = {
				ref: 'relay-' + idx, 
				key: child.props.id || idx,
				container: this,
				onLayout,
				json: json,
				measurements : childMeasurements[idx],
				onConfigChange: this.handleConfigChange,
				dragging: idx === dragging,
				dimension: this.getManagedDimension(),
				style : Object.assign({boxSizing:'border-box'}, childProps.style || {}, dimensions[idx])
			}

			if (isLayout(child)){
				results.push(cloneWithProps( child, props ));
			}
			else {
				results.push(<LayoutItem {...childProps} {...props}>{child}</LayoutItem>);
			}

			return results;

		}, []);
	},

	getInitialState(){

		// var measuredChildren = this.props.children.reduce(flexSizedChild,[]);
		// var childMeasurements = [];
		// measuredChildren.forEach(idx => childMeasurements[idx] = {width: 'auto', height: 'auto'});
		//onsole.log('FlexBox.getInitialState context = ', this.context);

		return {
			dragging: -1,
			flexPlaceholder: -1,
			dimensions : this.getDimensions(),
			childMeasurements : [],
			measurements : {}
			// childMeasurements
		};
	},

	getDimensions(){

		if (this.props.json){
			return this.props.json.content.map(c => c.$size);
		}
		else {
			return this.props.children.map(this.getComponentDimensions);
		}

		return 
	},

	// a candidate for FlexUtils

	getComponentDimensions(component){

		var dim = this.getManagedDimension();
		var resizeable;

		if (component.props.$size){
			return component.props.$size
		}

		var size = component.props[dim];
		if (size === undefined && component.props.style){
			size = component.props.style[dim];
		} 

		var resizeable = component.props.resizeable;

		if (size){
			return {flexShrink:0, flexGrow:0, flexBasis: size, resizeable};
		}

		return {flexShrink:1,flexGrow:1,flexBasis:1};
	},

	componentWillReceiveProps(nextProps){
		// if there are more/less children, revisit measuredChildren

		var {json, measurements} = nextProps;
		var {childMeasurements, dimensions} = this.state;

		if (json !== this.props.json){
			this.setState({
				dimensions: json.content.map(c => c.$size)
			});
		}

		if (measurements = checkMeasurements(measurements, this.state.measurements, 'FlexBox')){
			this.setState({measurements});

			var dim = this.getManagedDimension();
			if (childMeasurements = checkChildMeasurements(measurements, dimensions, dim)){
				this.setState({childMeasurements});
			}
		}


	},

	getManagedDimension(){
		return this.props.flexOrientation === 'row' ? 'width' : 'height';
	},

	getDragPermission(component){
		if (component.constructor.displayName === 'Splitter'){
			return this.props.flexOrientation === 'row' ? {y:false, x:true} : {x:false, y:true};
		}
		else {
			return {x:true,y:true}
		}
	},

	releaseChild(child, style){

		var children = refArray(this.refs);
		var idx = indexOf(children, c => c === child);

		var style = Object.assign({position: 'absolute'}, style);

		var dimensions = this.state.dimensions.slice();

		dimensions[idx] = Object.assign({}, dimensions[idx], style);

		var dim = this.getManagedDimension();

        this.setState({	dimensions, dragging: idx });

 	},

	drop(component, dropTarget){

		this.setState({
			dragging : -1,
			dimensions: this.props.json.content.map(c => c.$size)
		});

		var {releaseSpace} = this.context;

		this.props.onLayout('drop', {component, dropTarget, releaseSpace});

	},

	splitterDragStart(splitter){

		var idx = parseInt(splitter.props.idx);
		var idx1 = idx-1;
		var idx2 = idx;

		var child;
		var i = idx;

		while((child = this.child(idx1)) && !isFlexibleComponent(child)) idx1--;
		while((child = this.child(idx2)) && !isFlexibleComponent(child)) idx2++;
		

		this.assignExplicitSizeToFlexElements();

		this.splitChildren = [idx1, idx2];

	},

	splitterMoved(splitter, distance){
		//console.log('Flexible.splitterMoved ' + distance + '\n' + JSON.stringify(this.state.dimensions))

		var [idx1, idx2] = this.splitChildren;
		var dim = this.getManagedDimension();
		var dimensions = this.state.dimensions.slice();

		var size1 = dimensions[idx1].flexBasis + distance,
			size2 = dimensions[idx2].flexBasis - distance;

		dimensions[idx1] = {flexGrow:1,flexShrink:1,flexBasis: size1};
		dimensions[idx2] = {flexGrow:1,flexShrink:1,flexBasis: size2};	

		//onsole.log('new dimension ' + JSON.stringify(dimensions));

		this.setState({dimensions});

	},

	splitterDragEnd(splitter){

		var dimensions = this.state.dimensions;
		var dim = this.getManagedDimension();
		var [idx1, idx2] = this.splitChildren;

		// let the child know it has been resized
		var childMeasurements = [];
		childMeasurements[idx1] = {};
		childMeasurements[idx2] = {};
		childMeasurements[idx1][dim] = dimensions[idx1].flexBasis; 
		childMeasurements[idx2][dim] = dimensions[idx2].flexBasis; 

		this.setState({childMeasurements});

		if (this.props.onLayout){
			this.props.onLayout('splitter-resized', {container:this.props.json, dimensions});
		}
		
		this.splitChildren = null;

	},

	assignExplicitSizeToFlexElements(){
		console.log('Flexible.assignExplicitSizeToFlexElements BEFORE\n' + JSON.stringify(this.state.dimensions))
		
		var boxes = this.getChildBoundingBoxes();
		
		var dim = this.getManagedDimension();

		var dimensions = this.state.dimensions;

		var dimension = dim === 'height' ? 
			(box,idx) => {return Object.assign({},dimensions[idx], {flexBasis: Math.round(box.height)})} :
			(box,idx) => {return Object.assign({},dimensions[idx], {flexBasis: Math.round(box.width)})}
		

		var dimensions = boxes.map(dimension); 

		console.log('Flexible.assignExplicitSizeToFlexElements explicit sizes AFTER\n' +  JSON.stringify(dimensions)  );

		this.setState({
			dimensions
		});

		return dimensions;

	},

	handleConfigChange(component, {fixed}){
		
		if (fixed !== 'undefined'){
			//TODO we don't need to do this if it has been done already
			this.props.onLayout('config-change', {
				dimensions: this.assignExplicitSizeToFlexElements(),
				fixed,
				component:component.props.json,
				container:this.props.json})
		}
	},

	positionChild(child, left, top){

		if (left !== undefined || top !== undefined){

			var {dimensions, dragging:idx}  = this.state;

			dimensions = dimensions.slice();

			var style = shallowCloneObject(dimensions[idx]);

			if (left !== undefined)	style.left = left;
			if (top !== undefined)	style.top = top;

			dimensions[idx] = style;


	        this.setState({dimensions});

		}
	},


	getChildBoundingBoxes(){

		var refs = this.refs;
		var idx = 0;
		var child;
		var boxes = [];

		while(child = this.child(idx)){
			boxes.push(child.getDOMNode().getBoundingClientRect());
			idx++;
		}

		return boxes;

	},

	child(idx){
		return this.refs[`relay-${idx}`] || null;
	}



});

module.exports = FlexBox;

function splitterPositions(children, dimensions, dragging){
	
	var ret = [];
	var totalFlexCount = 0;

	var flexCount = 0;
	var fixed;

	for (var i=0;i<children.length;i++){

		if (isFlexible(dimensions[i])){
			totalFlexCount += 1;
		}
	}

	if (totalFlexCount < 2){ // no splitters needed
		return children.map(c => false);
	}

	for (var i=0;i<children.length;i++){

		fixed = !isFlexible(dimensions[i]);

		if (!fixed){
			flexCount += 1;
		}

		// even if flexible, if everything before is fixed, still no splitter...
		if (flexCount === 0 || (flexCount===1 && !fixed)){
			ret[i] = false;
		}
		else if (fixed && i > 0 && !isFlexible(dimensions[i-1])){
			ret[i] = false;
		}
		else if (i===0 || i === dragging || (fixed && flexCount === 0)){
			ret[i] = false;
		}
		else if (fixed && totalFlexCount === flexCount){
			ret[i] = false;
		}
		else {
			ret[i] = true;
		}			

	}

	return ret;

}

function isLayout(element){
	return element.type.displayName === 'FlexBox' || 
		   element.type.displayName === 'TabbedContainer' ||
		   element.type.displayName === 'DynamicContainer';
}

function isFlexible(size){
	return size.flexGrow !== 0 || size.resizeable === true; 
}

function isFlexibleComponent(component){
	return component.props.style.flexGrow !== 0 || component.props.resizeable === true; 
}

function flexSizedChild(list,component,idx){
	if (component.props.width === 'flex-width' || component.props.height === 'flex-height'){
		list.push(idx);
	} 
	return list;
}


