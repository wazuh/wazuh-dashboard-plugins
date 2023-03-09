/**
 * Util package for working with colors.
 */
define(['underscore'], function(_) {

    var hslColorFromRgbColor = function(rgbColor) {
        /**
         * convert from [r,g,b] to [h,s,l]
         *  r,g,b: [0,255]
         *  h: [0,360)
         *  s: [0,100]
         *  l: [0,100]
         *  Uses algorithm as specified on Wikipedia http://en.wikipedia.org/wiki/HSL_and_HSV
         */

        var r = rgbColor[0];
        var g = rgbColor[1];
        var b = rgbColor[2];
        var computedH = 0;
        var computedS = 0;
        var computedL = 0;

        if (r === null || g === null || b === null ||
            isNaN(r) || isNaN(g)|| isNaN(b) ) {
            return null;
        }

        if (r < 0 || g < 0 || b < 0 ||
            r > 255 || g > 255 || b > 255) {
            return null;
        }

        r = r / 255;
        g = g / 255;
        b = b / 255;
        var minRGB = Math.min(r, Math.min(g, b));
        var maxRGB = Math.max(r, Math.max(g, b));
        var chroma = maxRGB - minRGB;

        var h_prime = 0;
        if (chroma == 0) {
            h_prime = 0;
        }
        else if (maxRGB == r) {
            h_prime = ((g - b) / chroma) % 6;
        } else if (maxRGB == g) {
            h_prime = ((b - r) / chroma) + 2;
        } else if (maxRGB == b) {
            h_prime = ((r - g) / chroma) + 4;
        }

        var h = h_prime * 60;
        while (h < 0)
        {
            h += 360;
        }
        while (h > 360)
        {
            h -= 360;
        }

        var l = 0.5 * (maxRGB + minRGB);

        var s = 0;
        if (chroma == 0) {
            s = 0;
        } else {
            s = chroma / (1 - Math.abs(2 * l - 1));
        }

        if (s < 0) { s = 0; }
        if (s > 1) { s = 1; }
        if (l < 0) { l = 0; }
        if (l > 1) { l = 1; }

        return [h, s * 100, l * 100];
    };

    var rgbColorFromHslColor = function(hslColor) {
        /**
         * convert from [h,s,l] to [r,g,b]
         *  r,g,b: [0,255]
         *  h: [0,360)
         *  s: [0,100]
         *  l: [0,100]
         *  Uses algorithm as specified on Wikipedia http://en.wikipedia.org/wiki/HSL_and_HSV
         */
        if (hslColor.length != 3) {
            return null;
        }

        var h = hslColor[0],
            s = hslColor[1],
            l = hslColor[2];

        s = s / 100;
        l = l / 100;

        while (h < 0)
        {
            h += 360;
        }
        while (h > 360)
        {
            h -= 360;
        }

        if (h < 0 || h > 360 ||
            s < 0 || s > 1 ||
            l < 0 || l > 1)
        {
            return null;
        }

        // chroma
        var c = (1 - Math.abs(2 * l - 1)) * s;

        // determine color components (sans lightness)
        var h1 = h / 60;
        var x = c * (1 - Math.abs((h1 % 2) - 1));
        var r1 = 0,
            g1 = 0,
            b1 = 0;

        if (h1 < 1) {
            r1 = c;
            g1 = x;
        } else if (h1 < 2) {
            r1 = x;
            g1 = c;
        } else if (h1 < 3) {
            g1 = c;
            b1 = x;
        } else if (h1 < 4) {
            g1 = x;
            b1 = c;
        } else if (h1 < 5) {
            r1 = x;
            b1 = c;
        } else {
            r1 = c;
            b1 = x;
        }

        // add lightness component to get r,g,b
        var m = l - 0.5 * c;
        var r = r1 + m,
            g = g1 + m,
            b = b1 + m;

        // return in [0,255] range
        r *= 255;
        g *= 255;
        b *= 255;

        return [r, g, b];
    };

    var rgbColorFromRgbString = function(rgbColorString) {
        /**
         * given "rgb(r,g,b)" converts to [r,g,b]
         */

        var rgbValueStrings = rgbColorString.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
        if (rgbValueStrings === null) {
            return null;
        }

        var rgbColor = [parseInt(rgbValueStrings[1], 10),
                        parseInt(rgbValueStrings[2], 10),
                        parseInt(rgbValueStrings[3], 10)];

        return rgbColor;
    };

    var rgbStringFromRgbColor = function(rgbColor) {
        /**
         * given [r,g,b] returns "rgb(r,g,b)"
         *  r, g, b are all rounded to nearest integers
         */
        if (rgbColor.length != 3) {
            return null;
        }

        var roundedRgbColor = _.map(rgbColor, Math.round);
        var rgbString = "rgb(" + roundedRgbColor[0] + ", " + roundedRgbColor[1] + ", " + roundedRgbColor[2] + ")";
        return rgbString;
    };

    var hslStringFromHslColor = function(hslColor) {
        /**
         * given [h,s,l] returns "hsl(h,s%,l%)"
         *  h, s, l are all rounded to nearest integers
         */
        if (hslColor.length != 3) {
            return null;
        }
        var roundedHslColor = _.map(hslColor, Math.round);
        var hslString = "hsl(" + roundedHslColor[0] + ", " + roundedHslColor[1] + "%, " + roundedHslColor[2] + "%)";
        return hslString;
    };

    var hslColorFromHslString = function(hslColorString) {
        /**
         * given "hsl(h,s%,l%)" returns [h,s,l]
         */
        var hslValueStrings = hslColorString.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)$/);
        if (hslValueStrings === null) {
            return null;
        }

        var hslColor = [parseInt(hslValueStrings[1], 10),
                        parseInt(hslValueStrings[2], 10),
                        parseInt(hslValueStrings[3], 10)];

        return hslColor;
    };

    var rgbColorFromHexString = function(hexColorString) {
        /**
         * given "#RRGGBB" returns [r,g,b]
         */
        var normHexColorString = normalizeHexString(hexColorString);
        var hexValueStrings = normHexColorString.match(/^#?([\dA-Fa-f]{2})([\dA-Fa-f]{2})([\dA-Fa-f]{2})$/);
        if (hexValueStrings === null) {
            return null;
        }

        var rgbColor = [parseInt(hexValueStrings[1], 16),
                        parseInt(hexValueStrings[2], 16),
                        parseInt(hexValueStrings[3], 16)];

        return rgbColor;
    };

    var hexStringFromRgbColor = function(rgbColor) {
        /**
         * given [r,g,b] returns "#RRGGBB"
         *  r,g,b rounded to nearest integers
         */
        if (rgbColor.length != 3) {
            return null;
        }

        var roundedRgbColor = _.map(rgbColor, Math.round);
        var hexComponents = _.map(roundedRgbColor, function(num) {
            var hex = num.toString(16);
            if (hex.length < 2) {
                hex = "0" + hex;
            }
            return hex.toUpperCase();
        });
        var hexString = "#" + hexComponents[0] + hexComponents[1] + hexComponents[2];
        return hexString;
    };

    var normalizeHexString = function(hexString) {
        /**
         * given "rrggbb", "RRGGBB", "#rrggbb", "#RRGGBB" returns "#RRGGBB"
         */
        var normString = '#' + hexString.replace('#','');
        normString = normString.toUpperCase();
        // check for #RGB, to convert to #RRGGBB
        var hexValueStrings = normString.match(/^#?([\dA-F])([\dA-F])([\dA-F])$/);
        if (hexValueStrings !== null) {
            normString = '#' + hexValueStrings[1] + hexValueStrings[1] +
                               hexValueStrings[2] + hexValueStrings[2] +
                               hexValueStrings[3] + hexValueStrings[3];
        }
        return normString;
    };

    var modifyLuminosityOfHslColor = function(hslColor, luminosityMultiplier){
        /**
         * adjusts the luminosity of the specified hsl color by multiplying by luminosityMultiplier
         *  l is clamped to within [0,100]
         */
        var modHslColor = hslColor.slice(0);

        modHslColor[2] *= luminosityMultiplier;
        if (modHslColor[2] > 100) {
            modHslColor[2] = 100;
        } else if (modHslColor[2] < 0) {
            modHslColor[2] = 100;
        }

        return modHslColor;
    };

    var modifyLuminosityOfRgbColor = function(rgbColor, luminosityMultiplier){
        /**
         * adjusts the luminosity of the specified rgb color by luminosityMultiplier
         *   1 - convert to hsl
         *   2 - l *= luminosityMultiplier AND clamp(0,100)
         *   3 - convert back to rgb
         */
        var hslColor = hslColorFromRgbColor(rgbColor);
        var modHslColor = modifyLuminosityOfHslColor(hslColor, luminosityMultiplier);
        var modRgbColor = rgbColorFromHslColor(modHslColor);
        return modRgbColor;
    };

    var modifyLuminosityOfHexString = function(hexString, luminosityMultiplier){
        /**
         * adjusts the luminosity of the specified rgb color by luminosityMultiplier
         *   1 - convert to rgb, then to hsl
         *   2 - l *= luminosityMultiplier AND clamp(0,100)
         *   3 - convert back to rgb, then to hex
         */
        var rgbColor = rgbColorFromHexString(hexString);
        var modRgbColor = modifyLuminosityOfRgbColor(rgbColor, luminosityMultiplier);
        var modHexString = hexStringFromRgbColor(modRgbColor);
        return modHexString;
    };

    var generateGradientStylesWithMidColor = function(startColor, midColor, colorStop, endColor){
        /**
         * returns array of gradient style directives that cover set of browsers
         * builds gradient from three colors, places the midColor at colorStop percent
         *  startColor, midColor, endColor are css interpretable colors
         *  colorStop is "stop%", e.g. "50%", "80%"
         */
        var gradients =
            [
                ' -webkit-gradient(linear, 0 0, 0 100%, from(@startColor), color-stop(@colorStop, @midColor), to(@endColor)) ',
                ' -webkit-linear-gradient(@startColor, @midColor @colorStop, @endColor) ',
                ' -moz-linear-gradient(top, @startColor, @midColor @colorStop, @endColor) ',
                ' -o-linear-gradient(@startColor, @midColor @colorStop, @endColor) ',
                ' linear-gradient(@startColor, @midColor @colorStop, @endColor) ',
                // note: this uses filter instead of bg-image
                " progid:DXImageTransform.Microsoft.gradient(startColorstr='@startColor', endColorstr='@endColor', GradientType=0) "  // IE9 and down, gets no color-stop at all for proper fallback
            ];
        for (var i=0;i<gradients.length;i++){
            gradients[i] = gradients[i].replace(/@startColor/g, startColor);
            gradients[i] = gradients[i].replace(/@midColor/g, midColor);
            gradients[i] = gradients[i].replace(/@colorStop/g, colorStop);
            gradients[i] = gradients[i].replace(/@endColor/g, endColor);
        }
        return gradients;
    };

    var generateGradientStyles = function(startColor, endColor){
        /**
         * returns array of gradient style directives that cover set of browsers
         * builds gradient from two colors
         *  startColor, endColor are css interpretable colors
         */
        var gradients =
            [
                ' -moz-linear-gradient(top, @startColor, @endColor) ', // FF 3.6+
                ' -webkit-gradient(linear, 0 0, 0 100%, from(@startColor), to(@endColor))', // Safari 4+, Chrome 2+
                ' -webkit-linear-gradient(top, @startColor, @endColor) ', // Safari 5.1+, Chrome 10+
                ' -o-linear-gradient(top, @startColor, @endColor) ', // Opera 11.10
                ' linear-gradient(to bottom, @startColor, @endColor) ', // Standard, IE10
                // note: this uses filter instead of bg-image
                " progid:DXImageTransform.Microsoft.gradient(startColorstr='@startColor', endColorstr='@endColor', GradientType=0)  " // IE9 and down
            ];
        for (var i=0;i<gradients.length;i++){
            gradients[i] = gradients[i].replace(/@startColor/g, startColor);
            gradients[i] = gradients[i].replace(/@endColor/g, endColor);
        }
        return gradients;
    };

    // Prefixes hex value with provided symbols (e.g. '0x' or '#')
    var replaceSymbols = function(string, symbols) {
        if (!string) {
            return '';
        }
        var strippedString = this.stripSymbols(string);
        return symbols + strippedString;
    };

    // Removes '0x' and '#' prefixes to return just the color hex value itself
    var stripSymbols = function(string) {
        if (!string) {
            return '';
        }
        if (string.substring(0,2) === '0x') {
            return string.substring(2);
        }
        if (string.substring(0,1) === '#') {
            return string.substring(1);
        }
        return string;
    };

    var interpolateColors = function(color1, color2, p) {
        var r1 = (color1 >> 16) & 0xFF,
            g1 = (color1 >> 8) & 0xFF,
            b1 = color1 & 0xFF,

            r2 = (color2 >> 16) & 0xFF,
            g2 = (color2 >> 8) & 0xFF,
            b2 = color2 & 0xFF,

            rInterp = r1 + Math.round((r2 - r1) * p),
            gInterp = g1 + Math.round((g2 - g1) * p),
            bInterp = b1 + Math.round((b2 - b1) * p);

        return ((rInterp << 16) | (gInterp << 8) | bInterp);
    };

    return {
        hslColorFromRgbColor: hslColorFromRgbColor,
        rgbColorFromHslColor: rgbColorFromHslColor,
        hslColorFromHslString: hslColorFromHslString,
        rgbColorFromRgbString: rgbColorFromRgbString,
        hslStringFromHslColor: hslStringFromHslColor,
        rgbStringFromRgbColor: rgbStringFromRgbColor,
        rgbColorFromHexString: rgbColorFromHexString,
        hexStringFromRgbColor: hexStringFromRgbColor,
        normalizeHexString: normalizeHexString,
        modifyLuminosityOfHslColor: modifyLuminosityOfHslColor,
        modifyLuminosityOfRgbColor: modifyLuminosityOfRgbColor,
        modifyLuminosityOfHexString: modifyLuminosityOfHexString,
        generateGradientStylesWithMidColor: generateGradientStylesWithMidColor,
        generateGradientStyles: generateGradientStyles,
        replaceSymbols: replaceSymbols,
        stripSymbols: stripSymbols,
        interpolateColors: interpolateColors
    };
});
