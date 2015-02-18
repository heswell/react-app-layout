'use strict';

var shallowCloneObject = require('./shallowCloneObject');
var {addPaths, adjustPath, followPath} = require('./pathUtils');


function transform(json,options){

	var nodeToBeMoved;
	var nodeToBeRemoved;
	var containerOfNodeToBeRemoved;
	var pathToBeReplaced;
	var replacementNode;
    var nodeToBeInserted;
	var nodeToBeConfigured;
	var containerIntoWhichToInsert;
	var nodeAfterWhichToInsert;
	var nodeBeforeWhichToInsert;
	var wrappedNode1;
	var wrappedNode2;
	var nodeSize;
    var config;
    var containerRemoved;
    var placeHolderUsed = true;
    var releaseSpace = 'close';
    var pos;

	for (var op in options){
		var opts = options[op];
		switch(op){

            case 'releaseSpace':
                releaseSpace = opts;
                break;

			case 'move':

				nodeToBeMoved = opts.source;
				if (opts.before){
					console.log(`transform: move before ` + opts.before.$path);
					nodeBeforeWhichToInsert = opts.before.$path;
				}
				else if (opts.after){
					console.log(`transform: move after ` + opts.after.$path);
					nodeAfterWhichToInsert = opts.after.$path;
				}
				break;

            case 'configure':
                nodeToBeConfigured = opts.target;
                config = opts.config;
                break;

			case 'wrap':
                pos = opts.pos;
				nodeToBeRemoved = opts.source;
				wrappedNode1 = opts.target;
				wrappedNode2 = opts.source;
				break;

			case 'insert':
				nodeToBeInserted = opts.node;

				nodeSize = opts.pos ? (opts.pos.width || opts.pos.height): undefined;

				if (opts.container){
					console.log(`transform: insert into container ` + opts.container.$path);
					containerIntoWhichToInsert = opts.container.$path;
				}
				else if (opts.before){
					console.log(`transform: insert before ` + opts.before.$path);
					nodeBeforeWhichToInsert = opts.before.$path;
				}
				else if (opts.after){
					console.log(`transform: insert after ` + opts.after.$path);
					nodeAfterWhichToInsert = opts.after.$path;
				}
				break;

			case 'replace':
				console.log(`transform: replace node at ` + opts.node.$path);
				pathToBeReplaced = opts.node.$path;
				replacementNode = opts.replacement;
				break;

			case 'remove' :
				console.log(`transform: remove node at ` + opts.node.$path);
				nodeToBeRemoved = opts.node;
				containerOfNodeToBeRemoved = opts.from;
				break;
		}
	}

	if (nodeToBeRemoved){
        if (nodeToBeRemoved.type === 'PlaceHolder' || releaseSpace === 'close'){
            var ret = remove(json, nodeToBeRemoved.$path);
            containerRemoved = ret.containerRemoved;
            json = ret.json;
            placeHolderUsed = false;
        }
        else {
            var ret = removeWithPlaceholder(json, nodeToBeRemoved.$path);
            containerRemoved = ret.containerRemoved;
            json = ret.json;
        }


	}

	if (wrappedNode1 && wrappedNode2){

        if (placeHolderUsed){
            pathToBeReplaced = wrappedNode1.$path;
        }
        else {
            pathToBeReplaced = adjustPath(wrappedNode1.$path, nodeToBeRemoved.$path, containerRemoved);
        }
		replacementNode = wrap(pos, wrappedNode2, followPath(json, pathToBeReplaced));
	
    }

    if (nodeToBeConfigured){
        json = configure(json,nodeToBeConfigured.$path, config);
    }


	if (nodeToBeMoved){

		var path;
		var pos;

		if (path = nodeBeforeWhichToInsert){
			pos = parseInt(path.slice(path.lastIndexOf('.')+1));
		}
		else if (path = nodeAfterWhichToInsert){
			pos = parseInt(path.slice(path.lastIndexOf('.')+1)) + 1;
		}

		json = move(json, nodeToBeMoved.$path, pos);
	}

	if (pathToBeReplaced){
		json = replace(json, pathToBeReplaced, replacementNode);
	}

	if (nodeToBeInserted){

		if (nodeToBeRemoved){

            if (!placeHolderUsed){
                if (nodeAfterWhichToInsert){
                    nodeAfterWhichToInsert = adjustPath(nodeAfterWhichToInsert, nodeToBeRemoved.$path, containerRemoved);
                }
                else if (nodeBeforeWhichToInsert){
                    nodeBeforeWhichToInsert = adjustPath(nodeBeforeWhichToInsert, nodeToBeRemoved.$path, containerRemoved);
                }
                else {
                    containerIntoWhichToInsert = adjustPath(containerIntoWhichToInsert, nodeToBeRemoved.$path, containerRemoved);
                }
            }
		}

		json = insert(json, nodeToBeInserted, containerIntoWhichToInsert, nodeBeforeWhichToInsert, nodeAfterWhichToInsert, nodeSize);

	}


	addPaths(json);

	return json;

}

