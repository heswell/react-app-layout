/** @jsx React.DOM */
module.exports = function(arr, test){

	for (var i=0;i<arr.length;i++){
		if (test(arr[i])){
			return i;
		}
	}
	return -1;

};