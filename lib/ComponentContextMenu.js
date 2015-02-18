var React = require('react/addons');
var {ContextMenu, MenuItem}	= require('react-controls');

var ComponentContextMenu = React.createClass({

	propTypes : {
		component : React.PropTypes.element.isRequired
	},

	render(){

		return (
			<ContextMenu doAction={this.props.doAction}>
				{this.menuItems()}
			</ContextMenu>
		);

	},

	menuItems(){

		var {minimized,maximized} = this.props.component.state;
		var normal = !(maximized || minimized);

		console.log(`ComponentContextMenu.menuItems minimized=${minimized}`)

		var menuItems = [];

			menuItems.push(	<MenuItem action="pin" label="Fix Size"/> );
			menuItems.push(	<MenuItem action="remove" label="Remove"/> );
			if (normal){
				menuItems.push( <MenuItem action="minimize" label="Minimize"/> );
				menuItems.push( <MenuItem action="maximize" label="Maximize"/> );
			}
			else {
				menuItems.push( <MenuItem action="restore" label="Restore"/> );
			} 	

		return menuItems;
	}


});

module.exports = ComponentContextMenu;