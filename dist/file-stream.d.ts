import { ElementRef } from '@angular/core';
import { OnInit } from '@angular/core';
import { DropService } from './drop-service';
export declare class FileStream implements OnInit {
    private _dropService;
    fileStream: string;
    private _element;
    constructor(elementRef: ElementRef, _dropService: DropService);
    ngOnInit(): void;
}
