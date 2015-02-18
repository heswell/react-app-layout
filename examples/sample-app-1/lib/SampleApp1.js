'use strict';

var React 		= require('react/addons');
var cx 			= React.addons.classSet;
var PropTypes	= React.PropTypes;

var FlexBox 			= require('../../../lib/FlexBox');
var LayoutItem 			= require('../../../lib/LayoutItem');
var Component 			= require('../../../lib/Component');
var DynamicContainer 	= require('../../../lib/DynamicContainer');
var FixedDataTable 		= require('fixed-data-table');

var Table = FixedDataTable.Table;
var Column = FixedDataTable.Column;

var rows = [
  ['a1', 'b1', 'c1'],
  ['a2', 'b3', 'c2'],
  ['a3', 'b3', 'c3']
];

function rowGetter(rowIndex) {
  return rows[rowIndex];
}

var MyComponent = React.createClass({

	render(){

		var className = cx('MyComponent', this.props.className);

		return <div className={className} style={{border:'solid red 5px'}}/>


	}

});


var SampleApp1 = React.createClass({

	childContextTypes : {
		releaseSpace : PropTypes.oneOf(['close','open'])
	},

	getChildContext(){
		return {
			releaseSpace : this.state.releaseSpace
		}
	},

	getInitialState(){
		return {
			releaseSpace : 'close'
		}
	},

	render(){

		var style = {


		};

		return (
			<FlexBox className="SampleApp1" flexOrientation="column">
				<div style={{height: 32, backgroundColor: 'yellow'}} header={false}>
					<button onClick={this.toggleReleaseState}>Toggle releaseState</button>
				</div>
				<FlexBox className="SampleApp1" flexOrientation="row">
					<Component title="test 1" width={100} resizeable={true} header={false}/>
					<DynamicContainer types={{MyComponent,FixedDataTable:Table,FixedDataTableColumn:Column}}
						dragContainer={true}>
						<FlexBox className="SampleApp1" flexOrientation="column">
							<FlexBox className="SampleApp1" flexOrientation="row">
								<MyComponent title="test 0.1"/>
								<Component title="test 0.4" style={{backgroundColor:'green'}}/>
								<Component title="test 0.2"/>
								<div title="A Div" style={{backgroundColor:'cornflowerblue'}}/>
							</FlexBox>
							<Component title="test 3"/>
							<Component title="test4" style={{backgroundColor:'green'}}/>
							<Table width={600} height={400}
							    rowHeight={50} 
							    rowGetter={rowGetter}
							    rowsCount={rows.length}
							     headerHeight={50}>
							    <Column label="Col 1" width={300} dataKey={0} />
							    <Column label="Col 2" width={300} dataKey={1} />
							</Table>
						</FlexBox>
					</DynamicContainer>
				</FlexBox>
				<div header={false} style={{height: 32, backgroundColor: 'green'}}/>
			</FlexBox>
		);
	},

	toggleReleaseState(){
		var releaseSpace = this.state.releaseSpace === 'open' ? 'close' : 'open';
		this.setState({releaseSpace});
	}

//							<div style={{backgroundColor:'red'}}/>

});

module.exports = SampleApp1;