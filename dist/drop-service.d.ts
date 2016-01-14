export declare class DropService {
    static instance: DropService;
    static isCreating: Boolean;
    private _dropTargets;
    private _currentTarget;
    private _streams;
    private _streamMapping;
    private _callbacks;
    private _drop;
    private _dragover;
    private _dragleave;
    static getInstance(): DropService;
    constructor();
    register(name: string, element: HTMLScriptElement, callback: (state: boolean) => void): () => void;
    subscribe(name: string, func: (obj: any) => any): any;
    private _ensureStream(name);
    private _preventDefault(event);
    private _checkTarget(obj);
    private _findStream(element);
    private _performCallback(target, state);
    private _updateClasses(obj);
    private _removeClass(obj);
}
