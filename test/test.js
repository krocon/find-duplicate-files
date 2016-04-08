(function(){
    
    'use strict';
    
    // be carefull that your ide doesnt change the input of the test files (line breaks).

    var fs = require('fs');
    var findDuplicateFiles = require('../index.js'); // find-duplicate-files
    var assert = require('assert');
    var Promise = require('es6-promise').Promise;

    function deleteMd5(){
        return new Promise(function(resolve, reject) {
            fs.stat('da/md5.json', function (err, stats) {
                if (stats && stats.isFile()) {
                    fs.unlink('da/md5.json', function () {
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });
    }



    function callTest1(){
        console.info('Start 1...');
        return new Promise(function(resolve, reject) {
            findDuplicateFiles('da', { silent: true },
                function (err, groups) {
                    assert(err === null);
                    assert(groups.length == 2);
                    assert(groups[0].length == 8);
                    assert(groups[1].length == 4);
                    console.info('Path 1/6');
                    resolve();
                }
            );
        });
    }

    function callTest2(){
        console.info('Start 2...');
        return new Promise(function(resolve, reject) {
            findDuplicateFiles('da', { silent: true },
                function (err, groups) {
                    assert(err === null);
                    assert(groups.length == 2);
                    assert(groups[0].length == 8);
                    assert(groups[1].length == 4);
                    console.info('Path 2/6');
                    resolve();
                }
            );
        });
    }

    function callTest3(){
        console.info('Start 3...');
        return new Promise(function(resolve, reject) {
            findDuplicateFiles('da', { silent: true, checkPattern: /\.dummy$/g,  },
                function (err, groups) {
                    assert(err === null);
                    assert(groups.length == 0);
                    console.info('Path 3/6');
                    resolve();
                }
            );
        });
    }

    function callTest4(){
        console.info('Start 4...');
        return new Promise(function(resolve, reject) {
            findDuplicateFiles('da', {
                    checkPattern: /\.js$|\.doc$/g, // can be null
                    md5SkipSaving: true,
                    md5SkipLoading: true,
                    silent: true
                },

                function (err, groups) {
                    assert(err === null);
                    assert(groups.length == 1);
                    assert(groups[0].length == 4);

                    console.info('Path 4/6');
                    resolve();
                }
            );
        });
    }

    function callTest5(){
        console.info('Start 5...');
        return new Promise(function(resolve, reject) {
            findDuplicateFiles('da', {
                    checkPattern: /\.dummytetetetet$/g,
                    md5SkipSaving: true,
                    md5SkipLoading: true,
                    silent: true
                },

                function (err, groups) {
                    assert(err === null);
                    assert(groups.length == 0);
                    console.info('Path 5/6');
                    resolve();
                }
            );
        });
    }


    function callTest6(){
        console.info('Start 6...');
        return new Promise(
            function(resolve, reject) {
                findDuplicateFiles(['da', 'dd'], {
                    silent: true,
                    md5SkipSaving: true,
                    md5SkipLoading: true
                },
                function (err, groups) {
                    assert(err === null);
                    assert(groups.length == 2);
                    assert(groups[0].length == 12);
                    assert(groups[1].length == 8);
                    console.info('Path 6/6');
                    resolve();
                }
            );
        });
    }

    deleteMd5()
        .then(callTest1)
        .then(callTest2)
        .then(deleteMd5)
        .then(callTest3)
        .then(callTest4)
        .then(callTest5)
        .then(deleteMd5)
        .then(callTest6)
        .then(deleteMd5);

})();