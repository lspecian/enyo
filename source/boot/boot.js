// machine for a loader instance
enyo.machine = {
	sheet: function(s) {
		if (!enyo.runtimeLoading) {
			document.write('<link href="' + s + '" media="screen" rel="stylesheet" type="text/css" />');
		} else {
			var link = document.createElement('link');
			link.href = s;
			link.media = "screen";
			link.rel = "stylesheet";
			link.type = "text/css";
			document.getElementsByTagName('head')[0].appendChild(link);
		}
	},
	script: function(inSrc, onLoad, onError) {
		if (!enyo.runtimeLoading) {
			document.write('<scri' + 'pt src="' + inSrc + '"' + (onLoad ? ' onload="' + onLoad + '"' : '') + (onError ? ' onerror="' + onError + '"' : '') + '></scri' + 'pt>');
		} else {
			var script = document.createElement('script');
			script.src = inSrc;
			script.onLoad = onLoad;
			script.onError = onError;
			document.getElementsByTagName('head')[0].appendChild(script);
		}
	},
	inject: function(inCode) {
		document.write('<script type="text/javascript">' + inCode + "</script>");
	}
};

// create a dependency processor using our script machine
enyo.loader = new enyo.loaderFactory(enyo.machine);

// dependency API uses enyo loader
enyo.depends = function() {
	var ldr = enyo.loader;
	if (!ldr.packageFolder) {
		var tag = enyo.locateScript("package.js");
		if (tag && tag.path) {
			ldr.aliasPackage(tag.path);
			ldr.packageFolder = tag.path + "/";
			//console.log("detected PACKAGEFOLDER [" + ldr.packageFolder + "]");
		}
	}
	ldr.load.apply(ldr, arguments);
};

// Runtime loader
// Usage: enyo.load(depends, [onLoadCallback])
//  where - depends is string or array of string paths to package.js, script, or css to load
//        - doneCallback is fired after file or package loading has completed
// Only one file/package is loaded at a time; additional calls are queued and loading deferred
(function() {
	var enyo = window.enyo;
	var runtimeLoadQueue = [];
	enyo.load = function(depends, onLoadCallback) {
		runtimeLoadQueue.push(arguments);
		if (!enyo.runtimeLoading) {
			enyo.runtimeLoading = true;
			runtimeLoad();
		}
	}
	function runtimeLoad(onLoad) {
		if (onLoad) {
			onLoad(); // Run user callback function
		}
		if (runtimeLoadQueue.length) {
			var args = runtimeLoadQueue.shift();
			var depends = args[0];
			var dependsArg = enyo.isArray(depends) ? depends : [depends];
			var onLoadCallback = args[1];
			enyo.loader.finishCallback = function() {
				// Once loader is done loading a package, we chain a call to runtimeLoad(),
				// which will call the onLoadCallback from the original load call, passing
				// a reference to the depends argument from the original call for tracking,
				// followed by kicking off any additionally queued load() calls
				runtimeLoad(function() {
					onLoadCallback && onLoadCallback(depends);
				});
			}
			enyo.loader.packageFolder = "./";
			// Kick off next queued call to loader
			enyo.depends.apply(this, dependsArg);
		} else {
			enyo.runtimeLoading = false;
			enyo.loader.finishCallback = null;
			enyo.loader.packageFolder = "";
		}
	}
})();

// predefined path aliases
enyo.path.addPaths({
	enyo: enyo.args.root,
	lib: "$enyo/../lib"
});