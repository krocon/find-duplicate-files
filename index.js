"use strict";

import fs from "fs";
import path from "path";

import walk from "walkdir";
import md5File from "md5-file";
import log from "npmlog";

export function findDuplicateFiles(dir, options, callback) {

  if (!dir) {
    return error('fdf', 'Parameter dir is missing');
  }

  if (!options) options = {};
  options.pathes = Array.isArray(dir) ? dir : [dir]; // options.pathes is an array!
  options.callback = callback;

  // Check:
  for (let i; i < options.pathes.length; i++) {
    if (!isString(options.pathes[i])) {
      return error('fdf', 'Parameter dir must be a string or an array of strings.');
    }
  }

  start();

  // ---------------------------------------------------

  function isString(o) {
    return typeof o === 'string';
  }

  function info(args) {
    if (!options.silent) log.info(...args);
  }


  function error(args) {
    log.error(...args);
  }

  function defaultCallback(err, groups) {
    if (err) {
      error("fdf", err);
    } else {
      groups.forEach(group => {
        info("fdf", '');
        group.forEach(item => {
          info("fdf", item.path);
        });
      });
    }
  }

  function containsFileItemByPath(list, path) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].path === path) return true;
    }
    return false;
  }

  function getAllFiles(pathes) {
    const files = [];
    for (let i = 0; i < pathes.length; i++) {
      const ff = getFiles(pathes[i]);
      for (let j = 0; j < ff.length; j++) {
        // We dont want to have duplicates in our file array:
        if (files.indexOf(ff[j]) === -1) files.push(ff[j]);
      }
    }
    return files;
  }

  function getFiles(dir) {
    // We want get files only (no directories):
    const files = [];
    try {
      let filesObject = walk.sync(dir, {
        "return_object": true,
        "no_return": false
      });
      for (let file in filesObject) {
        if (filesObject.hasOwnProperty(file) && filesObject[file]["mode"] & 0x8000) files.push(file);
      }
    } catch (e) {
      error('fdf', 'Error reading %s', dir, e);
    }
    return files;
  }

  function loadMd5File() {
    let ret = [];
    if (!options.md5SkipLoading) {
      try {
        ret = JSON.parse(fs.readFileSync(options.md5File));
        info('fdf', 'File loaded   : %s', options.md5File);
      } catch (e) {
        info('fdf', 'Can\'t load %s (%s)', options.md5File, e.message);
      }
    }
    return ret;
  }

  function saveMd5File(md5List) {
    if (!options.md5SkipSaving) {
      fs.writeFile(options.md5File, JSON.stringify(md5List) /*, null, 2)*/, err => {
        if (err) return console.error(err);
        info('fdf', 'JSON (md5) saved at : %s', options.md5File);
      });
    }
  }

  function removeOutdatedMd5Entries(files, md5List) {
    // remove outdated entries from md5List:
    if (md5List.length) {
      for (let i = 0; i < md5List.length; i++) {
        if (files.indexOf(md5List[i].path) === -1) {
          md5List.splice(i, 1); // remove item from md5List
        }
      }
    }
  }

  function createMissingMd5(files, md5List) {
    const t2 = Date.now();
    for (let i = 0; i < files.length; i++) {
      // Logging:
      if (!options.silent && !options.silent && i > 0 && i % 1000 === 0) {
        const dt = (Date.now() - t2);
        const eta = Math.max(0, (dt * files.length / i - dt) / 1000).toFixed(0);
        info('fdf', '%s %% (%d files) in %d millis (ETA: %s secs).', (100 * i / files.length).toFixed(1), i, dt, eta);
      }
      const p = files[i];
      if (!options.checkPattern || p.match(options.checkPattern)) {
        if (!md5List.length || !containsFileItemByPath(md5List, p)) {
          const item = {path: p};
          try {
            item.md5 = md5File(p);
            md5List.push(item);
          } catch (e) {
            error('fdf', '%d) %s (%s)', i, p, e.message);
          }
        }
      }
    } // for
  }

  function findDuplicates(md5List) {
    const dublicatMd5s = [];
    let fileCount = 0;
    const ret = [];
    for (let k = 0; k < md5List.length; k++) {
      const foundDublicates = [];
      const item1 = md5List[k];

      for (let l = (k + 1); l < md5List.length; l++) {
        const item2 = md5List[l];
        if (item1.md5 === item2.md5) {
          if (dublicatMd5s.indexOf(item1.md5) === -1) {
            if (!containsFileItemByPath(foundDublicates, item1.path)) {
              foundDublicates.push(item1);
            }
            if (!containsFileItemByPath(foundDublicates, item2.path)) {
              foundDublicates.push(item2);
            }
          }
        }
      }
      if (foundDublicates.length) {
        ret.push(foundDublicates);
        fileCount += foundDublicates.length;
        dublicatMd5s.push(item1.md5);
      }
    }
    info('fdf', 'Dublicates          : %d files in %d groups.', fileCount, ret.length);
    return ret;
  }

  function start() {
    // Starting...

    if (!options.md5File) options.md5File = path.join(options.pathes[0], '/', 'md5.json');
    options.callback = options.callback ? options.callback : defaultCallback;

    info('fdf', 'Starting at   : %s', options.pathes);
    info('fdf', 'Searching for : %s', options.checkPattern);
    info('fdf', 'Start dirs    : %s', options.pathes);

    // Scan directories recursive:
    const t1 = Date.now();
    const files = getAllFiles(options.pathes);
    const t2 = Date.now();
    info('fdf',
      'Directory scan: %d entries (in %d start directories) in %d millis',
      files.length, options.pathes.length, (t2 - t1));

    // Load md5 file or create empty array:
    const md5List = loadMd5File();

    // remove outdated entries from md5List:
    if (md5List.length) removeOutdatedMd5Entries(files, md5List);

    // get md5 for each file in array 'files':
    createMissingMd5(files, md5List);

    const t3 = Date.now();
    // Logging:
    info('fdf', 'Creation of md5 list: %d entries in %d millis', md5List.length, (t3 - t2));

    // Write file/md5 list to file:
    saveMd5File(md5List);

    // find duplicates by md5:
    const ret = findDuplicates(md5List);

    // call the caller:
    options.callback(null, ret);
  }

}


