"use strict";
var DropFiles = (function () {
    function DropFiles(event) {
        this.length = 0;
        this.totalSize = 0;
        this.files = [];
        this.calculating = false;
        var self = this, files = event.dataTransfer.files, items = event.dataTransfer.items, either = items || files;
        self.promise = new Promise(function (resolve, reject) {
            if (!either || files.length === 0) {
                reject('no files found');
                return;
            }
            // Do we have file path information available
            if (either[0].kind) {
                self.resolve = resolve;
                self.reject = reject;
                self._pending = [{
                        items: items,
                        folders: true,
                        path: ''
                    }];
                self.calculating = true;
                // files are flattened so this should be accurate
                // at least until we are finished processing
                self.length = files.length;
                self._processPending();
            }
            else {
                var i, file;
                // Clone the files array
                for (i = 0; i < files.length; i += 1) {
                    file = files[i];
                    // ensure the file has some content
                    if (file.type || file.size > 0) {
                        self.totalSize += file.size;
                        self.files.push(file);
                    }
                }
                self.length = files.length;
                resolve(self);
            }
        });
    }
    // Extracts the files from the folders
    DropFiles.prototype._processPending = function () {
        var self = this;
        if (self._pending.length > 0) {
            var item = self._pending.shift(), items = item.items, length = items.length;
            // Let's ignore this folder
            if (length === 0 || length === undefined) {
                setTimeout(self._processPending.bind(self), 0);
                return;
            }
            // Check if this pending item has any folders
            if (item.folders) {
                var i, entry, obj, count = 0, new_items = [], checkCount = function () {
                    // Counts the entries processed so we can add any files to the queue
                    count += 1;
                    if (count >= length) {
                        if (new_items.length > 0) {
                            // add any files to the start of the queue
                            self._pending.unshift({
                                items: new_items,
                                folders: false
                            });
                        }
                        setTimeout(self._processPending.bind(self), 0);
                    }
                }, processEntry = function (entry, path) {
                    // If it is a directory we add it to the pending queue
                    try {
                        if (entry.isDirectory) {
                            entry.createReader().readEntries(function (entries) {
                                self._pending.push({
                                    items: entries,
                                    folders: true,
                                    path: path + entry.name + '/'
                                });
                                checkCount();
                            });
                        }
                        else if (entry.isFile) {
                            // Files are added to a file queue
                            entry.file(function (file) {
                                file.dir_path = path;
                                if (file.type || file.size > 0) {
                                    self.totalSize += file.size;
                                    new_items.push(file);
                                }
                                checkCount();
                            });
                        }
                        else {
                            checkCount();
                        }
                    }
                    catch (err) {
                        checkCount();
                    }
                };
                for (i = 0; i < length; i += 1) {
                    // first layer of DnD folders require you to getAsEntry
                    if (item.path.length === 0) {
                        obj = items[i];
                        obj.getAsEntry = obj.getAsEntry || obj.webkitGetAsEntry || obj.mozGetAsEntry || obj.msGetAsEntry;
                        if (obj.getAsEntry) {
                            entry = obj.getAsEntry();
                            processEntry(entry, item.path);
                        }
                        else {
                            // Opera support
                            entry = obj.getAsFile();
                            if (entry.size > 0) {
                                self.totalSize += entry.size;
                                new_items.push(entry);
                            }
                            checkCount();
                        }
                    }
                    else {
                        entry = items[i];
                        processEntry(entry, item.path);
                    }
                }
            }
            else {
                // Regular files where we can add them all at once
                self.files.push.apply(self.files, items);
                // Delay until next tick (delay and invoke apply are optional)
                setTimeout(self._processPending.bind(self), 0);
            }
        }
        else {
            self._completeProcessing();
        }
    };
    DropFiles.prototype._completeProcessing = function () {
        var self = this;
        self.calculating = false;
        self.length = self.files.length;
        if (self.length > 0) {
            self.resolve(self);
        }
        else {
            self.reject('no files found');
        }
    };
    return DropFiles;
}());
exports.DropFiles = DropFiles;
//# sourceMappingURL=drop-files.js.map