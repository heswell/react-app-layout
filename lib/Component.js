/** @jsx React.DOM */
var React               	= require('react/addons');
var PropTypes				= React.PropTypes;
var cx                  	= React.addons.classSet;
var cloneWithProps      	= React.addons.cloneWithProps;
var ComponentHeader			= require('./ComponentHeader');
var ComponentContextMenu	= require('./ComponentContextMenu');

var PopupService 		= require('react-services').PopupService;

var BoxModelCanvas 		= require('./BoxModelHtml');
var BoxModel 			= require('./BoxModel');

// need a layout prop and layout state. That way we can accept layout data both via json
// and vis managing Flexible container
var Component = React.createClass({
	
	propTypes : {
		children : PropTypes.element
	},

	contextTypes : {
		dragContainer : PropTypes.object
	},

	render(){
		
		var {title, style, bg, children, json,   ...props} = this.props;

	    var className = cx(
	      'Component'
	    );

		return (
			<div className={className}>

				{children ? cloneWithProps(children, Object.assign({},props,{
					doCommand: this.doCommand
				})) : null}

			</div>
		);
	},


	getDraggable(){
		return this;
	},

	doCommand(command){
		if (command === 'draw-boxes'){
			var boxModel = new BoxModelCanvas()
			boxModel.draw(this.context.dragContainer)
		}
		else if (command === 'measure-boxes'){
			BoxModel.annotateWithMeasurements(this.context.dragContainer)
		}
		else if (command === 'measure-this'){
			BoxModel.annotateWithMeasurements(this)
		}
		else if (command === 'draw-this'){
			var boxModel = new BoxModelCanvas()
			boxModel.draw(this)
		}
	}

});

module.exports = Component;