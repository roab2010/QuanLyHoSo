<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$columns = Illuminate\Support\Facades\DB::select('SHOW COLUMNS FROM projects');
foreach($columns as $c) {
    echo $c->Field . ': ' . $c->Type . PHP_EOL;
}
