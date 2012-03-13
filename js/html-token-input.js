

// Be compatible with the Google Closure Library dependency system
var goog;
goog = goog || { provide: function () {} };
goog.provide('HTMLTokenInput');


/**
 * HTML Token Input
 * A component for multi-token input
 * @constructor
 * @param {!HTMLInputElement} input The HTML input element into which
 *   to output the resulting token list.
 * @param {string=} separator The string used to separate tokens in the output.
 */
var HTMLTokenInput = function (input, separator) {
  /**
   * The token separator used in the output
   * @type {string}
   */
  this.separator = separator || ';';

  /**
   * The current token list
   * @type {Array.<string>}
   */
  this.tokens = [];

  /**
   * The output {HTMLInputElement}
   * @private
   * @type {!HTMLInputElement}
   */
  this.output_ = input;

  /**
   * The {Document} object to which does the output {HTMLInputElement} belong
   * @private
   * @type {!Document}
   */
  this.document_ = input.ownerDocument;
  /**
   * The window object to which does the output {HTMLInputElement} belong
   * @private
   * @type {!Window}
   */
  this.window_ = this.document_.defaultView;

  /**
   * A "change" event handler function
   * Called whenever the token list changes
   * @type {function (Array.<string>)}
   */
  this.onchange = function (tokens) {};
};

HTMLTokenInput.create = function (input, separator) {
  var token_input = new HTMLTokenInput(input, separator);
  token_input.build();

  return token_input;
};

/**
 * Builds the DOM required by the component
 * The resulting DOM structure is:
 *   container (.token-input)
 *     list (.token-input-list)
 *     field (.token-input-field)
 */
HTMLTokenInput.prototype.build = function () {
  var document = this.document_;

  var list = document.createElement('span');
  list.className = 'token-input-list';

  var field = document.createElement('span');
  field.className = 'token-input-field';
  field.setAttribute('contenteditable', 'true');

  var container = document.createElement('span');
  container.className = 'token-input';
  container.setAttribute('tabindex', '-1');

  var parent = this.output_.parentNode;
  if (parent) {
    parent.insertBefore(container, this.output_);
  }

  container.appendChild(list);
  container.appendChild(field);
  container.appendChild(this.output_);

  this.container_ = container;
  this.list_ = list;
  this.field_ = field;

  this.setupListeners_();

  // Initial tokens
  var tokens = this.output_.value.split(this.separator);
  this.output_.value = '';
  tokens.forEach(function (token) {
    if (token) {
      this.pushToken(token);
    }
  }, this);
};

/**
 * Adds a new token to the end of the token list
 */
HTMLTokenInput.prototype.pushToken = function (token) {
  var item = this.document_.createElement('span');
  item.setAttribute('tabindex', '-1');
  item.textContent = token;

  this.list_.appendChild(item);
  this.field_.focus();

  this.snap_();
};

/**
 * Snaps the current token list and updates the output {HTMLInputElement}
 */
HTMLTokenInput.prototype.snap_ = function () {
  var tokens = Array.prototype.map.call(this.list_.childNodes, function (item) {
    return item.textContent;
  });

  this.tokens = tokens;
  this.output_.value = tokens.join(this.separator);

  this.onchange();
};

/**
 * Focuses the input field
 */
HTMLTokenInput.prototype.focus = function () {
  this.field_.focus();
};

/**
 * Moves the focus by the given number of tokens
 * @param {number} change The number of tokens of which to move the focus.
 */
HTMLTokenInput.prototype.focusToken = function (change) {
  var index = this.getFocusedTokenIndex_();
  var count = this.list_.childNodes.length;

  index = Math.max(0, Math.min(index + change, count));

  var item = this.list_.childNodes[index];
  if (item) {
    item.focus();
  } else {
    this.focus();
  }
};

/**
 * Returns the index of the currently focused token list item element
 * @return {number} The index.
 */
HTMLTokenInput.prototype.getFocusedTokenIndex_ = function () {
  var element = this.document_.activeElement;
  var items = this.list_.childNodes;
  for (var i = 0, ii = items.length; i < ii; ++i) {
    var item = items.item(i);
    if (item === element) {
      return i;
    }
  }
  return items.length;
};

