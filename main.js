(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var p = require('pauseable');

$(function() {

	var foo;

	$('.start').click(function(e) {
		e.preventDefault();
		foo = p.setTimeout(function() {
			$('.done').text('Done!');
			foo = null;
		}, 100 * 1000);
	});

	$('.pause').click(function(e) {
		e.preventDefault();
		if (!foo) {
			return;
		}
		if (!foo.isPaused()) {
			foo.pause();
		} else {
			foo.resume();
		}
	});

	setInterval(function() {
		if (!foo) {
			return;
		}
		$('.timer').text(foo.next());
	}, 100);

});

},{"pauseable":2}],2:[function(require,module,exports){
exports.pause = function(ee, ms) {
  if (ee.paused) return;
  ee.paused = true;
  if (typeof ee._bufferedEvenets === 'undefined') {
    ee._bufferedEvents = [];
  }
  
  ee._oldEmit = ee.emit;
  ee.emit = function() {
    ee._bufferedEvents.push(arguments);
  };

  if (ms) {
    setTimeout(function() { exports.resume(ee); }, ms);
  }
};

exports.resume = function(ee, ms) {
  if (!ee.paused) return;
  ee.paused = false;

  ee.emit = ee._oldEmit;
  for (var i = ee._bufferedEvents.length - 1; i >= 0; i--) {
    ee.emit.apply(ee, ee._bufferedEvents.pop());
  }

  if (ms) {
    setTimeout(function() { exports.pause(ee); }, ms);
  }
};


exports.createGroup = function() {
  var timers = []
    , paused = false
    , done = false
    ;

  return {
    add: function(id) {
      if (typeof id.emit === 'undefined') {
        id.onDone(function() {
          timers.splice(timers.indexOf(id), 1);
          if (timers.length === 0) {
            done = true;
          }
        });
      }

      timers.push(id);
      return id;
    }

  , setTimeout: function(fn, ms) {
      return this.add(exports.setTimeout(fn, ms));
    }

  , setInterval: function(fn, ms) {
      return this.add(exports.setInterval(fn, ms));
    }

  , pause: function(resumeIn) {
      for (var i = 0; i < timers.length; i++) {
        var id = timers[i];
        if (typeof id.emit === 'function') {
          exports.pause(id, resumeIn);
        } else {
          id.pause(resumeIn);
        }
      }
      paused = true;
    }

  , resume: function(pauseIn) {
      for (var i = 0; i < timers.length; i++) {
        var id = timers[i];
        if (typeof id.emit === 'function') {
          exports.resume(id, pauseIn);
        } else {
          id.resume(pauseIn);
        }
      }
      paused = false;
    }

  , clear: function() {
      for (var i = timers.length - 1; i >= 0; i--) {
        if (typeof timers[i].clear === 'function') {
          timers[i].clear();
        }
      }
    }

  , isPaused: function() {
      return paused;
    }

  , isDone: function() {
      return done;
    }
  
  , timers: function() {
      return timers;
    }
  };
};


exports.setTimeout = function(fn, ms) {
  return timer(setTimeout, clearTimeout, fn, ms);
};

exports.setInterval = function(fn, ms) {
  return timer(setInterval, clearInterval, fn, ms);
};


// gets the ms difference between given time and now
// then subtract that from ms
// should not return negative
var diff = function(time, ms) {
  return ms - (Date.now() - time);
};

var timer = function(type, clear, fn, ms) {
  // allow fn and ms arguments to be switchabale
  // let the user decide the syntax
  if (typeof fn !== 'function') {
    var tmp = fn;
    fn = ms;
    ms = tmp;
  }

  var done = false
    , start = Date.now()
    , resumeTime
    , paused
    , finished
    ;

  var wrapper = function() {
    start = Date.now();
    fn.apply();
    if (type === setTimeout) {
      done = true;
      if (typeof finished === 'function') {
        finished.apply();
      }
    } else if (resumeTime) {
      resumeTime = null;
      id = setInterval(wrapper, ms);
    }
  };

  var id = type(wrapper, ms);

  return {
    pause: function(resumeIn) {
      if (done || paused) return;
      clear(id);
      paused = true;
      if (resumeIn) {
        setTimeout(this.resume, resumeIn);
      }
      return resumeTime = diff(start, ms);
    }

  , resume: function(pauseIn) {
      if (done || !paused) return;
      paused = false;
      start = Date.now();
      if (pauseIn) {
        setTimeout(this.pause, pauseIn);
      }

      // calling setTimeout here and not type because
      // calling setInterval with the remaining time will continue to
      // call setInterval with that lessened time
      id = setTimeout(wrapper, resumeTime);
    }

  , next: function() {
      return paused ? resumeTime : diff(start, resumeTime || ms);
    }

  , clear: function() {
      if (done) return;
      clear(id);
      done = true;
      if (typeof finished === 'function') {
        finished.apply();
      }
    }

  , isPaused: function() {
      return paused;
    }

  , isDone: function() {
      return done;
    }

  , onDone: function(fn) {
      finished = fn;
    }
  };
};

},{}]},{},[1]);
