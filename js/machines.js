/* Machines.js */

var findElementsByClass = function(parentElement, className) {
    var results = [];
    if (parentElement.getElementsByClassName === undefined) {
        var hasClassName = new RegExp("(?:^|\\s)" + className + "(?:$|\\s)"),
            allElements = parentElement.getElementsByTagName("*"),
            element, i;

        for (i = 0; allElements[i] !== null && allElements[i] !== undefined; i++) {
            element = allElements[i];
            var elementClass = element.className;
            if (elementClass && elementClass.indexOf(className) !== -1 && hasClassName.test(elementClass))
                results.push(element);
    }

    return results;

  } else {
    results = parentElement.getElementsByClassName(className);
    return results;
  }
};

var bind = (function( window, document ) {
    if ( document.addEventListener ) {
        return function( elem, type, cb ) {
            if ( (elem && !elem.length) || elem === window ) {
                elem.addEventListener(type, cb, false );
            }
            else if ( elem && elem.length ) {
                var len = elem.length;
                for ( var i = 0; i < len; i++ ) {
                    bind( elem[i], type, cb );
                }
            }
        };
    }
    else if ( document.attachEvent ) {
        return function ( elem, type, cb ) {
            if ( (elem && !elem.length) || elem === window ) {
                elem.attachEvent( 'on' + type, function () {
                    return cb.call(elem, window.event);
                });
            }
            else if ( elem.length ) {
                var len = elem.length;
                for ( var i = 0; i < len; i++ ) {
                    bind( elem[i], type, cb );
                }
            }
        };
    }
})( this, document );


var wire = {
    'keyDisplay': findElementsByClass(document.getElementById('keyDisplay'), 'data')[0],
    'encryptedMsgDisplay': findElementsByClass(document.getElementById('encryptedMsg'), 'data')[0]
};

wire.render = function () {
    wire.keyDisplay.innerHTML = 'p: ' + this.publicKey.p + ' g: ' + this.publicKey.g + ' h: ' + this.publicKey.h;
    wire.encryptedMsgDisplay.innerHTML = this.message.b + ', ' + this.message.c;
};

(function () {
    var receiver = {
        'el': document.getElementById('aliceMachine'),
        'generatorFieldId': 'generator',
        'primeFieldId': 'prime',
        'privateKeyFieldId': 'privateKey',
        'getPublicKeyBtn': document.getElementById('getPublicKey'),
        'decryptBtn': document.getElementById('decrypt'),
        'getGeneratorBtn': document.getElementById('getGenerators'),
        'generatorInfo': document.getElementById('generatorInfo'),
        'generatorList': document.getElementById('selectG'),
        'randomPrivateKeyBtn': document.getElementById('getRandomPrivateKey')
    },
    g, p, x, eg;

    bind(receiver.el.getElementsByTagName('form')[0], 'submit', function (e) {
        return false;
    });

    bind(receiver.getGeneratorBtn, 'click', function (e) {

        p = parseInt(document.getElementById( receiver.primeFieldId      ).getElementsByTagName('input')[0].value, 10);

        var roots = ElGamal.getAllRoots(p), i = 0, html = '';

        html = "Generators for " + p + " are: " + roots.map(function (r) { return String(r); }).join(", ");

        // findElementsByClass(receiver.el, 'extrainfo')[0].innerHTML = html;

        receiver.generatorInfo.style.display = "none";
        receiver.generatorList.innerHTML = [
            '<select>',
            roots.map(function (r) {
                return '<option value="' + r + '">' + r + '</option>';
            }),
            '</select>'
        ].join('');

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(receiver.getPublicKeyBtn, 'click', function (e) {

        var errorFields = findElementsByClass(receiver.el, 'error'), i = 0, publicKey;

        for (i = 0; i < errorFields.length; i += 1) {
            errorFields[i].className = '';
        }

        function getG() {
            var gSelect = receiver.generatorList.getElementsByTagName('select')[0];

            return parseInt(gSelect.options[gSelect.selectedIndex].value, 10);

        }

        g = getG();
        p = parseInt(document.getElementById(receiver.primeFieldId      ).getElementsByTagName('input')[0].value, 10);
        x = parseInt(document.getElementById(receiver.privateKeyFieldId ).getElementsByTagName('input')[0].value, 10);


        receiver.privateKey = x;

        eg = new ElGamal(p, g, x);
        try {
            receiver.publicKey = eg.getPublicKey();
            wire.publicKey = receiver.publicKey;
            wire.render();
        }
        catch (errors) {
            var i;
            for (i = 0; i < errors.length; i++) {
                switch(errors[i]) {
                  case 'NOT_PRIME':
                    document.getElementById('prime').className = 'error';
                    break;
                  case 'NOT_ROOT':
                    document.getElementById('generator').className = 'error';
                    break;
                  case 'INVALID_KEY':
                    document.getElementById('privateKey').className = 'error';
                    break;
                }
            }
        }

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(receiver.decryptBtn, 'click', function (e) {

        if (!wire.message) {
            alert('Bob has not sent you a message yet.');
            return false;
        }
        findElementsByClass(document.getElementById('messageDisplay'), 'data')[0].innerHTML = eg.decrypt(wire.message);

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(receiver.randomPrivateKeyBtn, 'click', function (e) {
        var p = parseInt(document.getElementById( receiver.primeFieldId      ).getElementsByTagName('input')[0].value, 10);
        var key = Math.ceil(Math.random() * 10);

        document.getElementById(receiver.privateKeyFieldId ).getElementsByTagName('input')[0].value = key;
    });
}());

(function () {

    var sender = {
        'el': document.getElementById('bobMachine'),
        'privateKeyFieldId': 'encryptPrivate',
        'messageFieldId': 'message',
        'encryptMsgBtn': document.getElementById('encrypt'),
        'randomKeyBtn': document.getElementById('getRandomEncyptKey')
    };

    bind(sender.el.getElementsByTagName('form')[0], 'submit', function (e) {
        return false;
    });

    bind(sender.encryptMsgBtn, 'click', function (e) {

        if (!wire.publicKey) {
            alert('You need Alice\'s public key to send her a message');
            return false;
        }

        var errorFields = findElementsByClass(sender.el, 'error'), i = 0,
            message = parseInt(document.getElementById( sender.messageFieldId ).getElementsByTagName('input')[0].value, 10),
            privateKey = parseInt(document.getElementById( sender.privateKeyFieldId ).getElementsByTagName('input')[0].value, 10);

        for (i = 0; i < errorFields.length; i += 1) {
            errorFields[i].className = '';
        }

        try {
            wire.message = ElGamal.encrypt(message, privateKey, wire.publicKey);
            wire.render();
        } catch (errors) {
            var i;
            for (i = 0; i < errors.length; i++) {
                switch(errors[i]) {
                  case 'INVALID_ENC_KEY':
                    document.getElementById('encryptPrivate').className = 'error';
                    break;
                  case 'INVALID_MSG':
                    document.getElementById('message').className = 'error';
                    break;
                }
            }
        }

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

    }, false);

    bind(sender.randomKeyBtn, 'click', function (e) {
        var p = wire.publicKey.p;
        var key = Math.ceil(Math.random() * 10);

        document.getElementById(sender.privateKeyFieldId ).getElementsByTagName('input')[0].value = key;
    });
}());