function move(json, path, pos){
	var paths = path.split('.').slice(1).map(n => parseInt(n,10));
	var idx = paths[0];
    var newJson = {};
    var content;

    for (var property in json){
        if (property === 'content'){
        	content = json.content;
            newJson.content = content.slice();
            if (paths.length === 1){
            	newJson.content.splice(pos,0,newJson.content[idx]);
            	if (pos < idx) idx += 1
            	newJson.content.splice(idx,1);
            }
            else {
            	newJson.content[idx] = move(content[idx], paths.join('.'), pos);
            }
        }
        else {
            newJson[property] = json[property];
        }
    }        

    return newJson;


}

function insert(json, node, container, before, after, nodeSize){

	if (nodeSize){
		node = shallowCloneObject(node);
		var {flexGrow,flexShrink} = node.$size;
		node.$size = {flexGrow,flexShrink,flexBasis:nodeSize};
	}

	if (after){
		return insertAfter(json, after, node, nodeSize);
	}
	else if (before){
		return insertBefore(json, before, node, nodeSize);
	}
	else {
		return insertInto(json, container, node, nodeSize);
	}
}



function insertInto(json, path, node, nodeSize){

	var paths = path.split('.').slice(1).map(n => parseInt(n,10));
	var idx = paths[0];
    var newJson = {};
    var content;

    for (var property in json){
        if (property === 'content'){
        	content = json.content;
            newJson.content = content.slice();
            if (paths.length === 0){
            	newJson.content.push(node);
            }
            else {
            	newJson.content[idx] = insertInto(content[idx],paths.join('.'), node);
            }
        }
        else {
            newJson[property] = json[property];
        }
    }        

    return newJson;
    
}

function insertBefore(json, path, node, nodeSize){

	var paths = path.split('.').slice(1).map(n => parseInt(n,10));
	var idx = paths[0];
    var newJson = {};
    var content;

    for (var property in json){
        if (property === 'content'){
        	content = json.content;
            newJson.content = content.slice();
            if (paths.length === 1){
            	newJson.content.splice(idx,0,node);
            }
            else {
            	newJson.content[idx] = insertBefore(content[idx],paths.join('.'), node);
            }
        }
        else {
            newJson[property] = json[property];
        }
    }        

    return newJson;
    
}

function insertAfter(json, path, node, nodeSize){

	var paths = path.split('.').slice(1).map(n => parseInt(n,10));
	var idx = paths[0];
    var newJson = {};
    var content;

    for (var property in json){
        if (property === 'content'){
        	content = json.content;
            if (paths.length === 1){
            	if (nodeSize){
		       		var dimension = json.flexOrientation === 'column' ? 'height' : 'width';
		            newJson.content = assignBoxSizes(dimension, content);
	            	newJson.content.splice(idx+1,0,node);
            	}
            	else {
		       		var dimension = json.flexOrientation === 'column' ? 'height' : 'width';
		            newJson.content = assignBoxSizes(dimension, content);
	            	var size = Math.round(newJson.content[idx].$size.flexBasis/2);
	            	newJson.content.splice(idx+1,0,node);
	            	newJson.content[idx].$size.flexBasis = size;
	            	newJson.content[idx+1].$size.flexBasis = size;
            	}
            }
            else {
            	newJson.content = content.slice();
            	newJson.content[idx] = insertAfter(content[idx],paths.join('.'), node, nodeSize);
            }
        }
        else {
            newJson[property] = json[property];
        }
    }        

    return newJson;
    
}


