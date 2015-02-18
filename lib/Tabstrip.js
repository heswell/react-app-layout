/** @jsx React.DOM */

var React 				= require("react/addons");
var cloneWithProps 		= React.addons.cloneWithProps;

var SelectionModel = require('./SelectionModel');

var Tabstrip = React.createClass({

	mixins : [SelectionModel],

	render(){

		var {dragging, children} = this.props;
		//onsole.log('Tabstrip render');

		var tabs = children.reduce((tabs, child, idx) => {

			if (dragging !== idx)
				tabs.push(
				   cloneWithProps(child, {
					key : String(idx),
					idx,
					isSelected: this.isSelected(idx),
					onClick: this.handleItemClick }));
			
			return tabs;

		},[]);

		return (

			<div className="rect-layout rect-component rect-tabstrip">
				<div className="rect-inner-sleeve">
					<ul className="rect-inner">{tabs}</ul>
				</div>
			</div>
		);

	},

	getDefaultProps(){
		return {
			selected: [0]
		}
	}

});


module.exports = Tabstrip;

