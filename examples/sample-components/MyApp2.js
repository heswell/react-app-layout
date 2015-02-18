'use strict';

var React = require('react/addons');
var PropTypes = React.PropTypes;
var DynamicContainer = require('../../lib/DynamicContainer'); 
var FlexBox = require('../../lib/FlexBox')
var PlaceHolder = require('../../lib/PlaceHolder')
var {Draggable} = require('../../lib/Draggable');
var Component = require('../../lib/Component');
var {AppHeader}	= require('./types');

var ComponentIcon = React.createClass({

	mixins : [Draggable],

	contextTypes :{
		dragContainer : PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
	},

	render(){

		var color = this.props.color;

		return (
			<div className="ComponentIcon"
				style={{backgroundColor:color}}>{color} Component</div>
		);

	},

	getDraggable(){
		return this;
	}


});

var ComponentPalette = React.createClass({

	render(){
		return (
			<div className="ComponentPalette">
				{this.props.componentColours.map(color => 
					<ComponentIcon key={color} color={color} 
						draggable={true} container={this} />
				)}
			</div>
		);
	},

	getDefaultProps(){
		return {
			componentColours : ['red', 'green', 'ivory']
		};
	},

	getDragPermission(draggee){
		return {x:true,y:true}
	}


});

var Footer = React.createClass({
	render(){

		var style = {
			...this.props.style,
			backgroundColor: "rgb(120,120,120)"
		};
		return <div className="AppStatus rect-component" style={style}/>;
	},
	getDefaultProps(){
		return {style:{}}
	}
});

var MyApp2 = React.createClass({

	render(){

		var {json, ...props} = this.props;

		var {history,index} = this.state;

		return (
	
			<FlexBox className="MyApp" flexOrientation="column">
				<AppHeader header={false} onBack={this.handleBack} onForward={this.handleForward} className="rect-component" style={{height:60}}>
					<ComponentPalette />
				</AppHeader>
				<DynamicContainer  
						{...props} 
						className="rect-component" 
						ref="app"
						json={json} 
						dragContainer={true}
						onChange={this.handleChange}>
					<PlaceHolder />
				</DynamicContainer>
				<Footer header={false} style={{height:32,backgroundColor:"green"}}/>
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

module.exports = MyApp2;