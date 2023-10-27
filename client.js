    var ws; 
  
    function computeRawPrivkey( node ) {
        return bitcoinjs.ECPair.fromPrivateKey( node.privateKey, { network: bitcoinjs.networks.mainnet } );
    }

    function getPrivkeyHex( backupwords, path, index ) {
        var seed = bip39.mnemonicToSeedSync( backupwords );
        var node = bip32.fromSeed( seed );
        var path = "m/" + path + "/" + index;
        var root = node;
        var child = root.derivePath( path );
        return computeRawPrivkey( child );
    }

    function toHexString(byteArray) {
        return Array.from(byteArray, function(byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('');
    }

    function connect(){
        try{
            
            ws = new WebSocket(host);

            ws.onopen = function () {
                var data = "System message: Connection established successfully";
                listMsg(data);
                subscribe(pubKey);
            };

            ws.onmessage = function (e) {
                console.log('ONMESSAGE',e.data);
                var msg = JSON.parse(e.data);
                listMsg(msg[2].content);
            };

            ws.onerror = function () {
                var data = "System message: something went wrong, please exit and try again.";
                listMsg(data);
            };

        }catch(ex){ 

            listMsg(ex); 

        }
        
        $("#chat-message").focus();

    }

    function disconnect(){
        $("#user_list").empty();
        listMsg("Goodbye!");
        ws.close();
    }

    function listMsg(data) {
        var msg_list = document.getElementById("messages");
        var msg = document.createElement("p");

        msg.innerHTML = data;
        msg_list.appendChild(msg);
        msg_list.scrollTop = msg_list.scrollHeight;
    }

    function connected(){
        return ws?true:false;
    }

    function socketState(){
        return ws.readyState;
    }

    $('body').on('click','#chat-btn-connect',function(e){
        if (!connected()) {
            connect();
        }else if (socketState()==1){
            disconnect();
        }else if (socketState()==3){
            listMsg('WebSocket Desconectado');
            connect();
        }else{
            listMsg('WebSocket - status '+socketState());
        }
    });

    function send( ) {

        var message = $('#chat-message').val();

        $('#chat-message').val('');

        listMsg(' yo > '+ message);

        console.log('SEND',message);
        var now = Math.floor( ( new Date().getTime() ) / 1000 );
        console.log( 'NOW', now );
        var newevent = [
            0,
            pubKey,
            now,
            1,
            [],
            message
        ];
        var msgjson = JSON.stringify( newevent );                            console.log( "msgjson: '" + msgjson + "'" );
        var msghash = bitcoinjs.crypto.sha256( msgjson ).toString( 'hex' );  console.log( "msghash: '" + msghash + "'" );
        nobleSecp256k1.schnorr.sign( msghash, privKey ).then( 
            value => { 
                sig = value;                                                 console.log( "the sig is:", sig );
                nobleSecp256k1.schnorr.verify( 
                    sig,
                    msghash,
                    pubKey
                ).then(
                    value => {                                               console.log( "is the signature valid for the above pubkey over the message 'test'?", value );
                        if ( value ) {
                            var fullevent = {
                                "id": msghash,
                                "pubkey": pubKey,
                                "created_at": now,
                                "kind": 1,
                                "tags": [],
                                "content": message,
                                "sig": sig
                            }
                            var sendable = [ "EVENT", fullevent ];
                            sessionStorage.sendable = JSON.stringify( sendable );
                            ws.send( '["EVENT",' + JSON.stringify( JSON.parse( sessionStorage.sendable )[ 1 ] ) + ']' );
                         }
                    }
               );
            }
        );
    }

    function subscribe( pubkey ) {
        var filter = { "authors": [ pubkey ] };
        var subscription = [ "REQ", "Test", filter ];
        subscription = JSON.stringify( subscription );
        sessionStorage.subscription = subscription;
        ws.send( sessionStorage.subscription );
    }  
  
    $('body').on('click','#chat-btn-send',function(e){
        console.log('CLICK','SEND',$('#chat-message').val());
        send();
    });

    $('body').on('keypress','#chat-message',function(e){
        code=e.keyCode?e.keyCode:e.which;
        if(code.toString()==13){
            console.log('KEYPRESS','SEND',$('#chat-message').val());
            send();
        }
    });
  

