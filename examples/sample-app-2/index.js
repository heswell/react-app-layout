
var React 	= window.React = require('react/addons');
var MyApp 	= require('../sample-components/MyApp2');



var strJson = localStorage.getItem("real-layout");
var json;

if (strJson){
    try {
        json = JSON.parse(strJson); 
    }
    catch(e){
        console.log('index.js failed to parse string from localStorage as JSON');
    }
}


React.render(
    <MyApp json={json} />,
    document.getElementById('app')
);