function replace(json, path, node){

	var paths = path.split('.').slice(1).map(n => parseInt(n,10));
	var idx = paths[0];
    var newJson = {};
    var content;

    // replacing the root...
    if (paths.length === 0){
    	return node;
    }

    for (var property in json){
        if (property === 'content'){
            newJson.content = json.content.slice();
            if (paths.length === 1){
            	if (Array.isArray(node)){
            		[].splice.apply(newJson.content,[idx,1].concat(node));
            	}
            	else {
            		newJson.content[idx] = node;
            	}
            }
            else {
            	newJson.content[idx] = replace(json.content[idx],paths.join('.'), node);
            }
        }
        else {
            newJson[property] = json[property];
        }
    }        

    return newJson;

}


function configure(json, path, config){

    var paths = path.split('.').slice(1).map(n => parseInt(n,10));
    var idx = paths[0];
    var newJson = {};
    var content;

    // replacing the root...
    if (paths.length === 0){
        return Object.assign({}, node, config);
    }

    for (var property in json){
        if (property === 'content'){
            newJson.content = json.content.slice();
            if (paths.length === 1){
                newJson.content[idx] = Object.assign({},json.content[idx], config);
            }
            else {
                newJson.content[idx] = configure(json.content[idx], paths.join('.'), config);
            }
        }
        else {
            newJson[property] = json[property];
        }
    }        

    return newJson;

}


function removeWithPlaceholder(json, path){

    var paths = path.split('.').slice(1).map(n => parseInt(n,10));
    var idx = paths[0];
    var newJson = {};
    var content;
    var result;
    var containerRemoved = 0;

    var activeTab = null;

    for (var property in json){
        if (property === 'content'){
            content = json.content;
            newJson.content = content.slice();
            if (paths.length === 2 && content[idx].content.length === 2 && content[idx].type === 'Tabs'){

                // our target is a twin, we need to unwrap the parent
                var parentOfTwins = content[idx];
                var remainingTwin = parentOfTwins.content[paths[1] === 0 ? 1 : 0];

                // is remainingTwin itself a container, aligned with its new parent ?
                if (alignedFlexBoxes(newJson, remainingTwin)){

                    //TODO should clone here
                    remainingTwin.content.forEach(c => {
                        c.$size.flexBasis = c.$clientRect[newJson.flexOrientation === 'column' ? 'height' :'width'];
                    });

                    [].splice.apply(newJson.content,[idx,1].concat(remainingTwin.content));
                    containerRemoved = 2;
                }
                else {
                    newJson.content[idx] = remainingTwin;

                    //TODO should clone here
                    remainingTwin.$size = parentOfTwins.$size;  
                    containerRemoved = 1;
                }

            }
            else if (paths.length === 1){
                newJson.content[idx] = {
                    type :'PlaceHolder',
                    header: false,
                    $size : shallowCloneObject(json.content[idx].$size)
                };
                if (json.type === 'Tabs' && json.activeTab === idx){
                    if (typeof newJson.activeTab === 'number'){
                        newJson.activeTab = 1;
                    }
                    else {
                        activeTab = 1;
                    }
                }
            }
            else {
                result = removeWithPlaceholder(content[idx],paths.join('.'));
                newJson.content[idx] = result.json;
                containerRemoved = result.containerRemoved;
            }
        }
        else if (property === 'activeTab' && activeTab !== null){
            newJson[property] = activeTab;
        }
        else {
            newJson[property] = json[property];
        }
    }  

    return {json:newJson, containerRemoved};
}


