/*global console, window*/
// can be run with `npm run demo`
var Input = require('./ampersand-chosen-view');
var FormView = require('ampersand-form-view');
var chosenCss = require('./vendor/chosen.css');

var singleInput = new Input({
    label: 'Color',
    name: 'color',
    unselectedText: 'Select only one',
    value: 'green',
    options: [
      ['red', 'Red'],
      ['green', 'Green'],
      ['blue', 'Blue']
    ],
});

var multipleInput = new Input({
    label: 'Colors',
    name: 'colors',
    unselectedText: 'Select one or more',
    value: ['green', 'blue'],
    isMultiple: true,
    options: [
      ['red', 'Red'],
      ['green', 'Green'],
      ['blue', 'Blue']
    ],
});

var form = document.createElement('form');
form.innerHTML = '<div data-hook="field-container"></div><input type="submit">';

var formView = new FormView({
    el: form,
    fields: [
        singleInput,
        multipleInput
    ],
    submitCallback: function (vals) {
        console.log(vals);
    }
});

window.formView = formView;

document.body.appendChild(formView.el);
