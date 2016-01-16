import {Inject, ElementRef} from 'angular2/core';
import {Directive, OnInit, OnDestroy} from 'angular2/core';
import {DropService} from './drop-service';


@Directive({
    selector: '[drop-target]',
    inputs: [
        'bind: drop-target',        // defaults to self, otherwise you can define a valid querySelector
        'highlight: drop-indicate', // defines the hover class to apply, defaults to: drop-indicate
        'stream: drop-stream'       // name of the stream the files should be sent to
    ]
})
export class DropTarget implements OnInit, OnDestroy {
    stream: string;
    highlight: string = 'drop-indicate';
    bind: string;

    private _element: any;
    private _unreg: () => void;


    constructor(@Inject(ElementRef) elementRef: ElementRef) {
        this._element = elementRef.nativeElement;
    }


    // Register the element you want to recieve drop events
    ngOnInit() {
        if (this.bind) {
            this._element = document.querySelector(this.bind);
        }

        this._unreg = DropService.getInstance().register(this.stream, this._element, this._doHighlight.bind(this));
    }

    // Ensure all the bindings and classes are removed
    ngOnDestroy() {
        this._unreg();

        // In case the drop-target is another element (not the ElementRef)
        this._doHighlight(false);
    }


    // Applies the hover class to the element
    private _doHighlight(state: boolean) {
        if (state) {
            this._element.classList.add(this.highlight);
        } else {
            this._element.classList.remove(this.highlight);
        }
    }
}
