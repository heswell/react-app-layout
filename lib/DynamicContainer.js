'use strict';

var React          		= require('react/addons');
var cx             		= React.addons.classSet;
var PropTypes	   		= React.PropTypes;
var cloneWithProps 		= React.addons.cloneWithProps;
var Layout 				= require('./Layout');
var componentFromJSON 	= require('./util/componentFromJson');
var shallowCloneObject  = require('./util/shallowCloneObject');
var {addPaths}			= require('./util/pathUtils');
var serialize 			= require('./serialize');
var {uuid} 				= require('react-utils');

var DynamicContainer = React.createClass({

	propTypes : {
		json : PropTypes.object,
		onLayout : PropTypes.func,
		types : PropTypes.object
	},

	contextTypes :{
		dragContainer : PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
	},

	childContextTypes : {
		dragContainer : PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
	},

	getChildContext(){
		
		var {dragContainer} = this.context; 
		
		if (!dragContainer){
			dragContainer = this.props.dragContainer === true ? this : false
		}

		return {
			dragContainer
		}
	},

	render(){

		addPaths(this.state.json);

		var {json, style, children, ...props} = this.props;
		var props = Object.assign(props, {
			ref : 'relay-0',
			key: 'root',
			container: this,
			onLayout : this.handleLayout
		});

		for (var prop in props){
			if (typeof props[prop] === 'undefined'){
				delete props[prop];
				console.log('deleted ' + prop);
			}
		}

		var className=cx(
			"relay-app rect-tower",
			this.props.className
		);

		return (
			<div className={className} style={style}>
				{cloneWithProps(componentFromJSON(this.state.json, this.props.types),props)}
			</div>
		);
	},

	getInitialState(){

		console.log('DynamicContainer.getInitialState context = ', this.context);

		var json = this.props.json || jsonFromComponent(this.props.children, this); 

		//onsole.log(JSON.stringify(json,null,2));

		return {json};
	},

	componentWillReceiveProps({json}){
		if (typeof json === 'object' && json !== this.state.json){
			this.setState({json});
		}
	},

	// shouldComponentUpdate(nextProps){
	// 	return nextProps.json !== this.state.json;
	// },

	handleLayout(command, options){

		var json = this.state.json;

		if (command === 'splitter-resized'){
			json = Layout.resize(json, options);
		}
		else if (command === 'config-change'){
			json = Layout.config(json, options);
		}
		else if (command === 'switch-tab'){
			json = Layout.tab(json, options);
		}
		else if (command === 'remove'){
			json = Layout.remove(json, options);
		}
		else if (command === 'minimize'){
			json = Layout.minimize(json, options);
		}
		else if (command === 'restore'){
			json = Layout.restore(json, options);
		}
		else {	
			json = Layout.drop(json, options);
		}

		console.log('%c' + serialize(json),'font-weight:bold;color:blue;')

		this.setState({json});

		if (this.props.onChange){
			this.props.onChange(json);
		}

	}

});

module.exports = DynamicContainer;


function jsonFromComponent(component, parent){

	var props = component.props;
	var parentType = (parent.type || parent.constructor).displayName;
	var dim = parent.props.flexOrientation === 'row' ? 'width' : 'height';
	var $size;
	var flexBasis;

	if (isLayoutType(parentType)){
		if (flexBasis = props[dim] || (props.style && props.style[dim])){
			$size = {flexShrink:0, flexGrow:0, flexBasis}
		}
		else {
			$size = {flexShrink:1, flexGrow:1, flexBasis:1}
		}
	}

	var json = {
		type: component.type.displayName || component.type,
		id : uuid(),
		$size
	};

	var props = component.props;
	var propertyNames = Object.getOwnPropertyNames(props);

	propertyNames.forEach(property => {
		if (property === 'children'){
			var content = json.content = [];
			React.Children.forEach(props.children, child => 
				content.push(jsonFromComponent(child,component))
			);
		}
		else if (property === 'style'){
			json.style = shallowCloneObject(props.style);
		}
		else if (typeof props[property] !== 'object'){
			json[property] = props[property];
		}
	});

	return json;
}

function isLayoutType(type){
	return type === 'FlexBox' || type === 'Tabs' || type === 'DynamicContainer';
}

/*

function getComponentDimensions(component){

	var dim = this.getManagedDimension();

	if (component.props.$size){
		return component.props.$size
	}

	var size = component.props[dim];
	if (size === undefined && component.props.style){
		size = component.props.style[dim];
	} 
	if (size){
		return {flexShrink:0, flexGrow:0,flexBasis: size};
	}

	return {flexShrink:1,flexGrow:1,flexBasis:1};
}

*/
