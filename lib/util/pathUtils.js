'use strict';


function addPaths (json, path){
	json.$path = path || (path = '0');
	if (json.content){
		json.content.forEach((json,idx) => addPaths(json, path + '.' + idx))
	}
}



function followPath(json, path){
	var paths = path.split('.');
	for (var i=1; i < paths.length ;i++){
		json = (json.content || json.nestedBoxes)[paths[i]];
	}
	return json;
}

function followPathToParent(json, path){
	if (path === '0') return null;
	return followPath(json, path.replace(/.\d+$/,''));
}

function adjustPath(path, removedPath, containerRemoved){

	var steps = path.split('.');
	var rem = removedPath.split('.');


	// pos needs to be first point at which paths differ, not necessarily last pos
	var pos = forkPoint(steps, rem);
	var remIdx = parseInt(rem[pos]);
	var stepIdx = parseInt(steps[pos]);

	if (pos === rem.length-1){

		if (containerRemoved === 1){
			steps.splice(pos,1);
			return steps.join('.');
		}
		else if (containerRemoved === 2){
			steps.splice(pos-1,2);
			var topLevelIdx = parseInt(rem[pos-1],10);
			steps[pos-1] = parseInt(steps[pos-1]) + topLevelIdx;

			return steps.join('.');
		}

		if (remIdx < stepIdx){
			steps[pos] = parseInt(steps[pos]) - 1;
			return steps.join('.')
		}

	}

	if (containerRemoved && remIdx === stepIdx){
		return path.replace(/.\d+$/,'');
	}
	else {
		return path;
	}


}

module.exports = {addPaths, followPath, followPathToParent, adjustPath}

function forkPoint(path1,path2){
	var len = Math.min(path1.length, path2.length);

	for (var i=0;i<len;i++){
		if (path1[i] !== path2[i]){
			return i;
		}
	}
	return -1;
}
