// Require what we need from rxjs
import {Observable} from 'rxjs/Rx';
import {DropFiles} from './drop-files';

export class DropService {
    static instance:DropService;
    static isCreating:Boolean = false;

    // All the elements we are interested in highlighting when the mouse is over them
    private _dropTargets:  HTMLScriptElement[] = [];
    private _currentTarget:HTMLScriptElement;

    // These track the relationship between elements, callbacks and file streams
    private _streams       = {}; // stream name => shared observable
    private _observers     = {}; // stream name => observer
    private _streamMapping = {}; // stream name => element array
    private _callbacks     = {}; // stream name => callback array

    // This are our event observables
    private _drop:     any;
    private _dragenter:any;
    private _dragover: any;
    private _dragleave:any;


    // This is a singleton class
    static getInstance(): DropService {
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

        this._dragenter  = Observable.fromEvent(window, 'dragenter')
            .map(this._preventDefault)
            .filter(this._checkTarget.bind(this));

        this._dragover  = Observable.fromEvent(window, 'dragover');

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
        this._dragover.subscribe((event: Event) => {
            event.preventDefault();
            event.stopPropagation();
        });
        this._dragenter.subscribe(this._updateClasses.bind(this));
        this._dragleave.subscribe(this._removeClass.bind(this));
        this._drop.subscribe(function (obj) {
            var observer = this._removeClass(obj);

            // Stream the files
            if (observer) {
                observer.next({
                    event:'drop',
                    data: new DropFiles(obj.originalEvent)
                });
            }
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
    // 3 events: 'over', 'left', 'drop'
    getStream(name: string) {
        this._ensureStream(name);
        return this._streams[name];
    }


    // Initialises a new file stream if it did not exist
    private _ensureStream(name: string) {
        if (!this._streams[name]) {
            this._streams[name] = new Observable<{event:string, data?:DropFiles}>(function (observer) {
                this._observers[name] = observer;

                return function () {
                    this._observers[name] = null;
                };
            }.bind(this)).share();
            this._observers[name] = null;
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
    private _performCallback(target: HTMLScriptElement, state: boolean, stream: string = null) {
        stream = stream || this._findStream(target);

        this._callbacks[stream].forEach(function (cb) {
            cb(state);
        });

        // We return stream so we don't ever have to look it up twice
        return stream;
    }

    // Based on the current target, determines if a class change needs to occur
    private _updateClasses(obj) {
        var target = obj.target,
            currentTarget = this._currentTarget,
            stream:string;

        // Have we moved off a target
        if (currentTarget && currentTarget !== target) {
            stream = this._performCallback(currentTarget, false);
            this._notifyObservers(stream, {event: 'left'});
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
    }

    private _removeClass(obj) {
        var stream:string = this._performCallback(obj.target, false);

        this._currentTarget = null;

        return this._notifyObservers(stream, {event: 'left'});
    }

    private _notifyObservers(stream:string, object: {event:string, data?:DropFiles}) {
        var observer = this._observers[stream];
        if (observer) {
            observer.next(object);
        }
        return observer;
    }
}
