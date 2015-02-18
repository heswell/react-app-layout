/** @jsx React.DOM */
var React = require('react');

function serialize(source){
	
	function toString(json, d){
		return [
			`$${json.$path}: <${type(json)}>${json.title ? ' ' + json.title:''} ${clientRect(json)}`
		].concat(
			json.content === undefined ? [] :
			json.content.map(j => tabs(d) + toString(j,d+1))).join('\n');
	}

	if (React.isValidElement(source)){
		return toString(source.props.json,1);
	}
	else {
		return toString(source,1);
	}


}

function type(json){
	if (json.type === 'FlexBox'){
		return json.flexOrientation === 'column' ? 'Tower' : 'Terrace';
	}
	else {
		return json.type;
	}
}

function tabs(length){
	return Array.apply(null,Array(length)).map(i => '\t').join('');
}

function layout(json){
	if (json.layout === undefined) return '';

	return ['layout:['].concat([json.layout.map(l => `${l.flexGrow}:${l.flexShrink}:${l.flexBasis}`).join(' ')]).concat(']').join('');
}

function clientRect(json){
	var cr = json.$clientRect;

	if (cr === undefined) return '';

	return `clientRect:[${cr.top},${cr.right},${cr.bottom},${cr.left} ${cr.width}x${cr.height}]`;

}


module.exports = serialize;


