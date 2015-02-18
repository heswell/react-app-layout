'use strict';

var React = require('react/addons');
var PropTypes = React.PropTypes;

var DragContainerType = PropTypes.oneOfType([PropTypes.object, PropTypes.bool]);

var ContainerMixin = {

	contextTypes :{
		dragContainer : DragContainerType,
		releaseSpace : PropTypes.oneOf(['close','open']) 
	},

	childContextTypes : {
		dragContainer : DragContainerType
	},

	getChildContext(){
		
		var {dragContainer} = this.context; 
		
		if (!dragContainer){
			dragContainer = this.props.dragContainer === true ? this : false
		}

		return { dragContainer };
	}

}

module.exports = ContainerMixin;