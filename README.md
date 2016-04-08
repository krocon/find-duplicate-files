
# find-duplicate-files
 
A file walk util that allows you to find duplicates in given sub directories (tree). The file walk is recursive.
Duplicate means that the content of two or more files is equals (checked via md5 check sum).
 
The directory and all sub directories will be scanned. A given file pattern will reduce the list of scanned files.
 
For big (static) files it can be usefull to use a md5 mapping file. This mapping file will be created a the first run. Following runs can take the md5 from the mapping file, if an entry exists. If a new file found, the md5 will be calculated and added to the mapping file.
 
The md5 calculation can take a long time via network and big data sets (5 hours for 1 TB data and GBit network connection).
 
## Usage
```js
var fdf = require('find-duplicate-files');
fdf(path <String>, options <Object>, callback hander <function(err,groups)>);
```

```js
var fdf = require('find-duplicate-files');
fdf(pathes [<String>, ...], options <Object>, callback hander <function(err,groups)>);
```
 
 
### Options
 
Key    | Possible values       | Comment
------ | ----------------------|---------------------
silent | true / false (default) | true will skip logging (except errors)
checkPattern | A regular expression for file names (/\.jpg$/g). Can be null. | null means: all files
md5File | Specifies a text file for md5 / file name mapping. Can be null. Default: 'md5.json'| null means: 'md5.json' in the first given directory ('path'). You can set a different name (relative or absolute path)
md5SkipSaving | true / false (default) | true means: no md5 file shall  be saved.
md5SkipLoading | true / false (default) | true means: no md5 file shall  be used (if exists).
 
 
## Examples
 
```js
var findDuplicateFiles = require('find-duplicate-files');
 
// Basic usage (a default callback handler will log the results):
findDuplicateFiles('/Volumes/data/ebooks', {});
 
// Sample config for ebooks (big static data set):
findDuplicateFiles(
    '/Volumes/data/ebooks',
    {
        silent: true, // No logging
        checkPattern: /\.cbz$|\.cbr$/g, // Can be null
        md5File: '_md5map.json' //will be created in '/Volumes/data/ebooks'
    },
    function(err, groups) {
    if (err) return console.error(err);
        groups.forEach(function(group) {
            // A group is a set of files with the same md5 checksum:
            group.forEach(function(item) {
                // a file item has a path and a md5 property:
                console.log(item.md5 + '\t' + item.path);
            }
        }
     });
 
// Sample config for (small) text files:
findDuplicateFiles(
     [
        '/Volumes/data/dev/abc',
        '/Volumes/movies/ger'
     ]
     {
         checkPattern: /\.html$|\.js$|\.txt$/g,
         md5SkipSaving: true, // No md5 mapping file will be written
         md5SkipLoading: true // No loading of md5 mapping file      
     },
     function(err, groups) {
         if (err) return console.error(err);
         // TODO what you want
         console.log(JSON.stringify(groups, null, 4));
     }); 
```
 
### Sample callback handler
 
Debug only:
```js
function(err, groups) {
  if (err) return console.error(err);
  console.log(JSON.stringify(groups, null, 4));
}); 
```
 
Writing a cleanup shell script:
```js
function(err, groups) {
    if (err) return console.error(err);
    var cmds = [];
    groups.forEach(function(group){
        cmds.push('');
        var c = 0;
        group.forEach(function(item){
            var fullName = path.isAbsolute(item.path) ?
            item.path : path.join(options.baseDir, '/', item.path);
            // Decide if you  want to delete or not:
            if (c < group.length - 1 && item.path.indexOf('___todo') > -1) {
                cmds.push('rm -f "' + fullName + '"');
                // Windows: cmds.push('DEL /F /S /Q /A "' + fullName + '"');
                c++;
            } else {
                cmds.push('# "' + fullName + '"');
                // Windows: cmds.push('REM "' + fullName + '"');
            }
        }); // forEach
    }); // forEach
    // Write shell script to file (but don't execute it):
    var stream = fs.createWriteStream("clean.command");
    stream.once('open', function(fd) {
        cmds.forEach(function(cmd) {
            stream.write(cmd + '\n');
        });
        stream.end();
    }); // stream   
}); 
```
 
Auto delete callback handler (madness mode):
```js
function(err, groups) {
    if (err) return console.error(err);
    groups.forEach(function(group) {
         // loop starts at index 1
         // first item will be untouched
         for (var i = 1; i < group.length; i++) {
             fs.unlinkSync(group[i].path);
         }
    }); // forEach
}); 
```
