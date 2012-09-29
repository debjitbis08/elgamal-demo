/* Machines.js */

var wire = {
    'keyDisplay': document.getElementById('keyDisplay').getElementsByClassName('data')[0],
    'encryptedMsgDisplay': document.getElementById('encryptedMsg').getElementsByClassName('data')[0]
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
        'getGeneratorBtn': document.getElementById('getGenerators')
    },
    g, p, x, eg;

    receiver.getGeneratorBtn.addEventListener('click', function (e) {

        p = parseInt(document.getElementById( receiver.primeFieldId      ).getElementsByTagName('input')[0].value, 10);

        var roots = ElGamal.getAllRoots(p), i = 0, html = '';

        for (i = 0; i < roots.length; i += 1) {
            html += roots[i] + ' ';
        }
        receiver.el.getElementsByClassName('extrainfo')[0].innerHTML = html;

        e.preventDefault();

    }, false);

    receiver.getPublicKeyBtn.addEventListener('click', function (e) {

        var errorFields = receiver.el.getElementsByClassName('error'), i = 0, publicKey;
        
        for (i = 0; i < errorFields.length; i += 1) {
            errorFields[i].className = '';
        }

        g = parseInt(document.getElementById( receiver.generatorFieldId  ).getElementsByTagName('input')[0].value, 10);
        p = parseInt(document.getElementById( receiver.primeFieldId      ).getElementsByTagName('input')[0].value, 10);
        x = parseInt(document.getElementById( receiver.privateKeyFieldId ).getElementsByTagName('input')[0].value, 10);


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

        e.preventDefault();

    }, false);

    receiver.decryptBtn.addEventListener('click', function (e) {

        if (!wire.message) {
            alert('Bob has not sent you a message yet.');
            return;
        }
        document.getElementById('messageDisplay').getElementsByClassName('data')[0].innerHTML = eg.decrypt(wire.message);

    }, false);

}());

(function () {

    var sender = {
        'el': document.getElementById('bobMachine'),
        'privateKeyFieldId': 'encryptPrivate',
        'messageFieldId': 'message',
        'encryptMsgBtn': document.getElementById('encrypt')
    };

    sender.encryptMsgBtn.addEventListener('click', function (e) {

        e.preventDefault();

        if (!wire.publicKey) {
            alert('You need Alice\'s public key to send her a message');
            return;
        }

        var errorFields = sender.el.getElementsByClassName('error'), i = 0,
            message = parseInt(document.getElementById( sender.messageFieldId ).getElementsByTagName('input')[0].value, 10),
            privateKey = parseInt(document.getElementById( sender.privateKeyFieldId ).getElementsByTagName('input')[0].value, 10);

        for (i = 0; i < errorFields.length; i += 1) {
            errorFields[i].className = '';
        }

        try {
            wire.message = ElGamal.encrypt(message, privateKey, wire.publicKey);
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
        wire.render();

    }, false);

}());