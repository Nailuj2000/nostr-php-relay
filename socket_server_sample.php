<?php

$host = '127.0.0.1'; 
$port = 7000; 

$server = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
socket_bind($server, $host, $port);
socket_listen($server);
$client = socket_accept($server);
$input = socket_read($client, 1024);
socket_write($client, "Hello, i'm a sample server. Your data: $input");
socket_close($client);
socket_close($server);
