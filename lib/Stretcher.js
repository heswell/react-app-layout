/** @jsx React.DOM */
"use strict";

var React = require('react');

var Stretcher = React.createClass({

	render(){
		return (
			<div className="stretcher" style={this.props.rect}>
				{this.props.children}
			</div>
		);
	}

});

module.exports = Stretcher;