/** @jsx React.DOM */
var React               	= require('react/addons');
var PropTypes				= React.PropTypes;
var cx                  	= React.addons.classSet;
var cloneWithProps      	= React.addons.cloneWithProps;
var ComponentHeader			= require('./ComponentHeader');
var ComponentContextMenu	= require('./ComponentContextMenu');
var {checkMeasurements} 	= require('./FlexUtils');

var PopupService 		= require('react-services').PopupService;

//var BoxModel      		= require('./BoxModelCanvas');
var BoxModelCanvas 		= require('./BoxModelHtml');
var BoxModel 			= require('./BoxModel');

var Draggable 			= require('./Draggable').Draggable;


// need a layout prop and layout state. That way we can accept layout data both via json
// and vis managing Flexible container
var LayoutItem = React.createClass({
	
	propTypes : {
		children : PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
	},

	contextTypes : {
		dragContainer : PropTypes.oneOfType([PropTypes.object, PropTypes.bool])
	},

	mixins : [Draggable],

	render(){
		
		var {title, dragging, ref, flex, dimension, style, bg, onLayout, children, json, header,   ...props} = this.props;

		var isSelected = this.props.isSelected;

		var isDraggable = Boolean(this.context.dragContainer);

		//onsole.log(`LayoutItem.render ${this.props.title} isDraggable=${isDraggable} dragging=${dragging}`);

		//title = title + ' ' + this.props.id

	    var className = cx(
	      'LayoutItem',
	      'rect-layout',
	      'rect-component',
	      this.state.fixed ? 'fixed' : null,
	      this.state.minimized ? 'minimized' : null,
	      this.state.maximized ? 'maximized' : null,
	      !!dragging ? 'dragging' : null,
	      isSelected ? 'active' : null,
	      isDraggable ? 'draggable' : null
	    );

	    var {width,height} = this.state.measurements;
	    var headerHeight = header === false ? 0 : 32;


		return (
			<div className={className} style={this.state.style || style} {...props}>
				{header !== false 
					? <ComponentHeader ref="header" 
						title={title} 
						draggable={isDraggable}  
						onAction={this.handleAction} 
						onClick={this.handleHeaderClick}
						fixed={this.state.fixed}
						minimized={this.state.minimized}
						maximized={this.state.maximized}
						json={this.state.header}/>
					: null}

				{width && height ? 
					cloneWithProps(children,{
						width,
						height:height-headerHeight,
						onLayout}) : null}
			</div>
		);
	},


	getDefaultProps(){
		return {
			onConfigChange : () => {}
		}
	},

	getInitialState: function () {

		//onsole.log('LayoutItem.getInitialState context = ', this.context);

		var fixed = this.props.style.flexGrow === 0; 
	    return {
	      header : {title: this.props.title},	
	      color: null,
	      colors: [],
	      fixed,
	      minimized: false,
	      measurements : {}
	    }
	},

	componentDidMount(){
		var {width, height} = this.getDOMNode().getBoundingClientRect();
		console.log(`%cLayoutItem ${this.props.title} setState with measurements`,'color:green;font-weight:bold');
		this.setState({measurements:{width,height}});
	},

	componentWillReceiveProps(nextProps){
			
		var {style, measurements} = nextProps;	

		if (style && style.flexGrow !== this.props.style.flexGrow){
			var fixed = style.flexGrow === 0; 
			this.setState({
				fixed,
				header : {title: this.props.title, fixed}
			});
		}

		if (measurements = checkMeasurements(measurements, this.state.measurements)){
			this.setState({measurements});
		}

	},

	getDraggable(){
		return this;
	},

	handleAction(key, opts){

		if (key === 'menu'){
			
			var {left,top} = opts;

			PopupService.showPopup({
				left, 
				top,
				component: <ComponentContextMenu component={this} 
						doAction={this.handleContextMenuAction}/>
			});
		}

		else if (key === 'pin'){
			var fixed = this.state.fixed;
			this.setState({fixed: !fixed});
			this.props.onConfigChange(this, {fixed:!fixed})
		}

	},

	handleHeaderClick(e){

		var x = e.clientX;
		var y = e.clientY;

		var pctX = 50;
		var pctY = 5;
		var SCALE_FACTOR = 0.4;


		var {top,left,width,height} = this.getDOMNode().getBoundingClientRect()
		var {top:top1,left:left1} = this.getDOMNode().offsetParent.getBoundingClientRect()

		var pctX = ((x - left) / width) * 100;
		var pctY = ((y - top) / height) * 100;

		console.log(`pctX = ${pctX} pctY = ${pctY}`);


//	    var webkitTransformOrigin =  pctX + "% " + pctY + "%";
	    var webkitTransformOrigin =  pctX + "% " + pctY + "%";
    	var webkitTransform = `scale(${SCALE_FACTOR},${SCALE_FACTOR})`;

    	var style = {...this.props.style, position:'absolute',top:top-top1,left:left-left1,width,height, webkitTransform, webkitTransformOrigin}

    	this.setState({style});


	},

	handleContextMenuAction(action,data){
		if (action === 'pin'){
			var fixed = this.state.fixed;
			this.setState({fixed: !fixed});
			this.props.onConfigChange(this, {fixed:!fixed})
		}
		else if (action === 'remove'){
			this.props.onLayout('remove', {component:this});
		}
		else if (action === 'minimize'){
			this.props.onLayout('minimize', {component:this});
			this.setState({minimized:true});
		}
		else if (action === 'maximize'){
			this.props.onLayout('maximize', {component:this});
			this.setState({maximized:true});
		}
		else if (action === 'restore'){
			this.props.onLayout('restore', {component:this});
			this.setState({minimized:false,maximized:false});
		}

	}



});

module.exports = LayoutItem;