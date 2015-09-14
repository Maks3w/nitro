
'use strict';

var glob = require('glob'),
    path = require('path'),
    mmatch = require('minimatch'),
    Minimatch = mmatch.Minimatch,
    file = require('./file'),
    classFile = require('./class-file'),
    noop = function (value) { return value; };

function fetchFiles (cwd, filter, File) {
  return glob.sync(filter, { cwd: cwd }).map(function (filePath) {
    return new File( file.read( path.join(cwd, filePath) ), file.parsePath(filePath) );
  });
}

function Files (src, meta) {
  meta = meta || {};
  meta.cwd = meta.cwd || '.';

  this.meta = meta;

  var File = classFile(meta);
  this.File = File;

  if( typeof src === 'string' ) {
    [].push.apply( this, fetchFiles( meta.cwd, src, this.File ) );
  } else if ( src instanceof Array ) {

    // @TODO combine glob and minimatch to parse load/filter array

    if( src.length ) {

      var pattern = src.shift(),
          files = glob.sync(pattern, { cwd: meta.cwd });

      pattern = src.shift();
      while ( pattern ) {

        if( pattern.charAt(0) === '!' ) {
          files = files.filter( mmatch.filter(pattern) );
        } else {

        }

        pattern = src.shift();
      }

      [].push.apply( this, files.map(function (filePath) {
        return new File( file.read( path.join(meta.cwd, filePath) ), file.parsePath(filePath) );
      }) );
    }

  }
}

function getFileSrc (f) {
  return f.src;
}

Files.prototype = [];

Files.prototype.each = function (handler) {
  for( var i = 0, n = this.length; i < n ; i++ ) {
    handler.call(this[i], this[i], i);
  }

  return this;
};

Files.prototype.log = function (title) {
  if( title ) {
    console.log(title.yellow);
  }

  this.each(function (f) {
    console.log( f.getPath() );
  });

  return this;
};

Files.prototype.add = function (files) {
  [].push.apply(this, files);
  return this;
};

Files.prototype.load = function (filter) {
  this.add( new Files(filter) );
  return this;
};

Files.prototype.concat = function (items) {
   [].push.apply(this, items);
   return this;
}

Files.prototype.clone = function () {
  return new Files().concat( this.map(function (f) {
    return f.clone();
  }) );
};

// Files.prototype.process > defined in processors.js

Files.prototype.join = function (filter, filePath) {
  if( !filePath ) {
    if( !filter ) {
      throw new Error('Files.join :: file path needs to be defined');
    }
    filePath = filter;
  }


  if( filePath !== true ) {
    var files = new Files();

    files.push( new File(this.join(true), file.parsePath(filePath) ) );
    return files;
  } else {
    return this.map(getFileSrc).join('');
  }
};

function filterPattern (pattern) {
  return mmatch.filter(pattern);
  // var mm = new Minimatch(pattern);
  // return function (f) {
  //   return mm.match( f.getPath() );
  // };
}

Files.prototype.filter = function (filter) {
  if( typeof filter === 'string' ) {
    return new Files( [].filter.call(this,  mmatch.filter(filter) ) );
  }
  return new Files().concat( [].filter.call(this,  filter ) );
};

Files.prototype.with = function (pattern, processor) {
  var matchPattern = filterPattern(pattern),
      pristine = new Files(),
      dirty = new Files();

  for( var i = 0, n = this.length; i < n ; i++ ) {
    if( matchPattern(this[i]) ) {
      dirty.push(this[i]);
    } else {
      pristine.push(this[i]);
    }
  }

  return pristine.join( processor(dirty) );
};

Files.prototype.write = function (dest, rename) {
  this.forEach(function (f) {
    file.write( ( rename || noop )( path.join(dest, f.filePath || '.', f.fileName) ), f.src );
  });
  return this;
};

Files.prototype.writeFile = function (destFile) {
  file.write( destFile, this.join(true) );
  return this;
};

module.exports = Files;