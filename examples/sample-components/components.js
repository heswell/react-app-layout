var React = require('react/addons');

var AppHeader = React.createClass({

	render(){

		return (
			<div className="app-header"/>
		);
	}


});

var Component1 = React.createClass({

	render(){

		var bg = this.props.bg;

		var style= Object.assign(this.props.style, {
			width: '100%',
			height:'100%',
			backgroundColor: bg
		});

		return (

			<div className="Component1" style={style}>

				<button onClick={this.handleClickMeasure}>Measure Boxes</button>
				<button onClick={this.handleClickDraw}>Show Boxes</button>
				<button onClick={this.handleClickDrawThis}>Draw This</button>
				<button onClick={this.handleClickMeasureThis}>Measure This</button>

			</div>



		);
	},

	getDefaultProps(){
		return {
			style : {}
		}
	},

	handleClickMeasure(){
		this.props.doCommand('measure-boxes');
	},

	handleClickDraw(){
		this.props.doCommand('draw-boxes');
	},

	handleClickMeasureThis(){
		this.props.doCommand('measure-this');
	},

	handleClickDrawThis(){
		this.props.doCommand('draw-this');
	}

});

module.exports = {AppHeader, Component1}