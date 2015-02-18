/** @jsx React.DOM */

var React 	= window.React = require('react/addons');
var MyApp 	= require('../sample-components/MyApp');

getJSON("flex-app.json", json => renderApp(json));

function renderApp(json){

    React.withContext({

        releaseSpace: 'close'
    
    }, () => {

        React.render(
            <MyApp json={json} />,
            document.getElementById('app')
        );

    });
}

function getJSON(url, callback){

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

    if (json){
        callback(json)
    }
    else {

        var xhr = new XMLHttpRequest();
         xhr.onreadystatechange = function() {
            if(xhr.readyState === 4){
                // TODO create a custom reader for the JSON, which can supply defaults etc
                var json = JSON.parse(xhr.responseText); 
                callback(json);
            }
        };
        xhr.open("GET", url, true);
        xhr.send(null);       

    }

}
