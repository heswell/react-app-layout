/** @jsx React.DOM */
var React 		= require('react');
var cx			= React.addons.classSet;

var ComponentHeader = React.createClass({

	render(){

		var {fixed,minimized,maximized} = this.props; 

		return (
			<header className="header">
				<span className="title">{this.props.title}</span>
				{fixed && !minimized ? <span className="icon-pushpin"></span> : null}
				<button className="icon-menu" data-key="menu" onClick={this.handleMenuClick}/>
			</header>
		);
	},

	handleMenuClick(e){
		if (this.props.onAction){
			this.props.onAction('menu', {left: e.clientX, top: e.clientY});
		}
	}


});

module.exports = ComponentHeader;