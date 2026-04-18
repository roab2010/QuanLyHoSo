<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$task = DB::table('project_tasks')->where('id', 300004)->first();
print_r($task);

$req = new \Illuminate\Http\Request();
$req->replace(['status' => 'DOING']);
$ctrl = new \App\Http\Controllers\ProjectController();
$res = $ctrl->updateTask($req, 330006, 300004);
echo $res->getContent();

$taskAfter = DB::table('project_tasks')->where('id', 300004)->first();
print_r($taskAfter);
