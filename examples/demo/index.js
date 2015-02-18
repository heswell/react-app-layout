'use strict';

var React 	= window.React = require('react/addons');

var DynamicContainer = require('../../lib/DynamicContainer');
var Tabs = require('../../lib/TabbedContainer');

var styleLI = {padding: 12}

React.render(
	<Tabs className="SampleApp1" flexOrientation="column">
		<div key="1" title="GitHub URL" style={{backgroundColor:'ivory'}} header={false}>
			<ul style={{fontSize: "60pt",margin: 36}}>
				<li style={styleLI}>{`https://github.com/heswell`}</li>
				<li style={styleLI}>{`react-app-layout`}</li>
			</ul>
		</div>
		<div key="2" title="test 2" style={{backgroundColor:'green'}} header={false}/>
	</Tabs>,
	document.getElementById('app')
);

