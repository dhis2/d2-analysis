require('./ckeditor/plugins/confighelper/plugin');

export var CKEditor;

CKEditor = function(refs) {
    var { appManager } = refs;

    Ext.define('Ext.ux.CKEditor', {
        extend: 'Ext.form.field.TextArea',

        alias: 'widget.ckeditor',

        constructor: function() {
            this.self.superclass.constructor.apply(this, arguments);
            this.addEvents("instanceReady");
        },

        initComponent: function() {
            this.self.superclass.initComponent.apply(this, arguments);

            this.on("afterrender", function() {
                // By default, CKEditor inserts <img> emoticons with the full URL. Let's keep only
                // the relative path so it will still work whenever the database is moved to another domain.
                const defaultItems = ['Bold', 'Italic', 'Link', 'Smiley'];

                const defaultOptions = {
                    toolbar: [
                        {name: 'actions', items: this.items || defaultItems},
                    ],
                    language: appManager.getUiLocale(),
                    smiley_path: window.CKEDITOR_BASEPATH ? CKEDITOR_BASEPATH + "plugins/smiley/images/" : undefined,
                    smiley_images: [
                        'regular_smile.png',
                        'sad_smile.png',
                        'wink_smile.png',
                        'thumbs_down.png',
                        'thumbs_up.png'
                    ],
                    plugins: 'confighelper,dialogui,dialog,basicstyles,button,toolbar,clipboard,enterkey,floatingspace,wysiwygarea,link,undo,smiley',
                    resize_enabled: false,
                };

                const defaultCss = `
                    body { margin: 0; margin-left: 5px; font-family: Helvetica !important; font-size: 11px !important; }
                    p { margin: 0px; line-height: auto; }
                    img { width: 1.3em; height: 1.3em; }
                `;

                CKEDITOR.addCss(defaultCss);

                const options = Object.assign({}, defaultOptions, this.CKEditorConfig);
                this.editor = CKEDITOR.replace(this.inputEl.id, options);
                this.editor.name = this.name;

                this.editor.on('change', function(ev) {
                    this.fireEvent("change", this, ev);
                    this.fireEvent("keyUp", this, ev);
                }, this);

                this.editor.on("instanceReady", function() {
                    this.fireEvent("instanceReady", this, this.editor);
                }, this);

                this.editor.on("dialogShow", this._onDialogShow, this);

                this.editor.on("dialogHide", function(ev) {
                    $(".cke_button").removeClass("active");
                    $(document).off('.ckeditor');
                }, this);
            }, this);
        },

        onRemoved() {
            if (this.editor)
                this.editor.destroy();
        },

        focus() {
            if (this.editor)
                this.editor.focus();
        },

        _onDialogShow: function(ev) {
            const {data: dialog, editor} = ev;
            const {name, element} = dialog._;

            $(".cke_button__" + name).addClass("active");

            if (name === "smiley") {
                element.addClass("cke_smiley");
            }

            $(document).on('click.ckeditor', clickEv => {
                const clickInsideDialog = $(clickEv.target).parents(".cke_dialog").get(0);
                if (!clickInsideDialog) {
                    dialog.hide();
                }
            });

            this._setDialogPosition(editor, dialog);
        },

        _setDialogPosition(editor, dialog) {
            const buttonObj = editor.toolbar[0].items.find(item => item.name == "smiley");
            if (dialog._.name != "smiley" || !buttonObj)
                return;
            const button = $("#" + buttonObj._.id);
            const {top: buttonTop, left: buttonLeft, width: buttonWidth, height: buttonHeight} =
                button.get(0).getBoundingClientRect();
            const {width: dialogWidth, height: dialogHeight} = dialog.getSize();
            const newDialogPosition = {
                top: buttonTop < $(window).height() / 2 ? buttonTop + buttonHeight : buttonTop - dialogHeight,
                left: buttonLeft < $(window).width() / 2 ? buttonLeft : buttonLeft + buttonWidth - dialogWidth,
            };

            dialog.move(newDialogPosition.left, newDialogPosition.top);
        },

        onRender: function(ct, position) {
            if (!this.el) {
                this.defaultAutoCreate = {
                    tag: 'textarea',
                    autocomplete: 'off'
                };
            }
            this.self.superclass.onRender.apply(this, arguments)
        },
        
        setValue: function(value) {
            this.self.superclass.setValue.apply(this, arguments);
            if (this.editor) {
                this.editor.setData(value);
            }
        },

        getValue: function() {
            return this.editor ? this.editor.getData() : "";
        },

        setCursorAtEnd: function() {
            setTimeout(() => {
                this.editor.focus();
                var range = this.editor.createRange();
                range.moveToElementEditEnd(range.root);
                this.editor.getSelection().selectRanges([range]);
            }, 100);
        },
    });
};
