'use strict';

var React = require('react/addons');
var cx    = React.addons.classSet;

var PlaceHolder = React.createClass({

	render(){

		var className = cx(
			"PlaceHolder",
			this.props.className
		);

		var style = {
//			...this.props.style,
			backgroundColor: 'rgb(60,60,60)'
		}



		return (
			<div className={className} style={style}>
				<div className="close icon-arrow" onClick={this.handleClose}>
					<span>Close</span>
				</div>
			</div>
		);
	},

	handleClose(){
		this.props.onLayout('remove', {component:this});
	}


});


module.exports = PlaceHolder;