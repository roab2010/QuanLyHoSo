<?php
require 'vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$requests = \App\Models\InventoryTransaction::where('type', 'OUT')
    ->where('status', 'PENDING')
    ->with(['details.product'])
    ->get();
    
echo "Count: " . $requests->count() . "\n";
foreach($requests as $r) {
    echo "ID: $r->id, Status: $r->status, Details count: " . $r->details->count() . "\n";
}
