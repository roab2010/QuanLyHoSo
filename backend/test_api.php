<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://127.0.0.1:8000/api/inventory/pending-requests");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
$output = curl_exec($ch);
curl_close($ch);
file_put_contents('error_output.json', $output);
