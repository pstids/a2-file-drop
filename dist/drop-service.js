// Require what we need from rxjs
var Rx_1 = require('rxjs/Rx');
var drop_files_1 = require('./drop-files');
var DropService = (function () {
    function DropService() {
        // All the elements we are interested in highlighting when the mouse is over them
        this._dropTargets = [];
        // These track the relationship between elements, callbacks and file streams
        this._streams = {}; // stream name => shared observable
        this._observers = {}; // stream name => observer
        this._streamMapping = {}; // stream name => element array
        this._callbacks = {}; // stream name => callback array
        var self = this, overFired = false;
        // Define the event streams
        self._drop = Rx_1.Observable.fromEvent(window, 'drop')
            .map(self._preventDefault)
            .filter(self._checkTarget.bind(self));
        self._dragover = Rx_1.Observable.fromEvent(window, 'dragover')
            .map(self._preventDefault)
            .filter(self._checkTarget.bind(self));
        self._dragleave = Rx_1.Observable.fromEvent(window, 'dragleave')
            .map(self._preventDefault)
            .filter(function (event) {
            var dropTargets = self._dropTargets, target = event.target, i;
            for (i = 0; i < dropTargets.length; i += 1) {
                if (dropTargets[i] === target) {
                    return true;
                }
            }
            return false;
        });
        // Start watching for the events
        self._dragover.subscribe(function (obj) {
            overFired = true;
            self._updateClasses(obj);
        });
        self._dragleave.subscribe(function (obj) {
            overFired = false;
            setTimeout(function () {
                if (!overFired) {
                    self._removeClass(obj);
                }
            }, 0);
        });
        self._drop.subscribe(function (obj) {
            var observer = self._removeClass(obj);
            // Stream the files
            if (observer) {
                observer.next({
                    event: 'drop',
                    data: new drop_files_1.DropFiles(obj.originalEvent)
                });
            }
        });
        // Detect when the mouse leaves the window (special case)
        document.addEventListener('mouseout', function (event) {
            if (self._currentTarget && !event.toElement) {
                self._performCallback(self._currentTarget, false);
                self._currentTarget = null;
            }
        }, false);
    }
    // Configures an element to become a drop target
    DropService.prototype.register = function (name, element, callback) {
        var self = this;
        // Register the drop-target
        self._ensureStream(name);
        self._streamMapping[name].push(element);
        self._callbacks[name].push(callback);
        self._dropTargets.push(element);
        // Return the unregister/cleanup callback
        return function () {
            var index = self._dropTargets.indexOf(element);
            if (index !== -1) {
                self._dropTargets.splice(index, 1);
                // If it is in the drop targets then it will be here
                index = self._streamMapping[name].indexOf(element);
                self._streamMapping[name].splice(index, 1);
                self._callbacks[name].splice(index, 1);
            }
        };
    };
    // Hooks up a function to recieve a the files from a particular stream
    // 3 events: 'over', 'left', 'drop'
    DropService.prototype.getStream = function (name) {
        this._ensureStream(name);
        return this._streams[name];
    };
    // Initialises a new file stream if it did not exist
    DropService.prototype._ensureStream = function (name) {
        if (!this._streams[name]) {
            this._streams[name] = new Rx_1.Observable(function (observer) {
                this._observers[name] = observer;
                return function () {
                    this._observers[name] = null;
                };
            }.bind(this)).share();
            this._observers[name] = null;
            this._streamMapping[name] = [];
            this._callbacks[name] = [];
        }
    };
    // The new stream object allows us to change the target (read only in the originalEvent)
    DropService.prototype._preventDefault = function (event) {
        event.preventDefault();
        event.stopPropagation();
        return {
            originalEvent: event,
            target: event.target
        };
    };
    // Checks if we need to perform a class addition or removal
    DropService.prototype._checkTarget = function (obj) {
        var dropTargets = this._dropTargets, target = obj.target;
        while (target) {
            if (dropTargets.indexOf(target) !== -1) {
                break;
            }
            target = target.parentNode;
        }
        obj.target = target;
        if (target || this._currentTarget)
            return true;
        return false;
    };
    // Returns the stream name for an element
    DropService.prototype._findStream = function (element) {
        var mapping = this._streamMapping, prop;
        for (prop in mapping) {
            if (mapping.hasOwnProperty(prop) && mapping[prop].indexOf(element) !== -1) {
                return prop;
            }
        }
        return null;
    };
    // Informs the element of its highlight state
    DropService.prototype._performCallback = function (target, state, stream) {
        if (stream === void 0) { stream = null; }
        stream = stream || this._findStream(target);
        this._callbacks[stream].forEach(function (cb) {
            cb(state);
        });
        // We return stream so we don't ever have to look it up twice
        return stream;
    };
    // Based on the current target, determines if a class change needs to occur
    DropService.prototype._updateClasses = function (obj) {
        var target = obj.target, currentTarget = this._currentTarget, stream;
        // Have we moved off a target
        if (currentTarget && currentTarget !== target) {
            stream = this._performCallback(currentTarget, false);
            this._notifyObservers(stream, { event: 'left' });
        }
        // Have we moved over a new target
        if (target && currentTarget !== target) {
            stream = this._performCallback(target, true, stream);
            // If this is a new hover - let our subscribers know
            if (!currentTarget) {
                this._notifyObservers(stream, {
                    event: 'over'
                });
            }
        }
        this._currentTarget = target;
    };
    DropService.prototype._removeClass = function (obj) {
        var stream = this._performCallback(obj.target, false);
        this._currentTarget = null;
        return this._notifyObservers(stream, { event: 'left' });
    };
    DropService.prototype._notifyObservers = function (stream, object) {
        var observer = this._observers[stream];
        if (observer) {
            observer.next(object);
        }
        return observer;
    };
    return DropService;
})();
exports.DropService = DropService;
//# sourceMappingURL=drop-service.js.map