/**
 * Removes the token associated with the given token list item element and
 * focuses the next token list item.
 * @param {!HTMLElement} child A token list item element.
 */
HTMLTokenInput.prototype.removeTokenByListChild = function (child) {
  if (child === this.document_.activeElement) {
    this.focusToken(+1);
  }
  this.list_.removeChild(child);

  this.snap_();
};

/**
 * Removes the currently focused token list item element
 */
HTMLTokenInput.prototype.removeFocusedToken = function () {
  var index = this.getFocusedTokenIndex_();
  var child = this.list_.childNodes[index];
  if (child) {
    this.removeTokenByListChild(child);
  }
};

/**
 * Sets up the required event listeners
 */
HTMLTokenInput.prototype.setupListeners_ = function () {
  var self = this;
  var container = this.container_;

  container.onkeydown = function (e) {
    var target = e.target;
    if (target.nodeType !== 1) {
      target = target.parentNode;
    }

    switch (e.keyCode) {
    case 13: // Return
      self.handleReturnKey_(target, e);
      break;
    case 8: // Backspace
      self.handleBackspaceKey_(target, e);
      break;
    case 46: // Delete
      self.handleDeleteKey_(target, e);
      break;
    case 37: // Left
      self.handleLeftArrowKey_(target, e);
      break;
    case 39: // Right
      self.handleRightArrowKey_(target, e);
      break;
    default:
      console.log(e.keyCode);
    }
  };

  container.onclick = function (e) {
    var target = e.target;
    if (target.nodeType !== 1) {
      target = target.parentNode;
    }

    if (target.tagName !== 'SPAN' ||
      !/(?:^|\s)token-input-list(?:\s|$)/.test(target.parentNode.className)) {
      self.focus();
    }
  };
};

/**
 * Handles a pressed return key
 * @param {!Event} e The keyboard event object.
 */
HTMLTokenInput.prototype.handleReturnKey_ = function (target, e) {
  e.preventDefault();

  var field = this.field_;
  if (target === field && field.textContent) {
    var token = field.textContent;
    token = token.replace(/(^\s+|\s+$)/g, ''); // trim
    this.pushToken(token);
    field.textContent = '';
    field.focus();
  }
};

/**
 * Handles a pressed backspace key
 * @param {!Event} e The keyboard event object.
 */
HTMLTokenInput.prototype.handleBackspaceKey_ = function (target, e) {
  if (target !== this.field_) {
    e.preventDefault();
    this.removeFocusedToken();
  } else if (this.isCaretAtBeginningOfField_()) {
    e.preventDefault();
    this.focusToken(-1);
  }
};

/**
 * Handles a pressed delete key
 * @param {!Event} e The keyboard event object.
 */
HTMLTokenInput.prototype.handleDeleteKey_ = function (target, e) {
  if (target !== this.field_) {
    e.preventDefault();
    this.removeTokenByListChild(target);
  }
};

/**
 * Handles a pressed left arrow key
 * @param {!Event} e The keyboard event object.
 */
HTMLTokenInput.prototype.handleLeftArrowKey_ = function (target, e) {
  if (target !== this.field_ || this.isCaretAtBeginningOfField_()) {
    e.preventDefault();
    this.focusToken(-1);
  }
};

/**
 * Handles a pressed right arrow key
 * @param {!Event} e The keyboard event object.
 */
HTMLTokenInput.prototype.handleRightArrowKey_ = function (target, e) {
  if (target !== this.field_) {
    e.preventDefault();
    this.focusToken(+1);
  }
};

/**
 * @return {boolean} Whether the caret (selection) is collapsed and at
 *   the beginning of the user input field.
 */
HTMLTokenInput.prototype.isCaretAtBeginningOfField_ = function () {
  var selection = this.window_.getSelection();
  if (selection.rangeCount) {
    var range = selection.getRangeAt(0);
    return (range.collapsed && range.startOffset === 0);
  }
  return false;
};
