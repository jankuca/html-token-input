

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
 * @param {{
 *   separator: ?string,
 *   data_source: ?HTMLTokenInput.IDataSource,
 *   closed: ?boolean
 * }} Options.
 */
var HTMLTokenInput = function (input, options) {
  options = options || {};

  /**
   * The token separator used in the output
   * @type {string}
   */
  this.separator = options.separator || ';';

  /**
   * The current token list
   * @type {Array.<string>}
   */
  this.tokens = [];

  /**
   * Whether the data source is being queried for possible tokens
   * @private
   * @type {boolean}
   */
  this.searching_ = false;

  /**
   * The output {HTMLInputElement}
   * @private
   * @type {!HTMLInputElement}
   */
  this.output_ = input;

  /**
   * The data source in which to search for possible tokens
   * @private
   * @type {HTMLTokenInput.IDataSource=}
   */
  this.data_source_ = options.data_source;

  /**
   * Whether to work with a closed set of items (force data source)
   * @private
   * @type {boolean}
   */
  this.closed_ = !!options.closed;

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


/**
 * {HTMLTokenInput} instance factory method
 * @param {!HTMLInputElement} input The HTML input element into which
 *   to output the resulting token list.
 * @param {{
 *   separator: ?string,
 *   data_source: ?HTMLTokenInput.IDataSource,
 *   closed: ?boolean
 * }} Options.
 */
HTMLTokenInput.create = function (input, data_source, separator) {
  var token_input = new HTMLTokenInput(input, data_source, separator);
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

  if (this.data_source_) {
    var search_results = document.createElement('span');
    search_results.className = 'token-input-search-results';
    search_results.style.display = 'none';
    container.appendChild(search_results);
  }

  container.appendChild(this.output_);

  this.container_ = container;
  this.list_ = list;
  this.field_ = field;
  this.search_results_ = search_results;

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
 * @param {string} token A token value.
 * @param {string=} icon_url A URL of an associated image/icon.
 */
HTMLTokenInput.prototype.pushToken = function (token, icon_url) {
  var item = this.document_.createElement('span');
  item.setAttribute('tabindex', '-1');
  item.textContent = token;

  if (icon_url) {
    var icon = new Image();
    icon.src = icon_url;
    item.insertBefore(icon, item.firstChild);
  }

  this.list_.appendChild(item);
  this.field_.focus();

  this.snap_();
};

/**
 * Snaps the current token list and updates the output {HTMLInputElement}
 */
HTMLTokenInput.prototype.snap_ = function () {
  var items = this.list_.childNodes;
  var tokens = Array.prototype.map.call(items, function (item) {
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
 * Moves the focus by the given number of search results
 * @param {number} change The number of search results of which to move
 *   the focus.
 */
HTMLTokenInput.prototype.focusSearchResult = function (change) {
  var index = this.getFocusedSearchResultIndex_();
  var count = this.search_results_.childNodes.length;

  var old = this.search_results_.childNodes[index];
  if (old) {
    old.className = old.className.replace(/(^|\s)focus(\s|$)/, '$1$2');
  }

  index = Math.max(0, Math.min(index + change, count - 1));

  var item = this.search_results_.childNodes[index];
  if (item) {
    item.className += ' focus';
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
 * Returns the index of the currently focused token list item element
 * @return {number} The index.
 */
HTMLTokenInput.prototype.getFocusedSearchResultIndex_ = function () {
  var element = this.document_.activeElement;
  var items = this.search_results_.childNodes;
  for (var i = 0, ii = items.length; i < ii; ++i) {
    var item = items.item(i);
    if (/(?:^|\s)focus(\s|$)/.test(item.className)) {
      return i;
    }
  }
  return -1;
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

  var old_value = self.field_.textContent;
  var search = function () {
    setTimeout(function () {
      var value = self.field_.textContent;
      if (value !== old_value) {
        old_value = value;
        self.search_(value);
      }
    }, 0);
  };

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
      old_value = '';
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
    case 38: // Top
      self.handleTopArrowKey_(target, e);
      break;
    case 40: // Bottom
      self.handleBottomArrowKey_(target, e);
      break;
    default:
      search();
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

  if (self.search_results_) {
    this.field_.onfocus = function () {
      self.search_results_.style.display = '';
    };
    this.field_.onblur = function () {
      setTimeout(function () {
        self.search_results_.style.display = 'none';
      }, 0);
    };
  }
};

/**
 * Searches the associated data source for possible tokens
 */
HTMLTokenInput.prototype.search_ = function (query) {
  if (this.searching_) {
    this.abortSearch_();
  }

  query = query.replace(/(^\s+|\s+$)/g, ''); // trim

  if (!query) {
    this.resetSearchResults_();
  } else if (this.data_source_) {

    var self = this;
    this.searching_ = true;
    this.data_source_.search(query, function (err, results) {
      self.searching_ = false;
      if (err) {
        self.showSearchError_(err);
      } else {
        self.showSearchResults_(results);
      }
    });
  }
};

/**
 * Shows the given search results
 */
HTMLTokenInput.prototype.showSearchResults_ = function (results) {
  var document = this.document_;
  var frag = document.createDocumentFragment();
  var closed = this.closed_;

  results.forEach(function (result, i) {
    var item = document.createElement('span');
    item.textContent = result.token;
    item.setAttribute('data-token', result.token);
    item.setAttribute('tabindex', '-1');

    if (closed && i === 0) {
      item.className = 'focus';
    }

    if (result.icon) {
      item.setAttribute('data-icon', result.icon);

      var icon = new Image();
      icon.src = result.icon;
      item.insertBefore(icon, item.firstChild);
    }

    frag.appendChild(item);
  });

  if (!results.length) {
    // Show a "no results" message
    var item = document.createElement('span');
    item.className = 'message';
    item.textContent = 'No results';
    frag.appendChild(item);
  }

  this.search_results_.innerHTML = '';
  this.search_results_.appendChild(frag);
  this.search_results_.style.display = '';
};

/**
 * Resets the search result list
 */
HTMLTokenInput.prototype.resetSearchResults_ = function () {
  this.search_results_.style.display = 'none';
  this.search_results_.innerHTML = '';
};

/**
 * Handles a pressed return key
 * @param {!HTMLElement} target The event target.
 * @param {!Event} e The keyboard event object.
 */
HTMLTokenInput.prototype.handleReturnKey_ = function (target, e) {
  e.preventDefault();

  var field = this.field_;
  if (target === field) {
    var index = this.getFocusedSearchResultIndex_();
    if (index !== -1) {
      var item = this.search_results_.childNodes[index];
      var token = item.getAttribute('data-token')
      var icon = item.getAttribute('data-icon') || null;

      this.pushToken(token, icon);

      field.textContent = '';
      field.focus();
      this.resetSearchResults_();
    } else if (field.textContent && !this.closed_) {
      var token = field.textContent;
      token = token.replace(/(^\s+|\s+$)/g, ''); // trim

      this.pushToken(token);

      field.textContent = '';
      field.focus();
    }
  }
};

/**
 * Handles a pressed backspace key
 * @param {!HTMLElement} target The event target.
 * @param {!Event} e The keyboard event object.
 */
HTMLTokenInput.prototype.handleBackspaceKey_ = function (target, e) {
  if (target !== this.field_) {
    e.preventDefault();
    this.removeFocusedToken();
  } else if (this.isCaretAtBeginningOfField_()) {
    e.preventDefault();
    this.focusToken(-1);
  } else {
    var self = this;
    setTimeout(function () {
      self.search_(target.textContent);
    }, 0);
  }
};

/**
 * Handles a pressed delete key
 * @param {!HTMLElement} target The event target.
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
 * @param {!HTMLElement} target The event target.
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
 * @param {!HTMLElement} target The event target.
 * @param {!Event} e The keyboard event object.
 */
HTMLTokenInput.prototype.handleRightArrowKey_ = function (target, e) {
  if (target !== this.field_) {
    e.preventDefault();
    this.focusToken(+1);
  }
};

/**
 * Handles a pressed top arrow key
 * @param {!HTMLElement} target The event target.
 * @param {!Event} e The keyboard event
 */
HTMLTokenInput.prototype.handleTopArrowKey_ = function (target, e) {
  if (target === this.field_) {
    e.preventDefault();
    this.focusSearchResult(-1);
  }
};

/**
 * Handles a pressed top arrow key
 * @param {!HTMLElement} target The event target.
 * @param {!Event} e The keyboard event
 */
HTMLTokenInput.prototype.handleBottomArrowKey_ = function (target, e) {
  if (target.parentNode !== this.list_) {
    e.preventDefault();
    this.focusSearchResult(+1);
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



/**
 * Interface for a HTMLTokenInput data source
 * @interface
 */
HTMLTokenInput.IDataSource = function () {};

/**
 * Searches the data source
 * @param {string} query The search query.
 * @param {function (Error, Array.<{
 *   token: string,
 *   detail: ?string,
 *   icon: ?string
 * }>)} callback The callback function to which to pass the search results.
 */
HTMLTokenInput.IDataSource.prototype.search = function (query, callback) {};

/**
 * Aborts the searching process
 */
HTMLTokenInput.IDataSource.prototype.abort = function () {};
