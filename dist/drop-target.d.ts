import { ElementRef } from 'angular2/core';
import { OnInit, OnDestroy } from 'angular2/core';
import { DropService } from './drop-service';
export declare class DropTarget implements OnInit, OnDestroy {
    private _dropService;
    stream: string;
    highlight: string;
    bind: string;
    private _element;
    private _unreg;
    constructor(elementRef: ElementRef, _dropService: DropService);
    ngOnInit(): void;
    ngOnDestroy(): void;
    private _doHighlight(state);
}
