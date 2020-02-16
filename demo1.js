'use strict';

import {findDuplicateFiles} from './index.js';


findDuplicateFiles('f:/ebooks/_deu/a', {silent: true},
  (err, groups) => {

    if (err) {
      console.error(err);
    } else {
      groups.forEach(function (group) {
        // A group is a set of files with the same md5 checksum:
        console.log('');
        group.forEach(function (item) {
          // a file item has a path and a md5 property:
          console.log(item.md5 + '\t' + item.path);
        });
      });
    } // else

  }
);


