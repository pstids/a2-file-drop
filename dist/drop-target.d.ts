import { ElementRef } from 'angular2/core';
import { OnInit, OnDestroy } from 'angular2/core';
export declare class DropTarget implements OnInit, OnDestroy {
    stream: string;
    highlight: string;
    bind: string;
    private _element;
    private _unreg;
    constructor(elementRef: ElementRef);
    ngOnInit(): void;
    ngOnDestroy(): void;
    private _doHighlight(state);
}
