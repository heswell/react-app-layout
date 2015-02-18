"use strict";

var shallowCloneObject = require('./util/shallowCloneObject');
var transform           = require('./util/jsonUtils').transform;
var {adjustPath, followPath, followPathToParent}  = require('./util/pathUtils');


var positionValues = {
    "north" : 1,
    "east"  : 2,
    "south" : 4,
    "west"  : 8,
    "header": 16,
    "centre": 32       
};

var position = Object.freeze({
    "North" : _position("north"),
    "East"  : _position("east"),
    "South" : _position("south"),
    "West"  : _position("west"),
    "Header": _position("header"),
    "Centre": _position("centre")
});

function _position(str){
    return Object.freeze({
            offset : str === "north" || str === "west" ? 0 : str === "south" || str === "east" ? 1 : NaN,
            valueOf : function(){return positionValues[str];},
            toString : function(){return str;},
            North : str === "north",
            South : str === "south",
            East : str === "east",
            West : str === "west",
            Header : str === "header",
            NorthOrSouth : str === "north" || str === "south",
            EastOrWest : str === "east" || str === "west",
            NorthOrWest : str === "north" || str === "west",
            SouthOrEast : str === "east" || str === "south"
    });
}

function Layout(){

}

Layout.position = position;
Layout.drop = drop;
Layout.resize = resize;
Layout.minimize = minimize;
Layout.restore = restore;
Layout.remove = remove;
Layout.config = config;
Layout.tab = tab;

module.exports = Layout;

var Dimensions = {
    row : 'width',
    column : 'height'
}


function config(json, {fixed, dimensions, component, container}){

    var idx = container.content.indexOf(component);

    dimensions = dimensions.slice();
    dimensions[idx] = shallowCloneObject(dimensions[idx]);
    dimensions[idx].flexGrow = fixed ? 0 : 1;

    var newContainer = shallowCloneObject(container);

    newContainer.content = container.content.map((child, i) => 
        Object.assign({}, child, {$size:dimensions[i]})
    );

    return transform(json, { replace: {node: container, replacement: newContainer} });

}

function tab(json, {container, idx, nextIdx}){

    var content = container.content;
    var newContainer = shallowCloneObject(container);
    newContainer.activeTab = nextIdx;

    var selectedTab = shallowCloneObject(content[idx]);
    var nextSelectedTab = shallowCloneObject(content[nextIdx]);

    selectedTab.$size = {flexShrink:0, flexGrow:0, flexBasis:0};
    nextSelectedTab.$size = {flexShrink:1, flexGrow:1, flexBasis:1};

    content[idx] = selectedTab;
    content[nextIdx] = nextSelectedTab;

    return transform(json, { replace: {node: container, replacement: newContainer} });

}

function resize(json, {container, dimensions}){

    var newContainer = shallowCloneObject(container);

    newContainer.content = container.content.map((child, idx) => 
        Object.assign({}, child, {$size:dimensions[idx]})
    );

    return transform(json, { replace: {node: container, replacement: newContainer} });

}

function minimize(json, {component}){

    var target = component.props.json;
    var {flexBasis, flexShrink, flexGrow} = target.$size;
    var $origin = {flexBasis, flexGrow, flexShrink};

    return transform(json,{configure: {
        target, 
        config: {$size:{flexGrow:0,flexShrink:0,flexBasis:32}, $origin}
    }});
}

function restore(json, {component}){

    var target = component.props.json;

    return transform(json,{configure: {
        target, 
        config: {$size:{flexGrow:1,flexShrink:1,flexBasis:1}}
    }});
}

function remove(json, {component}){
    return transform(json,{
        remove: {node: component.props.json}
    });
}

function drop(json, {component, dropTarget:{component:targetComponent, pos}, releaseSpace}){

    //TODO insert a placeholder if there is no flexibility in the remaining peers of a draggee
    var droppedContainer = component.props.container;

    var source = component.props.json;
    var target = targetComponent.props.json;
    var sourceContainer = droppedContainer.props.json;
    var targetContainer = targetComponent.props.container.props.json;

    if (sourceContainer === target){
        return dropComponentOntoOwnContainer(json, pos, sourceContainer, targetContainer, source, target);
    }
    else if (pos.position.Header){

        if (target.type === 'Tabs'){ console.log('CASE 2 Works)');
            // We have dropped a Component onto a sibling within the same container. The sibling is a TabbedContainer 
            // and we have dropped the Component onto its Tabstrip.
             return transform(json,{
                insert: {node: source, container: target},
                remove: {node:source}
            });
        }
        else { console.log('CASE 3 Works)'); 
            // We have dropped a Component onto the header of a sibling Component within the same Container.
            return transform(json, { wrap: {target, source, pos }}); 
        }
    }
    else if (sourceContainer === targetContainer){
        return dropWithinContainer(json, pos, sourceContainer, source, target);
    }
    else { 
        return dropIntoDifferentContainer(json, pos, source, sourceContainer, target, targetContainer, releaseSpace);
    }  

}

function dropWithinContainer(json, pos, container, source, target){

    if (againstTheGrain(pos, container)){

        if (container.content.length === 2 && withTheGrain(pos, containerOf(json, container))){console.log('CASE 4) Works');
            // We have two Components in  container and have dropped one onto the other, reversing the original orientation
            // of the container, but aligned with the orientation of the parent container. eg 2 components in a Row, nested
            // inside a Column. Drop one component North of ther other - both components can now be managed as items in the 
            // Column layout, we can dispose of the intervening Row layout.
            var content = pos.position.SouthOrEast ? [target, source] : [source, target];
            return transform(json, { replace: {node: container, replacement: content}});
        }
        else { console.log('CASE 6 Works)');
            // Drop a Component onto one of its siblings against the grain of their shared container - both Component and 
            // target need to be wrapped in a nested 'contra-container', within the original container.    
            return transform(json, { wrap: {target, source, pos }}); 
        }
    }
    else { 
        
        return moveComponentWithinContainer(json, pos, container, source, target);

    }
    
}

