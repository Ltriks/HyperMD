// HyperMD, copyright (c) by laobubu
// Distributed under an MIT license: http://laobubu.net/HyperMD/LICENSE
//
// POWERPACK for "addon/hover"
//
// Render tooltip Markdown to HTML, with marked
//
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        require("../addon/hover");
        require("marked");
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../addon/hover", "marked"], factory);
    }
    else { //[HyperMD] UMD for plain environment!
      factory(function (m){
        if (m === "../addon/hover") return HyperMD.Hover;
        if (m === "marked") return marked;
      }, (this.HyperMD_PowerPack = this.HyperMD_PowerPack || {}, this.HyperMD_PowerPack["hover-with-marked"] = {}));
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <reference path="./typings/_misc.d.ts" />
    var hover_1 = require("../addon/hover");
    var marked = require("marked");
    if (typeof marked == "function") {
        // Use marked to render Hover tooltip content
        hover_1.defaultOption.convertor = function (footnote, text) {
            if (!text)
                return null;
            return marked(text);
        };
    }
    else {
        console.error("[HyperMD] PowerPack hover-with-marked loaded, but marked not found.");
    }
});
