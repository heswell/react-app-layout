/** @jsx React.DOM */

var React 				= require("react");
var cloneWithProps 		= React.addons.cloneWithProps;


var Stack = React.createClass({

	render(){

		console.log('Stack.render drag ' + JSON.stringify(this.props.drag));

		var {selected, dragging, style} = this.props;

		var children = this.props.children.map((child, idx) => {

			var isDragging = idx === dragging;
			var isSelected = selected.indexOf(idx) !== -1;

			return cloneWithProps(child, {
				key : 'relay-' + idx,
				ref : 'relay-' + idx,
				idx,
				dragging: isDragging,
				style: isDragging ? style : null,
				// ie. make TabbedContainer the component container, won't always be the case
				container : this.props.container, 
				dragContainer : this.props.dragContainer,
				isSelected,
				size : {flex : isSelected ? '1 1 100%' : ' 0 0 0'}
			})
		});
	
		// only render the active child

		return (
			<div className="rect-layout rect-container rect-stack">
				{children}
			</div>
		);

	}


});


module.exports = Stack;