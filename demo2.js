'use strict';

import {findSimilarlyNamedFiles} from './index.js';


findSimilarlyNamedFiles('f:/ebooks/_deu', {logLevel: 'info'},
  (err, arr) => {

    if (err) {
      console.error(err);
    } else {
      console.log(JSON.stringify(arr, null, 4));
    }

  }
);


