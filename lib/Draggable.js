var Layout                  = require('./Layout');
var DropTargetCanvas        = require('./DropTargetCanvas');
var refArray                = require('./util/refArray');
var BoxModel                = require('./BoxModel');
var BoxModelCanvas          = require('./BoxModelHtml');
var DragState               = require('./DragState');
var serialize               = require('./serialize');

var _draggee;
var _dragContainer;
var _mouseDownElement;
var _dragState;
var _dragThreshold = 5;
var _dropTarget = null;
var _mousedown;
var _annotated = false;

var _sketchpad = document.getElementById("sketchpad");
var _boxModelCanvas = new BoxModelCanvas();
var _dropTargetCanvas = new DropTargetCanvas();
//var _boxModel = null;

var SCALE_FACTOR = 0.4;

var DEFAULT_DRAG_THRESHOLD = 5;
    
var DEFAULT_OPTIONS = {};

var NORTH = Layout.position.North,
    SOUTH = Layout.position.South,
    EAST = Layout.position.East,
    WEST = Layout.position.West,
    HEADER = Layout.position.Header;

var Draggable = {

    componentDidMount(){

        var header = this.refs.header || this.refs.tabstrip;
        if (header && header.props.draggable){
            header.getDOMNode().addEventListener('mousedown',this.handleMousedown,false);
        }
        else if (this.props.draggable){
            this.getDOMNode().addEventListener('mousedown',this.handleMousedown,false);
        }
    },

    componentWillUnmount(){
        var header = this.refs.header || this.refs.tabstrip;
        if (header && header.props.draggable){
            console.log(`Draggable ${this.props.title} REM mousedown listener`);
            header.getDOMNode().removeEventListener('mousedown',this.handleMousedown,false);
        }
        else if (this.props.draggable){
            this.getDOMNode().removeEventListener('mousedown',this.handleMousedown,false);
        }

    },

    handleMousedown(e) {

       _mouseDownElement = e.target;

        _draggee = this;

        _mousedown = true;

        this.x = e.clientX;
        this.y = e.clientY;

        window.addEventListener("mousemove", preDragMousemoveHandler, false);
        window.addEventListener("mouseup",preDragMouseupHandler, false);

        e.preventDefault();
    }

};


module.exports = {Draggable};

function preDragMousemoveHandler(e){

    var {x,y} = _draggee.props.container.getDragPermission(_draggee);

    var x_diff = x ? e.clientX - _draggee.x : 0,
        y_diff = y ? e.clientY - _draggee.y : 0,
        mouseMoveDistance = Math.max(Math.abs(x_diff),Math.abs(y_diff));

    // when we do finally move the draggee, we are going to 'jump' by the amount of the drag threshold, should we
    // attempt to animate this ?    
    if (mouseMoveDistance > _dragThreshold){

        window.removeEventListener("mousemove", preDragMousemoveHandler, false);
        window.removeEventListener("mouseup",preDragMouseupHandler, false);

        if (initDrag(e) !== false){
            window.addEventListener("mousemove", dragMousemoveHandler, false);
            window.addEventListener("mouseup",dragMouseupHandler, false);
        }

    }

}

function preDragMouseupHandler(evt){

    window.removeEventListener("mousemove", preDragMousemoveHandler, false);
    window.removeEventListener("mouseup",preDragMouseupHandler, false);

}

