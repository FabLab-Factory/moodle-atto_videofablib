YUI.add('moodle-atto_videofablib-button', function (Y, NAME) {

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/*
 * @package    atto_videofablib
 * @copyright  2013 Damyon Wiese  <damyon@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * @module moodle-atto_videofablib_alignment-button
 */

/**
 * Atto image selection tool.
 *
 * @namespace M.atto_videofablib
 * @class Button
 * @extends M.editor_atto.EditorPlugin
 */

var CSS = {
    RESPONSIVE: 'img-responsive',
    INPUTALT: 'atto_videofablib_altentry',
    INPUTHEIGHT: 'atto_videofablib_heightentry',
    INPUTSUBMIT: 'atto_videofablib_urlentrysubmit',
    INPUTURL: 'atto_videofablib_urlentry',
    INPUTSIZE: 'atto_videofablib_size',
    INPUTWIDTH: 'atto_videofablib_widthentry',
    IMAGEALTWARNING: 'atto_videofablib_altwarning',
    IMAGEBROWSER: 'atto_videofablib_openimagebrowser'
  },
  SELECTORS = {
    INPUTURL: '.' + CSS.INPUTURL
  },
  
  REGEX = {
    ISPERCENT: /\d+%/
  },
  
  COMPONENTNAME = 'atto_videofablib',
  
  TEMPLATE = '' +
        '<form class="atto_attoform">' +
  
            // Add the repository browser button.
            '{{#if showFilepicker}}' +
                '<div class="mb-1">' +
                    '<label for="{{elementid}}_{{CSS.INPUTURL}}">{{get_string "enterurl" component}}</label>' +
                    '<div class="input-group input-append w-100">' +
                        '<input class="form-control {{CSS.INPUTURL}}" type="url" ' +
                        'id="{{elementid}}_{{CSS.INPUTURL}}" size="32"/>' +
                        '<span class="input-group-append">' +
                            '<button class="btn btn-secondary {{CSS.IMAGEBROWSER}}" type="button">' +
                            '{{get_string "browserepositories" component}}</button>' +
                        '</span>' +
                    '</div>' +
                '</div>' +
            '{{else}}' +
                '<div class="mb-1">' +
                    '<label for="{{elementid}}_{{CSS.INPUTURL}}">{{get_string "enterurl" component}}</label>' +
                    '<input class="form-control fullwidth {{CSS.INPUTURL}}" type="url" ' +
                    'id="{{elementid}}_{{CSS.INPUTURL}}" size="32"/>' +
                '</div>' +
            '{{/if}}' +
  
            // Hidden input to store custom styles.
            '<input type="hidden" class="{{CSS.INPUTCUSTOMSTYLE}}"/>' +
            '<br/>' +
  
  
            // Add the submit button and close the form.
            '<button class="btn btn-secondary {{CSS.INPUTSUBMIT}}" type="submit">' + '' +
                '{{get_string "saveimage" component}}</button>' +
            '</div>' +
        '</form>',

  VIDEOTEMPLATE = '' +
            '<div class="atto_videofablib_videowrapper">' +
            '<iframe src="{{url}}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"' +
            'allowfullscreen="">' +
            '</iframe>' +
            '</div>';
  
  Y.namespace('M.atto_videofablib').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
  /**
  * A reference to the current selection at the time that the dialogue
  * was opened.
  *
  * @property _currentSelection
  * @type Range
  * @private
  */
  _currentSelection: null,
  
  /**
  * The most recently selected video.
  *
  * @param _selectedVideo
  * @type Node
  * @private
  */
  _selectedVideo: null,
  
  /**
  * A reference to the currently open form.
  *
  * @param _attoform
  * @type Node
  * @private
  */
  _attoform: null,
  
  /**
  * The dimensions of the raw image before we manipulate it.
  *
  * @param _rawImageDimensions
  * @type Object
  * @private
  */
  _rawImageDimensions: null,
  
  initializer: function() {
  
    this.addButton({
        icon: 'e/insert_edit_video',
        callback: this._displayDialogue,
        tags: '.attovideofablib',
        tagMatchRequiresAll: false
    });
    this.editor.delegate('dblclick', this._displayDialogue, '.attovideofablib', this);
    this.editor.delegate('click', this._handleClick, '.attovideofablib', this);
  
    // e.preventDefault needed to stop the default event from clobbering the desired behaviour in some browsers.
    this.editor.on('dragover', function(e) {
        e.preventDefault();
    }, this);
    this.editor.on('dragenter', function(e) {
        e.preventDefault();
    }, this);
  },
  
  /**
  * Handle a click on an image.
  *
  * @method _handleClick
  * @param {EventFacade} e
  * @private
  */
  _handleClick: function(e) {
    var image = e.target;
  
    var selection = this.get('host').getSelectionFromNode(image);
    if (this.get('host').getSelection() !== selection) {
        this.get('host').setSelection(selection);
    }
  },
  
  /**
  * Display the image editing tool.
  *
  * @method _displayDialogue
  * @private
  */
  _displayDialogue: function() {
    // Store the current selection.
    this._currentSelection = this.get('host').getSelection();
    if (this._currentSelection === false) {
        return;
    }
  
    // Reset the image dimensions.
    this._rawImageDimensions = null;
  
    var dialogue = this.getDialogue({
        headerContent: M.util.get_string('imageproperties', COMPONENTNAME),
        width: 'auto',
        focusAfterHide: true,
        focusOnShowSelector: SELECTORS.INPUTURL
    });
  
    // Set the dialogue content, and then show the dialogue.
    dialogue.set('bodyContent', this._getDialogueContent())
            .show();
  },
  
  
  /**
  * Return the dialogue content for the tool, attaching any required
  * events.
  *
  * @method _getDialogueContent
  * @return {Node} The content to place in the dialogue.
  * @private
  */
  _getDialogueContent: function() {
    var template = Y.Handlebars.compile(TEMPLATE),
        canShowFilepicker = this.get('host').canShowFilepicker('media'),
        content = Y.Node.create(template({
            elementid: this.get('host').get('elementid'),
            CSS: CSS,
            component: COMPONENTNAME,
            showFilepicker: canShowFilepicker
        }));
   
    this._attoform = content;
  
    // Configure the view of the current image.
    this._applyImageProperties(this._attoform);
  
    this._attoform.one('.' + CSS.INPUTURL).on('blur', this._urlChanged, this);
    this._attoform.one('.' + CSS.INPUTURL).on('blur', this._urlChanged, this);
    this._attoform.one('.' + CSS.INPUTSUBMIT).on('click', this._setVideo, this);
  
     if (canShowFilepicker) {
          content.delegate('click', function(e) {
              var element = this._attoform;
              e.preventDefault();
              this.get('host').showFilepicker('media', this._getFilepickerCallback(element), this);
          }, '.atto_videofablib_openimagebrowser', this);
     }
  
    return content;
  },
  
  /**
  * Update the dialogue after an image was selected in the File Picker.
  *
  * @method _filepickerCallback
  * @param {object} params The parameters provided by the filepicker
  * containing information about the image.
  * @private
  */
  _filepickerCallback: function(params) {
    if (params.url !== '') {
        var input = this._attoform.one('.' + CSS.INPUTURL);
        input.set('value', params.url);
    }
  },
  
  /**
 * Returns the callback for the file picker to call after a file has been selected.
 *
 * @method _getFilepickerCallback
 * @param  {Y.Node} element The element which triggered the callback (atto form)
 * @return {Function} The function to be used as a callback when the file picker returns the file
 * @private
 */
_getFilepickerCallback: function(element) {
    return function(params) {
        if (params.url !== '') {
            var input = element.one('.' + CSS.INPUTURL);
            input.set('value', params.url);
        }
    };
},
  
  /**
  * Applies properties of an existing image to the image dialogue for editing.
  *
  * @method _applyImageProperties
  * @param {Node} form
  * @private
  */
  _applyImageProperties: function(form) {
    var properties = this._getSelectedImageProperties();
  
    if (properties === false) {  
        return;
    }
  
    if (properties.src) {
        form.one('.' + CSS.INPUTURL).set('value', properties.src);
    }
  },
  
  /**
  * Gets the properties of the currently selected image.
  *
  * The first image only if multiple images are selected.
  *
  * @method _getSelectedImageProperties
  * @return {object}
  * @private
  */
  _getSelectedImageProperties: function() {
    var properties = {
            src: null
        },
  
        // Get the current selection.
        videos = this.get('host').getSelectedNodes(),
        video;
  
    if (videos) {
        videos = videos.filter('iframe');
    }
  
    if (videos && videos.size()) {
        video = video.item(0);
        this._selectedVideo = video;
  
        properties.src = video.getAttribute('src');
        return properties;
    }
  
    // No image selected - clean up.
    this._selectedVideo = null;
    return false;
  },

  
  /**
  * Update the video in the contenteditable.
  *
  * @method _setVideo
  * @param {EventFacade} e
  * @private
  */
  _setVideo: function(e) {
    var form = this._attoform,
        url = form.one('.' + CSS.INPUTURL).get('value'),
        videohtml,
        host = this.get('host');
  
    e.preventDefault();
  
    if(url.includes('youtube.com') && !url.includes('embed')){
        url = 'https://www.youtube.com/embed/' + url.slice(-11);
    }

    // Check if there are any accessibility issues.
    if (this._updateWarning()) {
        return;
    }
  
    // Focus on the editor in preparation for inserting the image.
    host.focus();
    if (url !== '') {
        if (this._selectedVideo) {
            host.setSelection(host.getSelectionFromNode(this._selectedVideo));
        } else {
            host.setSelection(this._currentSelection);
        }
  
  
        var template = Y.Handlebars.compile(VIDEOTEMPLATE);
        videohtml = template({
            url: url
        });
  
        this.get('host').insertContentAtFocusPoint(videohtml);
  
        this.markUpdated();
    }
  
    this.getDialogue({
      focusAfterHide: null
    }).hide();
  
  },
  
  
  
  /**
  * Update the alt text warning live.
  *
  * @method _updateWarning
  * @return {boolean} whether a warning should be displayed.
  * @private
  */
  _updateWarning: function() {
          return false;
  }
  });
  

}, '@VERSION@', {"requires": ["moodle-editor_atto-plugin"]});
