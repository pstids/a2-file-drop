var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var core_1 = require('angular2/core');
var core_2 = require('angular2/core');
var drop_service_1 = require('./drop-service');
var DropTarget = (function () {
    function DropTarget(elementRef) {
        this.highlight = 'drop-indicate';
        this._element = elementRef.nativeElement;
    }
    // Register the element you want to recieve drop events
    DropTarget.prototype.ngOnInit = function () {
        if (this.bind) {
            this._element = document.querySelector(this.bind);
        }
        this._unreg = drop_service_1.DropService.getInstance().register(this.stream, this._element, this._doHighlight.bind(this));
    };
    // Ensure all the bindings and classes are removed
    DropTarget.prototype.ngOnDestroy = function () {
        this._unreg();
        // In case the drop-target is another element (not the ElementRef)
        this._doHighlight(false);
    };
    // Applies the hover class to the element
    DropTarget.prototype._doHighlight = function (state) {
        if (state) {
            this._element.classList.add(this.highlight);
        }
        else {
            this._element.classList.remove(this.highlight);
        }
    };
    DropTarget = __decorate([
        core_2.Directive({
            selector: '[drop-target]',
            inputs: [
                'bind: drop-target',
                'highlight: drop-indicate',
                'stream: drop-stream' // name of the stream the files should be sent to
            ]
        }),
        __param(0, core_1.Inject(core_1.ElementRef)), 
        __metadata('design:paramtypes', [core_1.ElementRef])
    ], DropTarget);
    return DropTarget;
})();
exports.DropTarget = DropTarget;
//# sourceMappingURL=drop-target.js.map