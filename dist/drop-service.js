// Require what we need from rxjs
var Rx_1 = require('rxjs/Rx');
var DropService = (function () {
    function DropService() {
        // All the elements we are interested in highlighting when the mouse is over them
        this._dropTargets = [];
        // These track the relationship between elements, callbacks and file streams
        this._streams = {};
        this._streamMapping = {};
        this._callbacks = {};
        if (!DropService.isCreating) {
            throw new Error('You can\'t call new in Singleton instances!');
        }
        // Define the event streams
        this._drop = Rx_1.Observable.fromEvent(window, 'drop')
            .map(this._preventDefault)
            .filter(this._checkTarget.bind(this));
        this._dragover = Rx_1.Observable.fromEvent(window, 'dragover')
            .map(this._preventDefault)
            .throttleTime(300 /* ms */) // Helps with performance a lot
            .filter(this._checkTarget.bind(this));
        this._dragleave = Rx_1.Observable.fromEvent(window, 'dragleave')
            .map(this._preventDefault)
            .filter(function (event) {
            var dropTargets = this._dropTargets, target = event.target, i;
            for (i = 0; i < dropTargets.length; i += 1) {
                if (dropTargets[i] === target) {
                    return true;
                }
            }
            return false;
        }.bind(this));
        // Start watching for the events
        this._dragover.subscribe(this._updateClasses.bind(this));
        this._dragleave.subscribe(this._removeClass.bind(this));
        this._drop.subscribe(function (obj) {
            this._removeClass(obj);
            // TODO:: Extract files and pass them to the correct stream
        }.bind(this));
        // Detect when the mouse leaves the window (special case)
        document.addEventListener('mouseout', function (event) {
            if (this._currentTarget && !event.toElement) {
                this._performCallback(this._currentTarget, false);
                this._currentTarget = null;
            }
        }.bind(this), false);
    }
    // This is a singleton class
    DropService.getInstance = function () {
        if (!DropService.instance) {
            DropService.isCreating = true;
            DropService.instance = new DropService();
            DropService.isCreating = false;
        }
        return DropService.instance;
    };
    // Configures an element to become a drop target
    DropService.prototype.register = function (name, element, callback) {
        var self = this;
        // Register the drop-target
        this._ensureStream(name);
        this._streamMapping[name].push(element);
        this._callbacks[name].push(callback);
        this._dropTargets.push(element);
        // Return the unregister/cleanup callback
        return function () {
            var index = this._dropTargets.indexOf(element);
            if (index !== -1) {
                this._dropTargets.splice(index, 1);
                // If it is in the drop targets then it will be here
                index = self._streamMapping[name].indexOf(element);
                self._streamMapping[name].splice(index, 1);
                self._callbacks[name].splice(index, 1);
            }
        };
    };
    // Hooks up a function to recieve a the files from a particular stream
    DropService.prototype.subscribe = function (name, func) {
        this._ensureStream(name);
        return this._streams[name].subscribe(func);
    };
    // Initialises a new file stream if it did not exist
    DropService.prototype._ensureStream = function (name) {
        if (!this._streams[name]) {
            this._streams[name] = new Rx_1.Observable().share();
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
    DropService.prototype._performCallback = function (target, state) {
        var callbacks = this._callbacks[this._findStream(target)];
        callbacks.forEach(function (cb) {
            cb(state);
        });
    };
    // Based on the current target, determines if a class change needs to occur
    DropService.prototype._updateClasses = function (obj) {
        var target = obj.target, currentTarget = this._currentTarget;
        if (currentTarget && currentTarget !== target) {
            this._performCallback(currentTarget, false);
        }
        if (target && currentTarget !== target) {
            this._currentTarget = target;
            this._performCallback(target, true);
            return true;
        }
        this._currentTarget = target;
        return false;
    };
    DropService.prototype._removeClass = function (obj) {
        this._currentTarget = null;
        this._performCallback(obj.target, false);
    };
    DropService.isCreating = false;
    return DropService;
})();
exports.DropService = DropService;
//# sourceMappingURL=drop-service.js.map