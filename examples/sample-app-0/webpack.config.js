module.exports = {

  entry: './index.js',
  output: {
    filename: 'bundle.js'       
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: 'jsx-loader?harmony' } 
    ]
  }  
  
};