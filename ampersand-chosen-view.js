/* global document, $AMPERSAND_VERSION */
var domify = require('domify');
var dom = require('ampersand-dom');
var matches = require('matches-selector');
var clone = require('amp-clone');

var jquery = require('jquery');
var chosen = require('chosen');

//Replaceable with anything with label, message-container, message-text data-hooks and a <select>
var defaultTemplate = [
  '<label class="select">',
    '<span data-hook="label"></span>',
    '<select></select>',
    '<span data-hook="message-container" class="message message-below message-error">',
      '<p data-hook="message-text"></p>',
    '</span>',
  '</label>'
].join('\n');


/* opts:
 *  - name:       name of the field
 *  - parent:     parent form reference
 *  - isMultiple: true if you want to support multiple results
 *  - options:    array/collection of options to render into the select box
 *  - [unselectedText]: text to display if unselected
 *  - [value]:    initial value for the field
 *  - [el]:       dom node to use for the view
 *  - [required]: is field required
 *  - [width]:    input width
 *
 *  - [validClass]: class to apply to root element if valid
 *  - [invalidClass]: class to apply to root element if invalid
 *  - [requiredMessage]: message to display if invalid and required
 */

function SelectView (opts) {
  var self = this;
  opts = opts || {};

  if (typeof opts.name !== 'string') throw new Error('SelectView requires a name property.');
  this.name = opts.name;

  if (!Array.isArray(opts.options)) {
    throw new Error('SelectView requires select options.');
  }
  this.options = opts.options;

  this.el = opts.el;
  this.value = null;
  this.label = opts.label || this.name;
  this.parent = opts.parent;
  this.template = opts.template || defaultTemplate;
  this.unselectedText = opts.unselectedText;
  this.yieldModel = (opts.yieldModel === false) ? false : true;

  this.required = opts.required || false;
  this.isMultiple = opts.isMultiple || false;
  this.validClass = opts.validClass || 'input-valid';
  this.invalidClass = opts.invalidClass || 'input-invalid';
  this.requiredMessage = opts.requiredMessage || 'Selection required';

  this.width = opts.width || '100%';

  this.onChange = this.onChange.bind(this);

  this.value = opts.value && clone(opts.value) || [];

  this.render();
}

SelectView.prototype.render = function () {
  if (this.rendered) return;

  if (!this.el) this.el = domify(this.template);

  var label = this.el.querySelector('[data-hook~=label]');
  if (label) {
    label.textContent = this.label;
  }

  this.select = this.el.querySelector('select');
  if (matches(this.el, 'select')) this.select = this.el;
  if (this.select) this.select.setAttribute('name', this.name);
  if (this.select && this.isMultiple) this.select.setAttribute('multiple', '');

  // this.bindDOMEvents();
  this.renderOptions();

  if(!this.isMultiple) {
    this.updateSelectedOption();
  }

  jquery(this.select).chosen({width: this.width}).change(this.onChange);

  this.rendered = true;

  this.validate();
};

SelectView.prototype.onChange = function (ev, change) {
  if(this.isMultiple) {
    if(change && change.selected) {
      this.addValue(change.selected);
    }
    else if(change && change.deselected) {
      this.removeValue(change.deselected);
    }

    return;
  }

  var value = this.select.options[this.select.selectedIndex].value;

  this.setValue(value);
};

SelectView.prototype.findModelForId = function (id) {
  return this.options.filter(function (model) {
    if (!model[this.idAttribute]) return false;

    //intentionally coerce for '1' == 1
    return model[this.idAttribute] == id;
  }.bind(this))[0];
};

// SelectView.prototype.bindDOMEvents = function () {
//   this.el.addEventListener('change', this.onChange, false);
// };

SelectView.prototype.renderOptions = function () {
  var self = this;
  if (!this.select) return;

  this.select.innerHTML = '';
  if (this.unselectedText) {
    this.select.appendChild(
      createOption(null, this.unselectedText)
    );
  }

  this.options.forEach(function (option) {
    var selected = false;
    var optionValue = option;
    if (Array.isArray(option) && option.length === 2) {
      optionValue = option[0];
    }

    if(self.value) {
      if(self.isMultiple) {
        selected = self.value.indexOf(optionValue) != -1;
      } else {
        selected = (self.value == optionValue);
      }
    }

    this.select.appendChild(
      createOption(this.getOptionValue(option), this.getOptionText(option), selected)
    );
  }.bind(this));
};

SelectView.prototype.updateSelectedOption = function () {
  var lookupValue = this.value;

  if (!this.select) return;

  if (!lookupValue) {
    this.select.selectedIndex = 0;
    return;
  }

  if (lookupValue) {
    for (var i = this.select.options.length; i--; i) {
      if (this.select.options[i].value === lookupValue.toString()) {
        this.select.selectedIndex = i;
        return;
      }
    }
  }

  //If failed to match any
  this.select.selectedIndex = 0;
};

SelectView.prototype.remove = function () {
  if (this.el) this.el.parentNode.removeChild(this.el);
  this.el.removeEventListener('change', this.onChange, false);
};

SelectView.prototype.setValue = function (value) {
  if (value === this.value) return;

  this.value = value;
  this.validate();
  this.updateSelectedOption();
  this.renderOptions();
  if (this.parent) this.parent.update(this);
};

SelectView.prototype.addValue = function (value) {
  if (this.value.indexOf(value) != -1) return;

  this.value.push(value);
  this.validate();
  this.renderOptions();
  if (this.parent) this.parent.update(this);
};

SelectView.prototype.removeValue = function (value) {
  var index = this.value.indexOf(value);
  if (index == -1) return;

  this.value.splice(index, 1);
  this.validate();
  this.renderOptions();
  if (this.parent) this.parent.update(this);
};

SelectView.prototype.validate = function () {
  if(!this.isMultiple) {
    this.valid = this.options.some(function (element) {
      //[ ['foo', 'Foo Text'], ['bar', 'Bar Text'] ]
      if (Array.isArray(element) && element.length === 2) {
        return element[0] === this.value;
      }

      //[ 'foo', 'bar', 'baz' ]
      return element === this.value;
    }.bind(this));
  } else {
    this.valid = Array.isArray(this.value);
  }

  if (!this.valid && this.required) {
    this.setMessage(this.requiredMessage);
  } else {
    this.setMessage();
  }

  return this.valid;
};

SelectView.prototype.getOptionValue = function (option) {
  if (Array.isArray(option)) return option[0];

  return option;
};

SelectView.prototype.setMessage = function (message) {
  var mContainer = this.el.querySelector('[data-hook~=message-container]');
  var mText = this.el.querySelector('[data-hook~=message-text]');

  if (!mContainer || !mText) return;

  if (message) {
    dom.show(mContainer);
    mText.textContent = message;
    dom.addClass(this.el, this.invalidClass);
    dom.removeClass(this.el, this.validClass);
  } else {
    dom.hide(mContainer);
    mText.textContent = '';
    dom.addClass(this.el, this.validClass);
    dom.removeClass(this.el, this.invalidClass);
  }
};

SelectView.prototype.getOptionText = function (option) {
  if (Array.isArray(option)) return option[1];

  return option;
};

function createOption (value, text, selected) {
  var node = document.createElement('option');

  //Set to empty-string if undefined or null, but not if 0, false, etc
  if (value === null || value === undefined) { value = ''; }

  if(selected) {
    node.setAttribute('selected', '');
  }

  node.textContent = text;
  node.value = value;

  return node;
}

module.exports = SelectView;