// Require what we need from rxjs
import {Observable} from 'rxjs/Rx';

export class DropService {
    static instance:DropService;
    static isCreating:Boolean = false;

    // All the elements we are interested in highlighting when the mouse is over them
    private _dropTargets:  HTMLScriptElement[] = [];
    private _currentTarget:HTMLScriptElement;

    // These track the relationship between elements, callbacks and file streams
    private _streams       = {};
    private _streamMapping = {};
    private _callbacks     = {};

    // This are our event observables
    private _drop:     any;
    private _dragover: any;
    private _dragleave:any;


    // This is a singleton class
    static getInstance() {
        if (!DropService.instance) {
            DropService.isCreating = true;
            DropService.instance = new DropService();
            DropService.isCreating = false;
        }

        return DropService.instance;
    }


    constructor() {
        if (!DropService.isCreating) {
            throw new Error('You can\'t call new in Singleton instances!');
        }

        // Define the event streams
        this._drop = Observable.fromEvent(window, 'drop')
            .map(this._preventDefault)
            .filter(this._checkTarget.bind(this));

        this._dragover  = Observable.fromEvent(window, 'dragover')
            .map(this._preventDefault)
            .throttleTime(300 /* ms */) // Helps with performance a lot
            .filter(this._checkTarget.bind(this));

        this._dragleave = Observable.fromEvent(window, 'dragleave')
            .map(this._preventDefault)
            .filter(function (event) {
                var dropTargets = this._dropTargets,
                    target = event.target,
                    i:number;

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


    // Configures an element to become a drop target
    register(name: string, element: HTMLScriptElement, callback: (state: boolean) => void) {
        var self = this;

        // Register the drop-target
        this._ensureStream(name);
        this._streamMapping[name].push(element);
        this._callbacks[name].push(callback);
        this._dropTargets.push(element);

        // Return the unregister/cleanup callback
        return function () {
            var index:number = this._dropTargets.indexOf(element);
            if (index !== -1) {
                this._dropTargets.splice(index, 1);

                // If it is in the drop targets then it will be here
                index = self._streamMapping[name].indexOf(element);
                self._streamMapping[name].splice(index, 1);
                self._callbacks[name].splice(index, 1);
            }
        };
    }

    // Hooks up a function to recieve a the files from a particular stream
    subscribe(name: string, func: (obj: any) => any) {
        this._ensureStream(name);
        return this._streams[name].subscribe(func);
    }


    // Initialises a new file stream if it did not exist
    private _ensureStream(name: string) {
        if (!this._streams[name]) {
            this._streams[name] = new Observable().share();
            this._streamMapping[name] = [];
            this._callbacks[name] = [];
        }
    }

    // The new stream object allows us to change the target (read only in the originalEvent)
    private _preventDefault(event: Event) {
        event.preventDefault();
        event.stopPropagation();
        return {
            originalEvent: event,
            target: event.target
        };
    }

    // Checks if we need to perform a class addition or removal
    private _checkTarget(obj) {
        var dropTargets = this._dropTargets,
            target = obj.target;

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
    }

    // Returns the stream name for an element
    private _findStream(element: HTMLScriptElement) {
        var mapping = this._streamMapping,
            prop;

        for (prop in mapping) {
            if (mapping.hasOwnProperty(prop) && mapping[prop].indexOf(element) !== -1) {
                return prop;
            }
        }

        return null;
    }

    // Informs the element of its highlight state
    private _performCallback(target: HTMLScriptElement, state: boolean) {
        var callbacks = this._callbacks[this._findStream(target)];
        callbacks.forEach(function (cb) {
            cb(state);
        });
    }

    // Based on the current target, determines if a class change needs to occur
    private _updateClasses(obj) {
        var target = obj.target,
            currentTarget = this._currentTarget;

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
    }

    private _removeClass(obj) {
        this._currentTarget = null;
        this._performCallback(obj.target, false);
    }
}
