
(function () {

    "use strict";

    module.exports = function (dir, options, callback) {

        var fs = require('fs');
        var path = require('path');

        var walk = require('walkdir');
        var md5File = require("md5-file");
        var log = require('npmlog');

        if (!dir) return log.error('fdf', 'Parameter dir is missing');

        var isArray = Array.isArray || function( obj ) {
                return toString.call(obj) === "[object Array]";
            };
        var isString = function( obj ) {
            return toString.call(obj) === "[object String]";
        };

        if (!options) options = {};
        options.pathes = isArray(dir) ? dir : [dir]; // options.pathes is an array!
        options.callback = callback;

        // Check:
        for (var i; i < options.pathes.length; i++) {
            if (!isString(options.pathes[i])) return log.error('fdf', 'Parameter dir must be a string or an array of strings.');
        }


        (function (opt) {

            var defaultCallback = function defaultCallback(err, groups) {
                if (err) {
                    log.error("fdf", err);
                } else {
                    groups.forEach(function (group) {
                        log.info("fdf", '');
                        group.forEach(function (item) {
                            log.info("fdf", item.path);
                        });
                    });
                }
            };

            var containsFileItemByPath = function containsFileItemByPath(list, path) {
                for (var i = 0; i < list.length; i++) {
                    if (list[i].path === path) return true;
                }
                return false;
            };

            var getAllFiles = function getAllFiles(pathes) {
                var files = [];
                for (var i = 0; i < pathes.length; i++) {
                    var ff = getFiles(pathes[i]);
                    for (var j = 0; j < ff.length; j++) {
                        // We dont want to have duplicates in our file array:
                        if (files.indexOf(ff[j]) === -1) files.push(ff[j]);
                    }
                }
                return files;
            };
            var getFiles = function getFiles(dir) {
                // We want get files only (no directories):
                var files = [];
                try {
                    var filesObject = walk.sync(dir, {
                        "return_object": true,
                        "no_return": false
                    });
                } catch (e) {
                    log.error('fdf', 'Error reading %s', dir, e);
                }
                for (var file in filesObject) {
                    if (filesObject.hasOwnProperty(file) && filesObject[file]["mode"] & 0x8000) files.push(file);
                }
                return files;
            };

            var loadMd5File = function loadMd5File() {
                var ret = [];
                if (!opt.md5SkipLoading) {
                    try {
                        ret = JSON.parse(fs.readFileSync(opt.md5File));
                        if (!opt.silent) log.info('fdf', 'File loaded   : %s', opt.md5File);
                    } catch (e) {
                        log.info('fdf', 'Can\'t load %s (%s)', opt.md5File, e.message);
                    }
                }
                return ret;
            };

            var saveMd5File = function saveMd5File(md5List) {
                if (!opt.md5SkipSaving) {
                    fs.writeFile(opt.md5File, JSON.stringify(md5List) /*, null, 2)*/, function (err) {
                        if (err) return console.error(err);
                        if (!opt.silent) log.info('fdf', 'JSON (md5) saved at : %s', opt.md5File);
                    });
                }
            };

            var removeOutdatedMd5Entries = function removeOutdatedMd5Entries(files, md5List) {
                // remove outdated entries from md5List:
                if (md5List.length) {
                    for (var i = 0; i < md5List.length; i++) {
                        if (files.indexOf(md5List[i].path) === -1) {
                            md5List.splice(i, 1); // remove item from md5List
                        }
                    }
                }
            };

            var createMissingMd5 = function createMissingMd5(files, md5List) {
                for (var i = 0; i < files.length; i++) {
                    // Logging:
                    if (!opt.silent && !opt.silent && i > 0 && i % 1000 === 0) {
                        var dt = (Date.now() - t2);
                        var eta = Math.max(0, (dt * files.length / i - dt) / 1000).toFixed(0);
                        log.info('fdf', '%s %% (%d files) in %d millis (ETA: %s secs).', (100 * i / files.length).toFixed(1), i, dt, eta);
                    }
                    var p = files[i];
                    if (!opt.checkPattern || p.match(opt.checkPattern)) {
                        if (!md5List.length || !containsFileItemByPath(md5List, p)) {
                            var item = {path: p};
                            try {
                                item.md5 = md5File(p);
                                md5List.push(item);
                            } catch (e) {
                                log.error('fdf', '%d) %s (%s)', i, p, e.message);
                            }
                        }
                    }
                } // for
            };

            var findDuplicates= function findDuplicates(md5List) {
                var dublicatMd5s = [];
                var fileCount = 0;
                var ret = [];
                for (var k = 0; k < md5List.length; k++) {
                    var foundDublicates = [];
                    var item1 = md5List[k];

                    for (var l = (k + 1); l < md5List.length; l++) {
                        var item2 = md5List[l];
                        if (item1.md5 === item2.md5) {
                            if (dublicatMd5s.indexOf(item1.md5) === -1) {
                                if (!containsFileItemByPath(foundDublicates, item1.path)) foundDublicates.push(item1);
                                if (!containsFileItemByPath(foundDublicates, item2.path)) foundDublicates.push(item2);
                            }
                        }
                    }
                    if (foundDublicates.length) {
                        ret.push(foundDublicates);
                        fileCount += foundDublicates.length;
                        dublicatMd5s.push(item1.md5);
                    }
                }
                if (!opt.silent) log.info('fdf', 'Dublicates          : %d files in %d groups.', fileCount, ret.length);
                return ret;
            };


            var start = function start() {
                // Starting...

                if (!opt.md5File) opt.md5File = path.join(opt.pathes[0], '/', 'md5.json');
                opt.callback = opt.callback ? opt.callback : defaultCallback;

                if (!opt.silent) {
                    log.info('fdf', 'Starting at   : %s', opt.pathes);
                    log.info('fdf', 'Searching for : %s', opt.checkPattern);
                    log.info('fdf', 'Start dirs    : %s', opt.pathes);
                }

                // Scan directories recursive:
                var t1 = Date.now();
                var files = getAllFiles(opt.pathes);
                var t2 = Date.now();
                if (!opt.silent) log.info('fdf', 'Directory scan: %d entries (in %d start directories) in %d millis', files.length, opt.pathes.length, (t2 - t1));

                // Load md5 file or create empty array:
                var md5List = loadMd5File();

                // remove outdated entries from md5List:
                if (md5List.length) removeOutdatedMd5Entries(files, md5List);

                // get md5 for each file in array 'files':
                createMissingMd5(files, md5List);

                var t3 = Date.now();
                // Logging:
                if (!opt.silent) log.info('fdf', 'Creation of md5 list: %d entries in %d millis', md5List.length, (t3 - t2));

                // Write file/md5 list to file:
                saveMd5File(md5List);

                // find duplicates by md5:
                var ret = findDuplicates(md5List);

                // call the caller:
                opt.callback(null, ret);
            };

            start();

        })(options);

    }; // module.exports

})();
