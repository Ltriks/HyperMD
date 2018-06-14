// HyperMD, copyright (c) by laobubu
// Distributed under an MIT license: http://laobubu.net/HyperMD/LICENSE
//
// DESCRIPTION: Convert content to Markdown before pasting
//
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        require("codemirror");
        require("../core");
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "codemirror", "../core"], factory);
    }
    else { //[HyperMD] UMD for plain environment!
      factory(function (m){
        if (m === "codemirror") return CodeMirror;
        if (m === "../core") return HyperMD;
      }, (this.HyperMD.Paste = this.HyperMD.Paste || {}));
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CodeMirror = require("codemirror");
    var core_1 = require("../core");
    exports.defaultOption = {
        enabled: false,
        convertor: null,
    };
    exports.suggestedOption = {
        enabled: true,
    };
    core_1.suggestedEditorConfig.hmdPaste = exports.suggestedOption;
    CodeMirror.defineOption("hmdPaste", exports.defaultOption, function (cm, newVal) {
        ///// convert newVal's type to `Partial<Options>`, if it is not.
        if (!newVal || typeof newVal === "boolean") {
            newVal = { enabled: !!newVal };
        }
        else if (typeof newVal === "function") {
            newVal = { enabled: true, convertor: newVal };
        }
        ///// apply config and write new values into cm
        var inst = exports.getAddon(cm);
        for (var k in exports.defaultOption) {
            inst[k] = (k in newVal) ? newVal[k] : exports.defaultOption[k];
        }
    });
    //#endregion
    /********************************************************************************** */
    //#region Addon Class
    var Paste = /** @class */ (function () {
        function Paste(cm) {
            var _this = this;
            this.cm = cm;
            this.pasteHandler = function (cm, ev) {
                var cd = ev.clipboardData || window['clipboardData'];
                var convertor = _this.convertor;
                if (!convertor || !cd || cd.types.indexOf('text/html') == -1)
                    return;
                var result = convertor(cd.getData('text/html'));
                if (!result)
                    return;
                cm.operation(cm.replaceSelection.bind(cm, result));
                ev.preventDefault();
            };
            new core_1.FlipFlop(
            /* ON  */ function () { cm.on('paste', _this.pasteHandler); }, 
            /* OFF */ function () { cm.off('paste', _this.pasteHandler); }).bind(this, "enabled", true);
        }
        return Paste;
    }());
    exports.Paste = Paste;
    //#endregion
    /** ADDON GETTER (Singleton Pattern): a editor can have only one Paste instance */
    exports.getAddon = core_1.Addon.Getter("Paste", Paste, exports.defaultOption /** if has options */);
});
