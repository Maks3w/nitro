'use strict';

module.exports = function (nitro, list, options) {

  var plugins = [],
      _ = require('nitro-tools');

  if( options.groupmedia ) {
    var groupmedia = nitro.require('group-css-media-queries');

    list = list.clone().each(function (f) {
      f.src = groupmedia( '' + f.src );
    });
  }

  if( options.autoprefix ) {
    plugins.push( nitro.require('autoprefixer')( require('./autoprefixer-options')( options.autoprefix === true ? {} : options.autoprefix ) ) );
  }

  if( options.minify ) {
    plugins.push( nitro.require('cssnano')( _.extend({
      autoprefixer: false,
      mergeIdents: false,
      reduceIdents: false,
      zindex: false
    }, options.minify === true ? {} : options.minify) ) );
  }

  if( plugins.length ) {
    list = list.process('postcss', { plugins: plugins, sourceMap: options.sourceMap });
  }

  return list;

};
