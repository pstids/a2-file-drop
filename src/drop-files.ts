
export class DropFiles {
    promise: Promise<DropFiles>;

    length:number = 0;
    totalSize:number = 0;
    files:Array<any> = [];
    calculating:boolean = false;

    private _pending:Array<any>;
    private resolve:any;
    private reject:any;

    constructor(event:any) {
        var self:DropFiles = this,
            files:Array<any> = event.dataTransfer.files,
            items:Array<any> = event.dataTransfer.items,
            either:Array<any> = items || files;

        this.promise = new Promise(function(resolve, reject) {
            if (!either || files.length === 0) {
                self._checkImageDrop(self, event.dataTransfer).then(
                    () => { resolve(self); },
                    () => { reject('no files found'); }
                );
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
            } else {
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
    private _processPending() {
        if (this._pending.length > 0) {
            var item = this._pending.shift(),
                items = item.items,
                length = items.length;

            // Let's ignore this folder
            if (length === 0 || length === undefined) {
                setTimeout(this._processPending.bind(this), 0);
                return;
            }

            // Check if this pending item has any folders
            if (item.folders) {
                var i,
                    entry,
                    obj,
                    count = 0,
                    new_items = [],
                    checkCount = function () {
                        // Counts the entries processed so we can add any files to the queue
                        count += 1;
                        if (count >= length) {
                            if (new_items.length > 0) {
                                // add any files to the start of the queue
                                this._pending.unshift({
                                    items: new_items,
                                    folders: false
                                });
                            }
                            setTimeout(this._processPending.bind(this), 0);
                        }
                    }.bind(this),
                    processEntry = function (entry, path) {
                        // If it is a directory we add it to the pending queue
                        try {
                            if (entry.isDirectory) {
                                entry.createReader().readEntries(function (entries) {
                                    this._pending.push({
                                        items: entries,
                                        folders: true,
                                        path: path + entry.name + '/'
                                    });
                                    checkCount();
                                }.bind(this));
                            } else if (entry.isFile) {
                                // Files are added to a file queue
                                entry.file(function (file) {
                                    file.dir_path = path;

                                    if (file.type || file.size > 0) {
                                        this.totalSize += file.size;
                                        new_items.push(file);
                                    }

                                    checkCount();
                                }.bind(this));
                            } else {
                                checkCount();
                            }
                        } catch (err) {
                            checkCount();
                        }
                    }.bind(this);

                for (i = 0; i < length; i += 1) {
                    // first layer of DnD folders require you to getAsEntry
                    if (item.path.length === 0) {
                        obj = items[i];
                        obj.getAsEntry = obj.getAsEntry || obj.webkitGetAsEntry || obj.mozGetAsEntry || obj.msGetAsEntry;
                        if (obj.getAsEntry) {
                            entry = obj.getAsEntry();
                            processEntry(entry, item.path);
                        } else {
                            // Opera support
                            entry = obj.getAsFile();
                            if (entry.size > 0) {
                                this.totalSize += entry.size;
                                new_items.push(entry);
                            }
                            checkCount();
                        }
                    } else {
                        entry = items[i];
                        processEntry(entry, item.path);
                    }
                }
            } else {
                // Regular files where we can add them all at once
                this.files.push.apply(this.files, items);
                // Delay until next tick (delay and invoke apply are optional)
                setTimeout(this._processPending.bind(this), 0);
            }
        } else {
            this._completeProcessing();
        }
    }

    private _completeProcessing() {
        this.calculating = false;
        this.length = this.files.length;

        if (this.length > 0) {
            this.resolve(this);
        } else {
            this.reject('no files found');
        }
    }

    private _checkImageDrop(self:DropFiles, data) {
        // Move into the closure so we don't have to bind all functions to 'this'
        var files = this.files,
            makeReq = this._makeRequest;

        return new Promise(function (resolve, reject) {
            var urls = [],
                resp = [],
                html;

            html = (data && data.getData && data.getData('text/html'));
            if (!html) { return reject(); }

            html.replace(/<(img src|img [^>]* src) *=\"([^\"]*)\"/gi, function (m, n, src) {
                urls.push(src);
            });

            if (urls.length === 0) { return reject(); }
            self.calculating = true;

            // Make the requests
            urls.forEach((url) => {
                resp.push(makeReq('GET', url));
            });
            Promise.all(resp).then((results) => {
                results.forEach((file) => {
                    files.push(file);
                    self.totalSize += file.size;
                    self.length += 1;
                });

                self.calculating = false;
                resolve();
            },
            (err) => {
                console.log('rejected');
                reject();
            });
        });
    }

    private _makeRequest(method, url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, true);

            // Android 4.3 doesn't support responseType blob
            xhr.responseType = 'arraybuffer';

            xhr.onload = function () {
                if (xhr.response && xhr.status >= 200 && xhr.status < 300) {
                    var type = xhr.getResponseHeader('content-type') || 'image/webp',
                        arrayBuffer = new Uint8Array(xhr.response),
                        blob = new Blob([arrayBuffer], {type: type});

                    // Make it look like a file
                    blob.name = url.substring(url.lastIndexOf('/') + 1);
                    blob.dir_path = "";

                    resolve(blob);
                } else {
                    reject(xhr);
                }
            };
            xhr.onerror = function () {
                reject(xhr);
            };
            xhr.send();
        });
    }
}
