var React 				= window.React = require('react/addons');
var cx					= React.addons.classSet;
var PropTypes 			= React.PropTypes;
var Tabstrip 			= require('./Tabstrip');
var Tab 				= require('./Tab')
var Draggable 			= require('./Draggable').Draggable;
var indexOf             = require('./util/indexOf');
var refArray            = require('./util/refArray');
var shallowCloneObject	= require('./util/shallowCloneObject');
var cloneWithProps 		= React.addons.cloneWithProps;
var LayoutItem 			= require('./LayoutItem');
var Container 			= require('./Container');


var TabbedContainer = React.createClass({

	mixins : [Container, Draggable],

	contextTypes : {
		dragContainer : PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
	},

	render(){

		//onsole.log('TabbedContainer.render state.dimensions = ' + JSON.stringify(this.state.dimensions));

		var style;

		var {dimension, bg, style, isSelected, children, onLayout, dragging:tabsDragging} = this.props;

		var {selected, dragging, dimensions, childMeasurements} = this.state;

		var props = {selected:[selected||0], dragging, container:this};

		// Don't allow either the tabs or the tabstrip itself to be dragged unless it is inside
		// the DragZone. We might further config-enable this eg. allow tabs but not the tabstrip
		// to be dragged when the TabbedContainer IS the DragZOne.
		var isDraggable = Boolean(this.context.dragContainer);

//		if (dragContainer === true) (dragContainer = this);

		var tabs = children.map((child,idx) => <Tab key={'tab-' + idx} text={titleFor(child)}/>)

		var components = children.map((child, idx) => {

			var isSelected = selected === idx;

			var {json, children, ...childProps} = child.props;

			var props = {
				ref: 'relay-' + idx, 
				key: child.props.id || idx,
				container: this,
				onLayout,
				isSelected,
				json: json,
				measurements : childMeasurements[idx],
				onConfigChange: this.handleConfigChange,
				dragging: idx === dragging,
				style : Object.assign({boxSizing:'border-box'}, childProps.style || {}, dimensions[idx])
			};

			if (isLayout(child)){
				return cloneWithProps( child, props );
			}
			else {
				return <LayoutItem {...childProps} {...props}>{child}</LayoutItem>;
			}
		});

		var className = cx(
			'rect-layout',
			'rect-container',
			'rect-tabset',
			this.props.className,
	        tabsDragging ? 'dragging' : null
		);

		return (
			<div className={className} style={style}>
				<Tabstrip key="tabstrip" 
					ref="tabstrip" 
					json={this.state.header} 
					draggable={isDraggable} 
					{...props} 
					onSelectionChange={this.handleTabSelection}>{tabs}</Tabstrip>
				{components}
			</div>
		);
	},

	getInitialState(){
		return {
	        header : {},	
			selected : this.props.activeTab || 0,
			dragging: -1,
			dimensions : this.getDimensions(),
			childMeasurements:[]
		};
	},

	componentWillReceiveProps(nextProps){
		//onsole.log('TabbedContainer.componentWillReceiveProps...');
		if (nextProps.json !== this.props.json){
			console.log('...' + nextProps.json.content.length + ' children');

			var dimensions = nextProps.json.content.map((c,idx) => {
				if (idx === nextProps.json.activeTab){
					return {flexShrink:1,flexGrow:1,flexBasis:1};
				}
				else {
					return {flexShrink:1,flexGrow:1,flexBasis:0};
				}
			});

			this.setState({
				selected : nextProps.json.activeTab,
				dimensions});
		}

	},

	getDimensions(){

		var selectedIdx = this.props.activeTab || 0;

		if (this.props.json){
			return this.props.json.content.map(dimension);
		}
		else {
			return this.props.children.map(dimension);
		}

		function dimension(c,idx){
			if (idx === selectedIdx){
				return {flexGrow:1,flexShrink:1,flexBasis:1}
			}
			else {
				return {flexGrow:0,flexShrink:0,flexBasis:0}
			}
		}
	},

	renderChildren(){
		return null;
	},

	getManagedDimension(){
		return null;
	},

	getDragPermission(component){
		return {x:true,y:true}
	},

	getDragBoundingRect(){
		
		var {top, left, width, height,right, bottom} = this.getDOMNode().getBoundingClientRect();
		
		var tabstripHeight = this.refs.tabstrip.getDOMNode().clientHeight;

		if (this.props.dragContainer === true){
			return {top: top+tabstripHeight, left, width, height: height-tabstripHeight, right, bottom};
		}
		else {
			return {top, left, width, height, right, bottom};
		}
	},

	handleTabSelection(selected, idx){

		var prevIdx = this.state.selected;
//		this.setState({selected:idx, dimensions:newDimensions});
		if (this.props.onLayout){
			this.props.onLayout('switch-tab', {container: this.props.json, idx:this.state.selected, nextIdx:idx});
		}
		else {
			this.setState({selected: idx});
		}
	},

	getDraggable(el){

        if (el.classList.contains("rect-tab-caption")){
            var idx = parseInt(el.dataset.idx,10);
            return this.refs['relay-' + idx];
        }
        else {
            return this;
        }
	},

	releaseChild(child, style){

		var children = refArray(this.refs);
		var idx = indexOf(children, c => c === child);
		var selected = this.state.selected;
		var dimensions = this.state.dimensions.slice();

		var style = Object.assign({position: 'absolute'}, style);

		if (idx === selected){
			var len = children.length;
			selected = idx < len - 1 ? idx+1 : idx - 1;
			dimensions[selected] = dimensions[idx];
		}

		dimensions[idx] = Object.assign({}, dimensions[idx], style);

        this.setState({
        	dragging: idx,
        	selected,
        	dimensions
        });

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

	drop(component, dropTarget, boxModel){

		this.setState({
			dragging : -1
		});

		this.props.onLayout('drop', {component, dropTarget, boxModel});

	}

});

module.exports = TabbedContainer;

function titleFor(component){
	return component.props.title || computeTitle(component.props.json);
}


function computeTitle(component){

	var ret;

	if (component.content){
		ret = trawlForTitles(component);
	}

	return ret || component.type;
}

function trawlForTitles(component){
	
	function f(c,list){
		if (c.content){
			c.content.forEach(child => {
				if (child.title) list.push(child.title);
				else f(child,list);
			});
		}	
		return list;		
	}
	var flatten = listOfLists => [].concat.apply([],listOfLists);

	var lol = flatten(f(component,[]));

	return lol[0] + (lol.length > 1 ? '...' : '');

}

function isLayout(element){
	return element.type.displayName === 'FlexBox' || 
		   element.type.displayName === 'TabbedContainer' ||
		   element.type.displayName === 'DynamicContainer';
}




