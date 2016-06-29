Angular Tooltips
==================


[![Join the chat at https://gitter.im/720kb/angular-tooltips](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/720kb/angular-tooltips?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


Angular Tooltips is an AngularJS directive that generates a tooltip on your element.


The angular tooltips is developed by [720kb](http://720kb.net).

##Requirements


AngularJS v1.3+

##Screen
![Angular tooltips](http://i.imgur.com/GjUwCat.png)

###Browser support


![Chrome](https://raw.github.com/alrra/browser-logos/master/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/firefox/firefox_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/internet-explorer/internet-explorer_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/opera/opera_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/safari/safari_48x48.png)
--- | --- | --- | --- | --- |
 ✔ | ✔ | IE10 + | ✔ | ✔ |


## Load

To use the directive, include the Angular Tooltips javascript and css files in your web page:

```html
<!DOCTYPE HTML>
<html>
<head>
  <link href="dist/angular-tooltips.min.css" rel="stylesheet" type="text/css" />
</head>
<body ng-app="app">
  //.....
  <script src="dist/angular-tooltips.min.js"></script>
</body>
</html>
```

##Installation

####Bower

```
$ bower install angular-tooltips --save
```

####Npm

```
$ npm install angular-tooltips --save
```

_then load the js files in your html_

####Add module dependency

Add the 720kb.tooltips module dependency

```js
angular.module('app', [
  '720kb.tooltips'
 ]);
```


Call the directive wherever you want in your html page

```html

<a href="#" tooltips tooltip-template="tooltip">Tooltip me</a>

```

##Doc

Option | Type | Default | Description
------------- | ------------- | ------------- | -------------
tooltip-side="" | String('left','right','top','bottom') | 'top' | Set your tooltip to show on `left` or `right` or `top` or `bottom` position
tooltip-template="" | String() | '' | Set your tooltip template (HTML or just Text)
 |  |  | **to know**: don't use it together with `tooltip-template-url` attribute, use only one of them
tooltip-template-url="" | String() | '' | Set your external tooltip template PATH
 |  |  | **to know**: don't use it together with `tooltip-template` attribute, use only one of them 
tooltip-smart="" | String(Boolean) | false | Set the tooltip to automatically search the best position on the screen
tooltip-show-trigger="" | String('event1 event2') | 'mouseover' | Show the tooltip on specific event/events
tooltip-hide-trigger="" | String('event1 event2') | 'mouseleave' | Hide the tooltip on specific event/events
tooltip-close-button="" | String(Boolean) | false | Enable the tooltip close button
tooltip-class="" | String() | '' | Set custom tooltip CSS class/classes
tooltip-size="" | String('large', 'small') | 'medium' | Set your tooltip dimensions
tooltip-speed="" | String('fast', 'slow', 'medium') | 'medium' | Set your tooltip show & hide transition speed
tooltip-hidden="" | String(Boolean) | false | Hide (at all) the tooltip
tooltip-append-to-body="" | String(Boolean) | false | This attribute clones the tooltip and append this directly on body. This enables the tooltip position also, for instance, if you have an scrolling area. **This option does heavy javascript calculation.**


##Globals
Sometimes you may need to set all of your tooltips options in one place, you can achieve this using `tooltipsConfProvider` like this:

```javascript
.config(['tooltipsConfProvider', function configConf(tooltipsConfProvider) {
  tooltipsConfProvider.configure({
    'smart':true,
    'size':'large',
    'speed': 'slow',
    //etc...
  });
}])
```

## Example

###[Live demo](https://720kb.github.io/angular-tooltips)

##Theming
You can create your own theme by editing the default SASS file `lib/angular-tooltips.scss` or just editing the default CSS file `dist/angular-tooltips.css`.

##Contributing

We will be much grateful if you help us making this project to grow up.
Feel free to contribute by forking, opening issues, pull requests etc.

## License

The MIT License (MIT)

Copyright (c) 2014 Filippo Oretti, Dario Andrei

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
