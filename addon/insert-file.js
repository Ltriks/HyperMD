// HyperMD, copyright (c) by laobubu
// Distributed under an MIT license: http://laobubu.net/HyperMD/LICENSE
//
// DESCRIPTION: Insert images or files into Editor by pasting (Ctrl+V) or Drag'n'Drop
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
      }, (this.HyperMD.InsertFile = this.HyperMD.InsertFile || {}));
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var CodeMirror = require("codemirror");
    var core_1 = require("../core");
    /**
     * send data to url
     *
     * @param method default: "POST"
     */
    function ajaxUpload(url, form, callback, method) {
        var xhr = new XMLHttpRequest();
        var formData = new FormData();
        for (var name in form)
            formData.append(name, form[name]);
        xhr.onreadystatechange = function () {
            if (4 == this.readyState) {
                var ret = xhr.responseText;
                try {
                    ret = JSON.parse(xhr.responseText);
                }
                catch (err) { }
                if (/^20\d/.test(xhr.status + "")) {
                    callback(ret, null);
                }
                else {
                    callback(null, ret);
                }
            }
        };
        xhr.open(method || 'POST', url, true);
        // xhr.setRequestHeader("Content-Type", "multipart/form-data");
        xhr.send(formData);
    }
    exports.ajaxUpload = ajaxUpload;
    //#endregion
    /********************************************************************************** */
    //#region Default FileHandler
    /** a spinning gif image (16x16) */
    var spinGIF = '';
    var errorPNG = '';
    /**
     * Default FileHandler
     *
     * accepts images, uploads to https://sm.ms and inserts as `![](image_url)`
     */
    exports.DefaultFileHandler = function (files, action) {
        var unfinishedCount = 0;
        var placeholderForAll = document.createElement("div");
        placeholderForAll.className = "HyperMD-insertFile-dfh-placeholder";
        action.setPlaceholder(placeholderForAll);
        /** @type {{name:string, url:string, placeholder:HTMLImageElement, blobURL:string}[]} */
        var uploads = [];
        var supportBlobURL = typeof URL !== 'undefined';
        var blobURLs = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (!/image\//.test(file.type))
                continue;
            var blobURL = supportBlobURL ? URL.createObjectURL(file) : spinGIF;
            var name_1 = file.name.match(/[^\\\/]+\.\w+$/)[0];
            var url = null;
            var placeholder = document.createElement("img");
            placeholder.onload = action.resize; // img size changed
            placeholder.className = "HyperMD-insertFile-dfh-uploading";
            placeholder.src = blobURL;
            placeholderForAll.appendChild(placeholder);
            uploads.push({
                blobURL: blobURL, name: name_1, url: url, placeholder: placeholder,
            });
            unfinishedCount++;
            // now start upload image. once uploaded, `finishImage(index, url)` shall be called
            Upload_SmMs(file, uploads.length - 1);
        }
        return unfinishedCount > 0;
        function finishImage(index, url) {
            uploads[index].url = url;
            var placeholder = uploads[index].placeholder;
            placeholder.className = "HyperMD-insertFile-dfh-uploaded";
            placeholder.src = url || errorPNG;
            if (supportBlobURL)
                URL.revokeObjectURL(uploads[index].blobURL);
            if (--unfinishedCount === 0) {
                var texts = uploads.map(function (it) { return "![" + it.name + "](" + it.url + ")"; });
                action.finish(texts.join(" ") + " ");
            }
        }
        function Upload_SmMs(file, index) {
            ajaxUpload('https://sm.ms/api/upload', {
                smfile: file,
                format: 'json'
            }, function (o, e) {
                var imgURL = (o && o.code == 'success') ? o.data.url : null;
                finishImage(index, imgURL);
            });
        }
    };
    exports.defaultOption = {
        byDrop: false,
        byPaste: false,
        fileHandler: exports.DefaultFileHandler,
    };
    exports.suggestedOption = {
        byPaste: true,
        byDrop: true,
    };
    core_1.suggestedEditorConfig.hmdInsertFile = exports.suggestedOption;
    CodeMirror.defineOption("hmdInsertFile", exports.defaultOption, function (cm, newVal) {
        ///// convert newVal's type to `Partial<Options>`, if it is not.
        if (!newVal || typeof newVal === "boolean") {
            var enabled = !!newVal;
            newVal = { byDrop: enabled, byPaste: enabled };
        }
        else if (typeof newVal === 'function') {
            newVal = { byDrop: true, byPaste: true, fileHandler: newVal };
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
    var InsertFile = /** @class */ (function () {
        function InsertFile(cm) {
            // options will be initialized to defaultOption when constructor is finished
            var _this = this;
            this.cm = cm;
            this.pasteHandle = function (cm, ev) {
                if (!_this.doInsert(ev.clipboardData || window['clipboardData']))
                    return;
                ev.preventDefault();
            };
            this.dropHandle = function (cm, ev) {
                var self = _this, cm = _this.cm, result = false;
                cm.operation(function () {
                    var pos = cm.coordsChar({ left: ev.clientX, top: ev.clientY }, "window");
                    cm.setCursor(pos);
                    result = self.doInsert(ev.dataTransfer);
                });
                if (!result)
                    return;
                ev.preventDefault();
            };
            new core_1.FlipFlop(
            /* ON  */ function () { return _this.cm.on("paste", _this.pasteHandle); }, 
            /* OFF */ function () { return _this.cm.off("paste", _this.pasteHandle); }).bind(this, "byPaste", true);
            new core_1.FlipFlop(
            /* ON  */ function () { return _this.cm.on("drop", _this.dropHandle); }, 
            /* OFF */ function () { return _this.cm.off("drop", _this.dropHandle); }).bind(this, "byDrop", true);
        }
        /**
         * upload files to the current cursor.
         *
         * @param {DataTransfer} data
         * @returns {boolean} data is accepted or not
         */
        InsertFile.prototype.doInsert = function (data) {
            var cm = this.cm;
            if (!data || !data.files || 0 === data.files.length)
                return false;
            var files = data.files;
            var fileHandler = this.fileHandler || exports.DefaultFileHandler;
            var handled = false;
            cm.operation(function () {
                // create a placeholder
                cm.replaceSelection(".");
                var posTo = cm.getCursor();
                var posFrom = { line: posTo.line, ch: posTo.ch - 1 };
                var placeholderContainer = document.createElement("span");
                var marker = cm.markText(posFrom, posTo, {
                    replacedWith: placeholderContainer,
                    clearOnEnter: false,
                    handleMouseEvents: false,
                });
                var action = {
                    marker: marker, cm: cm,
                    finish: function (text, cursor) { return cm.operation(function () {
                        var range = marker.find();
                        var posFrom = range.from, posTo = range.to;
                        cm.replaceRange(text, posFrom, posTo);
                        marker.clear();
                        if (typeof cursor === 'number')
                            cm.setCursor({
                                line: posFrom.line,
                                ch: posFrom.ch + cursor,
                            });
                    }); },
                    setPlaceholder: function (el) {
                        if (placeholderContainer.childNodes.length > 0)
                            placeholderContainer.removeChild(placeholderContainer.firstChild);
                        placeholderContainer.appendChild(el);
                        marker.changed();
                    },
                    resize: function () {
                        marker.changed();
                    }
                };
                handled = fileHandler(files, action);
                if (!handled)
                    marker.clear();
            });
            return handled;
        };
        return InsertFile;
    }());
    exports.InsertFile = InsertFile;
    //#endregion
    /** ADDON GETTER (Singleton Pattern): a editor can have only one InsertFile instance */
    exports.getAddon = core_1.Addon.Getter("InsertFile", InsertFile, exports.defaultOption /** if has options */);
});
