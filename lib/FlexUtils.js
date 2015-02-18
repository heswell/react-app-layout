/** @jsx React.DOM */
var React 					= require('react/addons');
var cloneWithProps 			= React.addons.cloneWithProps;
var refArray                = require('./util/refArray');
var indexOf                 = require('./util/indexOf');
var shallowCloneObject		= require('./util/shallowCloneObject');

function checkMeasurements(nextMeasurements, myMeasurements, label){

	if (nextMeasurements){
		var {width,height} = nextMeasurements;

		if (height === undefined){ height  = myMeasurements.height}
		if (width === undefined){ width  = myMeasurements.width}
		
		if (width !== myMeasurements.width || height !== myMeasurements.height){
			
			return { width,height };
		}
	}

}

function checkChildMeasurements(measurements, dimensions, dim){

	if (dim === 'height' && measurements.width){
		return dimensions.map(() => {
			return {width : measurements.width}
		});
	}
	else if (dim === 'width' && measurements.height){
		return dimensions.map(() => {
			return {height : measurements.height}
		});
	}

}

module.exports = {checkMeasurements, checkChildMeasurements}







