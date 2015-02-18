module.exports = {

  entry: './index.js',
  output: {
    filename: 'bundle.js'       
  },
  module: {
    loaders: [
      //{ test: /\.js$/, loader: '6to5-loader'},
      { test: /\.js$/, loader: 'jsx-loader?harmony' } 
    ]
  }  
  
};