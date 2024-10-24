<?php

set_time_limit(0);    // prevent the server from timing out

/* * * * * *
 *
 *  Ejemplo configuración en un subdominio en DirectAdmin
 *  Desde el panel DirectAdmin se le puede poner un certificado
 *  de LetsEncrypt al subdominio y así podremos conectarnos con
 *  wss a una url mas o menos como  wss://nostr.<domain.tld>/relay
 *
 *  Configuración DNS:
 *    Zona A : nostr.<domain.tld>.	3600	A	<server_ip>
 *
 * >DirectAdmin 
 *   > Configuraciones Httpd Personalizadas
 *     > Personalizaciones del Httpd.conf para nostr.<domain.tl>
 * (Solamente agregue las pocas lineas del VirtualHost que necesita.
 * No agregue todo un <Virtualhost>..</VirtualHost>)
 *
 *    SSLProxyEngine On
 *    ProxyRequests Off
 *    ProxyPreserveHost Off
 *    ProxyVia Full
 *    <proxy *="">
 *      Order deny,allow
 *      Allow from all
 *    </proxy>
 *    ProxyPass /relay ws://<server_ip>:9000/
 *    ProxyPassReverse /relay ws://<server_ip>:9000/
 * 
 *
 * * * * */

// Using PHPWebSocket-Chat by Flynsarmy
require 'class.PHPWebSocket.php';

// when a client sends data to the server
function wsOnMessage($clientID, $message, $messageLength, $binary) {
    global $Server, $friends;
    $ip = long2ip( $Server->wsClients[$clientID][6] );
    if ($messageLength == 0) { 
        $Server->wsClose($clientID);
        return;
    }

    if ( sizeof($Server->wsClients) == 1 ){    // No hay nadie mas
                                           
    }else{            

        $decoded = json_decode($message, true);
        
        if($decoded[0]=='EVENT')
            $message = '["EVENT","Testing",'.json_encode($decoded[1]).']';
        else if($decoded[0]=='EOSE')
            $message = '["EOSE","Test","END OF STORED EVENTS"]';
        else if($decoded[0]=='REQ')
            $message = '["REQ","'.$decoded[1].'",'.json_encode($decoded[2]).']';
        else
            $message = '["NOTICE","Test","'.print_r($decoded,true).'"]';

        foreach ( $Server->wsClients as $id => $client )
            if ( $id != $clientID )  {       
                $Server->wsSend($id, $message);
            }else{

            }
    }
}

// when a client connects
function wsOnOpen($clientID){
    global $Server, $friends, $cfg;
    $ip = long2ip( $Server->wsClients[$clientID][6] );
    $Server->log( "$ip ($clientID) ha entrado.<br>".print_r($Server->wsClients[$clientID],true) );
}

// when a client closes or lost connection
function wsOnClose($clientID, $status){
    global $Server;
    $ip = long2ip( $Server->wsClients[$clientID][6] );
}

// start the server
$Server = new PHPWebSocket();
$Server->bind('message', 'wsOnMessage');
$Server->bind('open', 'wsOnOpen');
$Server->bind('close', 'wsOnClose');

$Server->wsStartServer('0.0.0.0', 9000);

