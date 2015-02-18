'use strict';

var React = require('react/addons');
var DynamicContainer = require('../../lib/DynamicContainer'); 
var FlexBox = require('../../lib/FlexBox')
var {AppHeader}	= require('./types');


var Footer = React.createClass({
	render(){

		var style = {
			...this.props.style
		};
		return <div className="AppStatus rect-component" style={style}/>;
	},
	getDefaultProps(){
		return {style:{}}
	}
});

var MyApp = React.createClass({


	render(){

		var {json, ...props} = this.props;

		var {history,index} = this.state;

		return (
	
			<FlexBox className="MyApp" flexOrientation="column">
				<AppHeader header={false} className="rect-component" style={{height:60}}>
					<button onClick={this.handleBack}>Back</button>
					<button onClick={this.handleForward}>Forward</button>
				</AppHeader>

				<DynamicContainer ref="app" {...props} className="rect-component" 
					json={history[index]}  onChange={this.handleChange} />
				
				<Footer header={false} style={{height:32,backgroundColor:"rgb(120,120,120)"}} />
			</FlexBox>

		);

	},

	getInitialState(){
		return {
			index : 0,
			history :[this.props.json]
		}
	},

	handleChange(json){
		// no need for imutability
		this.state.history.push(json);
		var index = this.state.history.length-1;
		this.setState({index});


		localStorage.setItem("real-layout",JSON.stringify(json));

	},

	handleBack(){
		var index = Math.max(this.state.index-1,0);
		this.setState({index})
	},

	handleForward(){
		var index = Math.max(this.state.index+1,this.state.history.length-1);
		this.setState({index})
	}


});

module.exports = MyApp;