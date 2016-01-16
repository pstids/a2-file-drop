export declare class DropFiles {
    length: number;
    totalSize: number;
    files: Array<any>;
    calculating: boolean;
    private _pending;
    private _callback;
    constructor(event: any);
    onReady(callback: (files: DropFiles) => void): void;
    private processPending();
    private completeProcessing();
}