function remove(json, path){

	var paths = path.split('.').slice(1).map(n => parseInt(n,10));
	var idx = paths[0];
    var newJson = {};
    var content;
    var result;
    var containerRemoved = 0;

    var activeTab = null;

    for (var property in json){
        if (property === 'content'){
        	content = json.content;
            newJson.content = content.slice();
            if (paths.length === 2 && content[idx].content.length === 2){

            	// our target is a twin, we need to unwrap the parent
            	var parentOfTwins = content[idx];
            	var remainingTwin = parentOfTwins.content[paths[1] === 0 ? 1 : 0];

            	// is remainingTwin itself a container, aligned with its new parent ?
            	if (alignedFlexBoxes(newJson, remainingTwin)){

            		//TODO should clone here
            		remainingTwin.content.forEach(c => {
            			c.$size.flexBasis = c.$clientRect[newJson.flexOrientation === 'column' ? 'height' :'width'];
            		});

            		[].splice.apply(newJson.content,[idx,1].concat(remainingTwin.content));
	            	containerRemoved = 2;
            	}
            	else {
    	        	newJson.content[idx] = remainingTwin;

            		//TODO should clone here
    	        	remainingTwin.$size = parentOfTwins.$size;  
    	        	containerRemoved = 1;
            	}

            }
            else if (paths.length === 1){
            	newJson.content.splice(idx,1);
            	if (json.type === 'Tabs' && json.activeTab === idx){
            		if (typeof newJson.activeTab === 'number'){
            			newJson.activeTab = 1;
            		}
            		else {
            			activeTab = 1;
            		}
            	}
            }
            else {
            	result = remove(content[idx],paths.join('.'));
            	newJson.content[idx] = result.json;
            	containerRemoved = result.containerRemoved;
            }
        }
        else if (property === 'activeTab' && activeTab !== null){
        	newJson[property] = activeTab;
        }
        else {
            newJson[property] = json[property];
        }
    }  

    return {json:newJson, containerRemoved};

}


module.exports = {transform};

function wrap(pos, source, target){

    source = shallowCloneObject(source);
    target = shallowCloneObject(target);

    var dragContainer = target.dragContainer;
    target.dragContainer = undefined;

    var type = pos.position.Header ? 'Tabs' : 'FlexBox';
    var flexOrientation = pos.position.EastOrWest ? 'row' : 'column'
    var activeTab = pos.position.Header ? 1 : undefined;
    var $size = {...target.$size};
    var content = positionedContent(pos, source, target);

    // changing the $size means we should clone the object
    if (pos.position.EastOrWest && pos.width){
    	source.$size = {flexGrow:1, flexShrink:1,flexBasis:pos.width}; 
    	target.$size = {flexGrow:1, flexShrink:1,flexBasis:target.$clientRect.width - pos.width}; 
    }
    else if (pos.position.NorthOrSouth && pos.height){
    	source.$size = {flexGrow:1, flexShrink:1,flexBasis:pos.height}; 
    	target.$size = {flexGrow:1, flexShrink:1,flexBasis:target.$clientRect.height - pos.height}; 
    }
    else if (target.$size.flexBasis > 1){
    	var flexBasis = Math.round(target.$size.flexBasis/2);
    	source.$size = {flexGrow:1, flexShrink:1,flexBasis:flexBasis}; 
    	target.$size = {flexGrow:1, flexShrink:1,flexBasis:flexBasis}; 
    }
    else if (source.$size.flexBasis === 0){
    	source.$size = {flexGrow:1, flexShrink:1, flexBasis:1};
    }

    return {type, flexOrientation, activeTab, dragContainer, $size, content};
}

function positionedContent(pos, source, target){

    if (pos.position.Header){
        // target.$size = {flexGrow:1,flexShrink:1,flexBasis:1};
        // source.$size = {flexGrow:1,flexShrink:1,flexBasis:1};
        return [target, source];
    }
    else if (pos.position.SouthOrEast){
        return [target, source];
    }
    else {
        return [source, target];
    }

}

function alignedFlexBoxes(c1, c2){
	return c1.type === 'FlexBox' && c2.type === 'FlexBox' &&
		   c1.flexOrientation === c2.flexOrientation;
}

function assignBoxSizes(dimension, components){

	var flexGrow = 1;
	var flexShrink = 1;

	return components.map(component => {
		if (component.$clientRect){
			var c = shallowCloneObject(component);
			c.$size = {flexBasis: c.$clientRect[dimension], flexGrow, flexShrink};
			return c;
		}
		else {
			return component;
		}
	});

}

