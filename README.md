# Introduction

Allows you to place multiple drag and drop hotspots onto a webpage.

* Multiple observable streams can be setup for dropped files
* Multiple hotspots can provide files to a shared stream
* Only one stream will highlight at a time (See note below)
* Supports both drag and drop and file dialogs
* File data is normalised for ease of use
  * Where possible file path information is retained - if a folder is dropped

NOTE: If multiple hotspots are defined for a single stream then all those
hotspots will activate when a user hovers over any of them. This improves
discoverability.


## Usage

1. Include the directive in your Component or Directive
     * `import {DropTarget} from 'a2-file-drop/dist/drop-target';`
2. Add the directive to the target elements
     * `<div drop-target file-stream="media-uploads" highlight="hover-class"></div>`


## Options

* `drop-target="#selector"` if you want to use a different element as your actual target (html, body etc)
    * This makes drop box style apps where the whole page is a drop target possible
    * Defaults to the element defined on if no selector is provided
* `file-stream="stream name"` is the name your upload logic will use to recieve dropped file data
* `highlight="class-name"` is the class added to the drop-target when the mouse pointer is above


# License

MIT
