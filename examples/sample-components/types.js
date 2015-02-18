var React = require('react/addons');
var cx    = React.addons.classSet;

var AppHeader = React.createClass({

	render(){

		var className = cx(
			"app-header",
			this.props.className
		);

		var style ={
			backgroundColor: 'rgb(90,90,90)',
			height: this.props.height
		}



		return (
			<div className={className} style={style}>
				{this.props.children}
			</div>
		);
	},

	getDefaultProps(){
		return {style:{}}
	}


});


module.exports = {AppHeader}