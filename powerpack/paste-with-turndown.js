// HyperMD, copyright (c) by laobubu
// Distributed under an MIT license: http://laobubu.net/HyperMD/LICENSE
//
// POWERPACK for "addon/paste"
//
// Turndown is an excellent HTML-to-Markdown library
// Give it a try!
//
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        require("turndown");
        require("../addon/paste");
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "turndown", "../addon/paste"], factory);
    }
    else { //[HyperMD] UMD for plain environment!
      factory(function (m){
        if (m === "turndown") return TurndownService;
        if (m === "../addon/paste") return HyperMD.Paste;
      }, (this.HyperMD_PowerPack = this.HyperMD_PowerPack || {}, this.HyperMD_PowerPack["paste-with-turndown"] = {}));
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /// <reference path="./typings/turndown.d.ts" />
    var TurndownService = require("turndown");
    var paste_1 = require("../addon/paste");
    exports.TurndownConvertor = function (html) {
        // strip <a> without href
        html = html.replace(/<a([^>]*)>(.*?)<\/a>/ig, function (s, attrs, content) {
            if (!/href=/i.test(attrs))
                return content;
            return s;
        });
        // maybe you don't need to convert, if there is no img/link/header...
        if (!/\<(?:hr|img|h\d|strong|em|strikethrough|table|a|b|i|del)(?:\s.*?|\/)?\>/i.test(html))
            return null;
        var turndownService = exports.getTurndownService();
        if (turndownService)
            return turndownService.turndown(html);
        return null;
    };
    exports.getTurndownService = (function () {
        var service = null;
        return function () {
            if (!service && typeof TurndownService === 'function') {
                var opts = {
                    "headingStyle": "atx",
                    "hr": "---",
                    "bulletListMarker": "*",
                    "codeBlockStyle": "fenced",
                    "fence": "```",
                    "emDelimiter": "*",
                    "strongDelimiter": "**",
                    "linkStyle": "inlined",
                    "linkReferenceStyle": "collapsed"
                };
                service = new TurndownService(opts);
                if (typeof turndownPluginGfm !== 'undefined') {
                    service.use(turndownPluginGfm.gfm);
                }
            }
            return service;
        };
    })();
    if (typeof TurndownService != "undefined") {
        // Use this convertor as default convertor
        paste_1.defaultOption.convertor = exports.TurndownConvertor;
    }
    else {
        console.error("[HyperMD] PowerPack paste-with-turndown loaded, but turndown not found.");
    }
});
