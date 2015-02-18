/** @jsx React.DOM */
var React = require('react');
var indexOf = require('./util/indexOf')


var SelectionModel = {

	// beware this will be used anytime owner doesn't supply props.selected
	// getDefaultProps(){
	// 	return {
	// 		selected : []
	// 	};
	// },

	getInitialState(){
		return {
			selected : this.props.selected || [],
			lastTouchIdx: -1
		};
	},

	componentWillReceiveProps(nextProps){

		if (Array.isArray(nextProps.selected) && nextProps.selected !== this.state.selected){
			this.setState({selected: nextProps.selected});
		}

	},

	handleItemClick(idx, selectedItem, rangeSelect, incrementalSelection){
		
		console.log('SelectionModel.handleItemClick');

		var selected,
			lastTouchIdx;

		if (rangeSelect){
			selected = this.handleRangeSelection(idx);
			lastTouchIdx = this.state.lastTouchIdx;
		}	
		else if (incrementalSelection){
			selected = this.handleIncrementalSelection(idx);
			lastTouchIdx = idx;
		}
		else {
			selected = this.handleRegularSelection(idx);
			lastTouchIdx = idx;
		}

		this.setState({selected, lastTouchIdx});

		if (this.props.onSelectionChange){
			this.props.onSelectionChange(selected, idx, selectedItem);
		}

	},

	isSelected(idx){
		return this.state.selected.indexOf(idx) !== -1;
	},

	handleRegularSelection(idx){
		var pos = this.state.selected.indexOf(idx);
		if (pos === -1){
			return [idx];
		}
		else {
			return [];
		}


	},

	handleIncrementalSelection(idx){

		var pos = this.state.selected.indexOf(idx);
		var len = this.state.selected.length;

		if (pos === -1){
			if (len === 0){
				return [idx];
			}
			else {
				return insert(this.state.selected, idx);
			}
		}
		else {
			if (len === 1){
				return [];
			}
			else {
				return remove(this.state.selected, idx);
			}
		}

	},

	handleRangeSelection(idx){

	}


};


module.exports = SelectionModel;

function insert(arr, idx){
	var ret = [];
	for (var i=0;i<arr.length;i++){
		if (idx !== null && idx < arr[i]){
			ret.push(idx); // won't this give us duplicate idx ?
			idx = null;
		}
		ret.push(arr[i])
	}

	if (idx !== null){
		ret.push(idx)
	}

	return ret;
}

function remove(arr, idx){
	var ret = [];
	for (var i=0;i<arr.length;i++){
		if (idx !== arr[i]){
			ret.push(arr[i])
		}
	}
	return ret;
}
