'use strict';

import {findSimilarlyNamedFiles} from './index.js';


//findSimilarlyNamedFiles('f:/ebooks/_deu/a', {logLevel: 'info'},
findSimilarlyNamedFiles('./test', {logLevel: 'info'},
  (err, groups) => {

    if (err) {
      console.error(err);
    } else {
      groups.forEach(function (group) {
        // A group is a set of files with the same md5 checksum:
        console.log('');
        group.forEach(function (item) {
          // a file item has a path and a md5 property:
          console.log(item.key + '\t' + item.path);
        });
      });
    } // else

  }
);


