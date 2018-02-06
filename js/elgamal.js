/*jshint browser: false, maxerr: 50, white: true, indent: 4, newcap: true, onevar: true, jquery: false, curly: true, eqeqeq: true, undef: true, strict: false */


var ElGamal = (function () {

    "use strict";

    var extendedEuclid, powmod,

        isPrime, isPrimitiveRoot, isValidPrivate, isValidEncryptKey, isValidMessage,

        validatePublicKeyFields, validateEncryptFields,

        Api;

    extendedEuclid = function (a, b) {
        var u1 = 1, u2 = 0, u3 = a,
            v1 = 0, v2 = 1, v3 = b,
            q, t1, t2, t3;

        while (v3 !== 0) {
            q = Math.floor(u3/v3);
            t1 = u1 - q*v1;
            t2 = u2 - q*v2;
            t3 = u3 - q*v3;
            u1 = v1; u2 = v2; u3 = v3;
            v1 = t1; v2 = t2; v3 = t3;
        }
        return {'x': u1, 'y': u2, 'd': u3};
    };

    powmod = function (base, exp, modulus) {
        var accum = 1, i = 0, basepow2 = base;
        if (exp === -1) {
            return extendedEuclid(base, modulus).x;
        }
        while ((exp >> i) > 0) {
            if (((exp >> i) & 1) === 1) {
                accum = (accum * basepow2) % modulus;
            }
            basepow2 = (basepow2 * basepow2) % modulus;
            i += 1;
        }
        return accum;
    };


    isPrime = function (p) {
        //return true if prime
        return PRIMES.indexOf(p) > -1;
    };

    isPrimitiveRoot = function (g, p) {
        //return true if g is primitive root of p
        var o = 1,
            k = powmod(g, o, p);
        while (k > 1) {
            o++;
            k *= g;
            k %= p;
        }
        if (o === (p - 1)) {
            return true;
        }
        return false;
    };

    isValidPrivate = function (x, p) {
        return (x > 0 && x < (p - 1));
    };

    isValidEncryptKey = function (y, p) {
        return (y >= 0 && y < (p - 1));
    };

    isValidMessage = function (m, p) {
        return (m > 0 && m < p);
    };

    validatePublicKeyFields = function (g, x, p) {
        var errors = [];
        if (!isPrime(p)) {
            errors.push('NOT_PRIME');
        }
        if (!isPrimitiveRoot(g, p)) {
            errors.push('NOT_ROOT');
        }
        if (!isValidPrivate(x, p)) {
            errors.push('INVALID_KEY');
        }
        return errors;
    };

    validateEncryptFields = function (m, y, p) {
        var errors = [];
        if (!isValidEncryptKey(y, p)) {
            errors.push('INVALID_ENC_KEY');
        }
        if (!isValidMessage(m, p)) {
            errors.push('INVALID_MSG');
        }
        return errors;
    };

    Api = function (p, g, x) {

        this.p = p;
        this.g = g;
        this.x = x;

    };

    Api.prototype.getPublicKey = function () {

        var errors = validatePublicKeyFields(this.g, this.x, this.p), h;
        if (errors.length > 0) {
            throw errors;
        }
        h = powmod(this.g, this.x, this.p);
        return {
            p: this.p,
            g: this.g,
            h: h
        };

    };

    Api.prototype.decrypt = function (m) {
        var ay = powmod(m.b, this.x, this.p), s;

        s = (powmod(ay, -1, this.p) * m.c) % this.p;
        s = s < 0 ? s + this.p : s;
        return s;
    };

    Api.getAllRoots = function (p) {
        var r, roots = [];

        if (!isPrime(p)) {
          throw Error("Enter a valid prime number");
        }

        for (r = 2; r < p; r += 1) {
            if (isPrimitiveRoot(r, p)) {
                roots.push(r);
            }
        }

        return roots;
    };

    Api.getAllRootsAsync = function (p, work) {
        var r = 2;

        if (!isPrime(p)) {
          throw Error("Enter a valid prime number");
        }

        (function loop() {
          var j, roots = [];
          for (j = 0; j + r < p || j < 20; j += 1) {
              if (isPrimitiveRoot(r, p)) {
                  roots.push(r);
              }
              r += 1;
          }
          work(roots);

          if (j + r < p) {
            setTimeout(loop, 24);
          }
        }());

        return 0;
    };

    Api.encrypt = function (m, y, publicKey) {

        var errors = validateEncryptFields(m, y, publicKey.p);
        if (errors.length > 0) {
            throw errors;
        }
        return {
            b: powmod(publicKey.g, y, publicKey.p),
            c: (m * (powmod(publicKey.h, y, publicKey.p))) % publicKey.p
        };
    };

    return Api;

}());