function initDrag(evt){

    _annotated = false;

    _draggee = _draggee.getDraggable(_mouseDownElement);

    // No, just measure the outer perimeter of the draggable zone of dragCOntainer
    if (_draggee.context){
        _dragContainer = _draggee.context.dragContainer;    
    }
    /* === true ? _draggee.props.container : _draggee.context.dragContainer*/;

    if (!_dragContainer) return false;

    var dragBox = _dragContainer.getDragBoundingRect ? _dragContainer.getDragBoundingRect() : _dragContainer.getDOMNode().getBoundingClientRect();  

    //TODO ask the container for it's DragZone, so a Tabbedcontainer can give an area excluding tabstrip
    var {width, height, ...dragZone} = dragBox;

    var start = window.performance.now();
    BoxModel.annotateWithMeasurements(_dragContainer);
    var end = window.performance.now();
    console.log('%cannotateWithMeasurements took ' + (end-start) + ' ms','color:brown;font-weight:bold;');

    _dragState = new DragState(dragZone, _draggee, evt.clientX, evt.clientY);

    var pctX = Math.round(_dragState.x.mousePct * 100);
    var pctY = Math.round(_dragState.y.mousePct * 100);


    var webkitTransformOrigin =  pctX + "% " + pctY + "%";
    var webkitTransform = `scale(${SCALE_FACTOR},${SCALE_FACTOR})`;

    console.log(`%cDraggable.initDrag TransformOrigin=${webkitTransformOrigin}`,'font-weight:bold;color:blue;');

    var dragRect = _draggee.props.json.$clientRect;
    if (dragRect.height === 0){
        dragRect = _draggee.props.container.props.json.$clientRect;
    }

    var {left,top,width,height} = dragRect;

    var offsetParent = _draggee.getDOMNode().offsetParent;
    if (offsetParent !== document.body){
        var offsetRect = offsetParent.getBoundingClientRect();
        __offsetLeft = offsetRect.left;
        __offsetTop = offsetRect.top;
    }
    else {
        __offsetLeft = 0;
        __offsetTop = 0;
    }

    var dragStyle = {left:left-__offsetLeft,top:top-__offsetTop,width,height, webkitTransform, webkitTransformOrigin, visibility:'visible'}; 

    _draggee.props.container.releaseChild(_draggee, dragStyle);

    _dropTargetCanvas.prepare();

   return true;

}

var __offsetLeft;
var __offsetTop;

function measureDragContainer(container){
    
    if (typeof container.getDragBoundingRect === 'function'){
        return container.getDragBoundingRect();
    }
    else {
        return container.getDOMNode().getBoundingClientRect();
    }
}

function dragMousemoveHandler(evt){

    if (_annotated === false){
        BoxModel.annotateWithMeasurements(_draggee.context.dragContainer);
        //_boxModelCanvas.draw(_draggee.props.dragContainer);
        _annotated = true;
    }


    var x = evt.clientX,
        y = evt.clientY,
        dragState = _dragState,
        currentDropTarget = _dropTarget,
        dropTarget;
        
    var newX, newY;

    if (dragState.update('x', x)){
        newX = dragState.x.pos-__offsetLeft;
    }
    
    if (dragState.update('y', y)){
        newY = dragState.y.pos-__offsetTop;
    }

    _draggee.props.container.positionChild(_draggee, newX, newY);

    if (dragState.inBounds()){

        dropTarget = identifyDropTarget(x,y, _dragContainer);

    }
    else {
        //onsole.log('%coutOfBounds, do our best to position dropTarget','color:cyan')
        dropTarget = identifyDropTarget(dragState.dropX(), dragState.dropY(), _dragContainer);
    }

    // did we have an existing droptarget which is no longer such ...
    if (currentDropTarget){
        if (dropTarget == null || dropTarget.box !== currentDropTarget.box){
            _dropTarget = null;
        }
    }

    if (dropTarget){

        if (currentDropTarget && 
            currentDropTarget.component === dropTarget.component &&
            currentDropTarget.pos.position === dropTarget.pos.position &&
            // experiment...
            currentDropTarget.pos.closeToTheEdge === dropTarget.pos.closeToTheEdge){
            // no change from last turn, don't assign to _dropTarget, we might lose settings

            //onsole.log('%cSame Drop Target/Position','color:green');

        }
        else {
            if (currentDropTarget && currentDropTarget.pos.position === dropTarget.pos.position){
                console.log('Same drop target/position, just closeToTheEdge/extremePos changed');
            }

            // redraw position marker
            //onsole.log('%cNew Drop Target/Position','color:red;font-weight:bold;');
            _dropTargetCanvas.draw(dropTarget);

            _dropTarget = dropTarget;

        }

    }
 }

function dragMouseupHandler(evt){
   
    onDragEnd(evt);
}

function constrain(value, min, max){
    return Math.max(min,Math.min(value,max));
}

