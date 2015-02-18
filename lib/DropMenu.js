var React = require('react/addons');
var cx    = React.addons.classSet; 

var sizes = [{h:34,w:20}, {h:66,w:20}, {h:100,w:20}, {h:130,w:20}];


var DropMenuItem = React.createClass({

	render(){

		var {dropTarget, depth, isOuter} = this.props;

		var pos = dropTarget.pos;

		var className = cx(
			'drop-menu-item', 
			this.state.hover,
			pos.position);

	    var size = sizes[depth];

	    var borderWidth = 4;

	    var style;

	    if (pos.position.West){
	    	style = {
	    		// borderRadius: '0 100% 100% 0',
	    		width: size.w,
	    		height: size.h,
	    		top: isOuter ? -(Math.round(size.h/2)+borderWidth) : -(Math.round(size.h/2)),
	    		left: isOuter ? 0 : borderWidth
	    	};
	    }
	    else if (pos.position.South){
	    	style = {
	    		// borderRadius: '100% 100% 0 0',
	    		width: size.h,
	    		height: size.w,
	    		top: isOuter ? -size.w : -(size.w-4),
	    		left: isOuter ? -(Math.round(size.h/2)+borderWidth) : -Math.round(size.h/2)
	    	};
	    }
	    else if (pos.position.North || pos.position.Header){
	    	style = {
	    		// borderRadius: '0 0 100% 100%',
	    		width: size.h,
	    		height: size.w,
	    		top: isOuter ? 0 : borderWidth,
	    		left: isOuter ? -(Math.round(size.h/2)+borderWidth) : -Math.round(size.h/2)
	    	};
	    }
	    else if (pos.position.East){
	    	style = {
	    		// borderRadius: '100% 0 0 100%',
	    		width: size.w,
	    		height: size.h,
	    		top: isOuter ? -(Math.round(size.h/2)+borderWidth) : -Math.round(size.h/2),
	    		left: isOuter ? -size.w : -(size.w-borderWidth)
	    	};
	    }

		return ( 
		    	<div className={className} style={style} 
		    		onMouseOver={this.handleMouseOver}
		    		onMouseOut={this.handleMouseOut} />
		);

	},

	getInitialState(){
		return {hover: this.props.depth === 0 ? 'hover' : undefined};
	},

	handleMouseOver(){
		this.setState({hover: 'hover'});
		if (this.props.onMouseOver){
			this.props.onMouseOver(this.props.dropTarget);
		}
	},

	handleMouseOut(){
		this.setState({hover: undefined});
	}


});

var DropMenu = React.createClass({

	render(){

		var dropTarget = this.props.dropTarget;

	    var {left, top} = menuPosition(dropTarget);

		return (
			<div className="DropMenu" style={{left, top}}>
				{this.renderMenuItems(dropTarget)}
			</div>
		);

	},

	renderMenuItems(dropTarget){

		var target = dropTarget;
		var depth = 0;

		var targets = [];
		while (target){
			targets.push(target);
		    target = target.nextDropTarget;
		}

		return targets.reverse().map((target,idx) => 
		    	<DropMenuItem isOuter={idx===0} depth={targets.length-(idx+1)} 
		    		dropTarget={target} 
		    		onMouseOver={this.props.onMouseOver} /> 
		);

	}

});

module.exports = DropMenu;

function menuPosition({component, pos}){
	 
	var box = component.props.json.$clientRect;

    if (pos.position.West){
        return {left:box.left, top: pos.y};
    }
    else if (pos.position.South){
    	return {left:pos.x, top: box.bottom-6};
    }
    else if (pos.position.North || pos.position.Header){
    	return {left:pos.x, top: box.top};
    }
    else if (pos.position.East){
    	return {left:box.right, top: pos.y};
    }

}




