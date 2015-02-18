/** @jsx React.DOM */

var React 	= require("react/addons");
var cx      = React.addons.classSet;


var Tab = React.createClass({


	render(){
		
		var isSelected = this.props.isSelected;

	    var className = cx(
	      'rect-tab',
	      isSelected ? 'active': null
	    );

		return (
			<li className={className} onClick={this.handleClick}>
				<a href="#" className="rect-tab-caption" data-idx={this.props.idx}>{this.props.text}</a>
			</li>
		);

	},

	handleClick(){
		this.props.onClick(this.props.idx);
	}

});


module.exports = Tab;