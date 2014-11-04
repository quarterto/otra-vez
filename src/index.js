var clearRequire = require('clear-require');
var repl = require('repl');
var fs = require('fs');
var path = require('path');
var util = require('util');

function requireFresh(module) {
	var resolved = path.resolve(module);
	clearRequire(resolved);
	return require(resolved);
}

function requireAndInject(session, module) {
	var obj = requireFresh(module);
	util._extend(session.context, obj);
}

function watchModule(session, module, context, fn) {
	var resolved = require.resolve(path.resolve(module))
	fs.watch(resolved, function(event) {
		if(event === 'change') {
			console.log(
				'\r' +
				'reloaded ' + context +
				' from ' + resolved
			);
			fn(session, module);
			session.displayPrompt();
		}
	});
}

function requireKey(key) {
	return function(session, module) {
		session.context[key] = requireFresh(module);
	};
}

function requireMagic(session, module) {
	var obj = requireFresh(module);

	process.nextTick(function() {
		var key = Object.keys(session.context).filter(function(m) {
			return session.context[m] === obj;
		})[0];

		if(key) {
			watchModule(session, module, key, requireKey(key));
		}
	});

	return obj;
}

function otraVez(module, options) {
	var session = repl.start(options || '> ');
	session.on('exit', process.exit);

	session.context.require = function(module) {
		return requireMagic(session, module);
	};

	if(module) {
		requireAndInject(session, module);
		watchModule(session, module, 'content', requireAndInject);
	}
}

module.exports = otraVez;