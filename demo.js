/*global console, window*/
// can be run with `npm run demo`
var Input = require('./ampersand-chosen-view');
var FormView = require('ampersand-form-view');
var chosenCss = require('./vendor/chosen.css');

var input = new Input({
    label: 'Colors',
    name: 'color',
    unselectedText: 'Select one',
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
    fields: [input],
    submitCallback: function (vals) {
        console.log(vals.color);
    }
});

window.formView = formView;

document.body.appendChild(formView.el);