function onDragEnd(evt){
    _mousedown = false;   

    if (_dropTarget){

        var dropTarget = getActiveDropTarget(_dropTarget);

        _draggee.props.container.drop(_draggee, dropTarget);

        _dropTarget = null;
    }

    _draggee = null; 

    _dragContainer = null; 

    _mouseDownElement = null;

    _boxModelCanvas.clear();

    _dropTargetCanvas.clear();

    window.removeEventListener("mousemove", dragMousemoveHandler, false);

    window.removeEventListener("mouseup", dragMouseupHandler, false);

}

function getActiveDropTarget(dropTarget){
    return dropTarget.active ? dropTarget : getActiveDropTarget(dropTarget.nextDropTarget);
}

class DropTarget {

    constructor({component, pos, closeToTheEdge, nextDropTarget}){
        this.component = component; 
        this.pos = pos;
        this.nextDropTarget = nextDropTarget;
        this.active = false;       
    }

    activate(){
        this.active=true;
        return this;
    }

}


    // Initial entry to this method is always via the app (may be it should be *on* the app)
function identifyDropTarget(x, y, container){

     var dropTarget = null;
   
    //onsole.log('Draggable.identifyDropTarget for component  ' + box.name + ' (' + box.nestedBoxes.length + ' children)') ;
    var component = BoxModel.smallestBoxContainingPoint(container,x,y);
    
    if (component){
        var pos = BoxModel.pointPositionWithinComponent(x,y,component);
        var nextDropTarget = getNextDropTarget(component, pos, _dragState.constraint.zone);
        dropTarget = new DropTarget({component, pos, nextDropTarget}).activate()
    }

    return dropTarget;
}


// must be cleared when we end the drag
function getNextDropTarget(component, pos, zone){

    // valueOf comparison, do not change to ===
    if (pos.position.Header || pos.closeToTheEdge == pos.position){
 
        var childComponent = component;
        var nextDropTarget = false;

        while (component = component._owner){
           
            if (!positionedAtOuterContainerEdge(component, pos.position, childComponent)) return;

            if (/*component.props.dragContainer === true ||*/ !inTheZone(component, zone)) return;

           if (component.constructor.displayName === 'TabbedContainer' && pos.closeToTheEdge){
                nextDropTarget = true;
            }

            else if (isVBox(component) && (pos.closeToTheEdge === 2 || pos.closeToTheEdge === 8)){
                
                if (component.props.json.content.length === 2 && component.state.dragging !== -1){ // Two Child FlexBox, one of which is the draggee 
                    return getNextDropTarget(component, pos, zone);
                }

                nextDropTarget = true;
                pos.width = 120;
            }
            else if (isHBox(component) && (pos.position.Header || pos.closeToTheEdge === 1 || pos.closeToTheEdge === 4)){
                
                if (component.props.json.content.length === 2 && component.state.dragging !== -1){
                    return getNextDropTarget(component, pos, zone);
                }
                
                nextDropTarget = true;
                pos.height = 120;
            }

            if (nextDropTarget){

                if (pos.position.Header){
                    pos = Object.assign({},pos,{position:NORTH});    
                }

                return new DropTarget({component, pos, nextDropTarget: getNextDropTarget(component, pos, zone)})
            }

            if (component.props.dragContainer === true) break;

            childComponent = component;
        }

    } 
}

function isVBox(box){
    return box.constructor.displayName === 'FlexBox' &&  box.props.flexOrientation === "column";
}

function isHBox(box){
    return box.constructor.displayName === 'FlexBox' &&  box.props.flexOrientation === "row";
}

function positionedAtOuterContainerEdge(containingComponent, position, component){
    
    if (component.props.dragContainer === true) return false;

    var containingBox = containingComponent.props.json.$clientRect;
    var box = component.props.json.$clientRect;

    if (position.North || position.Header) return box.top === containingBox.top;
    if (position.East) return box.right === containingBox.right;
    if (position.South) return box.bottom === containingBox.bottom;
    if (position.West) return box.left === containingBox.left;
}

function inTheZone(component, zone){
    var box = component.props.json.$clientRect;
    return within(zone.x.lo, zone.x.hi, box.left, box.right)
        && within(zone.y.lo, zone.y.hi, box.top, box.bottom); 
}

function within(lowerBound, upperBound, ...values){
    for (var i=0;i<values.length;i++){
        var value = values[i];
        if (value < lowerBound || value > upperBound) return false;
    }
    return true;
}