function dropIntoDifferentContainer(json, pos, source, sourceContainer, target, targetContainer, releaseSpace){

    if (target === json || isDraggableRoot(json, target)){ 
        // Can only be against the grain...
        if (withTheGrain(pos, target)){
            throw('How the hell did we do this');
        }
        else { console.log('CASE 14.c) Works');
            return transform(json, { wrap: {target, source, pos }, releaseSpace}); 
        }
    }
    else if (withTheGrain(pos, targetContainer)){
        // Insert into a new container, with the grain
        if (pos.position.SouthOrEast){ console.log('CASE 15) Works');
            return transform(json,{
                releaseSpace,
                insert: {node: source, after: target, pos},
                remove: {node:source}});
            //json = insertAfter(json, target, source);
        }
        else { console.log('CASE 16) Works');
            return transform(json,{
                releaseSpace,
                insert: {node: source, before: target},
                remove: {node:source, from:sourceContainer}});
        }
    }
    else if (againstTheGrain(pos, targetContainer)){ console.log('CASE 17) Works.');
        return transform(json, { wrap: {target, source, pos }, releaseSpace}); 
    }
    else {
        console.log('no support right now for position = ' + pos.position);
    }
    return json;
}

function dropComponentOntoOwnContainer(json, pos, sourceContainer, targetContainer, source, target){
    // If we have pulled a Component out of a container and are now dropping to split that container
    // we have to be very careful about the sequence of steps. If we first removed the source from 
    // our model - it's container would also be replaced and we would not be able to locate it in a subsequent
    // replace step;
    if (targetContainer === sourceContainer){
        if (pos.position.Header){
            // We have dragged a Tab from a TabbedContainer and are now dropping it back onto the original Tabstrip.
            console.log('CASE 1) Works'); // still needs to deal with selected tab
            return json;
        }
        // beyond here means have accepted the nextDropTarget, navigating up layout structure
        else if (withTheGrain(pos, sourceContainer)){

            var content = sourceContainer.content;
            target = pos.position.SouthOrEast ?  content[content.length-1] : content[0];
            return moveComponentWithinContainer(json, pos, sourceContainer, source, target);

        }
        else if (againstTheGrain(pos, sourceContainer)){
            // ???
            return json;

        }
    }

    if (target === json || againstTheGrain(pos, containerOf(json,sourceContainer))){console.log('CASE 9) Works');
        return transform(json, { wrap: {target:sourceContainer, source, pos }}); 
    }
    else if (pos.position.SouthOrEast){ console.log('CASE 10) Works');
        return transform(json,{ insert: {node: source, after: sourceContainer, pos}, remove: {node:source}});
    }
    else { console.log('CASE 11) Works.');
        return transform(json,{ insert: {node: source, before: sourceContainer}, remove: {node:source}});
    }
}

function moveComponentWithinContainer(json, pos, container, source, target){

    // We're moving a component within its Container
    var idx1 = container.content.indexOf(source);
    var targetIdx = container.content.indexOf(target);

    if ((pos.position.SouthOrEast && idx1 - targetIdx === 1) || (pos.position.NorthOrWest && idx1 - targetIdx === -1)){
        // Dropping component back into original position
        return json;
    }
    else if (pos.position.SouthOrEast){  console.log('CASE 7 Works)');
        return transform(json, { move: {source, after: target}});
    }
    else if (pos.position.NorthOrWest){ console.log('CASE 8) Works');
        return transform(json,{ move: {source, before: target}});
    }
    else {
        console.log('#1   Do not currently support dropping at position ' + pos.position);
        return json;
    }

}

function isDraggableRoot(json,component){
    var container = containerOf(json, component);
    if (container){
        return container.type === 'App';
    }
    else {
        debugger;
    }
}

// Note: withTheGrain is not the negative of againstTheGrain - the difference lies in the 
// handling of non-Flexible containers, the response for which is always false;
function withTheGrain(pos, container){

    return pos.position.NorthOrSouth ?  isTower(container)    
         : pos.position.EastOrWest   ?  isTerrace(container)
         : false;
}

function againstTheGrain(pos, container){
    
    return pos.position.EastOrWest   ?  isTower(container)  || isTabset(container)  
         : pos.position.NorthOrSouth ?  isTerrace(container) || isTabset(container) 
         : false;

}

function isTabset(container){
    return container.type === "Tabs";
}

function isTower(container){
    return container.type === "FlexBox" && container.flexOrientation === "column";
}

function isTerrace(container){
    return container.type === "FlexBox" && container.flexOrientation === "row";
}

function containerOf(json, target){


    if (typeof target !== 'object' || Array.isArray(target)){
        throw "containerOf can only be used to find Object types";
    }

    if (typeof json.content === undefined || !Array.isArray(json.content)){
        return null;
    }

    var found = false;
    var result;
    var content = json.content;

    if (content.indexOf(target) !== -1){
        return json;
    }

    for (var i=0;i<content.length;i++){
        if (contains(content[i],target)){
            return containerOf(content[i],target);
        }
    }

    return null;

}

function contains({content}, target){
        
    if (Array.isArray(content)){
        for (var i=0;i<content.length;i++){
            if (content[i] === target){
                return true;
            }
            else if (contains(content[i],target)){
                return true;
            }
        }
    }
    
    return false;

}