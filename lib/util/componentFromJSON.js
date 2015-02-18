/** @jsx React.DOM */
"use strict";

var React = require('react');

var Container 	= require('../Container');
var Component 	= require('../Component');
var FlexBox 	= require('../FlexBox');
var LayoutItem 	= require('../LayoutItem');
var PlaceHolder = require('../PlaceHolder');
var Tabs		= require('../TabbedContainer');

var primaryTypes = require('../../examples/sample-components/types');
var components = require('../../examples/sample-components/components');

var LayoutTypes = {Container, Component, FlexBox, Tabs, TabbedContainer:Tabs,PlaceHolder, LayoutItem};

var Types = {};

function componentFromJSON(json, types){

	Types = types || {};

	var component = _componentFromJSON(json);

	Types = null;

	return component;
}

function _componentFromJSON(json, idx){

	if (Array.isArray(json)){
		return json.map(componentFromJSON);
	}
	else if (json == null){
		return null
	}

	var {type, content, ...props} = json;
	var ReactType, BoxedType, boxedComponent;

	ReactType = LayoutTypes[type];

	if (ReactType === undefined){
		if (React.DOM[type]){
			ReactType = type;
		}
		else if (Types[type]){
			ReactType = Types[type];
		}
		else if (primaryTypes[type]){
			ReactType = primaryTypes[type];
		}
		else {
			ReactType = Component;
			BoxedType = components[type];
			if (BoxedType === undefined){
				throw "componentFromJSON: unknown component type: " + type;
			}
		}
	}

	var children = content ? content.map(_componentFromJSON) : null;
	if (BoxedType){
		boxedComponent = <BoxedType>{children}</BoxedType>;
	}

	return (
		<ReactType key={idx | 0} {...props} json={json}>
			{boxedComponent || children}
		</ReactType>
	);
}


module.exports = componentFromJSON;