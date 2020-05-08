//interpolator.js
class Interpolator {
	
	contructor (){}
	
	cubicHermite(xeval, xbp, ybp, method, tension) {
        // first we need to determine tangents (m)
        var n = xbp.length;
        var obj = this.calcTangents(xbp, ybp, method, tension);
        var m = obj.m;          // length n
        var delta = obj.delta;  // length n-1
        var c = new Array(n-1);
        var d = new Array(n-1);
        for (var k=0; k < n-1; k++) {
            if (method.toLowerCase() == 'linear') {
                m[k] = delta[k];
                c[k] = d[k] = 0;
                continue;
            }
            var xdiff = xbp[k+1] - xbp[k];
            c[k] = (3*delta[k] - 2*m[k] - m[k+1]) / xdiff;
            d[k] = (m[k] + m[k+1] - 2*delta[k]) / xdiff / xdiff;
        }

        var len = xeval.length;
        var f = new Array(len);
        var k = 0;
        for (var i=0; i < len; i++) {
            var x = xeval[i];
            if (x < xbp[0] || x > xbp[n-1]) {
                throw "interpolateCubicHermite: x value " + x + " outside breakpoint range [" + xbp[0] + ", " + xbp[n-1] + "]";
            }
            while (k < n-1 && x > xbp[k+1]) {
                k++;
            }
            var xdiff = x - xbp[k];
            f[i] = ybp[k] + m[k]*xdiff + c[k]*xdiff*xdiff + d[k]*xdiff*xdiff*xdiff; 
        }
        return f;
    }

    calcTangents(x, y, method, tension) {
        method = typeof method === 'undefined' ? 'fritschbutland' : method.toLowerCase();
        var n = x.length;
        var delta = new Array(n-1);
        var m = new Array(n);
        for (var k=0; k < n-1; k++) {
            var deltak = (y[k+1] - y[k]) / (x[k+1] - x[k]);
            delta[k] = deltak;
            if (k == 0) {   // left endpoint, same for all methods
                m[k] = deltak;
            } else if (method == 'cardinal') {
                m[k] = (1 - tension) * (y[k+1] - y[k-1]) / (x[k+1] - x[k-1]);
            } else if (method == 'fritschbutland') {
                var alpha = (1 + (x[k+1] - x[k]) / (x[k+1] - x[k-1])) / 3;  // Not the same alpha as below.
                m[k] = delta[k-1] * deltak <= 0  ?  0 : delta[k-1] * deltak / (alpha*deltak + (1-alpha)*delta[k-1]);
            } else if (method == 'fritschcarlson') {
                // If any consecutive secant lines change sign (i.e. curve changes direction), initialize the tangent to zero.
                // This is needed to make the interpolation monotonic. Otherwise set tangent to the average of the secants.
                m[k] = delta[k-1] * deltak < 0  ?  0 : (delta[k-1] + deltak) / 2;
            } else if (method == 'steffen') {
                var p = ((x[k+1] - x[k]) * delta[k-1] + (x[k] - x[k-1]) * deltak) / (x[k+1] - x[k-1]);
                m[k] = (Math.sign(delta[k-1]) + Math.sign(deltak)) * 
                                    Math.min(Math.abs(delta[k-1]), Math.abs(deltak), 0.5*Math.abs(p));
            } else {    // FiniteDifference
                m[k] = (delta[k-1] + deltak) / 2;               
            }
        }
        m[n-1] = delta[n-2];
        if (method != 'fritschcarlson') {
            return {m: m, delta: delta};
        }
        
        // Second pass of FritschCarlson: adjust any non-monotonic tangents.
        for (var k=0; k < n-1; k++) {
            var deltak = delta[k];
            if (deltak == 0) {
                m[k] = 0;
                m[k+1] = 0;
                continue;
            }
            var alpha = m[k] / deltak;
            var beta = m[k+1] / deltak;
            var tau = 3 / Math.sqrt(Math.pow(alpha,2) + Math.pow(beta,2));
            if (tau < 1) {      // if we're outside the circle with radius 3 then move onto the circle
                m[k] = tau * alpha * deltak;
                m[k+1] = tau * beta * deltak;
            }
        }
        return {m: m, delta: delta};
    }

}