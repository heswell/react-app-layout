/** @jsx React.DOM */

var React = require('react/addons');
var cx    = React.addons.classSet;

var _splitter,
    _mousedown = false,
    _direction,
    _diff = 0;


var Splitter = React.createClass({

	render(){

	    var className = cx(
	      'rect-Splitter',
	      this.props.className
	    );

		return <div className={className} />
	},

	componentDidMount(){
	    this.getDOMNode().addEventListener('mousedown',this.handleMousedown,false);
	},

	componentWillUnmount(){
	    this.getDOMNode().removeEventListener('mousedown',this.handleMousedown,false);
	},

	handleMousedown(e){

       _splitter = this;
       _mousedown = true;
       _diff = 0;

       initDrag.call(this, e);

       window.addEventListener("mousemove", mouseMoved, false);
       window.addEventListener("mouseup",mouseUp, false);

        e.preventDefault();
	}

});

module.exports = Splitter;

function mouseMoved(evt){
    return onDrag.call(_splitter, evt)
}

function mouseUp(evt){
    return onDragEnd.call(_splitter, evt)
}


function initDrag(e){

	_direction = this.props.container.props.flexOrientation === 'column' ? 'vertical' : 'horizontal';

    var vertical = _direction === "vertical";
    var dim = vertical ? "height" : "width";

    var pos = this.lastPos = (vertical ? e.clientY : e.clientX);

    var el = this.getDOMNode();

    //todo can we delegate most of this to container
    this.props.container.splitterDragStart(this);

}

function onDrag(evt){

    var clientPos,
        dimension;

    if (_direction === 'vertical'){
        clientPos = "clientY";
        dimension = "height";
    }  
    else {
        clientPos = "clientX";
        dimension = "width";
    }  

    var pos = evt[clientPos],
        diff = pos - this.lastPos;


    // we seem to get a final value of zero
    if (pos && (pos !== this.lastPos)){

	    this.props.container.splitterMoved(this, diff);    

    }

    this.lastPos = pos;

}

function onDragEnd(evt){

    _mousedown = false;   
    _splitter = null;     

    window.removeEventListener("mousemove", mouseMoved, false);
    window.removeEventListener("mouseup", mouseUp, false);

    // this is not right, when we have events ready, we will raise an event
    this.props.container.splitterDragEnd(this);

}
