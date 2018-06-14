// HyperMD, copyright (c) by laobubu
// Distributed under an MIT license: http://laobubu.net/HyperMD/LICENSE
//
// POWERPACK for "addon/fold-math"
//
// Use MathJax to render the formulars
//
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        require("mathjax");
        require("../addon/fold-math");
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "mathjax", "../addon/fold-math"], factory);
    }
    else { //[HyperMD] UMD for plain environment!
      factory(function (m){
        if (m === "mathjax") return MathJax;
        if (m === "../addon/fold-math") return HyperMD.FoldMath;
      }, (this.HyperMD_PowerPack = this.HyperMD_PowerPack || {}, this.HyperMD_PowerPack["fold-math-with-mathjax"] = {}));
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    require("mathjax");
    var fold_math_1 = require("../addon/fold-math");
    var MathJaxRenderer = /** @class */ (function () {
        function MathJaxRenderer(div, mode) {
            this.div = div;
            this.mode = mode;
            this.onChanged = null;
            this.jax = null;
            this._cleared = false;
            this._renderingExpr = ""; // Currently rendering expr
            var script = document.createElement("script");
            script.setAttribute("type", mode ? 'math/tex; mode=' + mode : 'math/tex');
            div.appendChild(script);
            this.script = script;
        }
        MathJaxRenderer.prototype.clear = function () {
            var script = this.script;
            script.innerHTML = '';
            if (this.jax)
                this.jax.Remove();
            this._cleared = true;
        };
        MathJaxRenderer.prototype.startRender = function (expr) {
            if (this._cleared) {
                return;
            }
            if (this._renderingExpr) {
                // A new rendering job comes, while previous one is still in progress
                // Do rendering later, in _TypesetDoneCB function
                this._renderingExpr = expr;
                return;
            }
            this._renderingExpr = expr;
            var script = this.script;
            script.innerHTML = expr;
            if (this.jax) {
                MathJax.Hub.Queue(["Text", this.jax, expr], ["_TypesetDoneCB", this, expr]);
            }
            else {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, script], ["_TypesetDoneCB", this, expr]);
            }
        };
        /** Callback for MathJax when typeset is done*/
        MathJaxRenderer.prototype._TypesetDoneCB = function (finished_expr) {
            if (this._cleared) {
                return;
            }
            if (!this.jax)
                this.jax = MathJax.Hub.getJaxFor(this.script);
            if (this._renderingExpr !== finished_expr) {
                // Current finished rendering job is out-of-date
                // re-render with newest Tex expr
                var expr_new = this._renderingExpr;
                this._renderingExpr = "";
                this.startRender(expr_new);
                return;
            }
            // Rendering finished. Nothing wrong
            this._renderingExpr = "";
            if (typeof (this.onChanged) === 'function')
                this.onChanged(finished_expr);
        };
        MathJaxRenderer.prototype.isReady = function () {
            return MathJax.isReady;
        };
        return MathJaxRenderer;
    }());
    exports.MathJaxRenderer = MathJaxRenderer;
    if (typeof MathJax !== "object") {
        // MathJax not exists. Do nothing
        console.error("[HyperMD] PowerPack fold-math-with-mathjax loaded, but MathJax not found.");
    }
    else if (0 == MathJax.Hub.config.jax.length) {
        // IF NOT FOUND, throw a warning
        console.error("[HyperMD] Looks like MathJax is not configured.\nPlease do this BEFORE loading MathJax.\nSee http://docs.mathjax.org/en/latest/configuration.html");
        MathJax.isReady = false;
    }
    else {
        // Use MathJaxRenderer as default MathRenderer
        fold_math_1.defaultOption.renderer = MathJaxRenderer;
    }
});